const PYTHON_API_URL =
    process.env.PYTHON_ASSESSMENT_URL ?? "http://localhost:8001";


export interface HalfSplitRequest {
    probs: number[];
    ks: number[][];
}


export interface BayesianUpdateRequest {
    probs: number[];
    ks: number[][];
    beta: number | number[];
    eta: number | number[];
    item: number;
    response: 0 | 1;
}


export const halfsplitQuestion = async (probs: number[], ks: number[][]): Promise<number> => {
    const response = await fetch(
        `${PYTHON_API_URL}/halfsplit`,
        {
            method: "POST",
            headers: {"Content-Type": "application/json",},
            body: JSON.stringify({probs, ks,}),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Python halfsplit failed: ${error}`);
    }
    const data = await response.json() as { item: number; };
    return data.item;
};


export const bayesianUpdate = async (
    probs: number[],
    ks: number[][],
    beta: number | number[],
    eta: number | number[],
    item: number,
    responseValue: 0 | 1
): Promise<number[]> => {

    const response = await fetch(
        `${PYTHON_API_URL}/bayesian-update`,
        {
            method: "POST",
            headers: {"Content-Type": "application/json",},
            body: JSON.stringify({probs, ks, beta, eta, item, response: responseValue,}),
        }
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            `Python Bayesian update failed: ${error}`
        );
    }

    const data = await response.json() as {
        probs: number[];
    };

    return data.probs;
};