// Payme Merchant API (JSON-RPC). Payme kabinetida endpoint sifatida https://<sayt>/api/payme ko'rsatiladi.
import type { Payment } from "@prisma/client";
import { db } from "@/lib/db";
import { fulfillPayment, payme, revokePayment } from "@/lib/payments";

const TIMEOUT_MS = 12 * 60 * 60 * 1000; // Payme talabi: yaratilgan tranzaksiya 12 soatda bekor bo'ladi

class RpcError extends Error {
  constructor(public code: number, msg: string, public data?: string) { super(msg); }
}

const err = {
  auth: () => new RpcError(-32504, "Avtorizatsiya xatosi"),
  method: () => new RpcError(-32601, "Metod topilmadi"),
  amount: () => new RpcError(-31001, "Summa noto'g'ri"),
  notFoundTx: () => new RpcError(-31003, "Tranzaksiya topilmadi"),
  cantPerform: () => new RpcError(-31008, "Amalni bajarib bo'lmaydi"),
  account: () => new RpcError(-31050, "To'lov topilmadi", "payment_id"),
  accountBusy: () => new RpcError(-31051, "Bu to'lov boshqa tranzaksiyada band yoki allaqachon to'langan", "payment_id"),
};

const ms = (d: Date | null) => (d ? d.getTime() : 0);

function txInfo(p: Payment) {
  return {
    create_time: Number(p.externalTime ?? 0),
    perform_time: ms(p.performedAt),
    cancel_time: ms(p.cancelledAt),
    transaction: p.id,
    state: p.paymeState ?? 0,
    reason: p.cancelReason ?? null,
  };
}

async function findPayableOrThrow(account: { payment_id?: string } | undefined, amount: number) {
  const p = account?.payment_id ? await db.payment.findUnique({ where: { id: account.payment_id } }) : null;
  if (!p || p.provider !== "PAYME") throw err.account();
  if (p.status !== "PENDING") throw err.accountBusy();
  if (p.amount * 100 !== amount) throw err.amount();
  return p;
}

async function cancelExpired(p: Payment) {
  return db.payment.update({ where: { id: p.id }, data: { paymeState: -1, status: "FAILED", cancelledAt: new Date(), cancelReason: 4 } });
}

const findTx = (id: string) => db.payment.findFirst({ where: { provider: "PAYME", externalId: id } });

type Params = { id?: string; time?: number; amount?: number; account?: { payment_id?: string }; reason?: number; from?: number; to?: number };

const methods: Record<string, (p: Params) => Promise<unknown>> = {
  async CheckPerformTransaction({ amount, account }) {
    const p = await findPayableOrThrow(account, amount ?? -1);
    if (p.externalId && p.paymeState === 1) throw err.accountBusy();
    return { allow: true };
  },

  async CreateTransaction({ id, time, amount, account }) {
    const existing = await findTx(id!);
    if (existing) {
      if (existing.paymeState !== 1) throw err.cantPerform();
      if (Date.now() - Number(existing.externalTime) > TIMEOUT_MS) {
        await cancelExpired(existing);
        throw err.cantPerform();
      }
      return { create_time: Number(existing.externalTime), transaction: existing.id, state: 1 };
    }
    const p = await findPayableOrThrow(account, amount ?? -1);
    if (p.externalId && p.externalId !== id && p.paymeState === 1) throw err.accountBusy();
    const updated = await db.payment.update({ where: { id: p.id }, data: { externalId: id, externalTime: BigInt(time!), paymeState: 1 } });
    return { create_time: Number(updated.externalTime), transaction: updated.id, state: 1 };
  },

  async PerformTransaction({ id }) {
    const p = await findTx(id!);
    if (!p) throw err.notFoundTx();
    if (p.paymeState === 2) return { transaction: p.id, perform_time: ms(p.performedAt), state: 2 };
    if (p.paymeState !== 1) throw err.cantPerform();
    if (Date.now() - Number(p.externalTime) > TIMEOUT_MS) {
      await cancelExpired(p);
      throw err.cantPerform();
    }
    await fulfillPayment(p.id);
    const done = await db.payment.update({ where: { id: p.id }, data: { paymeState: 2 } });
    return { transaction: done.id, perform_time: ms(done.performedAt), state: 2 };
  },

  async CancelTransaction({ id, reason }) {
    const p = await findTx(id!);
    if (!p) throw err.notFoundTx();
    if (p.paymeState === 1 || p.paymeState === 2) {
      const performed = p.paymeState === 2;
      if (performed) await revokePayment(p.id);
      const c = await db.payment.update({
        where: { id: p.id },
        data: { paymeState: performed ? -2 : -1, status: performed ? "REFUNDED" : "FAILED", cancelledAt: new Date(), cancelReason: reason ?? null, enrollmentId: null },
      });
      return { transaction: c.id, cancel_time: ms(c.cancelledAt), state: c.paymeState };
    }
    return { transaction: p.id, cancel_time: ms(p.cancelledAt), state: p.paymeState };
  },

  async CheckTransaction({ id }) {
    const p = await findTx(id!);
    if (!p) throw err.notFoundTx();
    return txInfo(p);
  },

  async GetStatement({ from, to }) {
    const list = await db.payment.findMany({
      where: { provider: "PAYME", externalId: { not: null }, externalTime: { gte: BigInt(from ?? 0), lte: BigInt(to ?? 0) } },
      orderBy: { externalTime: "asc" },
    });
    return {
      transactions: list.map((p) => ({
        id: p.externalId, time: Number(p.externalTime), amount: p.amount * 100, account: { payment_id: p.id }, ...txInfo(p),
      })),
    };
  },
};

function authorized(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const [type, value] = header.split(" ");
  if (type !== "Basic" || !value || !payme.key()) return false;
  const [login, pass] = Buffer.from(value, "base64").toString().split(":");
  return login === "Paycom" && pass === payme.key();
}

export async function POST(req: Request) {
  let rpcId: unknown = null;
  try {
    const body = await req.json();
    rpcId = body.id ?? null;
    if (!authorized(req)) throw err.auth();
    const fn = methods[body.method];
    if (!fn) throw err.method();
    return Response.json({ jsonrpc: "2.0", id: rpcId, result: await fn(body.params ?? {}) });
  } catch (e) {
    const rpc = e instanceof RpcError ? e : new RpcError(-32400, "Ichki xato");
    if (!(e instanceof RpcError)) console.error("Payme xatosi:", e);
    return Response.json({
      jsonrpc: "2.0", id: rpcId,
      error: { code: rpc.code, message: { uz: rpc.message, ru: rpc.message, en: rpc.message }, data: rpc.data },
    });
  }
}
