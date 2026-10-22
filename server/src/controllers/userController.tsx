import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {registerValidationSchema} from "../validation/userValidation.js";
import {findUser, loginUserService, saveNewUser, searchUsersService} from "../services/userService.js";
import type {Request, Response} from 'express';

interface RegisterRequestBody {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
}

interface LoginRequestBody {
    email: string;
    password: string;
}

interface GetUserByIdQuery {
    userId: string;
}

export const registerUser = async (req: Request<{}, {}, RegisterRequestBody>, res: Response) => {
   const { error } = registerValidationSchema.validate(req.body);
     if (error) {
         return res.status(400).json({ message: error.details[0]?.message });
     }
     try {
         if (!process.env.JWT_SECRET) {
             throw new Error('JWT_SECRET not set');
         }
         const result = await saveNewUser(req.body);
         const token = jwt.sign(
             { userId: result.id.toString(), email: result.email },
             process.env.JWT_SECRET,
             { expiresIn: '24h' }
         );
         res.status(201).json({
             message: 'User registered successfully',
             userId: result.id.toString(),
             token,
         });
     } catch (err) {
         console.error('Error registering user:', err);
         res.status(500).json({ message: 'Database error' });
     }
};


export const loginUser = async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
    const { email, password } = req.body;
    try {
        const result = await loginUserService(email, password);
        if (!result.success) {
            if (result.reason === "ACCOUNT_LOCKED") {
                return res.status(429).json({
                    message: "Zu viele fehlgeschlagene Anmeldeversuche. " + "Bitte versuchen Sie es in 20 Minuten erneut.",
                    lockedUntil: result.lockedUntil
                });
            }
            return res.status(400).json({message: "Invalid email or password"});
        }

        if (!process.env.JWT_SECRET) {throw new Error("JWT_SECRET not set");}

        const token = jwt.sign(
            {
                userId: result.user.id.toString(),
                email: result.user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );
        return res.status(200).json({token, userId: result.user.id.toString()});
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({message: "Server error"});
    }
};

export const getUserById = async (req: Request<{}, {}, {}, GetUserByIdQuery>, res: Response) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ message: 'Missing userId' });
    }

    try {
        const user = await findUser(userId);
        res.json(user);
    } catch (err) {
        console.error('Error fetching user by ID:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

interface SearchUsersQuery {
    query?: string;
}

export const searchUsers = async (req: Request<{}, {}, {}, SearchUsersQuery>, res: Response) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: "Missing query" });
    }

    try {
        const users = await searchUsersService(query);
        res.status(200).json(users);
    } catch (err) {
        console.error("Error searching users:", err);
        res.status(500).json({ message: "Server error" });
    }
};