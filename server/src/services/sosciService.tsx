interface SoSciProject {
    id: number;
    folder: string;
    title: string;
    server: string;
    active: boolean;
    accessible: boolean;
}

interface SoSciRecord {
    REF?: string | number;
    FINISHED?: number | boolean | string;
    STATUS?: string;
    [key: string]: unknown;
}

interface SoSciResponse {
    data?: Record<string, SoSciRecord>;
}

const SOSCI_API_BASE_URL = "https://www.soscisurvey.de/admin/api.php";

export const getSoSciCompletionStatus = async (studentIds: number[], projectName: string): Promise<Record<number, boolean>> => {

    const apiKey = process.env.SOSCI_API_KEY;
    if (!apiKey) {
        throw new Error("SOSCI_API_KEY_NOT_CONFIGURED");
    }

    const statuses: Record<number, boolean> = {};

    for (const id of studentIds) {
        statuses[id] = false;
    }

    if (studentIds.length === 0) {
        return statuses;
    }

    const headers = {Authorization: `Bearer ${apiKey}`, Accept: "application/json",};

    const projectsResponse = await fetch(`${SOSCI_API_BASE_URL}?v1/projects`, {headers, signal: AbortSignal.timeout(10000),});
    if (!projectsResponse.ok) {
        throw new Error(`SOSCI_PROJECTS_API_ERROR_${projectsResponse.status}`);
    }

    const projects = await projectsResponse.json() as SoSciProject[];

    if (!Array.isArray(projects)) {
        throw new Error("INVALID_SOSCI_PROJECTS_RESPONSE");
    }

    const normalizedName = projectName.trim().toLowerCase();
    const project = projects.find(p => p.folder?.toLowerCase() === normalizedName || p.title?.toLowerCase() === normalizedName);

    if (!project) {
        console.error("Available SoSci projects:", projects.map(p => ({id: p.id, folder: p.folder, title: p.title,}))
        );
        throw new Error(`SOSCI_PROJECT_NOT_FOUND: ${projectName}`);
    }

    const datasetUrl = `${SOSCI_API_BASE_URL}?v1/projects/${project.id}/dataset`;
    const datasetResponse = await fetch(datasetUrl, {headers, signal: AbortSignal.timeout(10000),});

    if (!datasetResponse.ok) {
        const errorBody = await datasetResponse.text();
        console.error("SoSci dataset request failed:", {status: datasetResponse.status, body: errorBody.slice(0, 1000),});
        throw new Error(`SOSCI_DATASET_API_ERROR_${datasetResponse.status}`);
    }

    const result = await datasetResponse.json() as SoSciResponse | Record<string, SoSciRecord>;

    const records = "data" in result && result.data ? result.data : result as Record<string, SoSciRecord>;
    if (!records || typeof records !== "object" || Array.isArray(records)) {
        throw new Error("INVALID_SOSCI_DATASET_RESPONSE");
    }

    const requestedIds = new Set(studentIds.map(String));
    for (const record of Object.values(records) as SoSciRecord[]) {
        if (!record || typeof record !== "object") {
            continue;
        }
        const studentId = String(record.REF ?? "").trim();
        if (!requestedIds.has(studentId)) {continue;}
        const finished = record.FINISHED === 1 || record.FINISHED === true || record.FINISHED === "1";
        const numericId = Number(studentId);
        statuses[numericId] = statuses[numericId] || finished;
    }

    return statuses;
};