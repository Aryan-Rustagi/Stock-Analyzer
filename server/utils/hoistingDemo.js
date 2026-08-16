/**
 * ==============================================================================
 * JavaScript Concept: Hoisting & Temporal Dead Zone (TDZ)
 * ==============================================================================
 * Definition:
 * Hoisting is JavaScript's default behavior of moving declarations to the top of the
 * current scope during the compilation/creation phase before code execution begins.
 *
 * Key Distinctions:
 * 1. Function Declarations are completely hoisted (both name and definition).
 *    -> Can be safely called BEFORE they appear in the source code.
 * 2. `var` declarations are hoisted and initialized with `undefined`.
 *    -> Accessing before assignment yields `undefined`, not ReferenceError.
 * 3. `let` and `const` declarations are hoisted into the Temporal Dead Zone (TDZ).
 *    -> Accessing before declaration throws a fatal `ReferenceError`.
 * 4. Function Expressions and Arrow Functions follow the variable declaration rules
 *    (`var` -> undefined / `const` -> TDZ).
 * ==============================================================================
 */

function runHoistingDemonstration() {
    console.log('\n--- HOISTING DEMONSTRATION ---');

    // 1. Function Declaration Hoisting (Works!)
    console.log('1. Calling hoistedFunction() before declaration:', hoistedFunction());

    function hoistedFunction() {
        return 'SUCCESS: Function declarations are fully hoisted!';
    }

    // 2. Variable Hoisting with `var` (Initialized as undefined)
    console.log('2. Accessing hoistedVar before assignment:', typeof hoistedVar, '(value is', hoistedVar, ')');
    var hoistedVar = 'I am assigned now';
    console.log('   Accessing hoistedVar after assignment:', hoistedVar);

    // 3. Temporal Dead Zone (TDZ) with `let` and `const`
    try {
        // Attempting to evaluate `tdzConst` before declaration throws ReferenceError
        eval('console.log(tdzConst)');
    } catch (e) {
        console.log('3. Accessing const in TDZ threw expected Error:', e.name, '-', e.message);
    }
    const tdzConst = 'Const initialized outside TDZ';

    // 4. Function Expression Hoisting
    try {
        eval('expressionFn()');
    } catch (e) {
        console.log('4. Calling const function expression before declaration threw:', e.name);
    }
    const expressionFn = () => 'Arrow function';

    console.log('-------------------------------\n');
}

module.exports = { runHoistingDemonstration };
