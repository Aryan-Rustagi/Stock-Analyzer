# High-Level Design (HLD) — Stock Analyzer

## 1. System Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER (React SPA)                        │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌────────────────────┐  │
│  │ Dashboard │  │SearchStock│  │ Portfolio  │  │ Login / Register   │  │
│  │ + AI Chat │  │ + AI Panel│  │ + Live $   │  │ (Public Routes)    │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────────┬───────────┘  │
│        └───────────────┼───────────────┘                │              │
│                  Axios HTTP Client                       │              │
│                  (Bearer JWT Auth)                        │              │
└──────────────────────────┬───────────────────────────────┘              │
                           │ HTTPS / REST                                 │
┌──────────────────────────▼──────────────────────────────────────────────┐
│                      APPLICATION TIER (Express.js)                      │
│                                                                          │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────────┐  │
│  │  Auth Middleware │   │   Route Layer    │   │  Error Handler       │  │
│  │  (JWT Verify)    │──▶│  /api/auth       │   │  (try/catch + next)  │  │
│  │  (req.user)      │   │  /api/stock      │   │  HTTP 4xx / 5xx      │  │
│  └─────────────────┘   │  /api/portfolio   │   └──────────────────────┘  │
│                         │  /api/ai          │                             │
│                         └────────┬─────────┘                             │
│                                  │                                       │
│  ┌───────────────────────────────▼───────────────────────────────────┐   │
│  │                       SERVICE LAYER                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐│   │
│  │  │ stockService │  │  aiService   │  │   authController         ││   │
│  │  │ (3-tier API  │  │ (Groq LLM    │  │   (bcrypt + JWT sign)    ││   │
│  │  │  fallback)   │  │  + prompts)  │  │                          ││   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────────────────────────┘│   │
│  └─────────┼─────────────────┼───────────────────────────────────────┘   │
└────────────┼─────────────────┼───────────────────────────────────────────┘
             │                 │
┌────────────▼─────────────────▼───────────────────────────────────────────┐
│                         DATA & EXTERNAL API TIER                         │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────┐  ┌────────────────────────────┐  │
│  │  MongoDB Atlas   │  │  Groq API    │  │  Stock Data Providers      │  │
│  │  (Mongoose ODM)  │  │  (LLM Chat)  │  │  Finnhub → Alpha Vantage  │  │
│  │  Users + Portfolio│  │  llama-3.1   │  │  → Twelve Data (fallback) │  │
│  └──────────────────┘  └──────────────┘  └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Components
- **Client Application (React SPA)**: Renders dark-mode glassmorphism interface, manages routes via React Router DOM v7, visualizes charts via Recharts, hosts the AI Finance Chat widget, and transmits JWT bearer tokens via Axios.
- **API Gateway (Node.js + Express)**: Handles CORS, JWT authentication middleware, RESTful routing, and centralized error handling with `try/catch` + `next(error)` propagation.
- **AI Service (Groq LLM)**: Implements prompt engineering (system + user messages), enforced structured JSON outputs (`response_format: { type: 'json_object' }`), and field-level validation/normalization.
- **Database (MongoDB Atlas)**: Stores user credentials and relational portfolio mappings via `ObjectId` references and Mongoose `.populate()` for JOIN-equivalent queries.
- **Multi-Provider Fallback Service**: Intercepts stock queries and routes requests across Finnhub, Alpha Vantage, and Twelve Data to guarantee 99.9% uptime.

---

## 2. End-to-End Data Flows

### 2.1 Authentication Flow
1. User submits `{ email, password }` to `POST /api/auth/login`.
2. Backend fetches user document from MongoDB.
3. `bcryptjs.compare()` validates password hash.
4. `jsonwebtoken.sign()` issues a 30-day signed JWT.
5. Client stores token in `localStorage` and attaches it as `Authorization: Bearer <token>` in all subsequent requests.
6. `authMiddleware.js` verifies the token on protected routes and attaches `req.user`.

