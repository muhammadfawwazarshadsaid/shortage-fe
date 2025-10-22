
---

# 🧠 YOLO Prototype Frontend

Frontend untuk proyek **YOLO Panel/BOM Detection**, dibangun dengan **Next.js 15 (Turbopack)** dan diintegrasikan dengan backend Go + Python API.

---

## 🚀 Tech Stack

* **Next.js 15.5.5 (Turbopack)**
* **TypeScript**
* **Tailwind CSS**
* **Shadcn/UI**
* **Lucide Icons**
* **React Hook Form**
* **Zod Validation**

---

## ⚙️ Environment Setup

Buat dua file environment di root folder:

### `.env.development`

```bash
# API URL untuk mode development
NEXT_PUBLIC_API_URL=http://localhost:8081
```

### `.env.production`

```bash
# API URL untuk mode production (contoh)
NEXT_PUBLIC_API_URL=https://my-backend-domain.com
```

---

## 🧩 Menjalankan Project

### 1️⃣ Install dependencies

```bash
npm install
# atau
pnpm install
# atau
yarn install
```

### 2️⃣ Jalankan dalam mode development

```bash
NODE_ENV=development npm run dev
```

Keluaran akan menampilkan:

```
▲ Next.js 15.5.5 (Turbopack)
- Local:   http://localhost:3000
- Network: http://<ip>:3000
- Environments: .env.development
```

### 3️⃣ Jalankan mode production (setelah build)

```bash
npm run build
NODE_ENV=production npm start
```

## 💡 Tips Penggunaan

* Jalankan backend dulu (`go-api` + `python-api` via Docker) sebelum `npm run dev`.
* Pastikan port backend (`8081`) tidak bentrok dengan service lain.
* Kalau port `3000` sudah terpakai, Next.js otomatis pindah ke port `3001`.

---

## 🧰 Troubleshooting

| Masalah                       | Solusi                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `net::ERR_CONNECTION_REFUSED` | Pastikan backend Go berjalan di `localhost:8081` atau ganti `.env.development` ke `host.docker.internal`. |
| Port 3000 sudah terpakai      | Tutup proses lain atau biarkan Next.js pindah otomatis ke 3001.                                           |
| Fetch gagal di production     | Pastikan `NEXT_PUBLIC_API_URL` mengarah ke domain backend publik.                                         |

---