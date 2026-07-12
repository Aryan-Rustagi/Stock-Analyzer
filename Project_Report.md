# Project Report: Stock Analyzer

## 1. Introduction
**Stock Analyzer** is a full-stack, enterprise-grade financial tracking web application built using the MERN stack (MongoDB, Express.js, React, Node.js). The primary objective of this project is to provide investors and users with a seamless, high-performance dashboard to monitor real-time stock quotes, visualize chronological price histories, and manage a personalized investment portfolio. 

## 2. Problem Statement & Objectives
Retail investors often struggle with fragmented financial data across multiple platforms. Existing solutions can be overly complex, cluttered, or expensive. 

**Objectives:**
* Build a clean, intuitive, and highly responsive user interface using modern "glassmorphism" design principles.
* Provide real-time stock search with intelligent autocomplete suggestions.
* Allow users to securely create accounts and manage a persistent portfolio of their favorite stocks.
* Ensure high code quality by strictly adhering to named function paradigms and comment-free, self-documenting code.

## 3. Technology Stack
The application utilizes a decoupled architecture, separating the client-side presentation layer from the server-side business logic and database.

* **Frontend:** React (Vite), Vanilla CSS (Custom Design System), Recharts (Data Visualization), Axios (HTTP Client)
* **Backend:** Node.js, Express.js, Mongoose (ODM)
* **Database:** MongoDB Atlas (Cloud NoSQL Database)
* **Authentication:** JSON Web Tokens (JWT), BcryptJS (Password Hashing)
* **External APIs:** Finnhub REST API (Stock Quotes & Search Engine), Yahoo Finance (Historical Chart Data)
* **Deployment:** Vercel (Frontend Hosting), Render (Backend API Hosting)

## 4. System Architecture
The platform is built on a RESTful API architecture. 

1. **Presentation Layer (React):** Handles routing, state management, and renders the UI. It securely stores JWTs in `localStorage` to authorize protected routes.
2. **Application Layer (Express):** Serves as the API gateway. It receives HTTP requests, validates JWT tokens via middleware, and coordinates data between the database and external financial APIs.
3. **Data Layer (MongoDB):** Stores persistent user credentials and relational portfolio data (mapping stocks to specific User IDs).

## 5. Key Features
* **Secure Authentication:** Robust user registration and login system with encrypted passwords and token-based session management.
* **Live Stock Search:** Real-time query suggestions that dynamically search global markets as the user types.
* **Historical Data Visualization:** Interactive 1-month historical price charts plotted via Recharts.
* **Dynamic Portfolio:** A personalized dashboard where users can add and remove tracked assets. The portfolio dynamically fetches live valuations for all saved assets upon load.
* **Responsive Design:** A mobile-first, animated, dark-mode glassmorphism UI that feels premium and interactive.

## 6. Technical Challenges & API Engineering
One of the most significant engineering challenges during development involved **API Rate Limiting and Cloud IP Blocking**.

Initially, the backend utilized the `yahoo-finance2` library for all financial data. However, upon deployment to Render, Yahoo's aggressive anti-bot protections completely blocked the cloud server's IP address, resulting in `429 Too Many Requests` errors. 

**The Solution:**
The architecture was refactored to use a hybrid API approach:
* **Finnhub API:** Integrated for real-time stock quotes and search suggestions. Finnhub provides a reliable, unrestricted connection for cloud servers, though the free tier restricts real-time quotes primarily to US exchanges (e.g., AAPL, TSLA).
* **Yahoo Finance `query2` Engine:** Integrated via direct HTTP fetching exclusively for historical chart data metadata, bypassing strict library-based blocks while maintaining data integrity.

## 7. Development Principles & Code Quality
A major focus of this project was mastering JavaScript scope and architectural cleanliness. 
* **Strictly Named Functions:** Arrow functions (`=>`) were entirely banned from the codebase. Every function, callback, and React component was written using explicit `function name()` syntax. This enforced a deep understanding of lexical scope, hoisting, and the `this` context.
* **Self-Documenting Code:** Code comments were strictly prohibited. Instead, the codebase relies entirely on highly descriptive variable names, modular file structures, and intuitive logical flows to explain the architecture.

## 8. Deployment Setup
The application is fully deployed and accessible via the web.
* **Single Page Application (SPA) Routing:** The frontend is deployed to Vercel. A custom `vercel.json` rewrite rule was engineered to map all incoming traffic to `index.html`, allowing React Router to handle client-side navigation without triggering `404 Not Found` errors on page refresh.
* **CORS Management:** The Express backend (hosted on Render) is configured to accept Cross-Origin Resource Sharing (CORS) specifically from the Vercel frontend, ensuring secure data transmission.

## 9. Conclusion
The Stock Analyzer project successfully demonstrates the integration of complex external APIs, secure authentication, and a responsive UI within a MERN stack environment. It highlights practical problem-solving skills, particularly in navigating enterprise rate limits and cloud deployment configurations, resulting in a production-ready financial dashboard.
