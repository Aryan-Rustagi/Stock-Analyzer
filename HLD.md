# High-Level Design (HLD) — Stock Analyzer

## 1. System Architecture

```
Client (React + Vite)  ──HTTPS──▶  Express API Server  ──▶  MongoDB Atlas
                                          │
                                    Finnhub / Alpha Vantage / Twelve Data
```

### Key Components
- **Client Application (React SPA)**: Renders dark-mode glassmorphism interface, manages routes, visualizes charts via Recharts, and transmits JWT bearer tokens.
- **API Gateway (Node.js + Express)**: Handles CORS, rate limiting, JWT authentication middleware, and RESTful routing.
- **Database (MongoDB Atlas)**: Stores user credentials and relational portfolio mappings.
- **Multi-Provider Fallback Service**: Intercepts stock queries and routes requests across Finnhub, Alpha Vantage, and Twelve Data to guarantee 99.9% uptime.

---

## 2. End-to-End Data Flow

1. **Authentication**: User logs in → Backend validates password hash (`bcryptjs`) → Issues signed 30-day JWT.
2. **Stock Search**: Client types query → Backend searches primary provider (Finnhub) → Automatically falls back to Alpha Vantage / Twelve Data if rate limited (429) → Returns normalized payload.
3. **Portfolio Management**: Client requests `/api/portfolio` with JWT → Server verifies token → Fetches user's saved symbols from MongoDB → Executes concurrent live quote queries via `Promise.all` → Returns aggregated portfolio array.

---

## 3. API Fallback Strategy

```
Request Stock Quote 
        │
        ▼
   Finnhub API ──[Success]──▶ Return Normalized Payload
        │
   [Rate Limit 429 / Error]
        │
        ▼
 Alpha Vantage ──[Success]──▶ Return Normalized Payload
        │
   [Rate Limit 429 / Error]
        │
        ▼
  Twelve Data ──[Success]──▶ Return Normalized Payload
        │
   [Failure on All 3] ──────▶ Return HTTP 500 JSON Error
```

---

## 4. Deployment Topology

| Component | Platform | Environment / Details |
|---|---|---|
| **Frontend SPA** | Vercel | Single-Page App with client-side routing (`vercel.json`) |
| **Backend REST API** | Render | Node.js web service running Express |
| **Cloud Database** | MongoDB Atlas | Managed NoSQL Document Cluster |
| **Local Containerization** | Docker Compose | Multi-stage Dockerfile (`app` + `mongo`) |
