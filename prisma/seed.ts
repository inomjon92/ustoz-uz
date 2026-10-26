import { PrismaClient, type LessonFormat, type Level } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const SUBJECTS = [
  ["Ingliz tili", "ingliz-tili", "🇬🇧"], ["Matematika", "matematika", "📐"], ["Dasturlash", "dasturlash", "💻"],
  ["Fizika", "fizika", "⚛️"], ["Kimyo", "kimyo", "🧪"], ["Rus tili", "rus-tili", "🇷🇺"],
  ["Ona tili", "ona-tili", "📖"], ["Tarix", "tarix", "🏛️"],
] as const;

const TEACHERS: { name: string; headline: string; subjects: string[]; city: string; price: number; years: number; format: LessonFormat; verified: boolean }[] = [
  { name: "Dilnoza Karimova", headline: "IELTS 8.5 · ingliz tili ustozi", subjects: ["ingliz-tili"], city: "Toshkent", price: 150000, years: 8, format: "HYBRID", verified: true },
  { name: "Jasur Rahimov", headline: "DTM va olimpiada matematikasi", subjects: ["matematika", "fizika"], city: "Toshkent", price: 120000, years: 12, format: "OFFLINE", verified: true },
  { name: "Sardor Aliyev", headline: "Senior dasturchi, Python va Web mentor", subjects: ["dasturlash"], city: "Samarqand", price: 200000, years: 6, format: "ONLINE", verified: true },
  { name: "Madina Yusupova", headline: "Kimyo va biologiya, tibbiyotga tayyorlov", subjects: ["kimyo"], city: "Buxoro", price: 90000, years: 5, format: "HYBRID", verified: false },
  { name: "Aziz Tursunov", headline: "Rus tili: so'zlashuv va grammatika", subjects: ["rus-tili"], city: "Andijon", price: 70000, years: 4, format: "ONLINE", verified: false },
  { name: "Nodira Ismoilova", headline: "Ona tili va adabiyot, milliy sertifikat", subjects: ["ona-tili", "tarix"], city: "Farg'ona", price: 80000, years: 10, format: "OFFLINE", verified: true },
];

const CENTERS = [
  { name: "Cambridge Learning Centre", slug: "cambridge-lc", city: "Toshkent", address: "Chilonzor tumani, Bunyodkor ko'chasi 12", phone: "+998 71 200 11 22", subjects: ["ingliz-tili", "rus-tili"], description: "IELTS, CEFR va umumiy ingliz tili bo'yicha 10 yillik tajribaga ega markaz. Kichik guruhlar va xalqaro ustozlar." },
  { name: "Al-Xorazmiy Akademiyasi", slug: "al-xorazmiy", city: "Samarqand", address: "Registon ko'chasi 5", phone: "+998 66 233 44 55", subjects: ["matematika", "fizika", "kimyo"], description: "DTM va prezident maktablariga tayyorlov. Har oy sinov imtihonlari va ota-onalar uchun hisobot." },
  { name: "IT Park Academy", slug: "it-park-academy", city: "Toshkent", address: "Mirzo Ulug'bek tumani, IT Park", phone: "+998 71 300 00 01", subjects: ["dasturlash"], description: "Frontend, backend va mobil dasturlash bo'yicha amaliy kurslar. Bitiruvchilar uchun ishga joylashishda yordam." },
];

