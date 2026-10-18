export interface AssessmentResult {
    state: number[];
    probs: number[] | number[][];
    queried: number[];
    qtime: number;
    utime: number;
}

export type PerItemValue = number | number[];

/**
 * Equivalent to:
 * np.sqrt(np.finfo(np.float64).eps)
 * R's kmdoubleequal tolerance.
 */
const R_FLOAT_TOL = Math.sqrt(Number.EPSILON);

function validateKs(ks: number[][]): void {
    if (!Array.isArray(ks) || ks.length === 0) {
        throw new Error("ks must contain at least one state and one item.");
    }
    if (!Array.isArray(ks[0]) || ks[0].length === 0) {
        throw new Error("ks must contain at least one state and one item.");
    }
    const numberOfItems = ks[0].length;
    for (const row of ks) {
        if (!Array.isArray(row)) {
            throw new Error("ks must be a 2D matrix.");
        }
        if (row.length !== numberOfItems) {
            throw new Error("All rows in ks must have the same length.");
        }
        for (const value of row) {
            if (value !== 0 && value !== 1) {
                throw new Error("ks must be a binary matrix (entries in {0, 1}).");
            }
        }
    }
}


function validateProbs(probs: number[], expectedLength: number): void {
    if (!Array.isArray(probs)) {
        throw new Error("probs must be a 1D vector.");
    }
    if (probs.length !== expectedLength) {
        throw new Error(`probs length ${probs.length} != number of states ${expectedLength}.`);
    }
    for (const prob of probs) {
        if (typeof prob !== "number" || Number.isNaN(prob) || prob < 0 || prob > 1) {
            throw new Error("probs entries must lie in [0, 1].");
        }
    }
    const sum = probs.reduce((acc, value) => acc + value, 0);
    if (Math.abs(sum - 1) >= R_FLOAT_TOL) {
        throw new Error(`probs must sum to 1 (got ${sum}).`);
    }
}


function broadcastPerItem(value: PerItemValue, n: number): number[] {
    if (typeof value === "number") {
        return Array(n).fill(value);
    }

    if (!Array.isArray(value) || value.length !== n) {
        throw new Error(`expected scalar or length-${n} vector.`);
    }
    return [...value];
}

/**
 * Allows us to inject a seeded/random function during tests.
 * Default:
 * Math.random()
 * Must return a value >= 0 and < 1.
 */
export type RandomFunction = () => number;


/* ============================================================
 * Half-split
 * ============================================================ */
/**
 * Returns a 1-based item number to match kstMatrix / Python.
 * Example:
 * return value 1 -> first KS column
 * return value 5 -> fifth KS column
 */
export function halfsplitQuestion(probs: number[], ks: number[][]): number[] {
    validateKs(ks);
    validateProbs(probs, ks.length);
    const firstRow = ks[0];
    if (!firstRow) {throw new Error("ks must contain at least one state.");}
    const numberOfItems = firstRow.length;
    const itemProbabilities: number[] = Array(numberOfItems).fill(0);
    for (let itemIndex = 0; itemIndex < numberOfItems; itemIndex++) {
        let probability = 0;
        for (let stateIndex = 0; stateIndex < ks.length; stateIndex++) {
            probability += probs[stateIndex]! * ks[stateIndex]![itemIndex]!;
        }
        itemProbabilities[itemIndex] = probability;
    }
    return itemProbabilities.map(probability => Math.abs(probability - 0.5));
}


export function halfsplitBinary(binaryKS: Uint8Array, probs: number[], numberOfStates: number, numberOfItems: number): number[] {
    const wordsPerState = Math.ceil(numberOfItems / 32);
    const bytesPerState = wordsPerState * 4;
    if (binaryKS.byteLength !== numberOfStates * bytesPerState) {
        throw new Error("INVALID_BINARY_KNOWLEDGE_SPACaE_SIZE");
    }
    if (probs.length !== numberOfStates) {
        throw new Error("PROBABILITY_DISTRIBUTION_SIZE_MISMATCH");
    }
    const view = new DataView(binaryKS.buffer, binaryKS.byteOffset, binaryKS.byteLength);
    const masteredProbabilities = new Float64Array(numberOfItems);
    for (let stateIndex = 0; stateIndex < numberOfStates; stateIndex++) {
        const probability = probs[stateIndex]!;
        if (probability === 0) continue;
        const stateOffset = stateIndex * bytesPerState;
        for (let wordIndex = 0; wordIndex < wordsPerState; wordIndex++) {
            let word = view.getUint32(stateOffset + wordIndex * 4, true);
            while (word !== 0) {
                const bit = word & -word;
                const bitIndex = 31 - Math.clz32(bit);
                const itemIndex = wordIndex * 32 + bitIndex;
                if (itemIndex < numberOfItems) {
                    masteredProbabilities[itemIndex] = (masteredProbabilities[itemIndex] ?? 0) + probability;
                }
                word = (word & (word - 1)) >>> 0;}
        }
    }
    return Array.from(masteredProbabilities, value => Math.abs(value - 0.5)
   );
}

