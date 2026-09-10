<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Personal Website Admin (CMS)

แนวทางสำหรับ AI agent / คนที่มาแก้โค้ดหรือ prompt ต่อในโปรเจกต์นี้  
อ่านไฟล์นี้ก่อนเปลี่ยน layout, loading, หน้า list, หรือ API client

---

## 0) ภาพรวมระบบทั้งชุด

| โฟลเดอร์ | บทบาท |
|----------|--------|
| `Personal-website-web` | Landing page สาธารณะ |
| `Personal-website-admin` | **โปรเจกต์นี้** — CMS จัดการคอนเทนต์ |
| `Personal-website-api` | Backend API |

### หลักการผลิตภัณฑ์

1. Admin ใช้เขียน/แก้/เปิด-ปิด/จัดลำดับคอนเทนต์ที่จะไปโชว์บน landing
2. คอนเทนต์หลัก: Site Settings, Home Banners, Skills, Projects, Experiences, Education (+ Admins, Logs)
3. รองรับ **ไทย + อังกฤษ** ในฟอร์มที่มี `*_th` / `*_en`
4. `description_*` ใช้ **Rich Text (TipTap)** ส่งเป็น HTML string
5. Theme: **ขาว + navy** (`--brand-primary: #0b1f3a`)
6. Responsive: เดสก์ท็อปเป็นหลัก แต่ฟอร์ม/ตารางใช้งานบนจอแคบได้

Admin **ไม่ใช่** landing — อย่าออกแบบเป็น portfolio โชว์ผลงาน

---

## 1) ภาพรวมโปรเจกต์

- **ชื่อ:** `personal-website-admin` (Next.js App Router)
- **basePath:** `/personal-website-admin`
- **Backend:** `NEXT_PUBLIC_BACKEND_URL` เช่น `http://localhost:3003/personal-website/api/`
- **Auth:** JWT ใน `localStorage` key `personal_website_admin_token`
- **Profile key:** `personal_website_admin_admin`
- **Permission:** `AdminSessionProvider` โหลด `auth/me` + `admin-menu` ใน memory → sidebar ตาม `actions.view`

### คำสั่ง

```bash
npm run dev
npm run build
npm run lint
```

Dev URL ตัวอย่าง: `http://localhost:3000/personal-website-admin/login`

---

## 2) โครงสร้างโฟลเดอร์

```
Personal-website-admin/
├── AGENTS.md
├── .env.local
└── app/
    ├── layout.tsx
    ├── globals.css              # white + navy tokens
    ├── login/page.tsx
    ├── components/
    │   ├── RichTextEditor.tsx   # TipTap
    │   ├── loading.tsx
    │   ├── loginMain.tsx
    │   └── layout/
    │       ├── AdminShell.tsx
    │       ├── LoadingOverlayHost.tsx
    │       └── sideBar.tsx
    ├── providers/
    ├── hooks/
    ├── lib/
    │   ├── adminStorage.ts
    │   ├── navItems.ts          # TAB_CODE_TO_HREF
    │   └── uiTone.ts
    ├── services/
    │   ├── apiServices.ts
    │   ├── auth|admin|menu|adminLog/
    │   ├── homeBanner|skill|project|experience|education/
    ├── ui/                      # DataTable, FilterPanel, popUp, ...
    └── (admin)/
        ├── page.tsx             # overview links
        ├── home-banners/
        ├── skills/
        ├── projects/
        ├── experiences/
        ├── education/
        ├── admins/
        └── logs/
```

### List page pattern (บังคับ)

แต่ละโมดูลคอนเทนต์:

```
page.tsx
components/
  *Main.tsx      # fetch, filter state, toggle, delete, open modal
  *Filter.tsx
  *Table.tsx
  *Action/*FormModal.tsx
```

Permission: `useTabPermission("<tab-code>")`  
Tab codes: `site-settings`, `home-banners`, `skills`, `projects`, `experiences`, `education`, `admins`, `logs`

