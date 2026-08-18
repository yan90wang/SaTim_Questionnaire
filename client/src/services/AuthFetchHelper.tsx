export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : "",
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject(new Error("Unauthorized"));
    }

    return response;
}