type L = [string, number, string];
const COURSES: { title: string; slug: string; subject: string; teacher?: number; center?: string; price: number; level: Level; format: LessonFormat; weeks: number; summary: string; lessons: L[] }[] = [
  {
    title: "IELTS 7.0+ intensiv", slug: "ielts-intensiv", subject: "ingliz-tili", teacher: 0, price: 590000, level: "INTERMEDIATE", format: "ONLINE", weeks: 8,
    summary: "Listening, Reading, Writing va Speaking bo'yicha strategiyalar va real imtihon mashqlari.",
    lessons: [
      ["IELTS formati va baholash", 12, "IELTS to'rt qismdan iborat: Listening, Reading, Writing va Speaking. Har bir qism 0 dan 9 gacha baholanadi.\n\n### Band score qanday hisoblanadi\n\nUmumiy ball to'rt qism o'rtachasi bo'lib, eng yaqin 0.5 ga yaxlitlanadi."],
      ["Listening: kalit so'zlarni ushlash", 18, "Audio boshlanishidan oldin savollarni o'qib, kalit so'zlarning tagiga chizing.\n\nSinonimlarga e'tibor bering: audio savoldagi so'zni boshqacha ifodalaydi."],
      ["Reading: skimming va scanning", 20, "Skimming — matnning umumiy mazmunini tez tushunish. Scanning — aniq ma'lumotni (sana, ism, raqam) qidirish."],
      ["Writing Task 2: esse tuzilmasi", 25, "Kirish, ikki asosiy paragraf va xulosa. Har paragraf bitta asosiy g'oya, misol va izohdan iborat bo'lsin."],
      ["Speaking: Part 2 ga tayyorlanish", 15, "Bir daqiqalik tayyorgarlikda kalit so'zlar yozing va ularni hikoya tartibida joylang."],
    ],
  },
  {
    title: "Python: noldan boshlab", slug: "python-noldan", subject: "dasturlash", teacher: 2, price: 0, level: "BEGINNER", format: "ONLINE", weeks: 4,
    summary: "Dasturlashni hech qachon o'rganmaganlar uchun bepul kurs: o'zgaruvchilar, sikllar, funksiyalar.",
    lessons: [
      ["Python o'rnatish va birinchi dastur", 10, "python.org saytidan Python'ni yuklab oling. Birinchi dastur: print(\"Salom, dunyo!\")"],
      ["O'zgaruvchilar va turlar", 15, "Python'da o'zgaruvchi e'lon qilish uchun tur yozish shart emas: ism = \"Ali\", yosh = 20.\n\n### Asosiy turlar\n\nint, float, str, bool, list va dict."],
      ["Shartlar va sikllar", 20, "if, elif, else yordamida qaror qabul qilamiz. for va while sikllari takrorlanuvchi amallar uchun."],
      ["Funksiyalar", 18, "def kalit so'zi bilan funksiya yaratiladi. Funksiya kodni qayta ishlatish imkonini beradi."],
    ],
  },
  {
    title: "DTM matematika: to'liq tayyorlov", slug: "dtm-matematika", subject: "matematika", teacher: 1, price: 450000, level: "INTERMEDIATE", format: "HYBRID", weeks: 12,
    summary: "Algebra, geometriya va trigonometriya bo'yicha DTM testlarining barcha turlari.",
    lessons: [
      ["Kvadrat tenglamalar", 20, "ax² + bx + c = 0 ko'rinishidagi tenglama. Diskriminant D = b² − 4ac."],
      ["Progressiyalar", 18, "Arifmetik progressiya: aₙ = a₁ + (n−1)d. Geometrik progressiya: bₙ = b₁·qⁿ⁻¹."],
      ["Trigonometriya asoslari", 22, "sin²x + cos²x = 1 — asosiy trigonometrik ayniyat."],
    ],
  },
  {
    title: "Frontend dasturchi (React)", slug: "frontend-react", subject: "dasturlash", center: "it-park-academy", price: 1200000, level: "ADVANCED", format: "OFFLINE", weeks: 16,
    summary: "HTML, CSS, JavaScript va React bilan real loyihalar. Portfolio va ishga tayyorlov.",
    lessons: [
      ["HTML va semantika", 15, "Semantik teglar (header, main, article) sahifani tushunarli va qulay qiladi."],
      ["Zamonaviy CSS: Flex va Grid", 25, "Flexbox bir o'lchamli, Grid esa ikki o'lchamli joylashuv uchun."],
      ["JavaScript asoslari", 30, "let, const, funksiyalar, massiv metodlari: map, filter, reduce."],
      ["React komponentlari", 30, "Komponent — UI ning qayta ishlatiladigan bo'lagi. useState bilan holat saqlanadi."],
    ],
  },
  {
    title: "Kimyo: tibbiyot oliygohlariga", slug: "kimyo-tibbiyot", subject: "kimyo", teacher: 3, price: 350000, level: "INTERMEDIATE", format: "HYBRID", weeks: 10,
    summary: "Organik va anorganik kimyo, masalalar yechish metodikasi.",
    lessons: [
      ["Atom tuzilishi", 15, "Atom yadro (proton, neytron) va elektron qobiqlardan tashkil topgan."],
      ["Kimyoviy bog'lanish", 18, "Ion, kovalent va metall bog'lanish turlari."],
    ],
  },
  {
    title: "Ona tili: milliy sertifikat", slug: "ona-tili-sertifikat", subject: "ona-tili", teacher: 5, price: 250000, level: "BEGINNER", format: "OFFLINE", weeks: 6,
    summary: "Imlo, punktuatsiya va matn tahlili bo'yicha milliy sertifikat imtihoniga tayyorlov.",
    lessons: [
      ["Imlo qoidalari", 15, "O'zbek tilining asosiy imlo qoidalari va ko'p uchraydigan xatolar."],
      ["Tinish belgilari", 15, "Vergul, nuqtali vergul va tire qo'llanilishi."],
    ],
  },
];