`site-settings` เป็นหน้า singleton (GET/PUT) — ไม่มี Filter/Table/FormModal; ใช้ `*Main.tsx` เป็นฟอร์มหน้าเดียว

ตอนเพิ่ม tab ใหม่: อัปเดต `navItems.ts` + หน้า + API client + เมนูฝั่ง API

ถ้าเพิ่ม section บนเว็บใหม่: เพิ่มสวิตช์ `show_*` ใน Site Settings (DB/API/ฟอร์ม) คู่กับโมดูลนั้น

---

## 3) Admin shell + Loading

```
LoadingProvider
  └── AuthGuard
        └── AdminSessionProvider
              ├── SideBar
              └── main
                    ├── {children}
                    └── LoadingOverlayHost
```

| Loading | ใช้เมื่อ |
|---------|----------|
| fullscreen | รอ auth |
| overlay (`withLoading`) | mutate / เปลี่ยนหน้า |
| page | โหลดตารางครั้งแรก |
| login | ปิดปุ่ม submit อย่างเดียว |

---

## 4) Theme / UI

- CSS variables ใน `globals.css` — ขาวพื้น + navy ปุ่ม/แบรนด์
- อย่ากลับไปใช้ธีมมืด Nexus / ม่วง / glow
- SweetAlert ใช้โทนขาว-navy (`app/ui/popUp.tsx`)
- TipTap styles: `.rich-text-editor`, `.rich-text-toolbar`

---

## 5) i18n ในฟอร์มคอนเทนต์

- Projects / Experiences / Education: ฟิลด์ `name_th`, `name_en`, `description_th`, `description_en`
- Descriptions → `<RichTextEditor />`
- Skills / Home Banners: ไม่บังคับคู่ภาษาในชื่อ แต่ media_type + url ต้องถูกต้อง
- UI ระบบ (ปุ่ม Save, filter) ใช้ภาษาอังกฤษในโค้ดปัจจุบันได้ — ข้อมูลคอนเทนต์ต้องรองรับ 2 ภาษา

---

## 6) API client conventions

- `apiServices` axios + Bearer interceptor
- ทุกฟังก์ชัน: `validateOrThrowApiResponse` + `failedResult` รูปแบบ `{ status: "failed", errMessage }`
- Content endpoints ตรงกับ API:
  - list / getById / create / update
  - `PATCH /:id/is-active`
  - `DELETE /:id` soft
  - `DELETE /:id/hard` (ถ้า UI เปิดใช้ ต้อง confirm)

รายละเอียด schema → `../Personal-website-api/AGENTS.md`

---

## 7) สิ่งที่ห้าม

- อย่าเพิ่มโมดูล infra เก่ากลับมา (VPS, CI/CD, ports, domains, databases)
- อย่าทำ landing marketing ใน repo นี้
- อย่าเรียก mutate โดยไม่มี token
- อย่าซ่อนฟิลด์ภาษาที่สองในฟอร์มที่ต้องแปล
- อย่า hard delete โดยไม่มี confirmation
- อย่ารีแฟกเตอร์กว้างเกินงาน
- อย่า commit / push นอกจากผู้ใช้ขอ

---

## 8) เช็กลิสต์ก่อนจบงาน

- [ ] ยังเป็น CMS ไม่ใช่ landing
- [ ] Theme ขาว + navy
- [ ] ฟอร์มคอนเทนต์ TH/EN ตาม schema
- [ ] Rich text สำหรับ description ที่ควรมี
- [ ] Auth + 401/403 ใช้งานได้
- [ ] `navItems` สอดคล้อง tab ใหม่
- [ ] `npx tsc --noEmit` / `npm run build` ผ่าน

---

อัปเดตไฟล์นี้เมื่อเปลี่ยนโครงสร้างเมนู, theme, หรือ convention การเชื่อม API
