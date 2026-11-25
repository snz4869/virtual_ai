# AGY CLI — Portable Skills & Plugin Setup

File konfigurasi portabel untuk menyalin seluruh setup skill global Google Antigravity (`agy`) dari device ini ke device lain (Windows, macOS, maupun Linux).

> **Cara pakai di device baru:** Upload atau arahkan AGY CLI ke file ini, lalu kirim prompt:
> **"Pasang seluruh plugin dan skill global sesuai panduan di `AGY_SKILLS_SETUP.md` ini."**

---

## Ringkasan Setup Global (`~/.gemini/config/`)

| Nama | Jenis | Sumber | Perilaku / Optimasi |
| :--- | :--- | :--- | :--- |
| **`ponytail`** | Plugin (6 skill/command) | `https://github.com/DietrichGebert/ponytail` | Aktif untuk coding harian (*lazy senior dev*, anti-bloat, hemat token output). |
| **`grilling`** | Custom Global Skill | Adaptasi *Core-Only* dari `mattpocock/skills` | Hanya konfirmasi keputusan **core/penting** (`❓ Q1` + `➡️` rekomendasi); hal minor langsung dieksekusi. |
| **`unslop`** | Global Skill (Manual-Only) | `https://github.com/heydamir/unslop` | **Dipangkas frontmatter-nya (~85% lebih hemat overhead)** & dikunci **manual-only** (hanya aktif saat user eksplisit minta `/unslop`). |

---

## Langkah Instalasi (Untuk Dieksekusi AGY CLI / Manual)

### 1. Pasang Plugin `ponytail`
Jalankan perintah berikut (berlaku di Windows, macOS, dan Linux):

```bash
agy plugin install https://github.com/DietrichGebert/ponytail
```

Hasil yang diharapkan:
- Terpasang di `~/.gemini/config/plugins/ponytail`
- Mendaftarkan 6 skill & slash command: `/ponytail`, `/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`, `/ponytail-gain`, `/ponytail-help`.

---

### 2. Pasang Skill `unslop` (Mode Manual-Only / Hemat Token)

Clone `heydamir/unslop` ke folder sementara, salin folder `skills/unslop` ke `~/.gemini/config/skills/unslop`, lalu hapus folder sementara.

**Windows (PowerShell):**
```powershell
git clone --depth 1 https://github.com/heydamir/unslop.git "$env:TEMP\unslop-repo"
New-Item -ItemType Directory -Force -Path "$HOME\.gemini\config\skills" | Out-Null
Copy-Item -Recurse -Force "$env:TEMP\unslop-repo\skills\unslop" "$HOME\.gemini\config\skills\unslop"
Remove-Item -Recurse -Force "$env:TEMP\unslop-repo"
```

**macOS / Linux (Bash):**
```bash
git clone --depth 1 https://github.com/heydamir/unslop.git /tmp/unslop-repo
mkdir -p ~/.gemini/config/skills
cp -r /tmp/unslop-repo/skills/unslop ~/.gemini/config/skills/unslop
rm -rf /tmp/unslop-repo
```

#### Override Frontmatter `unslop` (Wajib Diterapkan)
Buka `~/.gemini/config/skills/unslop/SKILL.md` dan **ganti blok frontmatter paling atas (baris `---` sampai `---`)** menjadi persis seperti ini agar tidak auto-trigger dan tidak boros token pasif:

```yaml
---
name: unslop
description: ONLY use when the user explicitly types /unslop or asks to unslop a UI. Never auto-trigger on normal UI/frontend tasks.
license: CC-BY-4.0
metadata:
  author: Damir Sokolovsky
  x: https://x.com/heydamir
  site: https://heydamir.design/unslop
---
```

*(Biarkan isi body markdown di bawah baris `---` kedua tetap utuh.)*

---

### 3. Pasang Skill `grilling` (Custom Core-Only)

Buat file `~/.gemini/config/skills/grilling/SKILL.md` dengan isi persis di bawah ini:

````markdown
---
name: grilling
description: >-
  Focused grilling interview for core and high-impact decisions only. Use when
  planning or building features with meaningful architectural, functional, or
  product trade-offs, or when the user asks to be grilled (/grilling, "grill me").
  Asks and confirms ONLY important/core functionality; executes minor and
  reversible details autonomously without asking.
---

# Grilling (Core-Only)

Adapted from `mattpocock/skills` (`grilling`) for pragmatic, high-signal alignment.

Interview the user **only on important, core decisions** until shared understanding is reached, then execute. Do not pester the user with minor details.

## Core vs. Minor Filter (Strict)

Before asking any question, classify it:

- **ASK & CONFIRM (Core / High-Impact only):**
  - Core feature behavior, primary user flow, and scope boundaries
  - Architecture, data model/schema, API contracts, or external integrations
  - Breaking changes, destructive actions, security/auth, or data-loss risks
  - Major trade-offs that are expensive to reverse later
- **EXECUTE DIRECTLY (Minor / Low-Impact — never ask):**
  - Internal implementation details (helper structure, naming, file layout following codebase conventions)
  - Routine edge cases, standard validation, error handling, loading/empty states
  - Minor UI/copy adjustments or obvious defaults already established in the codebase
  - Easily reversible choices — pick the cleanest option consistent with the repo, implement it, and briefly note what you chose in the final summary

If a request has **no open core decisions** (only minor/clear work), **skip grilling completely and execute directly**.

## How to Run a Grilling Round

Map only the **core decisions** as a **design tree** and work it in **rounds**:

1. **Frontier only:** Ask only core questions whose prerequisites are already settled. A question depending on an unanswered question waits for the next round.
2. **Facts are your job, never the user's:** Before asking, inspect the codebase (or dispatch a research subagent) to answer anything discoverable from existing code, configs, or tools. Only put genuine *decisions* to the user.
3. **Format each round cleanly** with numbered questions and a recommended answer (worded so "yes" accepts your recommendation):

```text
❓ **Q1** - **<short title>**: <concise question covering the core decision and key options>

➡️ <recommended answer>

---

❓ **Q2** - **<short title>**: <concise question>

➡️ <recommended answer>
```

4. **Confirm core, then build:** Wait for the user's answers on open core decisions. Once the core frontier is settled and confirmed, proceed directly to implementation—handling all minor details autonomously without further confirmation rounds.
````

---

## Verifikasi Akhir di Device Baru

Pastikan struktur direktori berikut sudah ada setelah instalasi:
- `~/.gemini/config/plugins/ponytail/skills/ponytail/SKILL.md`
- `~/.gemini/config/skills/grilling/SKILL.md`
- `~/.gemini/config/skills/unslop/SKILL.md` *(dengan `description: ONLY use when the user explicitly types /unslop...`)*
- `~/.gemini/config/skills/unslop/references/` dan `scripts/`

*(Opsional)* Jika ingin memakai fitur snapshot live URL atau story video pada `/unslop`, instal `playwright` (`npx playwright install chromium`) dan `ffmpeg` di project tujuan.