const TESTS: { title: string; slug: string; subject: string; course?: string; minutes: number; desc: string; q: [string, string[], number][] }[] = [
  {
    title: "Ingliz tili: darajangizni aniqlang", slug: "ingliz-daraja", subject: "ingliz-tili", course: "ielts-intensiv", minutes: 10,
    desc: "Grammatika va lug'at bo'yicha 6 ta savol orqali taxminiy darajangizni bilib oling.",
    q: [
      ["She ___ to school every day.", ["go", "goes", "going", "gone"], 1],
      ["I have lived here ___ 2015.", ["for", "since", "from", "at"], 1],
      ["If I ___ rich, I would travel the world.", ["am", "was", "were", "be"], 2],
      ["Choose the synonym of 'rapid':", ["slow", "quick", "heavy", "calm"], 1],
      ["The book ___ by millions of people.", ["has read", "has been read", "is reading", "reads"], 1],
      ["'Despite' bilan to'g'ri gap:", ["Despite it rained, we went.", "Despite the rain, we went.", "Despite of rain, we went.", "Despite raining it, we went."], 1],
    ],
  },
  {
    title: "Matematika: DTM sinov testi", slug: "dtm-matematika-sinov", subject: "matematika", course: "dtm-matematika", minutes: 15,
    desc: "DTM formatidagi 5 ta savol. 70% to'plasangiz sertifikat olasiz.",
    q: [
      ["x² − 5x + 6 = 0 tenglama ildizlari yig'indisi?", ["5", "6", "−5", "1"], 0],
      ["Arifmetik progressiyada a₁ = 2, d = 3. a₅ = ?", ["12", "14", "11", "17"], 1],
      ["sin²30° + cos²30° = ?", ["0", "1/2", "1", "2"], 2],
      ["log₂ 32 = ?", ["4", "5", "6", "16"], 1],
      ["Uchburchak ichki burchaklari yig'indisi?", ["90°", "180°", "270°", "360°"], 1],
    ],
  },
  {
    title: "Python asoslari", slug: "python-asoslari", subject: "dasturlash", course: "python-noldan", minutes: 8,
    desc: "Python sintaksisi bo'yicha qisqa test.",
    q: [
      ["print(type(3.0)) natijasi?", ["<class 'int'>", "<class 'float'>", "<class 'str'>", "Xato"], 1],
      ["Ro'yxat uzunligini qaysi funksiya qaytaradi?", ["size()", "count()", "len()", "length()"], 2],
      ["Funksiya qaysi kalit so'z bilan e'lon qilinadi?", ["func", "def", "function", "lambda"], 1],
      ["[1, 2, 3][-1] = ?", ["1", "2", "3", "Xato"], 2],
    ],
  },
];

const REVIEWS = ["Juda tushunarli tushuntiradi, natijam ancha oshdi!", "Darslar qiziqarli va foydali. Tavsiya qilaman.", "Vaqtga juda e'tiborli, uy vazifalarini sinchiklab tekshiradi.", "Narxiga arziydi, ammo jadval biroz band.", "Eng yaxshi ustoz! 3 oyda maqsadimga erishdim."];

