import type {surveyStatus} from "../pages/survey/SurveyUpdatePage.tsx";

export interface CreateSurveyDTO {
    title: string;
    description?: string;
    fromDate?: string;
    toDate?: string;
    mode: "adaptiv" | "design";
    status?: surveyStatus;
    isTwoTier: boolean;
}

export interface SurveyResponse {
    id: number;
    title: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    status?: surveyStatus;
    mode: string;
    instances?: {
        id: number;
        surveyId: number;
        name: string;
        validFrom: string;
        validTo: string;
    }[];
    hasActiveInstance?: boolean;
    isTwoTier: boolean;
    teacherAssigned: boolean;
}

export interface QuestionExport {
    id: number;
    contentJson: any;
    contentHtml: any;
}

// @ts-expect-error
const API_BASE = import.meta.env.VITE_API_URL;

export async function createSurvey(data: CreateSurveyDTO): Promise<SurveyResponse> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const res = await fetch(`${API_BASE}/api/survey`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Failed to create survey: ${message}`);
    }
    return res.json();
}

export async function getSurveys(): Promise<SurveyResponse[]> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const res = await fetch(`${API_BASE}/api/survey`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Failed to fetch surveys: ${message}`);
    }

    const surveys = await res.json();
    const now = new Date();
    return surveys.map((s: any) => {
        const hasActiveInstance =
            s.instances?.some((inst: any) => {
                const from = new Date(inst.validFrom);
                const to = new Date(inst.validTo);
                return from <= now && now <= to;
            }) ?? false;

        return {
            ...s,
            hasActiveInstance,
        };
    });
}

export async function updateSurveyFiles(id: string, file1: File, file2: File) {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file1", file1);
    formData.append("file2", file2);

    const res = await fetch(`${API_BASE}/api/survey/${id}/files`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    });

    if (!res.ok) throw new Error("Failed to upload files");
    return res.json();
}

export interface UserRef {
    id: number;
    first_name: string;
    last_name: string;
}

export async function getSurveyById(id: string): Promise<any> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const res = await fetch(`${API_BASE}/api/survey/${id}`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
    }
    const s = await res.json();
    return {
        ...s,
        hasActiveInstance: s.hasActiveInstance,
        booklet: s.booklet ?? [],
        hasBooklet: (s.booklet?.length ?? 0) > 0,};
}

export async function updateSurvey(id: string, data: {
    title?: string;
    description?: string;
    status?: surveyStatus;
    adaptiveThreshold?: number | null;
}) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const response = await fetch(`${API_BASE}/api/survey/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to update survey (status ${response.status})`);
    }

    return await response.json();
}


export const uploadSurveyExcels = async (surveyId: string, file1: File, file2: File) => {
    const formData = new FormData();
    formData.append("slotQuestionFile", file1);
    formData.append("bookletSlotFile", file2);
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(`${API_BASE}/api/survey/${surveyId}/upload-excels`, {
        method: "POST",
        body: formData,
        headers: {
            "Authorization": `Bearer ${token}`,
        }
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
    }
    return await response.json();
};

export interface Booklet {
    id: number;
    bookletId: number;
    bookletQuestion: any[];
    excelFileUrl: string;
    createdAt: string;
    version: number;
}

export async function getSurveyBooklets(surveyId: string): Promise<Booklet[]> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const res = await fetch(`${API_BASE}/api/survey/${surveyId}/booklets`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Failed to fetch booklets: ${message}`);
    }

    return res.json();
}

export interface SurveyInstanceDTO {
    name: string;
    validFrom: string;
    validTo: string;
}

export async function createSurveyInstance(surveyId: number, data: SurveyInstanceDTO) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const res = await fetch(`${API_BASE}/api/survey/${surveyId}/instance`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Failed to create survey instance: ${message}`);
    }

    return res.json();
}

export async function getSurveyInstances(surveyId: number) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const res = await fetch(`${API_BASE}/api/survey/${surveyId}/instances`, {
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Failed to fetch survey instances: ${message}`);
    }

    return res.json();
}

export async function updateSurveyInstance(
    instanceId: number,
    data: SurveyInstanceDTO
) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const res = await fetch(`${API_BASE}/api/survey/instance/${instanceId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Failed to update survey instance: ${message}`);
    }

    return res.json();
}

export async function getSurveyExport(instanceIds: number[], surveyId: number) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");

    const res = await fetch(`${API_BASE}/api/survey/${surveyId}/export`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ instanceIds }),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Export failed: ${errorText}`);
    }
    return res.blob();
}

export async function getQuestionsByIds(ids: number[]): Promise<QuestionExport[]> {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("User not authenticated");
    const res = await fetch(
        `${API_BASE}/api/survey/questions`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ ids }),
        }
    );

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Failed to fetch questions: ${msg}`);
    }

    return res.json();
}

export async function getQuestionDetailsByIds(ids: number[], surveyTitle: string, surveyId: number): Promise<Blob> {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("User not authenticated");
    }
    const res = await fetch(
        `${API_BASE}/api/survey/questionDetails`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ ids, surveyTitle, surveyId}),
        }
    );

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Failed to fetch questions excel export: ${msg}`);
    }

    return await res.blob();
}

export async function assignSurveyToTeachers(surveyId: number, teacherAssigned: boolean): Promise<SurveyResponse> {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("User not authenticated");
    }
    const response = await fetch(
        `${API_BASE}/api/survey/teacher-assign/${surveyId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ teacherAssigned, }),
        }
    );

    if (!response.ok) {
        const message = await response.text();

        throw new Error(
            `Failed to assign survey to teachers: ${message}`
        );
    }

    return await response.json();
}

export const uploadKnowledgeSpace = async (surveyId: string, file: File) => {
    const formData = new FormData();
    formData.append("knowledgeSpace", file);
    const response = await fetch(
        `${API_BASE}/api/survey/${surveyId}/knowledge-space`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
            },
            body: formData,
        }
    );

    if (!response.ok) {
        let error;
        try {
            error = await response.json();
        } catch {
            error = {message: "Knowledge Space konnte nicht hochgeladen werden.",};
        }

        throw {response: {data: error,},};
    }
    return response.json();
};

export const uploadProbabilityDistribution = async (
    surveyId: string,
    file: File
) => {
    const formData = new FormData();
    formData.append("probabilityDistribution", file);

    const response = await fetch(
        `${API_BASE}/api/survey/${surveyId}/probability-distribution`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: formData,
        }
    );

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        throw new Error(
            error.message ??
            "Fehler beim Hochladen der Wahrscheinlichkeitsverteilung."
        );
    }

    return response.json();
};