# Low-Level Design (LLD) — Stock Analyzer

## 1. Database Schemas (Mongoose ODM)

### User Model (`models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['user', 'admin'], default: 'user' }
});
```
- **Pre-save Hook:** `bcryptjs.hash(password, 10)` runs before `save()` to hash passwords automatically.
- **Index:** `email` has a unique index for O(1) lookup during login.

### Portfolio Model (`models/Portfolio.js`)
```javascript
const portfolioSchema = new mongoose.Schema({
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    symbol: { type: String, required: true }
});
```
- **Relational Mapping:** `user` field references the `User` model via `ObjectId`, enabling `.populate('user', 'email')` for JOIN-equivalent queries in a NoSQL environment.

### SQL-Equivalent JOIN Reference (`db/queries.sql`)
For assessors evaluating relational data capabilities, the project includes a documented SQL schema and JOIN query file demonstrating equivalent operations:
```sql
SELECT p.symbol, u.email
FROM portfolios p
INNER JOIN users u ON p.user_id = u.id
WHERE u.id = $1;
```

---

## 2. API Endpoint Contracts

| Method | Endpoint | Auth | Request Body / Params | Response Body | Status Codes |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | None | `{ name, email, password }` | `{ token }` | 201 Created, 400 Bad Request |
| `POST` | `/api/auth/login` | None | `{ email, password }` | `{ token }` | 200 OK, 401 Unauthorized |
| `GET` | `/api/stock/suggestions/search?q=` | None | Query param `q` | `[{ symbol, description }]` | 200 OK |
| `GET` | `/api/stock/:symbol` | None | URL param `:symbol` | `{ symbol, companyName, currentPrice, open, high, low, previousClose, volume }` | 200 OK, 404 Not Found, 500 Error |
| `GET` | `/api/stock/:symbol/history` | None | URL param `:symbol` | `[{ date, close }]` | 200 OK |
| `GET` | `/api/ai/analyze/:symbol` | Bearer JWT | URL param `:symbol` | `{ symbol, companyName, currentPrice, analysis: { sentiment, summary, strengths, risks, recommendation } }` | 200 OK, 400 Bad Request, 500 Error |
| `POST` | `/api/ai/chat` | Bearer JWT | `{ question }` | `{ answer, disclaimer }` | 200 OK, 400 Bad Request, 500 Error |
| `GET` | `/api/portfolio` | Bearer JWT | — | `[{ _id, symbol, price, ... }]` | 200 OK |
| `POST` | `/api/portfolio/add` | Bearer JWT | `{ symbol, companyName }` | `{ portfolio doc }` | 201 Created |
| `DELETE` | `/api/portfolio/:id` | Bearer JWT | URL param `:id` | `{ message }` | 200 OK, 404 Not Found |

---

## 3. AI/LLM Implementation Details

### 3.1 Groq SDK Integration (`services/aiService.js`)
```javascript
const Groq = require('groq-sdk');
var client = new Groq({ apiKey: process.env.GROQ_API_KEY });

