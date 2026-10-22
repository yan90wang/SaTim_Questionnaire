import prisma from "../config/prismaClient.js";
import bcrypt from "bcrypt";
import {getUserTeam} from "./teamServices.js";
import {SwissCanton} from "@prisma/client";
import {randomBytes} from "node:crypto";

const saltRounds = 10;

interface RegisterTeacherInput {
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

export const getTeachersService = async (loggedInUserId: number) => {
    const user = await prisma.users.findUnique({
        where: {
            id: loggedInUserId,
        },
        select: {
            team_id: true,
        },
    });
    if (!user || user.team_id === null) {
        throw new Error("USER_OR_TEAM_NOT_FOUND");
    }
    return prisma.teacher.findMany({
        where: {
            teamId: user.team_id,
        },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            school_name: true,
            school_address: true,
            createdAt: true,
        },
        orderBy: {
            last_name: "asc",
        },
    });
};

export const registerTeacherService = async ({firstName, lastName, email, password, schoolName, schoolAddress, userId, canton, privacyAccepted}: RegisterTeacherInput) => {
    const normalizedEmail = email.toLowerCase().trim();
    const existingTeacher = await prisma.teacher.findUnique({
        where: {
            email: normalizedEmail,
        },
    });
    if (existingTeacher) {
        throw new Error("Email already exists");
    }
    if (!privacyAccepted) {
        throw new Error("Privacy policy must be accepted");
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const teamId = await getUserTeam(userId);
    if (!teamId) {
        throw new Error("No team found");
    }
    return prisma.teacher.create({
        data: {
            first_name: firstName,
            last_name: lastName,
            email,
            password: hashedPassword,
            school_name: schoolName,
            school_address: schoolAddress,
            teamId: teamId,
            canton: canton,
            privacyAcceptedAt: new Date(),
        },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            school_name: true,
            school_address: true,
            createdAt: true,
            canton: true,
            privacyAcceptedAt: true
        },
    });
};

export const loginTeacherService = async (email: string) => {
    return prisma.teacher.findUnique({
        where: {
            email,
        },
    });
};

export const getTeacherByIdService = async (id: number) => {
    return prisma.teacher.findUnique({
        where: {
            id,
        },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            school_name: true,
            school_address: true,
            createdAt: true,
            canton: true
        },
    });
};


export const registerUnder14StudentService = async (
    classId: number,
    teacherId: number,
    birthday: string
) => {
    const schoolClass = await prisma.schoolClass.findFirst({
        where: {
            id: classId,
            teacherId,
        },
    });

    if (!schoolClass) {throw new Error(
        "Klasse nicht gefunden oder der Lehrer besitzt diese Klasse nicht."
    );}

    const email = await generateStudentEmail();
    const password = generatePassword();

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const student = await prisma.student.create({
        data: {
            email,
            birthday: new Date(`${birthday}T00:00:00.000Z`),
            password: hashedPassword,
            classId: schoolClass.id,
        },
        select: {
            id: true,
            email: true,
            classId: true,
            createdAt: true,
        },
    });


    return {
        student: {id: student.id,},
        email,
        password,
    };
};


const generatePassword = (length = 10): string => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return password;
};


const generateStudentEmail = async (): Promise<string> => {
    while (true) {
        const randomId = randomBytes(6).toString("hex");
        const username = `student_${randomId}`;

        const existingStudent = await prisma.student.findUnique({
            where: {
                email: username,
            },
            select: {
                id: true,
            },
        });

        if (!existingStudent) {
            return username;
        }
};}

interface UpdateTeacherInput {
    first_name: string;
    last_name: string;
    email: string;
    school_name: string;
    school_address: string;
    canton: SwissCanton;
    privacyAccepted: boolean;
}

export const updateTeacherService = async (
    teacherId: number,
    data: UpdateTeacherInput
) => {
    const existingTeacher = await prisma.teacher.findUnique({
        where: {
            id: teacherId,
        },
    });

    if (!existingTeacher) {
        throw new Error("Teacher not found");
    }
    if (data.email !== existingTeacher.email) {
        const teacherWithEmail = await prisma.teacher.findUnique({
            where: {email: data.email,},
        });

        if (teacherWithEmail) {
            throw new Error("Email already exists");
        }
    }

    return prisma.teacher.update({
        where: {
            id: teacherId,
        },
        data: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            school_name: data.school_name,
            school_address: data.school_address,
            canton: data.canton,
        },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            school_name: true,
            school_address: true,
            canton: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

export const changeTeacherPasswordService = async (teacherId: number, oldPassword: string, newPassword: string) => {
    const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
    });
    if (!teacher) {
        throw new Error("TEACHER_NOT_FOUND");
    }
    const isPasswordValid = await bcrypt.compare(oldPassword, teacher.password);
    if (!isPasswordValid) {
        throw new Error("INVALID_OLD_PASSWORD");
    }
    if (newPassword.length < 8) {
        throw new Error("PASSWORD_TOO_SHORT");
    }
    if (oldPassword === newPassword) {
        throw new Error("SAME_PASSWORD");
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.teacher.update({
        where: { id: teacherId },
        data: { password: hashedPassword },
    });
};

