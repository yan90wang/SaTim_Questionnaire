export const teacherAuthFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
) => {
    const token = localStorage.getItem("teacherToken");

    return fetch(input, {
        ...init,
        headers: {
            ...init?.headers,
            Authorization: `Bearer ${token}`,
        },
    });
};

export const classAuthFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
    adminView: boolean = false
) => {
    const token = adminView
        ? localStorage.getItem("token")
        : localStorage.getItem("teacherToken");

    return fetch(input, {
        ...init,
        headers: {
            ...init?.headers,
            Authorization: `Bearer ${token}`,
        },
    });
};