var completion = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ],
    temperature: 0.2,
    max_tokens: 512,
    response_format: { type: 'json_object' }  // Enforced structured output
});
```

### 3.2 Prompt Engineering — Stock Analysis
**System Prompt Construction (`buildSystemPrompt()`):**
- Defines AI role: "professional stock market analyst"
- Embeds exact output schema as JSON within the prompt
- Lists field constraints (enum values, array lengths, sentence limits)
- Instructs: "Output ONLY the JSON object, nothing else"

**User Prompt Construction (`buildUserPrompt(stockData)`):**
- Dynamically injects live stock metrics at runtime
- Calculates `changePercent` from `currentPrice` and `previousClose`
- Formats as human-readable key-value pairs

### 3.3 Prompt Engineering — Finance Chat
**System Prompt Construction (`buildChatSystemPrompt()`):**
- Defines AI role: "helpful finance assistant"
- Embeds `{ answer, disclaimer }` schema
- Instructs model to redirect non-finance questions politely

### 3.4 Structured Output Validation (`parseStructuredOutput()`)
```javascript
function parseStructuredOutput(rawText) {
    // 1. Strip accidental markdown code fences
    var cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    // 2. Parse JSON
    var parsed = JSON.parse(cleaned);

    // 3. Validate enums — fallback to safe defaults
    var validSentiments = ['Bullish', 'Neutral', 'Bearish'];
    if (!validSentiments.includes(parsed.sentiment)) parsed.sentiment = 'Neutral';

    var validRecommendations = ['Buy', 'Hold', 'Sell'];
    if (!validRecommendations.includes(parsed.recommendation)) parsed.recommendation = 'Hold';

    // 4. Validate arrays and strings
    if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
    if (!Array.isArray(parsed.risks)) parsed.risks = [];
    if (typeof parsed.summary !== 'string') parsed.summary = '';

    return parsed;
}
```

---

## 4. Core Software Mechanics & JavaScript Concepts

### 4.1 Auth & Security Mechanics
- **Password Hashing**: `bcryptjs` with salt factor 10 inside Mongoose `pre('save')` schema hook.
- **JWT Verification**: Custom Express middleware `authMiddleware.js` extracts `Bearer <token>` from HTTP headers, verifies signature via `process.env.JWT_SECRET`, and attaches `req.user`.
- **Input Sanitization**: Tickers are coerced to uppercase strings and regex-cleaned prior to query execution.

### 4.2 Multi-Provider Fallback Strategy (`stockService.js`)
1. `searchStockFinnhub(symbol)` executes first.
2. On exception (HTTP 429 / network failure / empty payload), `try-catch` delegates to `searchStockAlphaVantage(symbol)`.
3. On secondary exception, delegates to `searchStockTwelveData(symbol)`.
4. Output is passed through a normalizer function returning uniform keys (`symbol`, `companyName`, `currentPrice`, `previousClose`, `open`, `high`, `low`, `volume`).

### 4.3 Closures — API Key Encapsulation (`stockService.js`)
```javascript
// Closure factory: API key is captured in lexical scope and never re-exposed
function createApiKeyGetter(envVar) {
    var key = process.env[envVar];
    return function getKey() { return key; };
}
var getFinnhubKey = createApiKeyGetter('FINNHUB_API_KEY');
```
Also used in React event handlers (`Dashboard.jsx`, `Portfolio.jsx`) where `askQuestion()` closes over `question` state and `token` from the enclosing component scope.

### 4.4 Event Loop — Microtasks vs Macrotasks (`server.js`)
```javascript
console.log('1. Synchronous script execution');

setTimeout(function() {
    // Macrotask: pushed to Timers phase, runs AFTER all synchronous code + microtasks
    console.log('4. setTimeout (Macrotask)');
}, 0);

Promise.resolve().then(function() {
    // Microtask: runs immediately after synchronous phase, BEFORE macrotasks
    console.log('3. Promise resolved (Microtask)');
});

console.log('2. Synchronous script execution ended');
// Output order: 1 → 2 → 3 → 4 (proving microtask priority)
```

### 4.5 Hoisting & Temporal Dead Zone (`server.js`)
```javascript
startServer(); // ✅ Works — function declarations are hoisted to top of scope

