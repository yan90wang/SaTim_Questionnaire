import {classAuthFetch} from "./TeacherAuthFetchHelper.tsx";

// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL;

export interface TeacherTest {
    id: number;
    surveyId: number;
    classId: number;

    className: string;
    classType: string;

    title: string;
    description?: string | null;

    status: string;
    mode: string;
    finishedStudents: number;
    totalStudents: number;
    active: boolean;

    createdAt: string;
    updatedAt: string;
}

export interface TestFilter {
    search?: string;
    status?: string;
    mode?: string;
}


/**
 * Get all test instances assigned to a specific class.
 *
 * The teacher is authenticated through teacherAuthFetch.
 */
export const getClassTests = async (teacherId?: string, isAdminView=false): Promise<TeacherTest[]> => {
    const url = isAdminView
        ? `${API_URL}/api/admin/teacher/${teacherId}/classes/tests`
        : `${API_URL}/api/schoolclass/tests`;

    const response = await classAuthFetch(url, {method: "GET",
            headers: {
                "Content-Type": "application/json"},
        }, isAdminView
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch class tests: ${error}`);
    }
    return response.json();
};


/**
 * Activate a test for a class.
 */
export const activateTestId = async (testId: number, teacherId?:string, isAdminView=false) => {
    const url = isAdminView
        ? `${API_URL}/api/admin/teacher/${teacherId}/classes/tests/activate`
        : `${API_URL}/api/schoolclass/tests/activate`;
    const response = await classAuthFetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"},
            body: JSON.stringify({testId}),
        }, isAdminView
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to activate test");
    }

    return response.json();
};


/**
 * Deactivate a test instance.
 */
export const deactivateTest = async (testId: number, teacherId?:string, isAdminView=false) => {
    const url = isAdminView
        ? `${API_URL}/api/admin/teacher/${teacherId}/classes/tests/deactivate`
        : `${API_URL}/api/schoolclass/tests/deactivate`;
    const response = await classAuthFetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({testId})
        }, isAdminView
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to deactivate test");
    }

    return response.json();
};
