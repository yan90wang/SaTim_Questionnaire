import {authFetch} from "./AuthFetchHelper.tsx";
// @ts-expect-error
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Evaluate user answers for a question
 * @param id - Question ID
 * @param answers - TipTap JSON representing user’s completed answers
 * @returns {Promise<{ score: number; total: number; feedback?: string }>} evaluation result
 */
export async function evaluateAnswers(id: string, answers: object): Promise<{ score: number; total: number }> {
    const token = localStorage.getItem("token");
    const payload = { answers };
    const response = await authFetch(`${API_URL}/api/solver/${id}/evaluate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
}

/**
 * Helper for request with error handling
 */
async function handleResponse(response: Response) {
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error ${response.status}`);
    }
    return response.json();
}
