import type {Request, Response} from "express";
import {
    endQuestionSession, endQuizSession,
    getQuiz, saveFeedback,
    skipQuestion,
    startQuestionSession,
    submitQuizAnswer, syncAnonymousUser,
    trackQuestionTime
} from "../services/quizService.js";

/**
 * Get a quiz by ID
 */
export const getQuizHandler = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const userId = req.body.userId as string;
        const questionId = req.body.questionId ? Number(req.body.questionId) : undefined;
        const nextQuestionId = req.body.nextQuestionId ? Number(req.body.nextQuestionId) : undefined;
        const freeParam = req.body.freeParam ? req.body.freeParam as string: undefined;
        if (!id) return res.status(400).json({ error: "Quiz ID is required" });
        if (!userId) return res.status(400).json({ error: "User ID is required" });
        const quiz = await getQuiz(id, userId, questionId, nextQuestionId, freeParam);
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });
        res.status(200).json(quiz);
    } catch (err: any) {
        if (err.message === "NOT_ACTIVE") {
            return res.status(403).json({ error: "This survey is not active at the moment." });
        }
        console.error("Error fetching quiz:", err);
        res.status(500).json({ error: err });
    }
};

/**
 * Submit an answer for a quiz question
 */
export const submitAnswerHandler = async (req: Request, res: Response) => {
    try {
        const questionId = Number(req.params.questionId);
        const userId = req.query.userId as string;
        const { answer, instanceId, solved } = req.body;
        if (!questionId || !userId || answer === undefined) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const result = await submitQuizAnswer(userId, questionId, Number(instanceId), answer, solved);
        res.status(200).json({ success: true, result });
    } catch (err: any) {
        if (err.message === "QUESTION_ALREADY_ANSWERED") {
            return res.status(409).json({ error: err.message });
        }
        if (err.message === "ANSWER_RECORD_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to submit answer" });
    }
};

/**
 * Skip a quiz question
 */
export const skipQuestionHandler = async (req: Request, res: Response) => {
    try {
        const questionId = Number(req.params.questionId);
        const userId = req.query.userId as string;
        const instanceId  = req.query.instanceId as string;
        if (!questionId || !userId || !instanceId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const result = await skipQuestion(userId, questionId, Number(instanceId));
        res.status(200).json({ success: true, result });

    } catch (err: any) {
        if (err.message === "ANSWER_RECORD_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        if (err.message === "ANSWER_QUESTIONS_RECORD_NOT_FOUND") {
            return res.status(404).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: "Failed to skip question" });
    }
};

/**
 * Track time spent on a quiz question
 */
export const trackQuestionTimeHandler = async (req: Request, res: Response) => {
    try {
        const { instanceId, questionId, userId, seconds } = req.body
        if (!instanceId || !questionId || !userId || seconds === undefined) {
            return res.status(400).json({ error: "Missing required fields" })
        }
        await trackQuestionTime(userId, Number(questionId), Number(instanceId), Number(seconds))
        res.status(200).json({ success: true })
    } catch (err: any) {
        console.error("Error tracking question time:", err)
        res.status(500).json({ error: "Failed to track time" })
    }
}

/**
 * Start question solving session
 */
export const startQuestionSessionHandler = async (req: Request, res: Response) => {
    try {
        const { userId, questionId, instanceId } = req.body;
        if (!userId || !questionId || !instanceId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        await startQuestionSession(userId, Number(questionId), Number(instanceId));
        res.status(200).json({ success: true });
    } catch (err: any) {
        console.error("Error starting question session:", err);
        res.status(500).json({ error: "Failed to start session" });
    }
};

/**
 * End question solving session
 */
export const endQuestionSessionHandler = async (req: Request, res: Response) => {
    try {
        const { userId, questionId, instanceId } = req.body;
        if (!userId || !questionId || !instanceId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        await endQuestionSession(userId, Number(questionId), Number(instanceId));
        res.status(200).json({ success: true });
    } catch (err: any) {
        console.error("Error ending question session:", err);
        res.status(500).json({ error: "Failed to end session" });
    }
};

export const submitFeedbackHandler = async (req: Request, res: Response) => {
    try {
        const { instanceId, questionId, userId, feedback } = req.body;
        if (!instanceId || !questionId || !userId || !feedback) {
            return res.status(400).json({ error: "Missing fields" });
        }
        await saveFeedback({instanceId: Number(instanceId), questionId, userId, feedback,});
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save feedback" });
    }
};

export const endQuizSessionHandler = async (req: Request, res: Response) => {
    try {
        const { userId, instanceId } = req.body;
        if (!userId || !instanceId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        await endQuizSession(userId, Number(instanceId));
        res.status(200).json({ success: true });
    } catch (err: any) {
        console.error("Error ending question session:", err);
        res.status(500).json({ error: "Failed to end session" });
    }
};

export const syncAnonymousUserHandler = async (req: Request, res: Response) => {
    try {
        const { externalId } = req.body;
        if (!externalId) {
            return res.status(400).json({ error: "externalId is required" });
        }
        const user = await syncAnonymousUser(externalId);
        res.status(200).json(user);
    } catch (err: any) {
        console.error("Error syncing anonymous user:", err);
        res.status(500).json({ error: "Failed to sync anonymous user" });
    }
};