/**
 * Bayesian update equivalent to the Python implementation /
 * kmassessbayesian.
 * item is 1-based!
 * response:
 * 1 = correct
 * 0 = incorrect
 */
export function bayesianUpdate(probs: number[], ks: number[][], beta: PerItemValue, eta: PerItemValue, item: number, response:  0 | 1): number[] {
    validateKs(ks);
    const numberOfStates = ks.length;
    const firstRow = ks[0];
    if (!firstRow) {throw new Error("ks must contain at least one state.");}
    const numberOfItems = firstRow.length;
    validateProbs(probs, numberOfStates);
    const betaVector = broadcastPerItem(beta, numberOfItems);
    const etaVector = broadcastPerItem(eta, numberOfItems);
    for (const value of betaVector) {
        if (value < 0 || value > 1) {
            throw new Error("beta entries must lie in [0, 1].");
        }
    }
    for (const value of etaVector) {
        if (value < 0 || value > 1) {
            throw new Error("eta entries must lie in [0, 1].");
        }
    }

    for (let i = 0; i < numberOfItems; i++) {
        if (betaVector[i]! + etaVector[i]! > 1) {
            console.warn(`beta[${i}] + eta[${i}] should be less than 1.`);
        }
    }

    if (response !== 0 && response !== 1) {
        throw new Error("response must be 0 or 1."
       );
    }

    if (item < 0 || item >= numberOfItems) {
        throw new Error(`item must be in [0, ${numberOfItems - 1}].`);
    }
    const q = item;
    let up: number;
    let um: number;
    if (response === 1) {
        up = 1 - betaVector[q]!;
        um = etaVector[q]!;
    } else {
        up = betaVector[q]!;
        um = 1 - etaVector[q]!;
    }
    const posterior: number[] = new Array(numberOfStates);
    for (let stateIndex = 0; stateIndex < numberOfStates; stateIndex++) {
        const containsQuestion = ks[stateIndex]![q]! === 1;
        const likelihood = containsQuestion ? up : um;
        posterior[stateIndex] = likelihood * probs[stateIndex]!;
    }
    const total = posterior.reduce((sum, value) => sum + value, 0);
    if (total === 0) {
        return [...probs];
    }
    return posterior.map(value => value / total);
}

export function bayesianUpdateBinary(binaryKS: Uint8Array, probs: number[], numberOfStates: number, numberOfItems: number, beta: PerItemValue, eta: PerItemValue, item: number, response: 0 | 1): number[] {
    const wordsPerState = Math.ceil(numberOfItems / 32);
    const bytesPerState = wordsPerState * 4;

    if (numberOfStates <= 0 || numberOfItems <= 0 || binaryKS.byteLength !== numberOfStates * bytesPerState) {
        throw new Error("INVALID_BINARY_KNOWLEDGE_SPACE_SIZE");
    }
    validateProbs(probs, numberOfStates);
    if (!Number.isInteger(item) || item < 0 || item >= numberOfItems) {
        throw new Error(`item must be in [0, ${numberOfItems - 1}].`);
    }

    if (response !== 0 && response !== 1) {
        throw new Error("response must be 0 or 1.");
    }

    const betaVector = broadcastPerItem(beta, numberOfItems);
    const etaVector = broadcastPerItem(eta, numberOfItems);

    for (let i = 0; i < numberOfItems; i++) {
        const b = betaVector[i]!;
        const e = etaVector[i]!;

        if (!Number.isFinite(b) || !Number.isFinite(e) || b < 0 || b > 1 || e < 0 || e > 1) {
            throw new Error("beta and eta entries must lie in [0, 1].");
        }

        if (b + e > 1) {
            console.warn(
                `beta[${i}] + eta[${i}] should be less than 1.`
            );
        }
    }
    const b = betaVector[item]!;
    const e = etaVector[item]!;

    const up = response === 1 ? 1 - b : b;
    const um = response === 1 ? e : 1 - e;

    const wordIndex = Math.floor(item / 32);
    const bitIndex = item % 32;
    const bitMask = (1 << bitIndex) >>> 0;
    const view = new DataView(binaryKS.buffer, binaryKS.byteOffset, binaryKS.byteLength);
    const posterior = new Array<number>(numberOfStates);
    let total = 0;
    for (let stateIndex = 0; stateIndex < numberOfStates; stateIndex++) {
        const offset =
            stateIndex * bytesPerState +
            wordIndex * 4;

        const word = view.getUint32(offset, true);

        const containsQuestion = (word & bitMask) !== 0;
        const likelihood = containsQuestion ? up : um;

        const value = likelihood * probs[stateIndex]!;

        posterior[stateIndex] = value;
        total += value;
    }
    if (total === 0) {
        return [...probs];
    }
    for (let i = 0; i < numberOfStates; i++) {
        posterior[i] = posterior[i]! / total;
    }

    return posterior;
}


