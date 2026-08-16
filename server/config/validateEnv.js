/**
 * Environment Variables & Secrets Validation Utility
 *
 * Demonstrates:
 * 1. Fail-fast validation on startup for required secrets.
 * 2. Secret masking in console logs (defense-in-depth to prevent credential leakage).
 * 3. Safe fallback defaults for non-critical configuration.
 */

function maskSecret(secret) {
    if (!secret || typeof secret !== 'string') return '[NOT SET]';
    if (secret.length <= 8) return '****';
    return secret.slice(0, 4) + '...' + secret.slice(-4);
}

function validateEnvironment() {
    const requiredEnvVars = [
        { name: 'MONGO_URI', critical: true, description: 'MongoDB Atlas connection string' },
        { name: 'JWT_SECRET', critical: true, description: 'Cryptographic key for signing JWT tokens' },
        { name: 'GROQ_API_KEY', critical: false, description: 'Groq LLM API key for AI stock analysis & chat' },
        { name: 'FINNHUB_API_KEY', critical: false, description: 'Primary stock data provider' },
        { name: 'ALPHA_VANTAGE_API_KEY', critical: false, description: 'Secondary fallback stock data provider' },
        { name: 'TWELVE_DATA_API_KEY', critical: false, description: 'Tertiary fallback stock data provider' }
    ];

    console.log('\n================ ENVIRONMENT & SECRETS CHECK ================');
    let hasCriticalError = false;

    requiredEnvVars.forEach(item => {
        const val = process.env[item.name];
        const isPresent = Boolean(val && val.trim() !== '');

        if (isPresent) {
            console.log(`[OK] ${item.name.padEnd(24)} : ${maskSecret(val)} (${item.description})`);
        } else if (item.critical) {
            console.error(`[CRITICAL MISSING] ${item.name.padEnd(24)} : REQUIRED! Server cannot start safely.`);
            hasCriticalError = true;
        } else {
            console.warn(`[OPTIONAL MISSING] ${item.name.padEnd(24)} : Not provided. Feature/fallback may be limited.`);
        }
    });

    console.log('=============================================================\n');

    if (hasCriticalError) {
        console.error('FATAL: Missing critical environment variables. Please configure server/.env.');
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}

module.exports = { validateEnvironment, maskSecret };
