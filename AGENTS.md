<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Baan Laundry Admin

แนวทางสำหรับ AI agent / คนที่มาแก้โค้ดหรือ prompt ต่อในโปรเจกต์นี้  
อ่านไฟล์นี้ก่อนเปลี่ยน layout, loading, หน้า list, หรือ API client

---

## 1) ภาพรวมโปรเจกต์

- **ชื่อ:** `baan_laundry_admin` (Next.js App Router)
- **Backend URL:** `NEXT_PUBLIC_BACKEND_URL` ใน `.env.local` (เช่น `http://localhost:3001/laundry/api/`)
- **Auth:** JWT เก็บใน `localStorage` key `baan_laundry_token` — axios interceptor แนบ `Authorization: Bearer` อัตโนมัติ
- **Permission UI:** `AdminSessionProvider` โหลด `auth/me` + `admin-menu` เก็บใน memory → sidebar แสดงเฉพาะ tab ที่มี `actions.view` (ไม่เก็บใน localStorage)

### คำสั่งที่ใช้บ่อย

```bash
npm run dev
npm run build
npm run lint
```

---

## 2) โครงสร้างโฟลเดอร์

```
baan_laundry_admin/
├── AGENTS.md
├── .env.local                    # NEXT_PUBLIC_BACKEND_URL
└── app/
    ├── layout.tsx                # root layout + next-intl
    ├── globals.css
    ├── login/page.tsx
    ├── components/
    │   ├── loading.tsx           # UI Loading (variants)
    │   ├── loginMain.tsx
    │   └── layout/
    │       ├── AdminShell.tsx    # shell หลัก admin + LoadingProvider
    │       ├── LoadingOverlayHost.tsx
    │       ├── header.tsx
    │       └── sideBar.tsx
    ├── providers/
    │   ├── LoadingProvider.tsx   # context + route loading
    │   └── AdminSessionProvider.tsx  # permission_menu + menu_all ใน memory
    ├── hooks/
    │   └── AuthGuard.tsx
    ├── lib/
    │   ├── adminStorage.ts       # localStorage keys + helpers
    │   └── navItems.ts           # TAB_CODE_TO_HREF, icons, labels
    ├── services/
    │   ├── apiServices.ts        # axios instance + interceptors
    │   ├── response-validator.ts
    │   ├── auth/authAPI.ts
    │   ├── admin/adminAPI.ts
    │   ├── menu/menuAPI.ts
    │   ├── user/userAPI.ts
    │   ├── serviceType/serviceTypeAPI.ts
    │   ├── listType/listTypeAPI.ts
    │   ├── listPrice/listPriceAPI.ts
    │   └── order/orderAPI.ts
    ├── ui/
    │   ├── table.tsx             # DataTable ใช้ร่วมทุกหน้า list
    │   ├── filterPanel.tsx
    │   └── popUp.tsx             # SweetAlert2 wrappers
    └── (admin)/
        ├── layout.tsx            # wrap AdminShell
        ├── page.tsx              # dashboard
        ├── admins/components/    # *Main, *Filter, *Table
        ├── customers/components/
        ├── service-types/components/
        ├── list-types/components/
        ├── list-prices/components/
        └── ...
```

---

## 3) Admin layout shell

```
LoadingProvider
  └── AuthGuard (requireAuth)
        └── AdminSessionProvider  ← getMe + getMenuAll → memory
              ├── SideBar          ← dynamic menu จาก permission
              ├── Header           ← title ตาม pathname + profile + logout
              └── main (relative)
                    ├── {children} ← เนื้อหาแต่ละหน้า
                    └── LoadingOverlayHost  ← overlay loading ทับเฉพาะ main
```

- **`AdminShell`:** `app/components/layout/AdminShell.tsx`
- **`AuthGuard`:** redirect ไป `/login` ถ้าไม่มี token; ตอนรอใช้ `<Loading variant="fullscreen" />`
- **`AdminSessionProvider`:** โหลดสิทธิ์เมนูครั้งเข้า admin shell; ถ้า fail → clear session + ไป `/login`
- **`Header`:** ชื่อหน้าจาก `menuAll` ใน session + โปรไฟล์จาก localStorage
- **`SideBar`:** อ่าน `permissionMenu` + `menuAll` จาก `useAdminSession()`

---

## 4) ระบบ Loading (สำคัญ — อ่านก่อนเพิ่ม async UI)

### 4.1 ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | หน้าที่ |
|------|--------|
| `app/components/loading.tsx` | UI component หลัก + `LoadingSpinner` |
| `app/providers/LoadingProvider.tsx` | Context, route loading, `useLoading()` |
| `app/components/layout/LoadingOverlayHost.tsx` | แสดง overlay เมื่อ `isLoading === true` |
| `app/components/layout/AdminShell.tsx` | wrap `LoadingProvider` + วาง `LoadingOverlayHost` ใน `<main>` |

