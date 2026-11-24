# Virtual Office AI — 2D Interactive Workspace (BRD v2.1)

Aplikasi simulasi kantor 2D interaktif berbasis **React + Vite + Tailwind CSS + HTML5 Canvas 2D + Vercel Serverless** yang menghubungkan tim multi-agent AI ke **Gemini Interactions API**.

## Fitur Utama (BRD v2.1)
1. **Tata Letak 5 Ruangan:** Director Office, Lounge & Pantry, Tech Lead Room (Alex), Engineering Pod (Raka), dan QA & Review Lab (Nadia).
2. **Kontrol Karakter Director:** Gerakkan karakter Director mengelilingi kantor menggunakan keyboard (**WASD / Arrow Keys**) atau **klik langsung pada lantai kantor**.
3. **NPC Ambient Roaming & Handoff:** Saat *idle*, NPC berjalan santai di area Lounge & Pantry; saat bertugas, NPC berjalan melalui koridor untuk menyerahkan dokumen antar ruangan dan melapor ke Director Office (`!`).
4. **Adaptive Complexity (Anti-Overengineering):** Agen otomatis membedakan pertanyaan ringkas (hitungan/logika cepat) dan proyek teknis (spesifikasi API, kode, dan audit QA).
5. **Gemini Interactions API + Auto-Fallback:** Mendukung endpoint `/v1beta/interactions` dengan header `x-goog-api-key`, jeda *cooldown* 3 detik antar-agen, dan *fallback* model otomatis saat `503`.

## Cara Menjalankan Lokal
```bash
npm install
npm run dev
```
Untuk menjalankan bersama Vercel Serverless Function (`/api/interact`) secara lokal:
```bash
npx vercel dev
```
