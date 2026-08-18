import type {Request, Response} from "express";
import {
    createSurvey,
    createSurveyInstance,
    deleteSurveyById,
    deleteSurveyInstanceById,
    getAllSurveys,
    getBookletsBySurveyId,
    getQuestionDetailsExport,
    getQuestionsByIds,
    getSurveyById,
    getSurveyExport,
    getSurveyInstances,
    processSurveyExcels, setSurveyTeacherAssignableService,
    updateSurveyById,
    updateSurveyInstanceById, uploadKnowledgeSpaceService, uploadProbabilityService,
} from "../services/surveyService.js";
import fs from "fs";
/**
 * Interface for creating a new survey
 */
interface SurveyInput {
    title: string;
    description?: string;
    mode: "adaptiv" | "design";
    instances?: {
        name: string;
        validFrom: string;
        validTo: string;
    }[];
    isTwoTier: boolean
}

/**
 * Create a new survey
 */
export const createSurveyHandler = async (req: Request, res: Response) => {
    try {
        const { title, description, mode, instances, isTwoTier } = req.body as SurveyInput;
        const userId = Number((req as any).user?.id);
        if (!userId) return res.status(401).json({ error: "Not authenticated" });

        if (!title || !mode) {
            return res.status(400).json({ error: "Missing required fields: title or mode" });
        }

        const newSurvey = await createSurvey({
            title,
            description: description || "",
            mode: mode === "adaptiv" ? "ADAPTIV" : "DESIGN",
            createdById: userId,
            updatedById: userId,
            instances: instances?.map(i => ({
                name: i.name,
                validFrom: new Date(i.validFrom),
                validTo: new Date(i.validTo),
            })) || [],
            isTwoTier: isTwoTier
        });

        res.status(201).json(newSurvey);
    } catch (err) {
        console.error("Error creating survey:", err);
        res.status(500).json({ error: "Failed to create survey" });
    }
};

/**
 * Get all surveys
 */
export const getAllSurveysHandler = async (_req: Request, res: Response) => {
    try {
        const surveys = await getAllSurveys();
        res.json(surveys);
    } catch (err) {
        console.error("Error fetching surveys:", err);
        res.status(500).json({ error: "Failed to fetch surveys" });
    }
};

/**
 * Get one survey by ID
 */
export const getSurveyByIdHandler = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const survey = await getSurveyById(id);
        if (!survey) return res.status(404).json({ error: "Survey not found" });
        res.json(survey);
    } catch (err) {
        console.error("Error fetching survey:", err);
        res.status(500).json({ error: "Failed to fetch survey" });
    }
};

/**
 * Update survey by ID
 */
export const updateSurveyHandler = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const userId = Number((req as any).user?.id);
        if (!userId) return res.status(401).json({ error: "Not authenticated" });

        const { title, description, mode, status, adaptiveThreshold,} = req.body;

        const updatePayload: any = { updatedById: userId };
        if (title) updatePayload.title = title;
        if (description !== undefined) updatePayload.description = description;
        if (mode) updatePayload.mode = mode === "adaptiv" ? "ADAPTIV" : "DESIGN";
        if (status) updatePayload.status = status;
        if (adaptiveThreshold !== undefined) {updatePayload.adaptiveThreshold = adaptiveThreshold;}
        const updatedSurvey = await updateSurveyById(id, updatePayload);

        res.json(updatedSurvey);
    } catch (err) {
        console.error("Error updating survey:", err);
        res.status(500).json({ error: "Failed to update survey" });
    }
};

/**
 * Delete survey by ID
 */
export const deleteSurveyHandler = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        await deleteSurveyById(id);
        res.json({ success: true });
    } catch (err) {
        console.error("Error deleting survey:", err);
        res.status(500).json({ error: "Failed to delete survey" });
    }
};

/**
 * Create a new survey instance
 */
