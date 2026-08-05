# Low-Level Design (LLD) — Stock Analyzer

## 1. Database Schemas (Mongoose)

### User Model (`models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['user', 'admin'], default: 'user' }
});
```

### Portfolio Model (`models/Portfolio.js`)
```javascript
const portfolioSchema = new mongoose.Schema({
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, required: true }
});
```

---

## 2. API Endpoint Contracts

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | None | Public | Register new user, return JWT |
| `POST` | `/api/auth/login` | None | Public | Validate credentials, return JWT |
| `GET` | `/api/stock/suggestions/search?q=` | None | Public | Ticker autocomplete |
| `GET` | `/api/stock/:symbol` | None | Public | Fetch live stock metrics |
| `GET` | `/api/stock/:symbol/history` | None | Public | Fetch 30-day closing prices |
| `GET` | `/api/portfolio` | Bearer JWT | User / Admin | Retrieve user watchlist with live prices |
| `POST` | `/api/portfolio/add` | Bearer JWT | User / Admin | Add stock to user watchlist |
| `DELETE` | `/api/portfolio/:id` | Bearer JWT | User / Admin | Remove stock from user watchlist |

---

## 3. Core Software Mechanics

### Auth & Security Mechanics
- **Password Hashing**: `bcryptjs` with salt factor 10 inside Mongoose `pre('save')` schema hook.
- **JWT Verification**: Custom Express middleware `authMiddleware.js` extracts `Bearer <token>` from HTTP headers, verifies signature via `process.env.JWT_SECRET`, and attaches `req.user`.
- **Input Sanitization**: Tickers are coerced to uppercase strings and regex-cleaned prior to query execution.

### Multi-Provider Strategy Implementation
In `services/stockService.js`:
1. `searchStockFinnhub(symbol)` executes first.
2. On exception (HTTP 429 / network failure / empty payload), `try-catch` delegates to `searchStockAlphaVantage(symbol)`.
3. On secondary exception, delegates to `searchStockTwelveData(symbol)`.
4. Output is passed through a normalizer function returning uniform keys (`symbol`, `companyName`, `currentPrice`, `previousClose`, `open`, `high`, `low`, `volume`).

### Parallel Execution with `Promise.all`
In `controllers/portfolioController.js`:
```javascript
const portfolioWithPrices = await Promise.all(
    items.map(async function(item) {
        const quote = await stockService.searchStock(item.symbol);
        return { _id: item._id, symbol: item.symbol, price: quote.currentPrice };
    })
);
```

---

## 4. Code Base Directory Topology

```
Stock-Analyzer/
├── client/
│   └── src/
│       ├── pages/        # Login, SignUp, SearchStock, Portfolio, Dashboard
│       ├── components/   # Navbar, Hero, Footer, ProtectedRoute
│       └── config.js     # API_BASE_URL configuration
├── server/
│   ├── config/db.js      # Database connection
│   ├── models/           # User.js, Portfolio.js
│   ├── routes/           # authRoutes.js, stockRoutes.js, portfolioRoutes.js
│   ├── controllers/      # authController.js, stockController.js, portfolioController.js
│   ├── services/         # stockService.js (3-tier fallback engine)
│   ├── middleware/        # authMiddleware.js (JWT validation & RBAC)
│   └── server.js         # Server entry point
├── Dockerfile            # Multi-stage production container build
└── docker-compose.yml    # App & MongoDB orchestration
```