// /**
//  * Equivalent to simplified_assessment().
//  * responses contains one response per item:
//  * [1,0,1,...]
//  * The halfsplit algorithm determines which responseis actually consulted next.
//  */
// export function simplifiedAssessment(responses: number[], ks: number[][], options: SimplifiedAssessmentOptions = {}): AssessmentResult | null {
//     validateKs(ks);
//     const {beta = 0.1, eta = 0.1, threshold = 0.51, prior, probdev = false, random = Math.random,} = options;
//     const numberOfStates = ks.length;
//     const firstRow = ks[0];
//     if (!firstRow) {throw new Error("ks must contain at least one state.");}
//     const numberOfItems = firstRow.length;
//     if (responses.length !== numberOfItems) {
//         throw new Error(`responses must have length ${numberOfItems}, got ${responses.length}.`);
//     }
//     for (const response of responses) {
//         if (response !== 0 && response !== 1) {
//             throw new Error("responses must be a binary vector.");
//         }
//     }
//     if (threshold < 0 || threshold > 1) {
//         throw new Error("Threshold must be between 0 and 1.");
//     }
//     if (threshold <= 0.5) {
//         console.warn("Threshold should be larger than 0.5!");
//     }
//     let probs: number[];
//     if (prior === undefined) {
//         probs = Array(numberOfStates).fill(1 / numberOfStates);
//     } else {
//         probs = [...prior];
//         validateProbs(probs, numberOfStates);
//     }
//
//     const queried: number[] = [];
//     const probabilityDevelopment: number[][] = [[...probs]];
//     const questionTimes: number[] = [];
//     const updateTimes: number[] = [];
//
//     while (Math.max(...probs) <= threshold) {
//         const questionStart = performance.now();
//         const item = halfsplitQuestion(probs, ks, random);
//         const questionEnd = performance.now();
//         questionTimes.push((questionEnd - questionStart) / 1000);
//         queried.push(item);
//
//         if (queried.length > 2 * numberOfItems) {
//             console.warn("Reached twice of number of items as number of questions!");
//             console.warn(`Question sequence: ${queried.join(", ")}`);
//             return null;
//         }
//
//         const response = responses[item];
//         const updateStart = performance.now();
//         if (response === undefined) {throw new Error(`No response found for item index ${item}`);}
//         probs = bayesianUpdate(probs, ks, beta, eta, item, response as 0 | 1);
//         const updateEnd = performance.now();
//         updateTimes.push((updateEnd - updateStart) / 1000);
//         probabilityDevelopment.push([...probs]);
//     }
//
//     /* ========================================================
//      * Determine final knowledge state
//      * ======================================================== */
//     const maxProbability = Math.max(...probs);
//     const winners: number[] = [];
//     for (let i = 0; i < probs.length; i++) {
//         if (probs[i] === maxProbability) {
//             winners.push(i);
//         }
//     }
//     let state: number[] = [];
//     if (winners.length === 1) {
//         state = [...ks[winners[0]!]!];
//     } else {
//         for (let column = 0; column < numberOfItems; column++) {
//             for (const winner of winners) {
//                 state.push(ks[winner]![column]!);
//             }
//         }
//     }
//
//     const average = (values: number[]): number => {
//         if (values.length === 0) {
//             return 0;
//         }
//         return (values.reduce((sum, value) => sum + value, 0) / values.length);
//     };
//
//     return {
//         state,
//         probs: probdev ? probabilityDevelopment : [...probs],
//         queried,
//         qtime: average(questionTimes),
//         utime: average(updateTimes),
//     };
// }
//

/* ============================================================
 * Helper: maximum probability
 * ============================================================ */
export function getMaxProbability(probs: number[]): number {return Math.max(...probs);}

/* ============================================================
 * Helper: uniform initial distribution
 * ============================================================ */
export function createUniformPrior(numberOfStates: number): number[] {
    if (numberOfStates <= 0) {
        throw new Error("numberOfStates must be greater than 0.");
    }
    return Array(numberOfStates)
        .fill(1 / numberOfStates);
}