export const createSurveyInstanceHandler = async (req: Request, res: Response) => {
    try {
        const surveyId = Number(req.params.surveyId);
        if (!surveyId) return res.status(400).json({ error: "Invalid survey ID" });
        const userId = Number((req as any).user?.id);
        if (!userId) return res.status(401).json({ error: "Not authenticated" });
        const { name, validFrom, validTo } = req.body;
        if (!name || !validFrom || !validTo) {
            return res.status(400).json({ error: "Missing required fields: name, validFrom, validTo" });
        }
        const instance = await createSurveyInstance({
            surveyId,
            name,
            validFrom: new Date(validFrom),
            validTo: new Date(validTo),
            createdById: userId,
            updatedById: userId,
        });

        res.status(201).json(instance);
    } catch (err) {
        console.error("Error creating survey instance:", err);
        res.status(500).json({ error: "Failed to create survey instance" });
    }
};

/**
 * Get all instances for a survey
 */
export const getSurveyInstancesHandler = async (req: Request, res: Response) => {
    try {
        const surveyId = Number(req.params.surveyId);
        const instances = await getSurveyInstances(surveyId);
        res.json(instances);
    } catch (err) {
        console.error("Error fetching survey instances:", err);
        res.status(500).json({ error: "Failed to fetch survey instances" });
    }
};

/**
 * Update survey instance
 */
export const updateSurveyInstanceHandler = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const userId = Number((req as any).user?.id);
        if (!userId) return res.status(401).json({ error: "Not authenticated" });

        const { name, validFrom, validTo } = req.body;

        const updatePayload: any = { updatedById: userId };
        if (name) updatePayload.name = name;
        if (validFrom) updatePayload.validFrom = new Date(validFrom);
        if (validTo) updatePayload.validTo = new Date(validTo);

        const updated = await updateSurveyInstanceById(id, updatePayload);

        res.json(updated);
    } catch (err) {
        console.error("Error updating survey instance:", err);
        res.status(500).json({ error: "Failed to update survey instance" });
    }
};

/**
 * Delete survey instance
 */
export const deleteSurveyInstanceHandler = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        await deleteSurveyInstanceById(id);
        res.json({ success: true });
    } catch (err) {
        console.error("Error deleting survey instance:", err);
        res.status(500).json({ error: "Failed to delete survey instance" });
    }
};

export const uploadSurveyExcelsHandler = async (req: Request, res: Response) => {
    try {
        const surveyId = Number(req.params.id);
        if (!surveyId) return res.status(400).json({error: "Invalid survey ID"});

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        const slotQuestionFile = files.slotQuestionFile?.[0];
        const bookletSlotFile = files.bookletSlotFile?.[0];

        if (!slotQuestionFile || !bookletSlotFile) {
            return res.status(400).json({error: "Both files are required"});
        }

        if (!slotQuestionFile || !bookletSlotFile) {
            return res.status(400).json({error: "Both files are required"});
        }
        const createdBy = Number((req as any).user?.id);
        if (!createdBy) {
            return res.status(401).json({error: "Unauthorized: user not found in token"});
        }
        await processSurveyExcels(surveyId, slotQuestionFile, bookletSlotFile, createdBy);

        res.status(200).json({message: "Files uploaded and processed successfully"});
    } catch (err: any) {
        console.error(err);
        if (err.statusCode === 400) {
            return res.status(400).json({
                message: err.message,
                details: err.details
            });
        }
        res.status(500).json({
            message: "Failed to upload Excel files"
        });
    }
}


export const getSurveyBookletsHandler = async (req: Request, res: Response) => {
    try {
        const surveyId = Number(req.params.id);
        if (!surveyId) return res.status(400).json({ error: "Invalid survey ID" });

        const booklets = await getBookletsBySurveyId(surveyId);
        res.status(200).json(booklets);
    } catch (err) {
        console.error("Error fetching booklets:", err);
        res.status(500).json({ error: "Failed to fetch booklets" });
    }
};

