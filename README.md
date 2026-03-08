# Ne Dendy? Dashboard

Dendy.ai ürününün **"Ne Dendy?"** modülü için geliştirilen yönetici odaklı anket içgörü dashboard'u.

## Stack
- React 18 + Vite
- Recharts
- PapaParse
- DM Sans + DM Mono
- CSS-in-JS token yaklaşımı (Tailwind yok)

## Teknik Tercihler ve Nedenleri
- React 18: veri odakli dashboardlarda state/composition yonetimini sade ve izlenebilir tutuyor.
- Vite: hizli HMR ve kisa build suresi ile iterasyonu hizlandiriyor.
- PapaParse: istemci tarafinda guvenilir CSV parse; buyuk dosyada da stabil.
- Recharts: React ile dogrudan uyumlu; ozellikle dashboard chart setleri hizli gelistiriliyor.
- CSS variables + token yapisi: dark/light tema ve tasarim tutarliligini tek merkezden yonetiyor.
- Moduler yapi: `src/dashboard/config.js`, `src/dashboard/utils.js`, `src/dashboard/primitives.jsx` ile sorumluluklar ayrildi.
- Performans: chart tablari lazy-load edilerek ilk yukleme maliyeti dusuruldu.

## Özellikler
- `survey_id` bazlı anket filtreleme
- `action` filtreleme: `escalate / follow_up / watch / ignore`
- `sentiment` filtreleme: `positive / neutral / negative`
- Metin arama
- Sıralama: `priority / severity / score / confidence`
- 3 sekme:
  - Genel Bakış (KPI + donut + bar + sentiment trend line chart)
  - İçgörüler (aksiyon gruplu kartlar + participant drill-down drawer + öncelik skoru)
  - Temalar (radar + horizontal bar + tema kartları)
- Escalate uyarı banner'ı
- CSV veri yükleme (`public/data.csv`)
- Filtrelenmiş veriyi CSV olarak dışa aktarma
- Dark/Light tema toggle (CSS variable token sistemi)
- Mobil/tablet responsive düzen + hamburger menü
- Focus Mode filtreleri (`Tum / Kritik / Negatif / Dusuk Guven`)
- Veri kalite paneli (eksik tarih, belirsiz aksiyon/sentiment, düşük güven)
- Riskli katılımcı listesi ve hızlı drill-down

## Proje Yapısı
```text
.
├── docs/
│   ├── df_front_case_mar2026.pdf
│   └── ne-dendy-dashboard.html
├── public/
│   └── data.csv
├── src/
│   ├── App.jsx
│   ├── NeDendy.jsx
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── OverviewTab.jsx
│   │   │   └── ThemesTab.jsx
│   │   ├── config.js
│   │   ├── primitives.jsx
│   │   ├── utils.test.js
│   │   └── utils.js
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── README.md
```

## Kurulum
```bash
npm install
npm run dev
```

## Build ve Kontrol
```bash
npm run lint
npm run test
npm run build
npm run preview
```

## CI Pipeline
GitHub Actions pipeline'i eklendi: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

Calistirdigi adimlar:
1. `npm ci`
2. `npm run lint`
3. `npm run test`
4. `npm run build`

Trigger:
- `push` (`main` ve `feature/**`)
- `pull_request`
- `workflow_dispatch`

## Tasarım Token'ları
- `bg: #0a0c10`
- `surface: #111318`
- `border: #1e2230`
- `accent: #6c63ff`
- `positive: #22d3a0`
- `neutral: #f59e0b`
- `negative: #f43f5e`
- `watch: #fb923c`
- `escalate: #ef4444`
- `followUp: #a78bfa`
- `text: #e2e8f0`
- `muted: #64748b`

## Zaman Kisitina Gore Sonraki Iyilestirmeler
- Chart bundle boyutunu azaltmak icin code-splitting ve lazy chart yukleme.
- E2E test (Playwright) ve smoke test katmani.
- Daha detayli accessiblity turu (klavye/focus/screen reader audit).

## GitHub (Public) Yayınlama
Aşağıdaki komutlarla public repo açıp push edebilirsin:

```bash
git init
git add .
git commit -m "feat: initial Ne Dendy dashboard"
git branch -M main
gh repo create ne-dendy-dashboard --public --source=. --remote=origin --push
```

`gh` oturumu açık değilse:
```bash
gh auth login
```