async function startServer() {
    await connectDb();
    app.listen(PORT);
}
```
In contrast, `const protect = function(req, res, next) { ... }` in `authMiddleware.js` is NOT hoisted — accessing it before declaration throws a `ReferenceError` (TDZ).

### 4.6 Parallel Execution with `Promise.all` (`portfolioController.js`)
```javascript
// Promise.all fires all API calls concurrently, not sequentially
var portfolioWithPrices = await Promise.all(
    items.map(async function(item) {
        var quote = await searchStock(item.symbol);
        return { _id: item._id, symbol: item.symbol, price: quote.currentPrice };
    })
);
```

### 4.7 Express Callback Handlers + async/await
All controllers use Express's classic `(req, res, next)` callback signature combined with `async/await` and `try/catch`:
```javascript
async function getPortfolio(req, res, next) {
    try {
        var items = await Portfolio.find({ user: req.user.id }).populate('user', 'email');
        // ... business logic
        res.status(200).json(portfolioWithPrices);
    } catch (error) {
        if (typeof next === 'function') return next(error);
        res.status(500).json({ message: error.message });
    }
}
```

---

## 5. Frontend Component Hierarchy

```
<App> (React Router DOM v7 — Client-Side Routing)
 ├── <Navbar> (Conditionally rendered when authenticated)
 ├── / ─────────────────── <Home>
 │                           └── <Hero> (Landing CTA)
 ├── /login ────────────── <Login> (Public Route)
 ├── /signup ───────────── <SignUp> (Public Route)
 ├── /dashboard ────────── <Dashboard> (Protected Route)
 │                           ├── Dashboard Cards (Search, Portfolio, Logout)
 │                           └── AI Finance Chat Widget
 │                                ├── Sample Question Buttons (Closures)
 │                                ├── Text Input + Ask Button
 │                                └── Structured Response Panel (answer + disclaimer)
 ├── /searchstock ──────── <SearchStock> (Protected Route)
 │                           ├── Search Input + Button
 │                           ├── Stock Metrics Panel (Price, High, Low, Change)
 │                           ├── 30-Day Recharts Sparkline
 │                           ├── Add to Portfolio Button
 │                           └── AI Analysis Panel (Sentiment, Recommendation, Strengths, Risks)
 ├── /portfolio ────────── <Portfolio> (Protected Route)
 │                           ├── Portfolio Stock List (mapped array)
 │                           ├── Live Price Badges (fetched via Promise.all)
 │                           └── Remove Stock Button
 └── <Footer> (Global)
```

---

## 6. Codebase Directory Topology

```
Stock-Analyzer/
├── client/
│   └── src/
│       ├── pages/           # Login, SignUp, SearchStock, Portfolio, Dashboard
│       ├── components/      # Navbar, Hero, Footer, ProtectedRoute
│       └── config.js        # Auto-detect local vs production API URL
├── server/
│   ├── config/db.js         # MongoDB connection (Mongoose)
│   ├── models/              # User.js, Portfolio.js (Mongoose schemas)
│   ├── routes/              # authRoutes.js, stockRoutes.js, portfolioRoutes.js, aiRoutes.js
│   ├── controllers/         # authController.js, stockController.js, portfolioController.js, aiController.js
│   ├── services/            # stockService.js (3-tier fallback), aiService.js (Groq LLM + prompts)
│   ├── middleware/          # authMiddleware.js (JWT + TDZ documentation)
│   ├── db/queries.sql       # SQL JOIN reference for relational data concepts
│   └── server.js            # Entry point (hoisting + event loop demos)
├── docs/                    # PRD.md, HLD.md, LLD.md (duplicated for docs/ folder)
├── PRD.md                   # Product Requirements Document
├── HLD.md                   # High-Level Design
├── LLD.md                   # Low-Level Design (this file)
└── package.json             # Root: concurrently dev script
```

---

## 7. HTTP Status Code Usage Map

| Code | Meaning | Where Used |
|---|---|---|
| `200 OK` | Successful GET, login, portfolio fetch, AI analysis | All controllers |
| `201 Created` | Successful resource creation (register, portfolio add) | `authController.js`, `portfolioController.js` |
| `400 Bad Request` | Missing required fields (symbol, question, email/password) | All controllers |
| `401 Unauthorized` | Invalid/missing JWT, wrong password | `authMiddleware.js`, `authController.js` |
| `404 Not Found` | Stock not found, portfolio entry not found | `stockController.js`, `portfolioController.js` |
| `500 Internal Server Error` | Uncaught exceptions, all-providers-failed, LLM failure | All controllers via `catch` blocks |

---

## 8. Error Handling Strategy

Every Express route handler follows the same defensive pattern:
1. Wrap all logic in `try { ... }`.
2. On error, log to server console via `console.error()`.
3. Check if Express `next` function exists: `if (typeof next === 'function') return next(error)`.
4. Otherwise, return an appropriate HTTP status code with a JSON error message.
5. Never expose stack traces or internal error details to the client in production.
