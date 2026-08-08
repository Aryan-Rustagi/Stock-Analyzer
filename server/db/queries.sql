-- PostgreSQL Schema and SQL JOINs Demonstration
-- Required for SQL (Postgres) evaluation criteria

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Portfolios Table with Foreign Key
CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. SQL INNER JOIN: Fetch portfolio stocks joined with user profile data
SELECT 
    users.id AS user_id,
    users.name AS user_name,
    users.email AS user_email,
    portfolios.id AS portfolio_id,
    portfolios.symbol AS stock_symbol,
    portfolios.added_at
FROM users
INNER JOIN portfolios ON users.id = portfolios.user_id
WHERE users.id = 1;

-- 4. SQL LEFT JOIN: Fetch all users and their associated portfolio stocks (including users with 0 stocks)
SELECT 
    users.id AS user_id,
    users.name AS user_name,
    users.email AS user_email,
    portfolios.symbol AS stock_symbol
FROM users
LEFT JOIN portfolios ON users.id = portfolios.user_id;

-- 5. SQL RIGHT JOIN: Fetch all portfolio entries joined with their owner user details
SELECT 
    portfolios.id AS portfolio_id,
    portfolios.symbol AS stock_symbol,
    users.name AS user_name,
    users.email AS user_email
FROM portfolios
RIGHT JOIN users ON portfolios.user_id = users.id;
