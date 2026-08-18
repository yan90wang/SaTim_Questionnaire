import {authFetch} from "./AuthFetchHelper.tsx";
import type {MetaField} from "../pages/editor/MetaDataPage.tsx";

// @ts-expect-error
const API_URL = import.meta.env.VITE_API_URL;
export interface Question {
    id: number;
    title: string;
    contentJson: JSON;
    createdById: string;
    createdAt: string;
    updatedById?: string;
    updatedAt?: string;
    status: string;
    groupId: number;
    correctAnswers?: Record<string, any>;
    metadata?: MetaField[];
    isEditable: boolean;
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

/**
 * Save new metadata entry
 * @param formData - The metadata key/value object
 */
export async function createQuestionForm(formData: Record<string, any>) {
    const token = localStorage.getItem("token");
    const payload = {formData: formData};
    const response = await authFetch(`${API_URL}/api/editor/question`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
}

/**
 * Load metadata entry by ID (for editing)
 * @param id - The ID of the metadata
 */
export async function loadQuestionForm(id: string): Promise<Question> {
    const token = localStorage.getItem("token");
    const response = await authFetch(`${API_URL}/api/editor/question/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
    });
    return handleResponse(response);
}

/**
 * Update existing metadata entry
 * @param id - Metadata ID
 * @param formData - Updated content
 */
export async function updateQuestionForm(id: string, formData: Record<string, any>) {
    const token = localStorage.getItem("token");
    const response = await authFetch(`${API_URL}/api/editor/question/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
    });
    return handleResponse(response);
}

/**
 * Update question content only (JSON + HTML)
 * @param id - Question ID
 * @param contentJson - TipTap JSON content
 * @param contentHtml - Rendered HTML content
 */
export async function updateQuestionContent(id: string, contentJson: object, contentHtml: string | null) {
    const token = localStorage.getItem("token");
    const payload = {contentJson, contentHtml};
    const response = await authFetch(`${API_URL}/api/editor/question/${id}/content`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
}

/**
 * Load all questions for a specific group
 */
export async function loadAllQuestions() {
    const token = localStorage.getItem("token");
    const response = await authFetch(`${API_URL}/api/editor/questions`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    return handleResponse(response);
}

/**
 * Upload an image (used by TipTap image dialog)
 * @param file - image file (jpg/png/webp etc.)
 * @returns {Promise<{url: string}>} public URL of uploaded image
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    const response = await authFetch(`${API_URL}/api/editor/imageUpload`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        body: formData,
    });
    return handleResponse(response);
}

/**
 * Update the correct answers for a question
 * @param id - Question ID
 * @param answers - Object or array containing correct answers
 */
export async function updateQuestionAnswers(id: string, answers: Record<string, any>) {
    const token = localStorage.getItem("token");
    const payload = {answers};
    const response = await authFetch(`${API_URL}/api/editor/question/${id}/answers`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
}

/**
 * Update the status of a question (e.g., "in bearbeitung", "abgeschlossen", "gelöscht")
 * @param id - Question ID
 * @param status - New status
 */
export async function updateQuestionStatus(id: string, status: string) {
    const token = localStorage.getItem("token");
    const payload = {status};
    const response = await authFetch(`${API_URL}/api/editor/question/${id}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
}

export async function duplicateQuestion(questionId: number) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/api/editor/question/${questionId}/duplicate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
    if (!response.ok) throw new Error("Could not duplicate question");
    return response.json();
}
