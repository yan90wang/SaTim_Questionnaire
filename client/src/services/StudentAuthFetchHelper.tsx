
export const studentAuthFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
) => {
    const token = localStorage.getItem("studentToken");

    return fetch(input, {
        ...init,
        headers: {
            ...(init?.headers ?? {}),
            Authorization: `Bearer ${token}`,
        },
    });
};