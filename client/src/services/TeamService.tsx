import {authFetch} from "./AuthFetchHelper.tsx";
import type {FullUser} from "./UserService.tsx";

// @ts-ignore
const API_URL = import.meta.env.VITE_API_URL;

export interface Team{
    id: number;
    name: string;
    description?: string;
    users: FullUser[];
}

export const getUserTeam = async (): Promise<Team> => {
    const token = localStorage.getItem("token");
    const response = await authFetch(`${API_URL}/api/team/info`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error("Failed to fetch user team");
    }
    return await response.json();
};

export const addUserToTeam = async (teamId: number, userId: number) => {
    const token = localStorage.getItem("token");

    const res = await authFetch(`${API_URL}/api/team/addmember`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId, userId }),
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to add member");
    }

    return await res.json();
};