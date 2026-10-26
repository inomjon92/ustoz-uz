export const CITIES = [
  "Toshkent", "Samarqand", "Buxoro", "Andijon", "Farg'ona", "Namangan",
  "Qarshi", "Navoiy", "Jizzax", "Urganch", "Nukus", "Termiz", "Guliston",
];

export function som(amount: number) {
  if (amount === 0) return "Bepul";
  return new Intl.NumberFormat("uz-UZ").format(amount).replace(/,/g, " ") + " so'm";
}

export const FORMAT_LABEL = { ONLINE: "Onlayn", OFFLINE: "Oflayn", HYBRID: "Onlayn + oflayn" } as const;
export const LEVEL_LABEL = { BEGINNER: "Boshlang'ich", INTERMEDIATE: "O'rta", ADVANCED: "Yuqori" } as const;
export const BOOKING_LABEL = { PENDING: "Kutilmoqda", ACCEPTED: "Qabul qilindi", DECLINED: "Rad etildi", DONE: "Yakunlandi" } as const;
export const PAYMENT_LABEL = { PENDING: "Kutilmoqda", PAID: "To'langan", FAILED: "Xato", REFUNDED: "Qaytarilgan" } as const;

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
export function date(d: Date) {
  return `${d.getDate()}-${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

export function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[ʻʼ'`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
