import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access token missing" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: number;
            email: string;
            roles?: string[];
        };

        (req as any).user = {
            id: decoded.userId,
            email: decoded.email,
            roles: decoded.roles || [],
        };

        next();
    } catch (err) {
        console.error("Invalid token:", err);
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};