async function main() {
  // Deploy paytida qayta ishga tushganda mavjud ma'lumotlarni o'chirmaslik uchun. Majburan qayta yuklash: SEED_RESET=1
  if (process.env.SEED_RESET !== "1" && (await db.subject.count()) > 0) {
    console.log("ℹ️ Baza allaqachon to'ldirilgan, seed o'tkazib yuborildi");
    return;
  }
  await db.$transaction([
    db.booking.deleteMany(), db.payment.deleteMany(), db.certificate.deleteMany(), db.testAttempt.deleteMany(),
    db.option.deleteMany(), db.question.deleteMany(), db.test.deleteMany(), db.review.deleteMany(),
    db.lessonProgress.deleteMany(), db.enrollment.deleteMany(), db.lesson.deleteMany(), db.course.deleteMany(),
    db.center.deleteMany(), db.teacherProfile.deleteMany(), db.user.deleteMany(), db.subject.deleteMany(),
  ]);

  const subj: Record<string, string> = {};
  for (const [name, slug, icon] of SUBJECTS) subj[slug] = (await db.subject.create({ data: { name, slug, icon } })).id;

  // SEED_DEMO="false" bo'lsa, faqat fanlar yaratiladi va sayt bo'sh holatda boshlanadi
  if (process.env.SEED_DEMO === "false") {
    console.log("✅ Bo'sh baza: faqat fanlar yaratildi");
    return;
  }

  const passwordHash = await bcrypt.hash("parol123", 10);

  const students = await Promise.all(
    ["Talaba Demo", "Bekzod Nazarov", "Shahzoda Olimova", "Otabek Qodirov", "Malika Saidova"].map((name, i) =>
      db.user.create({ data: { name, email: i === 0 ? "talaba@ustoz.uz" : `student${i}@ustoz.uz`, passwordHash, city: "Toshkent" } }),
    ),
  );

  const teachers = [];
  for (const [i, t] of TEACHERS.entries()) {
    const user = await db.user.create({ data: { name: t.name, email: i === 0 ? "ustoz@ustoz.uz" : `teacher${i}@ustoz.uz`, passwordHash, role: "TEACHER", city: t.city } });
    teachers.push(await db.teacherProfile.create({
      data: {
        userId: user.id, headline: t.headline, city: t.city, pricePerHour: t.price, experienceYears: t.years, format: t.format, verified: t.verified,
        bio: `Assalomu alaykum! Men ${t.years} yildan beri dars beraman. Har bir o'quvchiga individual yondashaman: avval darajangizni aniqlaymiz, so'ng aniq reja asosida ishlaymiz.\n\nDarslarimda nazariya va amaliyot uyg'un: har darsdan keyin uy vazifasi va haftalik nazorat testi bo'ladi.`,
        subjects: { connect: t.subjects.map((s) => ({ id: subj[s] })) },
      },
    }));
  }

  const centers: Record<string, string> = {};
  for (const c of CENTERS) {
    centers[c.slug] = (await db.center.create({
      data: { name: c.name, slug: c.slug, city: c.city, address: c.address, phone: c.phone, description: c.description, verified: true, subjects: { connect: c.subjects.map((s) => ({ id: subj[s] })) } },
    })).id;
  }

  const courses: Record<string, string> = {};
  for (const c of COURSES) {
    courses[c.slug] = (await db.course.create({
      data: {
        title: c.title, slug: c.slug, summary: c.summary, price: c.price, level: c.level, format: c.format, durationWeeks: c.weeks,
        description: `${c.summary}\n\nKurs davomida siz bosqichma-bosqich nazariyani o'rganasiz, amaliy topshiriqlar bajarasiz va yakuniy testdan o'tasiz. Barcha darslarni tugatganingizdan so'ng tekshiriladigan sertifikat beriladi.`,
        subjectId: subj[c.subject], teacherId: c.teacher !== undefined ? teachers[c.teacher].id : null, centerId: c.center ? centers[c.center] : null,
        lessons: { create: c.lessons.map(([title, minutes, content], i) => ({ title, minutes, content, order: i + 1 })) },
      },
    })).id;
  }

  for (const t of TESTS) {
    await db.test.create({
      data: {
        title: t.title, slug: t.slug, description: t.desc, durationMin: t.minutes, subjectId: subj[t.subject], courseId: t.course ? courses[t.course] : null,
        questions: { create: t.q.map(([text, opts, correct], i) => ({ text, order: i + 1, options: { create: opts.map((o, j) => ({ text: o, isCorrect: j === correct })) } })) },
      },
    });
  }

  // Sharhlar va reytinglar
  const ratings = [5, 5, 4, 5, 4];
  for (const [ti, t] of teachers.entries()) {
    const n = 2 + (ti % 4);
    for (let i = 0; i < n; i++) await db.review.create({ data: { authorId: students[i].id, teacherId: t.id, rating: ratings[(i + ti) % 5], comment: REVIEWS[(i + ti) % 5] } });
  }
  for (const [ci, id] of Object.values(centers).entries()) {
    for (let i = 0; i < 3; i++) await db.review.create({ data: { authorId: students[i + 1].id, centerId: id, rating: ratings[(i + ci) % 5], comment: REVIEWS[(i + ci + 2) % 5] } });
  }
  for (const [ci, id] of Object.values(courses).entries()) {
    for (let i = 1; i <= 1 + (ci % 3); i++) {
      await db.enrollment.create({ data: { userId: students[i].id, courseId: id } });
      await db.review.create({ data: { authorId: students[i].id, courseId: id, rating: ratings[(i + ci) % 5], comment: REVIEWS[(i + ci + 1) % 5] } });
    }
  }
  for (const key of ["teacherId", "centerId", "courseId"] as const) {
    const groups = await db.review.groupBy({ by: [key], _avg: { rating: true }, _count: true, where: { [key]: { not: null } } });
    for (const g of groups) {
      const id = g[key]!;
      const data = { rating: Math.round((g._avg.rating ?? 0) * 10) / 10, reviewCount: g._count };
      if (key === "teacherId") await db.teacherProfile.update({ where: { id }, data });
      if (key === "centerId") await db.center.update({ where: { id }, data });
      if (key === "courseId") await db.course.update({ where: { id }, data });
    }
  }

  await db.booking.create({ data: { studentId: students[0].id, teacherId: teachers[0].id, date: new Date(Date.now() + 3 * 864e5), message: "IELTS Speaking bo'yicha sinov darsi kerak" } });
  console.log("✅ Seed tayyor: talaba@ustoz.uz / ustoz@ustoz.uz, parol: parol123");
}

main().finally(() => db.$disconnect());
