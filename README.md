# Maven Landing Template (PRD Dynamic Company Landing Page)

Template landing page dinamis, bilingual ID/EN, CMS-ready. **100% statis (HTML+CSS+JS) — deploy TANPA python / tanpa build.**

## Deploy (tanpa python)
- Netlify / Vercel / GitHub Pages / cPanel: drag & drop folder ini. Selesai.
- Python / `npx serve` HANYA untuk preview lokal di laptop, bukan untuk production.

## Buka lokal 2 cara
1. Double-click `index.html` → langsung jalan (data fallback embedded di `js/fallback.js`)
2. Atau via server: `cd folder-ini && python3 -m http.server 8000` → `http://localhost:8000`

## Ganti foto slideshow
Edit `content/content.id.json` + `content.en.json` → bagian `gallery.items` (ganti `src` + `caption`). Bisa URL atau file lokal `assets/foto1.jpg`. `js/fallback.js` auto-regenerate? Jika edit JSON, jalankan:
`python3 -c "import json;open('js/fallback.js','w').write('window.__SITE__='+json.dumps(json.load(open('content/site.config.json')))+';window.__ID__='+json.dumps(json.load(open('content/content.id.json')))+';window.__EN__='+json.dumps(json.load(open('content/content.en.json'))))"`

## Cara pakai untuk project berikutnya
1. Duplikat folder `maven-landing-template` → `nama-klien-baru`
2. Edit `content/site.config.json`:
   - `brand.name`, `theme` (warna primary/accent/bg), `contact.whatsapp`, `contact.email`, alamat, sosmed
3. Edit `content/content.id.json` + `content/content.en.json` untuk semua teks
4. Jalankan: `npx serve .` lalu buka `http://localhost:3000`
5. Deploy ke Netlify/Vercel/GitHub Pages (drag & drop folder ini)

## Struktur (sesuai PRD §3.1)
- `index.html` → kerangka semua block dinamis
- `content/site.config.json` → brand, tema, kontak, CMS endpoint
- `content/content.id.json` / `content.en.json` → copy per bahasa (1:1 dengan schema Strapi)
- `css/style.css` → design system, 3 breakpoint (320/768/1024), variabel tema
- `js/app.js` → renderer dinamis, i18n toggle, counter IntersectionObserver, carousel, form → WhatsApp, cookie UU PDP/GDPR, analytics stub

## Mapping PRD
| PRD | Implementasi |
|---|---|
| Top Nav, Hero, Logos, Services, Stats, Cases, Testimonials, Form, Footer | Semua render dari JSON, toggle via hapus/edit item |
| Mobile sticky CTA, hamburger fullscreen, 48px target | ✅ |
| Tablet 2-col, Desktop blur nav + hover scale | ✅ |
| Animated counters, marquee pause-hover, autoplay carousel | ✅ |
| Form validasi + success modal + WhatsApp | ✅ |
| Cookie banner, JSON-LD Restaurant, SEO meta dinamis, sitemap/robots | ✅ |
| GA4 events: cta, form_start/submit, scroll 25/50/75/100, lang_switch | `track()` di app.js → sambung ke gtag |

## Upgrade ke Strapi/Contentful
1. Buat collection dengan field sama persis seperti key di `content.*.json`
2. Set `CMS_ENDPOINT` di `js/app.js`
3. Selesai — tidak perlu ubah HTML/CSS.

## Ganti nomor WhatsApp
Satu tempat saja: `content/site.config.json` → `contact.whatsapp` (format 628xx).
