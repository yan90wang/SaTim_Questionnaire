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