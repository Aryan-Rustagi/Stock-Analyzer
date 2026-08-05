# Product Requirements Document (PRD)
## Project Name: Stock Analyzer

---

| Document Attributes | Information |
| :--- | :--- |
| **Document Title** | Stock Analyzer — Product Requirements Document |
| **Document Owner** | Lead Product Manager & Engineering Team |
| **Product Version** | v1.0.0 (Production Target) |
| **Status** | Approved & Implemented |
| **Target Audience** | Retail Investors, Day Traders, Financial Analysts |
| **Target Deployment** | Web Application (Vercel + Render + MongoDB Atlas) |

---

## 1. Executive Summary & Vision

### 1.1 Product Overview
**Stock Analyzer** is a modern, high-performance financial tracking web application built using the decoupled MERN stack (MongoDB, Express, React, Node.js). It provides investors with an intuitive, clutter-free dashboard to monitor real-time stock valuations, analyze 30-day chronological price trends, manage customized investment watchlists, and perform rapid market lookups.

### 1.2 Problem Statement
Retail investors face fragmented financial tools. Mainstream platforms are frequently overcrowded with intrusive advertisements, overly complex interface panels, high subscription paywalls, or unreliable data fetching due to third-party API rate limits and server IP blocks.

### 1.3 Product Vision
To provide a free, lightning-fast, ultra-reliable, and aesthetically stunning dark-mode "glassmorphism" dashboard that simplifies stock market tracking while maintaining 99.9% uptime through intelligent API fallback infrastructure.

---

## 2. Target Personas & Use Cases

### 2.1 User Personas

#### Persona 1: Casual Investor ("Alex", 28)
- **Goal**: Wants to quickly check daily closing prices and volume metrics for major stocks (AAPL, TSLA, MSFT) during work breaks.
- **Pain Points**: Existing financial apps require mandatory paid subscriptions or display confusing financial jargon.
- **Needs**: Clean, responsive layout with auto-complete ticker search and instant valuation summaries.

#### Persona 2: Active Watchlist Tracker ("Priya", 34)
- **Goal**: Wants to maintain a personalized portfolio of 10-15 stocks and visualize trend lines over a 30-day historical window.
- **Pain Points**: Standard watchlists require manual refresh or take too long to aggregate live pricing for all saved items.
- **Needs**: One-click portfolio addition/deletion with automatic parallel price fetching (`Promise.all`) on dashboard load.

#### Persona 3: Privacy-Conscious User ("Sam", 24)
- **Goal**: Desires a secure account environment where personal watchlist data is isolated and credentials are encrypted.
- **Pain Points**: Worried about password leaks or unencrypted session data across shared devices.
- **Needs**: Robust JWT authentication, salted password hashing, and stateless session tokens.

---

## 3. Key Performance Indicators (KPIs) & Success Metrics

| Metric Category | Target KPI | Purpose & Measurement |
| :--- | :--- | :--- |
| **System Uptime** | **≥ 99.9%** | Measured by uptime monitoring on API endpoints, sustained via multi-provider failover. |
| **API Latency** | **< 200 ms** | Average response time for stock search and real-time quote endpoints. |
| **Fallback Efficiency** | **100% Graceful Failover** | Transparent fallback execution from Finnhub → Alpha Vantage → Twelve Data when rate limits (429) occur. |
| **Search Speed** | **< 150 ms** | Fast, query-responsive ticker autocomplete suggestions as the user types. |
| **Security Standards** | **Zero Plaintext Passwords** | 100% salted password encryption using `bcryptjs` (salt round 10). |

---

## 4. Detailed Functional Requirements (FR)

### Module 1: User Authentication & Session Management
- **FR 1.1 - User Registration**: The system shall allow new users to create accounts using `name`, a unique `email`, and a `password`.
- **FR 1.2 - Password Hashing**: Passwords MUST be encrypted using `bcryptjs` prior to persistent storage in MongoDB via a Mongoose `pre('save')` hook.
- **FR 1.3 - User Login & Token Generation**: Authenticating valid credentials MUST issue a signed 30-day JSON Web Token (JWT) containing the user `_id`.
- **FR 1.4 - Session Persistence**: The client SPA shall store the JWT in `localStorage` and transmit it in standard `Authorization: Bearer <token>` HTTP headers.
- **FR 1.5 - Protected Routes**: Access to portfolio management endpoints MUST be guarded by server-side `authMiddleware`. Unauthorized requests MUST return HTTP `401 Unauthorized`.

---

### Module 2: Live Ticker Search & Autocomplete Engine
- **FR 2.1 - Real-time Autocomplete**: As the user types into the search input, the system shall query exchange symbol suggestions dynamically.
- **FR 2.2 - Suggestion Payload**: Results MUST return ticker symbol, company/short name, and exchange region (e.g. `AAPL`, `Apple Inc.`, `NASDAQ`).
- **FR 2.3 - Multi-Provider Search Fallback**: If the primary search provider (Finnhub) fails or returns zero results, the system MUST fallback automatically to Alpha Vantage, then Twelve Data.

---

### Module 3: Stock Valuation & Financial Metrics
- **FR 3.1 - Metric Aggregation**: Querying a ticker MUST yield standard financial metrics: Current Price, Previous Close, Open Price, High, Low, and Volume.
- **FR 3.2 - Currency Standard**: All quotes shall be normalized to USD with currency indicators.
- **FR 3.3 - Valuation Card Rendering**: Metrics MUST be visually organized into formatted glassmorphism cards with color-coded profit/loss indicators (green for positive daily change, red for negative).

