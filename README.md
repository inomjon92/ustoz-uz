# Ustoz.uz — ta'lim ekotizimi

Repetitorlar, o'quv markazlari, onlayn kurslar, testlar va sertifikatlar bitta platformada.

**Texnologiyalar:** Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 6 · PostgreSQL

## Imkoniyatlar
- **Ustozlar katalogi** — fan, shahar, narx va tajriba bo'yicha qidiruv va filtrlar; profil, reyting, sharhlar
- **Sinov darsiga yozilish** — o'quvchi so'rov yuboradi, ustoz o'z panelida qabul qiladi / rad etadi
- **O'quv markazlar** — katalog, manzil, kurslar, sharhlar
- **Onlayn kurslar** — dasturi, darsma-dars o'qish, progress, tugatgach avtomatik sertifikat
- **To'lov** — Payme / Click / Uzum tanlovi (hozircha demo rejim, to'lov avtomatik tasdiqlanadi)
- **Testlar** — taymer, avtomatik baholash, javoblar tahlili, o'tilsa sertifikat
- **Sertifikatni tekshirish** — `/sertifikat/UZ-XXXXXXXX` ommaviy sahifa
- **Kabinetlar** — o'quvchi (kurslar, testlar, sertifikatlar, to'lovlar) va ustoz (so'rovlar, profil, daromad)
- Ro'yxatdan o'tish / kirish (bcrypt + JWT cookie)

## Ishga tushirish
```bash
cp .env.example .env        # DATABASE_URL va AUTH_SECRET ni kiriting
npm install
npm run db:push             # jadvallarni yaratish
npm run db:seed             # namuna ma'lumotlar
npm run dev                 # http://localhost:3000
```
Demo hisoblar (parol `parol123`): `talaba@ustoz.uz` (o'quvchi), `ustoz@ustoz.uz` (ustoz).

## Ma'lumotlar bazasi (prisma/schema.prisma)
User · TeacherProfile · Center · Subject · Course · Lesson · Enrollment · LessonProgress ·
Review · Test · Question · Option · TestAttempt · Certificate · Payment · Booking

## Keyingi bosqichlar
Payme/Click haqiqiy integratsiyasi · markaz admin paneli va kurs yaratish · SMS/Telegram bildirishnomalar ·
rasm yuklash · admin moderatsiya · Vercel + Neon/Supabase'ga deploy
