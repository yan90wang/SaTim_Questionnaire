import type { Request, Response } from "express";
import {
    getStudentsService,
    registerStudentService,
    loginStudentService,
    getStudentService,
    getAssignedTestsService,
    requestUnder14RegistrationService,
    getStudentWithPasswordService, changeStudentPasswordService,
} from "../services/studentService.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface RegisterStudentBody {
    email: string;
    password: string;
    birthday: string;
    registrationToken: string;
    privacyAccepted: boolean;
    dataProcessingAccepted: boolean;
}

interface StudentLoginRequestBody {
    email: string;
    password: string;
}

export const getStudents = async (
    req: Request<{ classId: string }>,
    res: Response
) => {
    try {
        const classId = Number(req.params.classId);
        if (Number.isNaN(classId)) {return res.status(400).json({message: "Invalid class id",});}
        const students = await getStudentsService(classId);
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server error",
        });
    }
};

export const registerStudent = async (
    req: Request<{}, {}, RegisterStudentBody>,
    res: Response
) => {
    try {
        const student = await registerStudentService(req.body);
        const token = jwt.sign(
            {
                studentId: student.id,
                email: student.email,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: "24h",
            }
        );

        res.status(201).json({
            token,
            studentId: student.id,
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Registration failed",
        });
    }
};

export const loginStudent = async (
    req: Request<{}, {}, StudentLoginRequestBody>,
    res: Response
) => {

    const { email, password } = req.body;
    try {
        const student = await loginStudentService(email);
        if (!student) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        const valid = await bcrypt.compare(
            password,
            student.password
        );

        if (!valid) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                studentId: student.id,
                email: student.email,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: "24h",
            }
        );

        res.json({
            token,
            studentId: student.id,
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Server error",
        });
    }
};

export const getStudent = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).studentId;
        if (!studentId) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const student = await getStudentService(Number(studentId));
        if (!student) {
            return res.status(404).json({
                message: "Student not found",
            });
        }
        res.json(student);
    } catch (err) {
        console.error(err);

        res.status(500).json({
            message: "Server error",
        });
    }
};

export const getAssignedTests = async (
    req: Request,
    res: Response
) => {
    try {
        const studentId = req.studentId;

        if (!studentId) {return res.status(401).json({message: "Unauthorized",});}

        const tests = await getAssignedTestsService(studentId);

        return res.json(tests);
    } catch (err) {
        console.error("Failed to get assigned tests:", err);

        if (
            err instanceof Error &&
            err.message === "Student not found"
        ) {
            return res.status(404).json({
                message: "Student not found",
            });
        }

        return res.status(500).json({
            message: "Failed to fetch assigned tests",
        });
    }
};

interface Under14RegistrationBody {
    birthday: string;
    registrationToken: string;
}

export const requestUnder14Registration = async (
    req: Request<{}, {}, Under14RegistrationBody>,
    res: Response
) => {
    try {
        const {birthday, registrationToken} = req.body;
        if (!birthday || !registrationToken) {
            return res.status(400).json({message: "Geburtsdatum und Registrierungstoken erforderlich.",});
        }
        const birthDate = new Date(birthday);
        if (Number.isNaN(birthDate.getTime())) {
            return res.status(400).json({message: "Ungültiges Geburtsdatum.",});
        }
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age >= 14) {
            return res.status(400).json({message: "Diese Anfrage ist nur für Schüler unter 14 Jahren.",});
        }

        await requestUnder14RegistrationService({registrationToken});
        return res.status(200).json({message: "Bitte kontaktiere deine Lehrperson, damit sie dich registrieren kann.",
        });

    } catch (err) {
        console.error("Under-14 registration request failed:", err);
        return res.status(500).json({message: "Die Anfrage konnte nicht verarbeitet werden.",
        });
    }
};

interface ChangePasswordBody {oldPassword: string;newPassword: string;}

export const changeStudentPassword = async (
    req: Request<{}, {}, ChangePasswordBody>,
    res: Response
) => {
    try {
        const studentId = req.studentId;
        const {oldPassword, newPassword} = req.body;
        if (!studentId) {return res.status(401).json({message: "Unauthorized",});}
        if (!oldPassword || !newPassword) {return res.status(400).json({message: "Altes und neues Passwort sind erforderlich.",});}
        if (newPassword.length < 6) {return res.status(400).json({message: "Das neue Passwort muss mindestens 6 Zeichen lang sein.",});}
        const student = await getStudentWithPasswordService(studentId);

        if (!student) {return res.status(404).json({message: "Student not found",});}
        const passwordMatches = await bcrypt.compare(oldPassword, student.password);
        if (!passwordMatches) {return res.status(400).json({message: "Das alte Passwort ist nicht korrekt.",});}
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await changeStudentPasswordService(studentId, hashedPassword);
        return res.json({message: "Passwort wurde erfolgreich geändert.",});

    } catch (err) {
        console.error("Failed to change student password:", err);
        return res.status(500).json({message: "Passwort konnte nicht geändert werden.",});
    }
};