### 2.2 Stock Search Flow
1. Client sends `GET /api/stock/:symbol` with the ticker.
2. `stockService.js` attempts Finnhub API (primary provider).
3. On HTTP 429 / network error, automatically falls back to Alpha Vantage, then Twelve Data.
4. Response is normalized to a uniform schema: `{ symbol, companyName, currentPrice, previousClose, open, high, low, volume }`.
5. Client renders the result with price metrics and a 30-day Recharts sparkline.

### 2.3 AI Analysis Flow
1. Client sends `GET /api/ai/analyze/:symbol` (protected).
2. `aiController.js` first fetches live stock data via `stockService.searchStock()`.
3. `aiService.js` constructs two messages:
   - **System prompt** (`buildSystemPrompt()`): Defines AI role, schema, and output rules.
   - **User prompt** (`buildUserPrompt(stockData)`): Injects live price metrics.
4. Groq SDK sends the messages to `llama-3.1-8b-instant` with `response_format: { type: 'json_object' }`.
5. `parseStructuredOutput()` validates and normalizes the response.
6. Client renders sentiment badge, recommendation, strengths, and risks.

### 2.4 AI Chat Flow
1. User types a question in the Dashboard chat widget.
2. Client sends `POST /api/ai/chat` with `{ question }` (protected).
3. `aiController.js` passes the question to `chatWithAI()`.
4. `aiService.js` constructs a `buildChatSystemPrompt()` with the `{ answer, disclaimer }` schema.
5. Groq SDK returns a structured JSON response.
6. Client renders the answer with optional disclaimer.

### 2.5 Portfolio Flow
1. Client requests `GET /api/portfolio` with JWT.
2. Server verifies token → fetches user's saved symbols from MongoDB.
3. `Promise.all` executes concurrent live quote queries for all symbols.
4. Server returns aggregated portfolio array with live prices.

---

## 3. API Fallback Strategy

```
Request Stock Quote 
        │
        ▼
   Finnhub API ──[Success 200]──▶ Return Normalized Payload
        │
   [Rate Limit 429 / Error]
        │
        ▼
 Alpha Vantage ──[Success 200]──▶ Return Normalized Payload
        │
   [Rate Limit 429 / Error]
        │
        ▼
  Twelve Data ──[Success 200]──▶ Return Normalized Payload
        │
   [Failure on All 3] ──────▶ Return HTTP 500 JSON Error
```

---

## 4. Environment & Secrets Management

| Variable | Purpose | Location |
|---|---|---|
| `MONGO_URI` | MongoDB Atlas connection string | `server/.env` |
| `JWT_SECRET` | JWT signing key | `server/.env` |
| `FINNHUB_API_KEY` | Primary stock data provider | `server/.env` |
| `ALPHA_VANTAGE_API_KEY` | Secondary stock data provider | `server/.env` |
| `TWELVE_DATA_API_KEY` | Tertiary stock data provider | `server/.env` |
| `GROQ_API_KEY` | Groq LLM API key for AI features | `server/.env` |

All secrets are loaded via `dotenv`, excluded from version control by `.gitignore`, and injected as environment variables on Render for production.

---

## 5. Deployment Topology

| Component | Platform | Environment / Details |
|---|---|---|
| **Frontend SPA** | Vercel | Single-Page App with client-side routing (`vercel.json`) |
| **Backend REST API** | Render | Node.js web service running Express, env vars injected via Render dashboard |
| **Cloud Database** | MongoDB Atlas | Managed NoSQL Document Cluster (M0 Free Tier) |
| **AI Provider** | Groq | Free-tier API for `llama-3.1-8b-instant` model |

### Auto-Detection for Local vs Production
`client/src/config.js` auto-detects the runtime environment:
- If `window.location.hostname === 'localhost'` → routes to `http://localhost:5000`
- Otherwise → routes to the production Render URL
- An explicit `VITE_API_BASE_URL` env var overrides both.
