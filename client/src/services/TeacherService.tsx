import {teacherAuthFetch} from "./TeacherAuthFetchHelper.tsx";
// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL;
export interface Teacher {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    school_name: string;
    school_address: string;
}

export interface RegisterTeacherRequest {
    token?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    schoolName: string;
    schoolAddress: string;
    userId: string;
}

export interface TeacherLoginRequest {
    email: string;
    password: string;
}

export interface TeacherLoginResponse {
    token: string;
    teacherId: number;
}
export const getTeachers = async (): Promise<Teacher[]> => {
    const token = localStorage.getItem("token");

    const response = await teacherAuthFetch(`${API_URL}/api/teacher/get`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch teachers");
    }

    return await response.json();
};


export const registerTeacher = async (data: RegisterTeacherRequest) => {
    const response = await fetch(
        `${API_URL}/api/teacher/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        throw new Error("Registration failed");
    }
    const result = await response.json();
    console.log(result)
    saveTeacherSession(result);
    return result;
};

export const loginTeacher = async (
    data: TeacherLoginRequest
): Promise<TeacherLoginResponse> => {
    const response = await fetch(`${API_URL}/api/teacher/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
    }

    const result = await response.json();
    saveTeacherSession(result);
    return result;
};

const saveTeacherSession = (result: TeacherLoginResponse) => {
    localStorage.setItem("teacherToken", result.token);
    localStorage.setItem("teacherId", result.teacherId.toString());
};

export const getTeacherById = async (
    id: number
): Promise<Teacher> => {
    const response = await teacherAuthFetch(
        `${API_URL}/api/teacher/${id}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch teacher");
    }

    return await response.json();
};