import type { Request, Response } from 'express';
import { evaluateAnswersService } from '../services/solverService.js';

interface AnswerInput {
    key: string;
    value: any;
}

export const evaluateAnswersController = async (req: Request, res: Response) => {
    try {
        const questionId = Number(req.params.id);
        const userId = (req as any).user?.id;

        if (!userId) return res.status(401).json({ error: 'Not authenticated' });
        if (!questionId) return res.status(400).json({ error: 'Missing question ID' });

        const { answers } = req.body as { answers: AnswerInput[] };

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ error: 'Invalid or missing answers payload' });
        }

        const result = await evaluateAnswersService(questionId, answers);

        res.status(200).json(result);
    } catch (err: any) {
        console.error('Error evaluating answers:', err);
        res.status(500).json({ error: err.message || 'Failed to evaluate answers' });
    }
};