---

### Module 4: Chronological Historical Chart Visualization
- **FR 4.1 - 30-Day Closing History**: The system shall fetch the last 30 daily closing prices for a given stock.
- **FR 4.2 - Interactive SVG Chart**: Historical data MUST be plotted using `Recharts` SVG components featuring custom hover tooltips showing exact date and closing valuation.
- **FR 4.3 - Dynamic Scaling**: The Y-axis MUST auto-scale dynamically based on the stock's minimum and maximum prices during the 30-day window to maximize visual clarity.

---

### Module 5: Personalized Watchlist / Portfolio Management
- **FR 5.1 - Add Ticker**: Authenticated users can save stocks to their portfolio with duplicate checking (`400 Bad Request` if ticker already exists).
- **FR 5.2 - Remove Ticker**: Users can remove stocks from their portfolio via one-click deletion triggers.
- **FR 5.3 - Async Parallel Valuation Loading**: Loading the user's portfolio page MUST fetch live market prices for all saved stocks simultaneously using asynchronous parallel execution (`Promise.all`).

---

### Module 6: 3-Tier Multi-Provider Fallback Infrastructure
- **FR 6.1 - Execution Order**: Financial API calls MUST follow a strict prioritized strategy:
  1. **Finnhub REST API** (Primary)
  2. **Alpha Vantage API** (Secondary Fallback)
  3. **Twelve Data API** (Tertiary Fallback)
- **FR 6.2 - Exception Catching**: If a provider returns HTTP 429 (Rate Limit), non-200 status, or invalid JSON, the service MUST catch the error, log a server warning, and proceed to the next provider seamlessly.
- **FR 6.3 - Data Normalization**: Output structures from all 3 providers MUST be mapped into a single uniform JSON output contract before responding to the client.

---

## 5. Non-Functional Requirements (NFR)

### 5.1 Performance & Latency
- **NFR 1**: Client SPA initial bundle size optimized via Vite tree-shaking for initial render under 1.2 seconds.
- **NFR 2**: Concurrent quote aggregation for portfolios up to 20 items MUST resolve in under 1 second using `Promise.all`.

### 5.2 Security & Compliance
- **NFR 3 - Zero Credential Leakage**: API keys (`FINNHUB_API_KEY`, `JWT_SECRET`, etc.) MUST strictly reside in server-side environment variables (`.env`) and never be exposed in client JS bundles.
- **NFR 4 - Cross-Origin Resource Sharing (CORS)**: Backend CORS middleware MUST restrict request origins exclusively to authorized domain origins.
- **NFR 5 - Input Sanitization**: Ticker inputs MUST be converted to uppercase strings and sanitized to prevent NoSQL injection attacks.

### 5.3 Reliability & Availability
- **NFR 6**: The application server must be stateless to support seamless horizontal auto-scaling and container redeployments without session dropouts.

### 5.4 Design System & Usability
- **NFR 7 - Glassmorphism UI**: The user interface MUST adhere to a consistent dark-mode design system featuring frosted glass panels (`backdrop-filter: blur()`), subtle border glows, and smooth keyframe micro-animations.

---

## 6. Containerization & Deployment Architecture

```
Stock-Analyzer Infrastructure Topology
 ├── Docker Compose Setup (Local/Dev)
 │    ├── client   (React + Vite)    → Port 5173
 │    ├── server   (Node.js + Express)→ Port 5000
 │    └── mongo    (MongoDB Atlas / Container) → Port 27017
 └── Production Web Cloud Setup
      ├── Vercel (Frontend Single Page Application)
      ├── Render (Stateless Node.js Express REST API)
      └── MongoDB Atlas (Managed Cloud NoSQL Database Cluster)
```

---

## 7. Future Product Roadmap (v2.0 & Beyond)

| Feature | Release Milestone | Feature Description |
| :--- | :--- | :--- |
| **In-Memory Caching (Redis)** | **v1.1.0** | Integrate a Redis cache layer (60s TTL for live quotes) to absorb >95% of third-party API traffic. |
| **Real-Time WebSockets** | **v1.2.0** | Implement Socket.io channels to push real-time tick updates without manual browser reloads. |
| **Advanced Technicals** | **v2.0.0** | Add technical analysis overlays: Relative Strength Index (RSI), Moving Average Convergence Divergence (MACD), and 200-day Simple Moving Averages (SMA). |
| **Price Alert Notifications** | **v2.1.0** | Webhook and email alerts when a tracked portfolio stock reaches a user-configured target threshold. |
| **Export Watchlist** | **v2.2.0** | Export portfolio analytics and transaction history to downloadable CSV or PDF reports. |

---

## 8. Risk Assessment & Mitigation Matrix

| Risk Identified | Impact Level | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **3rd Party API Rate Limiting** | **High** | High | Implemented 3-Tier Provider Fallback engine (Finnhub → Alpha Vantage → Twelve Data). |
| **Cloud IP Blocking by Providers** | **High** | Medium | Bypassed strict library wrappers in favor of direct REST HTTP calls with fallback headers. |
| **Database Connection Timeouts** | **Medium** | Low | Managed via Mongoose connection pooling and cloud database URI auto-reconnect configurations. |