export const getSurveyExportHandler = async (req: Request, res: Response) => {
    try {
        const surveyId = Number(req.params.id);
        const { instanceIds } = req.body as { instanceIds: number[] };

        if (!Array.isArray(instanceIds) || instanceIds.length === 0) {
            return res.status(400).json({
                message: "Keine Durchführungen ausgewählt."
            });
        }

        const filePath = await getSurveyExport(
            surveyId,
            instanceIds
        );

        res.setHeader("Content-Disposition", `attachment; filename=Erhebung_${surveyId}.xlsx`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        fileStream.on("end", () => {fs.unlink(filePath, () => {});});
    } catch (err) {
        console.error("Survey export failed:", err);

        res.status(500).json({
            message: "Export fehlgeschlagen"
        });
    }
};

export const getQuestionsByIdsHandler = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body as { ids: number[] };

        if (!Array.isArray(ids) || ids.length === 0) {return res.status(400).json({message: "Question IDs are required"});}
        const questions = await getQuestionsByIds(ids);

        res.status(200).json(questions);
    } catch (err) {
        console.error("Error fetching questions:", err);

        res.status(500).json({
            message: "Failed to fetch questions"
        });
    }
};

export const getQuestionDetailsByIdsHandler = async (req: Request, res: Response) => {
    try {
        const { ids, surveyTitle, surveyId } = req.body as { ids: number[]; surveyTitle: string, surveyId: number };

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({message: "Question IDs are required to fetch details"});
        }

        const buffer = await getQuestionDetailsExport(ids, surveyId, surveyTitle);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=Erhebung_${surveyTitle}.xlsx`);
        res.send(buffer);
    } catch (err) {
        console.error("Error exporting question details:", err);
        res.status(500).json({message: "Failed to export question details"});
    }
};

export const setSurveyTeacherAssignableHandler = async (req: Request<{ surveyId: string }>, res: Response) => {
    try {
        const surveyId = Number(req.params.surveyId);

        if (Number.isNaN(surveyId)) {
            return res.status(400).json({
                message: "Invalid survey id",
            });
        }
        const { teacherAssigned } = req.body; if (typeof teacherAssigned !== "boolean") { return res.status(400).json({ message: "teacherAssigned must be a boolean", }); }
        const survey = await setSurveyTeacherAssignableService(surveyId, teacherAssigned);
        return res.json(survey);
    } catch (err) {
        console.error(err);

        if (err instanceof Error && err.message === "Survey not found") {
            return res.status(404).json({
                message: "Survey not found",
            });
        }

        return res.status(500).json({
            message: "Failed to assign survey to teachers",
        });
    }
};

export const uploadKnowledgeSpace = async (
    req: Request,
    res: Response
) => {
    try {
        const surveyId = Number(req.params.surveyId);
        if (!req.file) {return res.status(400).json({message: "Keine Excel-Datei hochgeladen.",});}
        const result = await uploadKnowledgeSpaceService(surveyId, req.file);
        return res.status(200).json({message: "Knowledge Space erfolgreich hochgeladen.", ...result,});
    } catch (error: any) {
        console.error("Knowledge Space upload error:", error);
        return res.status(400).json({message: error?.message ?? "Knowledge Space konnte nicht verarbeitet werden.",});
    }
};

export const uploadProbabilityDistribution = async (
    req: Request,
    res: Response
) => {
    try {
        const surveyId = Number(req.params.surveyId);
        if (!surveyId || Number.isNaN(surveyId)) {return res.status(400).json({message: "Ungültige Survey ID.",});}
        if (!req.file) {return res.status(400).json({message: "Keine Excel-Datei hochgeladen.",});}

        const result = await uploadProbabilityService(surveyId, req.file);
        return res.status(200).json({message: "Wahrscheinlichkeitsverteilung erfolgreich hochgeladen.", ...result,});
    } catch (error: any) {
        console.error("Probability distribution upload error:", error);
        return res.status(400).json({message: error?.message ?? "Wahrscheinlichkeitsverteilung konnte nicht verarbeitet werden.",});
    }
};