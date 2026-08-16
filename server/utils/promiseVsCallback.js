/**
 * ==============================================================================
 * JavaScript Concept: Promises vs Callbacks
 * ==============================================================================
 * Comparison:
 *
 * 1. Callbacks:
 *    - The traditional asynchronous pattern where a function is passed as an argument
 *      and invoked when the operation finishes.
 *    - Drawbacks:
 *      * "Callback Hell" / "Pyramid of Doom" (deeply nested indentation).
 *      * Inversion of Control (trusting 3rd party code to call your callback once & with right params).
 *      * Difficult error bubbling (error-first callback pattern `(err, data) => ...`).
 *
 * 2. Promises:
 *    - An object representing the eventual completion or failure of an async operation.
 *    - 3 States: `pending`, `fulfilled` (resolved), `rejected`.
 *    - Advantages:
 *      * Chainable with `.then()`, `.catch()`, `.finally()`.
 *      * Standardized error propagation.
 *      * Powerful concurrency utilities: `Promise.all()`, `Promise.allSettled()`, `Promise.race()`.
 *      * Seamless interoperability with `async / await`.
 * ==============================================================================
 */

/**
 * 1. Callback-style simulated API request
 */
function fetchStockCallback(symbol, callback) {
    setTimeout(() => {
        if (!symbol) {
            return callback(new Error('Invalid ticker symbol'), null);
        }
        const mockPrice = (Math.random() * 200 + 50).toFixed(2);
        callback(null, { symbol: symbol.toUpperCase(), price: parseFloat(mockPrice) });
    }, 50);
}

/**
 * 2. Promisification Helper
 * Demonstrates how to wrap any callback-based function into a standard Promise.
 */
function promisify(callbackBasedFn) {
    return function(...args) {
        return new Promise((resolve, reject) => {
            callbackBasedFn(...args, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    };
}

/**
 * 3. Wrapped Promise version
 */
const fetchStockPromise = promisify(fetchStockCallback);

/**
 * 4. Concurrency Demonstrations:
 * - Promise.all: Fails immediately if ANY promise rejects (fail-fast).
 * - Promise.allSettled: Waits for ALL promises to complete, returning status and results/reasons.
 * - Promise.race: Returns the first promise to settle (fastest provider).
 */
async function demonstratePromiseConcurrency(symbols = ['AAPL', 'MSFT', 'GOOGL']) {
    console.log('\n--- PROMISES VS CALLBACKS DEMONSTRATION ---');

    // Callback execution
    fetchStockCallback('AAPL', (err, data) => {
        if (err) console.error('Callback error:', err.message);
        else console.log('1. Callback resolved:', data.symbol, '$' + data.price);
    });

    // Promise execution with .then / .catch
    fetchStockPromise('MSFT')
        .then(data => {
            console.log('2. Promise resolved via .then():', data.symbol, '$' + data.price);
        })
        .catch(err => {
            console.error('Promise caught error:', err.message);
        });

    // Promise.all (Parallel concurrent resolution)
    const allResults = await Promise.all(symbols.map(s => fetchStockPromise(s)));
    console.log(`3. Promise.all resolved ${allResults.length} tickers in parallel.`);

    // Promise.allSettled (Resilient parallel resolution)
    const settledResults = await Promise.allSettled([
        fetchStockPromise('GOOGL'),
        fetchStockPromise(null) // Deliberately failing item
    ]);
    console.log(`4. Promise.allSettled handled ${settledResults.length} requests (success + failures gracefully handled).`);
    console.log('-------------------------------------------\n');

    return { allResults, settledResults };
}

module.exports = {
    fetchStockCallback,
    fetchStockPromise,
    promisify,
    demonstratePromiseConcurrency
};