### 4.2 Variants ของ `<Loading />`

| variant | ใช้เมื่อ | ตำแหน่ง |
|---------|----------|---------|
| `fullscreen` | auth guard | `fixed inset-0 z-[9999]` ทับทั้งจอ |
| `overlay` | เปลี่ยนหน้า, ลบข้อมูล, logout | `absolute inset-0` ทับเฉพาะ `<main>` (parent ต้อง `relative`) |
| `page` | โหลดตารางครั้งแรก | ใน `DataTable` แทน spinner เก่า |
| `inline` | จุดเล็กๆ ในหน้า | default |

```tsx
import Loading from "@/app/components/loading";

<Loading variant="fullscreen" message="กำลังตรวจสอบสิทธิ์..." />
<Loading variant="overlay" message="กำลังลบข้อมูล..." />
<Loading variant="page" message="กำลังโหลดข้อมูลลูกค้า..." />
```

### 4.3 LoadingProvider — สองแหล่ง loading

1. **Route loading (อัตโนมัติ)**  
   - ดัก `click` บน `<a href>` ภายใน origin เดียวกัน  
   - ถ้า pathname เปลี่ยน → แสดง `"กำลังเปลี่ยนหน้า..."`  
   - ปิดเมื่อ `usePathname()` เปลี่ยน หรือ timeout 10 วินาที  

2. **Manual loading (ref count)**  
   - `showLoading(message?)` / `hideLoading()` — นับซ้อนได้  
   - `withLoading(asyncFn, message?)` — เปิดก่อน await ปิดใน `finally`

```tsx
import { useLoading } from "@/app/providers/LoadingProvider";

const { showLoading, hideLoading, withLoading, isLoading, message } = useLoading();

// แนะนำ: ครอบ async ที่ user รอ
await withLoading(async () => {
  const result = await someAPI.delete(id);
  // handle result...
}, "กำลังลบข้อมูล...");
```

**ข้อควรระวัง**

- `useLoading()` ใช้ได้เฉพาะภายใน `LoadingProvider` (อยู่ใน `AdminShell`)
- หน้า login **ไม่มี** `LoadingProvider` และ **ไม่แสดง** fullscreen loading ตอน submit — ใช้แค่ปุ่ม `disabled` + ข้อความ "กำลังเข้าสู่ระบบ..."
- อย่า `withLoading` ซ้อนกับ table `loading` ตอน fetch ครั้งแรก (table ใช้ `variant="page"` อยู่แล้ว) — ใช้ overlay สำหรับ action ที่ user กด (ลบ, logout)

### 4.4 จุดที่ใช้ loading อยู่แล้ว

| จังหวะ | วิธีแสดง |
|--------|----------|
| กดเมนู sidebar เปลี่ยนหน้า | route loading → overlay |
| GET list ครั้งแรก | `DataTable` + `loading={true}` → `Loading variant="page"` |
| Soft delete ใน *Main.tsx | `withLoading(..., "กำลังลบ...")` |
| Logout | `withLoading` ใน `header.tsx` |
| Login submit | ปุ่ม disabled + ข้อความ (ไม่มี overlay) |
| AuthGuard รอ token | `Loading variant="fullscreen"` |

---

## 5) แพทเทิร์นหน้า List (CRUD list)

แต่ละ entity ใช้โครงเดียวกัน:

```
(admin)/<route>/
  page.tsx              → import *Main
  components/
    <entity>Main.tsx    → fetch API, filter state, delete handler
    <entity>Filter.tsx  → search + ล้างตัวกรอง + ปุ่มเพิ่ม
    <entity>Table.tsx   → columns + DataTable
```

### Main.tsx

- `useEffect` → เรียก `getXxxAll()` ตอน mount
- filter client-side ด้วย `useMemo`
- delete → `popup.confirmDelete` → `withLoading` → `softDeleteXxx` → refresh
- add admin → เปิด `AdminCreateModal` (multi-step create)
- edit admin → เปิด `AdminCreateModal` โหมดแก้ไข (`adminId`) โหลด `getAdminByIdPermission`

### Admin Create / Edit Modal

ไฟล์หลัก: `app/(admin)/admins/components/adminAction/`
- `adminFormModal.tsx` — state + load/save flow
- `AdminFormSteps.tsx` — UI แต่ละขั้น + ตารางสิทธิ์
- `adminFormShared.ts` — types / constants / permission helpers

Flow 4 ขั้น (create / edit ใช้ modal เดียวกัน):

1. **เลือกบทบาท** — `owner` | `admin` | `staff`
2. **ข้อมูลผู้ใช้งาน** — `display_name`, `email`, `password`  
   - create: รหัสผ่านบังคับ  
   - edit: รหัสผ่านใหม่ไม่บังคับ (ว่าง = ไม่เปลี่ยน)
