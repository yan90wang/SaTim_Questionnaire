import type {Request, Response} from 'express';
import {
    createQuestionMeta, duplicateQuestionById,
    findQuestionById,
    getQuestionsFromTeam, saveImage, updateQuestionAnswersById,
    updateQuestionContentById,
    updateQuestionMetaById, updateQuestionStatusById
} from "../services/editorService.js";
import {question_status} from "@prisma/client";

interface FieldInput {
    key: string;
    value?: any;
    optionsValue?: Record<string, boolean>;
}

interface QuestionFormInput {
    formData: FieldInput[];
}

interface QuestionContentInput {
    contentJson: object;
    contentHtml: string | null;
}

export type QuizStatus = 'in bearbeitung' | 'abgeschlossen' | 'gelöscht' | 'lektorat';

export const uploadImage = async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
        const imageUrl = await saveImage(req.file);
        res.status(201).json({ url: imageUrl });
    } catch (err) {
        console.error("Image upload error:", err);
        res.status(500).json({ error: "Failed to upload image" });
    }
};

export const createQuestionsForm = async (req: Request, res: Response) => {
    try {
        const { formData } = req.body as QuestionFormInput;

        if (!formData || !Array.isArray(formData)) {
            return res.status(400).json({ error: "Invalid form data" });
        }
        const userId = Number((req as any).user?.id);
        if (!userId) return res.status(401).json({ error: "Not authenticated" });

        const newQuestion = await createQuestionMeta({metadata: formData, createdById: userId, updatedById: userId});

        res.status(201).json(newQuestion);
    } catch (err) {
        console.error("Error creating metadata:", err);
        res.status(500).json({ error: "Failed to save metadata" });
    }
};

export const getQuestionFormById = async  (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const userId = Number((req as any).user?.id);
        if (!userId) return res.status(401).json({ error: "Not authenticated" });
        const entry = await findQuestionById(id, userId);

        if (!entry) return res.status(404).json({ error: "Not found" });
        res.json(entry);
    } catch (err) {
        console.error("Error fetching metadata:", err);
        res.status(500).json({ error: "Failed to load metadata" });
    }
};

export const updateQuestionForm = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const userId = Number((req as any).user?.id);
        if (!userId) return res.status(401).json({ error: 'Not authenticated' });

        const updated = await updateQuestionMetaById(id, {
            metadata: req.body,
            updatedById: userId,
        });

        res.json(updated);
    } catch (err) {
        console.error('Error updating metadata:', err);
        res.status(500).json({ error: 'Failed to update metadata' });
    }
};

export const updateQuestionContent = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { contentJson, contentHtml } = req.body as QuestionContentInput;
        const userId = Number((req as any).user?.id);

        if (!userId) return res.status(401).json({ error: 'Not authenticated' });

        if (!contentJson) {
            return res.status(400).json({ error: 'Missing contentJson' });
        }

        const updated = await updateQuestionContentById(id, {
            updatedById: userId,
            contentJson,
            contentHtml: contentHtml || null,
        });

        res.json(updated);
    } catch (err) {
        console.error('Error updating question content:', err);
        res.status(500).json({ error: 'Failed to update question content' });
    }
};

export const loadAllQuestions = async (req: Request, res: Response) => {
    try {
        const userId = Number((req as any).user?.id);
        if (!userId) return res.status(401).json({ error: 'Not authenticated' });

        const questions = await getQuestionsFromTeam(userId);
        res.json(questions);
    } catch (err) {
        console.error("Error loading questions:", err);
        res.status(500).json({ error: "Failed to load questions" });
    }
};

export const updateQuestionAnswers = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { answers } = req.body;
        const userId = Number((req as any).user?.id);

        if (!userId) return res.status(401).json({ error: 'Not authenticated' });
        if (!answers) return res.status(400).json({ error: 'Missing answers payload' });

        const updated = await updateQuestionAnswersById(id, {
            updatedById: userId,
            answersJson: answers,
        });

        res.json(updated);
    } catch (err) {
        console.error('Error updating question answers:', err);
        res.status(500).json({ error: 'Failed to update question answers' });
    }
};

export const updateQuestionStatus = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;
        const userId = Number((req as any).user?.id);

        if (!userId) return res.status(401).json({ error: 'Not authenticated' });
        if (!status) return res.status(400).json({ error: 'Missing status' });

        const statusEnum = mapFrontendStatusToEnum(status);

        const updated = await updateQuestionStatusById(id, {
            updatedById: userId,
            status: statusEnum,
        });

        res.json(updated);
    } catch (err) {
        console.error('Error updating question status:', err);
        res.status(500).json({ error: 'Failed to update question status' });
    }
};

export const duplicateQuestion = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const userId = Number((req as any).user?.id);
        if (!userId) return res.status(401).json({ error: "Not authenticated" });

        const duplicated = await duplicateQuestionById(id, userId);
        res.status(201).json(duplicated);
    } catch (err: any) {
        console.error("Error duplicating question:", err);
        res.status(500).json({ error: err.message || "Failed to duplicate question" });
    }
};

const mapFrontendStatusToEnum = (status: QuizStatus): question_status => {
    switch (status) {
        case 'in bearbeitung':
            return 'ACTIVE';
        case 'abgeschlossen':
            return 'FINISHED';
        case 'gelöscht':
            return 'DELETED';
        case 'lektorat':
            return 'LECTURE';
        default:
            throw new Error('Invalid status');
    }
};
