# Stock Analyzer

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://mongodb.com)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61dafb.svg)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933.svg)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-47A248.svg)](https://www.mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An enterprise-grade, high-performance financial tracking dashboard built utilizing the decoupled MERN stack. Designed with a frosted glassmorphism interface, Stock Analyzer allows investors to monitor real-time stock quotes, visualize chronological price trends, manage customized watchlists, and query real-time market data securely.

* **Live Deployment:** [https://stock-analyzer-henna.vercel.app/](https://stock-analyzer-henna.vercel.app/)
* **API Server Endpoint:** [https://stock-analyzer-api-n9mz.onrender.com](https://stock-analyzer-api-n9mz.onrender.com)

---

## System Architecture & Workflow

```
[ Client: React + Recharts + Axios ] 
           │             ▲
    HTTPS  │             │ JSON Web Tokens (JWT)
           ▼             │
[ API Gateway & Routing (Express + Cors) ]
           │             ▲
           ▼             │ Mongoose ODM
[ Business Logic & Security (BcryptJS / Finnhub & Yahoo Services) ]
           │             │
           ▼             ▼
  [ MongoDB Atlas ]   [ Finnhub & Yahoo APIs ]
```

1. **Authentication Flow:** Users register or log in. Server-side verification validates user credentials securely. Sessions are authorized via JSON Web Tokens, which are cached client-side.
2. **Gateway Router:** API routing filters cross-origin (CORS) queries and applies JWT authorization checkpoints to secure user endpoints.
3. **Live Search Suggestions:** User inputs trigger backend requests to search endpoints, querying ticker recommendations from global exchanges.
4. **Stock Valuation & Metrics:** Fetched stocks populate detailed cards. Clicking "Load Historical Chart" generates interactive market charts based on one-month historical quote data.
5. **Portfolio Compilation:** Ticker mappings are stored securely in MongoDB database records. During page load, the backend aggregates watchlist mappings with live valuation quotes asynchronously.

---

## Core Features

* **JWT Authenticated Environment:** Robust login and signup operations securing custom user endpoints.
* **Auto-complete Query Engine:** Fast, query-responsive symbol matching search capabilities.
* **Live Valuation Aggregator:** Real-time stock quote lookups (prices, exchange data, open/close, daily highs and lows, volume metrics).
* **Interactive Chronological Charts:** One-month trend analysis powered by responsive data visualizer widgets.
* **Relational Watchlist Engine:** Personalized dashboards listing current assets with real-time price updates.

---

## Technical Mechanism Overview

| Tool / Technology | Technical Role | Implementation Purpose |
| :--- | :--- | :--- |
| **Axios** | Client HTTP Agent | Communicates asynchronously with Node endpoints; appends JWT tokens in Request Headers for secure routing validation. |
| **CORS** | Cross-Origin Middleware | Controls client access domains; restricts and regulates traffic from authorized local hosts. |
| **BcryptJS** | Cryptographic Hashing | Secures passwords using salted one-way hashing algorithms prior to database storage. |
| **Recharts** | Interactive Visualization | Renders dynamic SVG charts representing historical stock values, including customizable tooltip cards. |
| **Finnhub API** | Real-time Quote Engine | Serves autocomplete search suggestions and real-time market quotes using lightweight REST endpoints. |
| **Yahoo Chart API**| Historical Data | Serves monthly chart metrics directly via public REST endpoints without cookie restrictions. |

---

## API Documentation

### Authentication Endpoints
* `POST /api/auth/register` — Create a new user account.
* `POST /api/auth/login` — Authenticate credentials and return a session token.

### Stock Data Endpoints
* `GET /api/stock/suggestions/search?q=:query` — Fetch ticker autocomplete recommendations.
* `GET /api/stock/:symbol` — Retrieve real-time market quote metrics.
* `GET /api/stock/:symbol/history` — Retrieve monthly market close price history.

### Portfolio Endpoints
* `GET /api/portfolio` — Fetch user's saved watchlist complete with current live quotes.
* `POST /api/portfolio/add` — Save a new stock to the user's watchlist.
* `DELETE /api/portfolio/:id` — Delete a stock record from the user's watchlist.

---

## Installation & Setup

### Prerequisites
* Node.js (v18 or higher)
* MongoDB (Local instance or Atlas connection URI)

### Backend Configuration
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install server-side dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_signing_key
   FINNHUB_API_KEY=your_finnhub_api_token
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### Frontend Configuration
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install client-side dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```

---

## Design System & AI Collaboration

This application utilizes a custom design system styled in collaboration with AI tools. The visual presentation features:
* **Glassmorphism Styling:** Containers utilizing backdrop blur properties, thin border lines, and gradient glows.
* **Ambient Animation System:** Fluid keyframe transitions, drifting background gradient orbs, and staggered list renders.
* **Color Architecture:** A dark aesthetic focused on deep indigo, sky blue accents, and bright profit/loss visual indicators.

---

## Learning Outcomes & Professional Development

Building this financial analyzer provided key insights into advanced full-stack development patterns:

### 1. Advanced State Flow & Component Life Cycle
* Structured dynamic state logic cleanly to coordinate search inputs, chart visualizations, loading notifications, and dropdown elements.
* Managed side-effect cycles by fetching portfolio data on mount and ensuring proper event and timer cleanup.

### 2. Full-Stack Data Operations & Async Coordination
* Developed Mongoose schemas to establish structured data relationships linking custom portfolios to unique user accounts.
* Handled complex asynchronous operations by compiling external API data concurrent streams using `Promise.all`.

### 3. Application Security & Access Control
* Implemented token-based session tracking utilizing cryptographic password hashing and JSON Web Tokens.
* Engineered secure route guards on the React client to restrict access to unauthorized user dashboards.

### 4. Enterprise-Grade API Design
* Integrated Finnhub API fetches strictly on the backend to protect credentials and bypass cloud host restrictions (like Render IP blocking).
* Optimized network traffic in search inputs by managing suggestion fetches and handling autocomplete events.

### 5. Architectural Cleanliness & Refactoring
* Completed target refactoring from arrow structures to named function paradigms, providing deep mastery of JavaScript scope contexts.
* Collaborated with AI tools to write clean, comment-free code and document architectural patterns.
