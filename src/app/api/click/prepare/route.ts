// Click Shop API: Prepare (action=0). Click kabinetida https://<sayt>/api/click/prepare
import { db } from "@/lib/db";
import { CLICK_ERR, clickReply, clickSignValid, readClickForm } from "@/lib/click";

export async function POST(req: Request) {
  const p = await readClickForm(req);
  if (!p.click_trans_id || !p.merchant_trans_id) return clickReply(p, CLICK_ERR.request);
  if (!clickSignValid(p, false)) return clickReply(p, CLICK_ERR.sign);
  if (p.action !== "0") return clickReply(p, CLICK_ERR.action);

  const payment = await db.payment.findUnique({ where: { id: p.merchant_trans_id } });
  if (!payment || payment.provider !== "CLICK") return clickReply(p, CLICK_ERR.order);
  if (payment.status === "PAID") return clickReply(p, CLICK_ERR.paid);
  if (payment.status !== "PENDING") return clickReply(p, CLICK_ERR.cancelled);
  if (Number(p.amount) !== payment.amount) return clickReply(p, CLICK_ERR.amount);

  // merchant_prepare_id butun son bo'lishi kerak; complete bosqichida tekshiriladi
  const prepareId = BigInt(Math.floor(Date.now() / 1000));
  await db.payment.update({ where: { id: payment.id }, data: { externalId: p.click_trans_id, externalTime: prepareId } });
  return clickReply(p, null, { merchant_prepare_id: Number(prepareId) });
}