3. **ขอบเขตสิทธิ์** — จาก `menuAPI.getMenuAll()`  
   - edit: ติ๊กตาม `GET admins/:id/permissions` (`data.menu`)
   - owner: ติ๊กครบ + disabled (ไม่ส่ง `permissions`)
4. **ยืนยัน** → `createAdmin` หรือ `updateAdmin` → ปิด modal → `popup.success`

เปิดจาก `adminMain`: `createOpen` (เพิ่ม) หรือ `editingAdminId` (แก้ไข)

### Table.tsx

- คอลัมน์แรกชื่อ **"ลำดับ"** แสดง `index + 1` (ไม่ใช่ DB id)
- คอลัมน์ actions: ปุ่ม edit/delete
- ใช้ `DataTable` จาก `app/ui/table.tsx`

### Filter.tsx

- ใช้ `FilterPanel`, `FilterField`, `filterInputClass` จาก `app/ui/filterPanel.tsx`
- ปุ่ม "ล้างตัวกรอง" + ปุ่มเพิ่ม (สีน้ำเงิน `#2553D8`)

---

## 6) API services (frontend)

- Base: `app/services/apiServices.ts` — axios + token interceptor
- ทุก API file ใช้รูปแบบเดียวกับ `adminAPI.ts`:
  - inline `headers: { "Content-Type", Accept }`
  - `.then(validateOrThrowApiResponse)`
  - `.catch` return `{ status: "failed", errMessage, error }` ข้อความภาษาไทย
- ตรวจผล: `result.status === "failed" || result.success === false`

### Backend path mapping (relative ต่อ base URL)

| Service file | Path |
|--------------|------|
| `userAPI.ts` | `users` |
| `serviceTypeAPI.ts` | `service-type` |
| `listTypeAPI.ts` | `list-type` (permission tab: `list-types`) |
| `listPriceAPI.ts` | `list-price` |
| `orderAPI.ts` | `orders` (+ PATCH status, payment-status, GET logs) |

---

## 7) Session storage

### localStorage (persist)

| Key | เนื้อหา |
|-----|---------|
| `baan_laundry_token` | JWT |
| `baan_laundry_admin` | โปรไฟล์ admin |

Helper: `app/lib/adminStorage.ts` — `getAdminToken`, `getStoredAdmin`, `clearAdminSession`  
`clearAdminSession` ยังลบ legacy keys `baan_laundry_permission_menu` / `baan_laundry_menu_all` ถ้าค้างอยู่

### Memory (`AdminSessionProvider`)

| ข้อมูล | แหล่ง |
|--------|--------|
| `permissionMenu` | `GET auth/me` → `data.menu` |
| `menuAll` | `GET admin-menu` → `data` (labels, tabs, `tabs[].actions`) |

**หมายเหตุ `getMenuAll`:** แต่ละ tab มี `actions: [{ code, name, sort_order }]` จาก `admin_menu_tab_action` — ใช้ตอนตั้งสิทธิ์สร้าง admin

---

## 8) Navigation / menu

- `app/lib/navItems.ts` — `TAB_CODE_TO_HREF` map tab code → path  
  เช่น `"list-types"` → `/list-types`, `"service-types"` → `/service-types`
- Sidebar ใช้ menu จาก `AdminSessionProvider`; fallback `NAV_ITEMS` ถ้ายังไม่มี menu
- หลังเพิ่ม tab ใหม่ใน backend ต้อง: migration menu + อัป `TAB_CODE_TO_HREF` + สร้างหน้า admin

---

## 9) UI / styling conventions

- Primary blue: `#2553D8`, gradient `#4C7DFF` → `#2553D8`
- Background admin: `#f4f6fb`
- Card/table border: `#dbe4ff`
- Popup: `app/ui/popUp.tsx` — `popup.success`, `popup.error`, `popup.confirmDelete`, `popup.logout`
- อย่า extract `jsonHeaders` แยกใน API files — ใช้ inline headers ตามไฟล์ที่มีอยู่

---

## 10) Checklist ตอนเพิ่มหน้า admin ใหม่

1. สร้าง `app/services/<entity>/<entity>API.ts` (CRUD ตาม backend)
2. เพิ่ม route ใน `navItems.ts` (`TAB_CODE_TO_HREF`)
3. สร้าง `(admin)/<route>/page.tsx` + `components/*Main|Filter|Table`
4. ตาราง: คอลัมน์ลำดับ = `index + 1`, โหลดด้วย `DataTable loading`
5. Delete/action ที่รอ: ใช้ `withLoading` จาก `useLoading()`
6. ถ้า entity ใหม่ใน backend: migration menu + permission tab ด้วย

---

## 11) อ้างอิง backend

รายละเอียด API, permission, schema → อ่าน `../baan_laundry_api/AGENTS.md`
