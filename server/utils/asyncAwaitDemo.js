/**
 * ==============================================================================
 * JavaScript Concept: async / await
 * ==============================================================================
 * Definition:
 * `async / await` is syntactic sugar built on top of ECMAScript Promises.
 * - `async` keyword: Marks a function as asynchronous, guaranteeing it returns a Promise.
 * - `await` keyword: Pauses execution inside an async function until the Promise settles
 *   (resolves or rejects), without blocking the Node.js main Event Loop thread.
 *
 * Benefits:
 * 1. Synchronous-looking, readable control flow for asynchronous operations.
 * 2. Standard `try...catch...finally` exception handling.
 * 3. Eliminates `.then()` nesting and unhandled promise rejections.
 * 4. Enables concurrent scheduling when combined with `Promise.all`.
 * ==============================================================================
 */

const { fetchStockPromise } = require('./promiseVsCallback');

/**
 * 1. Sequential vs Parallel execution demo
 */
async function runAsyncAwaitDemonstration() {
    console.log('\n--- ASYNC / AWAIT DEMONSTRATION ---');

    // A. Sequential execution (await inside standard loop)
    console.log('1. Starting Sequential Async execution...');
    const startSeq = Date.now();
    const seqTickers = ['NVDA', 'TSLA'];
    const seqResults = [];
    for (const sym of seqTickers) {
        try {
            const data = await fetchStockPromise(sym); // Pauses non-blockingly
            seqResults.push(data);
        } catch (err) {
            console.error(`Error fetching ${sym}:`, err.message);
        }
    }
    const seqDuration = Date.now() - startSeq;
    console.log(`   Sequential completed in ~${seqDuration}ms for ${seqResults.length} items.`);

    // B. Parallel execution (async/await combined with Promise.all)
    console.log('2. Starting Parallel Async execution with Promise.all...');
    const startPar = Date.now();
    try {
        const parResults = await Promise.all(
            ['NVDA', 'TSLA'].map(async (sym) => await fetchStockPromise(sym))
        );
        const parDuration = Date.now() - startPar;
        console.log(`   Parallel completed in ~${parDuration}ms for ${parResults.length} items.`);
    } catch (err) {
        console.error('Parallel execution error:', err.message);
    }

    console.log('-----------------------------------\n');
}

module.exports = { runAsyncAwaitDemonstration };
