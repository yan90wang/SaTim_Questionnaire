import type { Request, Response } from 'express';
import {addUserToTeam, getTeamDetails} from "../services/teamServices.js";


export const getTeamInfos = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: 'Not authenticated' });

        const result = await getTeamDetails(userId);

        res.status(200).json(result);
    } catch (err: any) {
        console.error('Error evaluating answers:', err);
        res.status(500).json({ error: err.message || 'Failed to evaluate answers' });
    }
};

export const addTeamMember = async (req: Request, res: Response) => {
    try {
        const { teamId, userId } = req.body;

        if (!teamId || !userId) {
            return res.status(400).json({ message: "Missing data" });
        }

        const result = await addUserToTeam(Number(teamId), Number(userId));

        res.status(201).json(result);
    } catch (err: any) {
        console.error("Error adding team member:", err);
        if (err.code === "P2002") {
            return res.status(409).json({ message: "User already in team" });
        }

        res.status(500).json({ message: "Server error" });
    }
};