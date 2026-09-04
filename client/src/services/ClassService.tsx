import { classAuthFetch } from "./TeacherAuthFetchHelper.tsx";

// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL;

export interface SchoolClass {
    id: number;
    name: string;
    type: string;
    teacherId: number;
    createdAt: string;
    studentCount: number;
    registrationToken: string;
}

export interface Student {
    id: number;
    first_name: string;
    last_name: string;
    birthday: string;
    email?: string;
}

export interface CreateSchoolClassRequest {
    name: string;
    type: string;
    teacherId?: number;
}

export interface UpdateSchoolClassRequest {
    name: string;
    type: string;
}

export const getClasses = async (teacherId?: string, isAdminView = false): Promise<SchoolClass[]> => {
    const url = isAdminView ? `${API_URL}/api/admin/teacher/${teacherId}/classes` : `${API_URL}/api/schoolclass/list`;

    const response = await classAuthFetch(url, {method: "GET",}, isAdminView);

    if (!response.ok) {
        throw new Error("Failed to fetch classes");
    }

    return response.json();
};

export const getClass = async (classId: number, teacherId?: string, isAdminView = false): Promise<SchoolClass> => {
    const url = isAdminView
        ? `${API_URL}/api/admin/teacher/${teacherId}/classes/${classId}`
        : `${API_URL}/api/schoolclass/${classId}`;

    const response = await classAuthFetch(url, {method: "GET",}, isAdminView);

    if (!response.ok) {
        throw new Error("Failed to fetch class");
    }

    return response.json();
};

export const getStudents = async (classId: number, teacherId? : string, isAdminView = false): Promise<Student[]> => {
    const response = await classAuthFetch(`${API_URL}/api/student/${classId}`, {method: "GET",}, isAdminView);
    if (!response.ok) {
        throw new Error("Failed to fetch students");
    }

    return response.json();
};

export const createClass = async (data: CreateSchoolClassRequest, adminView = false) => {
    const response = await classAuthFetch(
        `${API_URL}/api/schoolclass`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        },
        adminView
    );

    if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "Failed to create class");
    }

    return response.json();
};

export const updateClass = async (
    classId: number,
    data: UpdateSchoolClassRequest,
    adminView = false
) => {
    const response = await classAuthFetch(
        `${API_URL}/api/schoolclass/${classId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        },
        adminView
    );

    if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "Failed to update class");
    }

    return response.json();
};

export const deleteClass = async (classId: number, adminView = false) => {
    const response = await classAuthFetch(
        `${API_URL}/api/schoolclass/${classId}`,
        {
            method: "DELETE",
        },
        adminView
    );

    if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "Failed to delete class");
    }

    return response.json();
};

export interface Under14RegistrationResult {
    student: {
        id: number;
    };
    email: string;
    password: string;
}

export const registerUnder14Student = async (
    classId: number,
    birthday: string,
    teacherId?:string,
    isAdminView = false
): Promise<Under14RegistrationResult> => {
    const response = await classAuthFetch(
        `${API_URL}/api/schoolclass/${classId}/register-under-14`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({birthday,}),
        },
        isAdminView
    );

    if (!response.ok) {
        const error = await response.json().catch(() => null);

        throw new Error(
            error?.message ||
            "Schüler konnte nicht registriert werden."
        );
    }

    return response.json();
};