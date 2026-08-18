import {teacherAuthFetch} from "./TeacherAuthFetchHelper.tsx";

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
export const getClassTests = async (): Promise<TeacherTest[]> => {

    const response = await teacherAuthFetch(
        `${API_URL}/api/schoolclass/tests`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
            },
        }
    );

    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            `Failed to fetch class tests: ${error}`
        );
    }

    return response.json();
};


/**
 * Activate a test for a class.
 */
export const activateTestId = async (testId: number) => {
    const response = await teacherAuthFetch(
        `${API_URL}/api/schoolclass/tests/activate`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
            },
            body: JSON.stringify({testId}),
        }
    );

    if (!response.ok) {
        const error = await response.json();

        throw new Error(
            error.message || "Failed to activate test"
        );
    }

    return response.json();
};


/**
 * Deactivate a test instance.
 */
export const deactivateTest = async (testId: number) => {
    const response = await teacherAuthFetch(
        `${API_URL}/api/schoolclass/tests/deactivate`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
            },
            body: JSON.stringify({testId})
        }
    );

    if (!response.ok) {
        const error = await response.json();

        throw new Error(
            error.message || "Failed to deactivate test"
        );
    }

    return response.json();
};
