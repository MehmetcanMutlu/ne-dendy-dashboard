# Ne Dendy? Dashboard

Dendy.ai ürününün **"Ne Dendy?"** modülü için geliştirilen yönetici odaklı anket içgörü dashboard'u.

## Stack
- React 18 + Vite
- Recharts
- PapaParse
- DM Sans + DM Mono
- CSS-in-JS token yaklaşımı (Tailwind yok)

## Özellikler
- `survey_id` bazlı anket filtreleme
- `action` filtreleme: `escalate / follow_up / watch / ignore`
- `sentiment` filtreleme: `positive / neutral / negative`
- Metin arama
- Sıralama: `severity / score / confidence`
- 3 sekme:
  - Genel Bakış (KPI + donut + bar)
  - İçgörüler (aksiyon gruplu kartlar)
  - Temalar (radar + horizontal bar + tema kartları)
- Escalate uyarı banner'ı
- CSV veri yükleme (`public/data.csv`)

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
npm run build
npm run preview
```

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
