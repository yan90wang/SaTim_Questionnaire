import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            teacherId?: number;
        }
    }
}

export const teacherAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as {
            teacherId: number;
            email: string;
        };

        req.teacherId = decoded.teacherId;

        next();
    } catch {
        return res.status(401).json({
            message: "Invalid token",
        });
    }
};