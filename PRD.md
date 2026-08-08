# Stock Analyzer — Product Requirement Document (PRD)

## Section 1: Product Overview & Core Vision
Stock Analyzer is an enterprise-grade, high-performance financial tracking web application built using the decoupled MERN stack (MongoDB, Express, React, Node.js). It enables investors to perform real-time stock lookups, visualize chronological 30-day historical price charts, obtain AI-driven financial insights, and maintain personal watchlists securely.

---

## Section 2: Feature Prioritization & Decision Matrix

Features were prioritized during development based on three primary criteria:
1. **Core User Value (Data Utility)** — Delivering immediate value through real-time market quotes and search.
2. **Data Reliability & Resilience** — Guaranteeing 99.9% API uptime through multi-provider fallback mechanics.
3. **User Retention & Security** — Protecting user state and personalized watchlists behind JWT authentication.

### MoSCoW & Tiered Prioritization Table

| Priority Level | Feature Name | PRD Reference | Target Endpoints | Prioritization Criteria & Rationale |
|---|---|---|---|---|
| **P0 (Must Have)** | **Search & Live Stock Details** | Section 2.1 & 2.2 | `GET /api/stock/suggestions/search?q=`<br>`GET /api/stock/:symbol` | **Core User Value**: Real-time pricing and ticker search represent the fundamental core loop. Without accurate market quotes, the application lacks primary utility. |
| **P0 (Must Have)** | **Multi-Provider Fallback Architecture** | Section 5.1 | Backend `stockService.js` (Finnhub → Alpha Vantage → Twelve Data) | **Data Reliability**: External stock APIs frequently encounter rate limits (HTTP 429). Automatic failover ensures uninterrupted data access. |
| **P1 (Should Have)** | **JWT Authentication & Password Security** | Section 2.3 | `POST /api/auth/register`<br>`POST /api/auth/login` | **Security & Isolation**: Protects user credentials using `bcryptjs` hashing and issues 30-day signed JSON Web Tokens for session isolation. |
| **P1 (Should Have)** | **Personal Watchlist / Portfolio** | Section 2.4 | `GET /api/portfolio`<br>`POST /api/portfolio/add`<br>`DELETE /api/portfolio/:id` | **User Retention**: Allows users to save favorite tickers to MongoDB, aggregating saved symbols with live market quotes on load via `Promise.all`. |
| **P2 (Could Have)** | **30-Day Historical Trend Chart** | Section 2.5 | `GET /api/stock/:symbol/history` | **Enhanced Visualization**: Interactive SVG price trend visualizer built with Recharts to evaluate month-over-month performance. |
| **P2 (Could Have)** | **AI Stock Insights & Financial Intelligence** | Section 2.6 | `POST /api/ai/analyze-stock` | **AI Engagement**: Generates structured AI stock summaries, risk ratings, and technical indicator consensus using Google Gemini LLM API. |

---

## Section 3: Tech Stack & System Boundaries

- **Frontend:** React (Vite SPA), Recharts (SVG Charts), Axios (HTTP Client), Vanilla CSS (Glassmorphism design system)
- **Backend:** Node.js, Express.js (REST API Gateway)
- **Databases:** MongoDB Atlas (NoSQL Document Store) & PostgreSQL (Relational Audit Log Store)
- **Security:** JWT (Bearer Token Auth), BcryptJS (Password Hashing), Helmet (Security Headers), Express Rate Limit
- **APIs:** Finnhub API (Primary) → Alpha Vantage API (Secondary) → Twelve Data API (Tertiary) → Gemini LLM API (AI Analysis)

---

## Section 4: API Endpoint Specifications & Authorization Matrix

| Method | Endpoint | Auth Required | Role | PRD Section | Description |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | No | Public | Sec 4.1 | Registers new user account with hashed password |
| `POST` | `/api/auth/login` | No | Public | Sec 4.2 | Validates credentials and issues signed JWT |
| `GET` | `/api/stock/suggestions/search?q=` | No | Public | Sec 4.3 | Real-time stock ticker autocomplete search |
| `GET` | `/api/stock/:symbol` | No | Public | Sec 4.4 | Retrieves real-time stock quote metrics |
| `GET` | `/api/stock/:symbol/history` | No | Public | Sec 4.5 | Retrieves 30-day closing price chronological data |
| `POST` | `/api/ai/analyze-stock` | No | Public | Sec 4.6 | Generates structured AI stock analysis & risk rating |
| `GET` | `/api/portfolio` | Bearer JWT | User / Admin | Sec 4.7 | Fetches saved watchlist aggregated with live quotes |
| `POST` | `/api/portfolio/add` | Bearer JWT | User / Admin | Sec 4.8 | Adds a unique stock ticker to user's MongoDB watchlist |
| `DELETE` | `/api/portfolio/:id` | Bearer JWT | User / Admin | Sec 4.9 | Removes a stock record from user's watchlist |

---

## Section 5: API Fallback & High-Availability Resilience Strategy

```
                       User Request Stock Quote
                                  │
                                  ▼
             [Try Primary Provider: Finnhub API]
                                  │
                     ┌────────────┴────────────┐
             [Success 200]             [Rate Limit 429 / Error]
                 │                                │
                 ▼                                ▼
       Return Normalized Quote      [Try Secondary: Alpha Vantage]
                                                  │
                                     ┌────────────┴────────────┐
                             [Success 200]             [Rate Limit 429 / Error]
                                 │                                │
                                 ▼                                ▼
                       Return Normalized Quote       [Try Tertiary: Twelve Data]
                                                                  │
                                                     ┌────────────┴────────────┐
                                             [Success 200]             [Failure All 3]
                                                 │                                │
                                                 ▼                                ▼
                                       Return Normalized Quote       Return HTTP 500 JSON Error
```

---

## Section 6: Phased Development Roadmap

- **Phase 1 (P0): Core Data Engine & Fallback Architecture**
  - Implement Express API server (`server.js`)
  - Implement 3-tier fallback stock service (`services/stockService.js`)
  - Build symbol search and live quote endpoints (`GET /api/stock/:symbol`)

- **Phase 2 (P1): Authentication & Persistence Layer**
  - Design User schema with Bcrypt password hashing (`models/User.js`)
  - Implement JWT authentication middleware (`middleware/authMiddleware.js`)
  - Build personalized watchlist CRUD endpoints (`controllers/portfolioController.js`)

- **Phase 3 (P2): Visualization, AI Analytics & DevOps**
  - Build Recharts 30-day price trend chart UI (`SearchStock.jsx`)
  - Integrate Gemini LLM structured outputs service (`services/aiService.js`)
  - Package full-stack application into containerized Docker topology (`docker-compose.yml`)
