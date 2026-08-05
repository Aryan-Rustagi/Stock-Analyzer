# Stock Analyzer — PRD

## What It Is
A stock tracking web app where users can search stocks, view prices, see 30-day charts, and save favorites to a personal watchlist.

## Tech Stack
- **Frontend:** React + Vite, Recharts, Axios
- **Backend:** Node.js, Express
- **Database:** MongoDB Atlas
- **Auth:** JWT + BcryptJS
- **APIs:** Finnhub → Alpha Vantage → Twelve Data (auto-fallback)
- **Deploy:** Vercel (frontend), Render (API), Docker

## Features
1. **Sign Up / Login** — JWT auth with hashed passwords
2. **Search Stocks** — Autocomplete ticker search
3. **Stock Details** — Price, open, high, low, volume
4. **30-Day Chart** — Interactive historical price chart
5. **Watchlist** — Save/remove stocks, live prices on load

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, get token |
| GET | `/api/stock/suggestions/search?q=` | No | Ticker autocomplete |
| GET | `/api/stock/:symbol` | No | Get stock quote |
| GET | `/api/stock/:symbol/history` | No | 30-day price history |
| GET | `/api/portfolio` | JWT | Get saved stocks |
| POST | `/api/portfolio/add` | JWT | Add stock to watchlist |
| DELETE | `/api/portfolio/:id` | JWT | Remove stock |

## API Fallback
If Finnhub fails (rate limit/error) → try Alpha Vantage → try Twelve Data → error. All responses are normalized to the same format.
