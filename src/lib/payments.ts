import "server-only";
import { db } from "./db";

export type Provider = "PAYME" | "CLICK" | "UZUM";

export const payme = {
  merchantId: () => process.env.PAYME_MERCHANT_ID,
  key: () => process.env.PAYME_KEY,
  test: () => process.env.PAYME_TEST === "true",
  enabled: () => !!(process.env.PAYME_MERCHANT_ID && process.env.PAYME_KEY),
};

export const click = {
  serviceId: () => process.env.CLICK_SERVICE_ID,
  merchantId: () => process.env.CLICK_MERCHANT_ID,
  secret: () => process.env.CLICK_SECRET_KEY,
  enabled: () => !!(process.env.CLICK_SERVICE_ID && process.env.CLICK_MERCHANT_ID && process.env.CLICK_SECRET_KEY),
};

/** Kalitlari kiritilgan to'lov tizimlari. Bo'sh bo'lsa sayt demo rejimda ishlaydi. */
export function liveProviders(): Provider[] {
  return [payme.enabled() && "PAYME", click.enabled() && "CLICK"].filter(Boolean) as Provider[];
}

export function paymeCheckoutUrl(paymentId: string, amountSom: number, returnUrl: string) {
  const params = `m=${payme.merchantId()};ac.payment_id=${paymentId};a=${amountSom * 100};l=uz;c=${returnUrl}`;
  const host = payme.test() ? "https://test.paycom.uz" : "https://checkout.paycom.uz";
  return `${host}/${Buffer.from(params).toString("base64")}`;
}

export function clickCheckoutUrl(paymentId: string, amountSom: number, returnUrl: string) {
  const q = new URLSearchParams({
    service_id: click.serviceId()!,
    merchant_id: click.merchantId()!,
    amount: String(amountSom),
    transaction_param: paymentId,
    return_url: returnUrl,
  });
  return `https://my.click.uz/services/pay?${q}`;
}

/** To'lov muvaffaqiyatli: to'lovni PAID qiladi va o'quvchini kursga yozadi (qayta chaqirilsa ham xavfsiz) */
export async function fulfillPayment(paymentId: string) {
  return db.$transaction(async (tx) => {
    const p = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (p.status === "PAID") return p;
    let enrollmentId = p.enrollmentId;
    if (p.courseId && !enrollmentId) {
      const e = await tx.enrollment.upsert({
        where: { userId_courseId: { userId: p.userId, courseId: p.courseId } },
        create: { userId: p.userId, courseId: p.courseId },
        update: {},
        include: { payment: true },
      });
      // Bitta yozilishga bitta to'lov bog'lanadi; ikkinchi to'lov bo'lsa, bog'lanmasdan qoladi
      enrollmentId = e.payment ? null : e.id;
    }
    return tx.payment.update({ where: { id: p.id }, data: { status: "PAID", performedAt: new Date(), enrollmentId } });
  });
}

/** Payme to'langan tranzaksiyani bekor qilsa: kursga kirish olib tashlanadi */
export async function revokePayment(paymentId: string) {
  const p = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (p.enrollmentId) await db.enrollment.delete({ where: { id: p.enrollmentId } }).catch(() => {});
}
