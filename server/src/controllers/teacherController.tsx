import type {Request, Response} from "express";

import {
    getTeacherByIdService,
    getTeachersService,
    loginTeacherService,
    registerTeacherService, registerUnder14StudentService, updateTeacherService,
} from "../services/teacherService.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type {SwissCanton} from "@prisma/client";

interface RegisterTeacherBody {
    token?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    schoolName: string;
    schoolAddress: string;
    userId: string;
    canton: SwissCanton;
    privacyAccepted: boolean;
}

interface TeacherLoginRequestBody {
    email: string;
    password: string;
}

interface UpdateTeacherBody {
    first_name: string;
    last_name: string;
    email: string;
    school_name: string;
    school_address: string;
    canton: SwissCanton;
    privacyAccepted: boolean;
}

export const getTeachers = async (_req: Request, res: Response) => {
    try {
        const teachers = await getTeachersService();
        res.json(teachers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const registerTeacher = async (
    req: Request<{}, {}, RegisterTeacherBody>,
    res: Response
) => {
    try {
        const teacher = await registerTeacherService(req.body);
        const token = jwt.sign(
            {
                teacherId: teacher.id,
                email: teacher.email,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: "24h",
            }
        );

        res.status(201).json({
            token,
            teacherId: teacher.id,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Registration failed",
        });
    }
};

export const loginTeacher = async (
    req: Request<{}, {}, TeacherLoginRequestBody>,
    res: Response
) => {
    const { email, password } = req.body;
    try {
        const teacher = await loginTeacherService(email);

        if (!teacher) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        const passwordValid = await bcrypt.compare(
            password,
            teacher.password
        );

        if (!passwordValid) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET not set");
        }

        const token = jwt.sign(
            {
                teacherId: teacher.id,
                email: teacher.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "24h",
            }
        );

        res.status(200).json({
            token,
            teacherId: teacher.id,
        });
    } catch (err) {
        console.error("Teacher login error:", err);

        res.status(500).json({
            message: "Server error",
        });
    }
};

export const getTeacherById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                message: "Invalid teacher id",
            });
        }

        const teacher = await getTeacherByIdService(id);

        if (!teacher) {
            return res.status(404).json({
                message: "Teacher not found",
            });
        }

        res.json(teacher);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server error",
        });
    }
};

export const registerUnder14Student = async (
    req: Request<{classId: string}, {}, {birthday: string}>,
    res: Response
) => {
    try {
        const classId = Number(req.params.classId);
        const {birthday} = req.body;
        if (isNaN(classId)) {return res.status(400).json({message: "Invalid class id",});}
        if (!birthday) {return res.status(400).json({message: "Geburtsdatum ist erforderlich.",});}
        const teacherId = (req as any).teacherId;

        if (!teacherId) {return res.status(401).json({message: "Teacher not authenticated",});}
        const result = await registerUnder14StudentService(classId, Number(teacherId), birthday);
        return res.status(201).json(result);

    } catch (err) {
        console.error("Under-14 student registration error:", err);
        return res.status(500).json({message: "Schüler konnte nicht registriert werden.",});
    }};

export const updateTeacher = async (
    req: Request<{ id: string }, {}, UpdateTeacherBody>,
    res: Response
) => {
    try {
        const teacherId = Number(req.params.id);
        if (isNaN(teacherId)) {return res.status(400).json({message: "Invalid teacher id",});}
        const authenticatedTeacherId = (req as any).teacherId;
        if (!authenticatedTeacherId) {return res.status(401).json({message: "Teacher not authenticated",});}
        if (Number(authenticatedTeacherId) !== teacherId) {
            return res.status(403).json({
                message: "Access denied",
            });
        }
        const updatedTeacher = await updateTeacherService(teacherId, req.body);
        return res.status(200).json(updatedTeacher);

    } catch (err) {
        console.error("Teacher update error:", err);
        if (err instanceof Error && err.message === "Teacher not found") {
            return res.status(404).json({message: "Teacher not found",});
        }
        return res.status(500).json({message: "Teacher could not be updated",});
    }
};

