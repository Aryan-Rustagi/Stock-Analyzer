# Stock Analyzer — Product Requirement Document (PRD)

## Section 1: Product Overview & Core Vision
Stock Analyzer is an enterprise-grade, high-performance financial tracking web application built using the decoupled MERN stack (MongoDB, Express, React, Node.js). It enables investors to perform real-time stock lookups, visualize chronological 30-day historical price charts, obtain AI-driven financial insights via Groq LLM integration, and maintain personal watchlists securely. The application features an AI Finance Assistant for natural-language Q&A and structured stock analysis powered by prompt engineering and enforced structured outputs.

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
| **P2 (Could Have)** | **AI Stock Analysis (Groq LLM)** | Section 2.6 | `GET /api/ai/analyze/:symbol` | **AI Engagement**: Generates structured AI stock summaries via Groq LLM (`llama-3.1-8b-instant`) with prompt engineering and enforced JSON structured outputs containing sentiment, recommendation, strengths, and risks. |
| **P2 (Could Have)** | **AI Finance Chat Assistant** | Section 2.7 | `POST /api/ai/chat` | **AI Engagement**: Dashboard-embedded conversational Q&A widget powered by Groq LLM that answers general investing and stock market questions with structured JSON responses and disclaimers. |

---

## Section 3: Tech Stack & System Boundaries

- **Frontend:** React 18 (Vite SPA), React Router DOM v7 (Client-side Routing), Recharts (SVG Charts), Axios (HTTP Client), Vanilla CSS (Glassmorphism design system)
- **Backend:** Node.js, Express.js (REST API Gateway)
- **Databases:** MongoDB Atlas (NoSQL Document Store via Mongoose ODM)
- **AI/LLM:** Groq SDK (`llama-3.1-8b-instant`) — Prompt engineering with system/user message architecture, `response_format: { type: 'json_object' }` for enforced structured outputs
- **Security:** JWT (Bearer Token Auth), BcryptJS (Password Hashing), CORS (Cross-Origin Resource Sharing)
- **APIs:** Finnhub API (Primary) → Alpha Vantage API (Secondary) → Twelve Data API (Tertiary)
- **Dev Tooling:** Concurrently (parallel server+client dev startup), Nodemon (server hot-reload), Vite (frontend HMR)

---

## Section 4: API Endpoint Specifications & Authorization Matrix

| Method | Endpoint | Auth Required | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | No | Public | Registers new user account with hashed password |
| `POST` | `/api/auth/login` | No | Public | Validates credentials and issues signed JWT |
| `GET` | `/api/stock/suggestions/search?q=` | No | Public | Real-time stock ticker autocomplete search |
| `GET` | `/api/stock/:symbol` | No | Public | Retrieves real-time stock quote metrics |
| `GET` | `/api/stock/:symbol/history` | No | Public | Retrieves 30-day closing price chronological data |
| `GET` | `/api/ai/analyze/:symbol` | Bearer JWT | User | Fetches live stock data → sends to Groq LLM with engineered prompts → returns structured analysis JSON |
| `POST` | `/api/ai/chat` | Bearer JWT | User | Accepts `{ question }` → sends to Groq LLM → returns structured `{ answer, disclaimer }` JSON |
| `GET` | `/api/portfolio` | Bearer JWT | User / Admin | Fetches saved watchlist aggregated with live quotes via `Promise.all` |
| `POST` | `/api/portfolio/add` | Bearer JWT | User / Admin | Adds a unique stock ticker to user's MongoDB watchlist |
| `DELETE` | `/api/portfolio/:id` | Bearer JWT | User / Admin | Removes a stock record from user's watchlist |

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

## Section 6: AI/LLM Integration Architecture

### 6.1 LLM Provider
- **Provider:** Groq (Free Tier)
- **Model:** `llama-3.1-8b-instant` — chosen for speed (<1s inference), JSON mode support, and zero-cost availability.
- **SDK:** `groq-sdk` (Node.js)

### 6.2 Prompt Engineering Strategy
Two distinct prompt pipelines are implemented in `services/aiService.js`:

**Stock Analysis Pipeline (`analyzeStockWithAI`):**
1. `buildSystemPrompt()` — Defines the AI role as a "professional stock market analyst", embeds the exact JSON schema the model must follow, and lists strict formatting rules (valid sentiment/recommendation enums, array lengths, sentence limits).
2. `buildUserPrompt(stockData)` — Dynamically injects real-time stock metrics (symbol, price, change %, volume) fetched live from Finnhub at request time.

**Finance Chat Pipeline (`chatWithAI`):**
1. `buildChatSystemPrompt()` — Defines the AI role as a "helpful finance assistant", embeds the `{ answer, disclaimer }` schema, and instructs the model to politely redirect non-finance questions.

### 6.3 Structured Output Enforcement
- **SDK-level:** `response_format: { type: 'json_object' }` is passed to Groq's API, forcing the model to return only valid JSON.
- **Application-level:** `parseStructuredOutput()` strips accidental markdown fences, parses JSON, and validates/normalizes every field against allowed enum values (e.g., `Bullish | Neutral | Bearish`). Invalid fields are replaced with safe defaults.

---

## Section 7: JavaScript Engineering Concepts Demonstrated

| Concept | Location | Implementation |
|---|---|---|
| **async/await** | `portfolioController.js`, `aiService.js`, `stockService.js` | All database and external API calls use `async/await` for readable asynchronous control flow |
| **Promise.all** | `portfolioController.js` | Concurrent live price fetching for all portfolio symbols in parallel |
| **Closures** | `stockService.js` (API key factories), `Dashboard.jsx` (event handlers) | Getter closures encapsulate API keys; React event handlers close over component state |
| **Event Loop** | `server.js` | Explicit demonstration of synchronous execution → Microtask (Promise) → Macrotask (setTimeout) ordering |
| **Hoisting** | `server.js` | `startServer()` invoked before its function declaration to demonstrate hoisting; `const` declarations documented as TDZ-restricted |
| **Callbacks + Promises** | `portfolioController.js` | Express `(req, res, next)` callback handlers wrapping `async/await` + `Promise.all` |

---

## Section 8: Phased Development Roadmap

- **Phase 1 (P0): Core Data Engine & Fallback Architecture**
  - Implement Express API server (`server.js`)
  - Implement 3-tier fallback stock service (`services/stockService.js`)
  - Build symbol search and live quote endpoints (`GET /api/stock/:symbol`)

- **Phase 2 (P1): Authentication & Persistence Layer**
  - Design User schema with Bcrypt password hashing (`models/User.js`)
  - Implement JWT authentication middleware (`middleware/authMiddleware.js`)
  - Build personalized watchlist CRUD endpoints (`controllers/portfolioController.js`)

- **Phase 3 (P2): Visualization & AI Analytics**
  - Build Recharts 30-day price trend chart UI (`SearchStock.jsx`)
  - Integrate Groq LLM structured outputs service (`services/aiService.js`)
  - Build AI Stock Analysis endpoint (`GET /api/ai/analyze/:symbol`)
  - Build AI Finance Chat endpoint (`POST /api/ai/chat`)
  - Build Dashboard AI Chat widget with sample questions (`Dashboard.jsx`)

- **Phase 4: DevOps & Engineering**
  - Add `concurrently` for unified `npm run dev` startup
  - Document Event Loop, Hoisting, Closures, and Promises vs Callbacks in code
  - Create SQL JOINs reference (`db/queries.sql`) alongside Mongoose `.populate()` relational queries
