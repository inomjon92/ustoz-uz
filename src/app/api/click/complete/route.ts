// Click Shop API: Complete (action=1). Click kabinetida https://<sayt>/api/click/complete
import { db } from "@/lib/db";
import { fulfillPayment } from "@/lib/payments";
import { CLICK_ERR, clickReply, clickSignValid, readClickForm } from "@/lib/click";

export async function POST(req: Request) {
  const p = await readClickForm(req);
  if (!p.click_trans_id || !p.merchant_trans_id) return clickReply(p, CLICK_ERR.request);
  if (!clickSignValid(p, true)) return clickReply(p, CLICK_ERR.sign);
  if (p.action !== "1") return clickReply(p, CLICK_ERR.action);

  const payment = await db.payment.findUnique({ where: { id: p.merchant_trans_id } });
  if (!payment || payment.provider !== "CLICK") return clickReply(p, CLICK_ERR.order);
  if (payment.externalId !== p.click_trans_id || String(payment.externalTime) !== p.merchant_prepare_id) return clickReply(p, CLICK_ERR.tx);
  const confirm = { merchant_confirm_id: Number(payment.externalTime) };
  if (payment.status === "PAID") return clickReply(p, CLICK_ERR.paid, confirm);
  if (payment.status !== "PENDING") return clickReply(p, CLICK_ERR.cancelled);
  if (Number(p.amount) !== payment.amount) return clickReply(p, CLICK_ERR.amount);

  // Click to'lov amalga oshmaganini bildirsa (error < 0), to'lovni bekor qilamiz
  if (Number(p.error) < 0) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", cancelledAt: new Date() } });
    return clickReply(p, CLICK_ERR.cancelled);
  }

  await fulfillPayment(payment.id);
  return clickReply(p, null, confirm);
}
