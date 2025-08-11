# 💸 FinTrack Bot — Personal Finance Tracker with Telegram + Web Dashboard

**FinTrack Bot** is a personal finance tracker that combines the simplicity of a Telegram bot with the power of a modern analytics dashboard.

Track your daily expenses by messaging a bot. Visualize your data through a beautiful, minimal web interface.

---

## ✨ Features

### Telegram Bot
- `/start` – quick setup and help
- `/summary` – view your daily/monthly balance
- `+500 salary` or `-120 groceries` – log income or expenses instantly
- Automatically parses and saves your transactions

### Web Dashboard
- Interactive charts (Chart.js)
- Balance overview: total income, expenses, and net
- Transactions table with filters, sorting, and search
- Clean and responsive UI (React + Tailwind)

### 🚧 Planned Features
- Bank card integration: display real-time top-ups and spending
- Visualize card transactions directly on the map (Google Maps API)

---

## 🛠 Tech Stack

### Frontend
- React + TypeScript
- Zustand for state management
- TanStack Query
- TailwindCSS

### Backend
- Node.js + Express
- PostgreSQL
- Telegram Bot via Telegraf

---

## 🔧 How It Works

1. User sends transactions via Telegram bot
2. Bot saves them to a PostgreSQL database
3. Web app fetches and displays data via REST API

[Figma UI Kit – Finance Dashboard (Community)](https://www.figma.com/design/R6IxlELyBVpBH00ndBfKAD/Figma-UI-kit---Finance-Dashboard--Community---Copy-?node-id=6501-451&t=OZEXhxgDdwmzQ4P3-1)