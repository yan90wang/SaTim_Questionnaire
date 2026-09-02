import prisma from "../config/prismaClient.js";
import bcrypt from "bcrypt";
import {getUserTeam} from "./teamServices.js";
import {SwissCanton} from "@prisma/client";

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

export const getTeachersService = async () => {
    return prisma.teacher.findMany({
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
    const existingTeacher = await prisma.teacher.findUnique({where: {email,},});

    if (existingTeacher) {
        throw new Error("Email already exists");
    }
    if (!privacyAccepted) {
        throw new Error("Privacy policy must be accepted");
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const teamId = await getUserTeam(userId);

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
    let email: string;
    do {
        const randomId = Math.random().toString(36).substring(2, 8);
        email = `student.${randomId}@satim.ch`;
        const existingStudent = await prisma.student.findFirst({
            where: {
                email,
            },
        });

        if (!existingStudent) {return email;}
    } while (true);
};

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