import prisma from "../config/prismaClient.js";
import bcrypt from "bcrypt";
import {sendUnder14RegistrationEmail} from "./emailService.js";

const saltRounds = 10;

interface RegisterStudentInput {
    email: string;
    password: string;
    birthday: string;
    registrationToken: string;
    privacyAccepted: boolean;
    dataProcessingAccepted: boolean;
}

export const getStudentsService = async (
    classId: number
) => {
    return prisma.student.findMany({
        where: {
            classId,
        },
        select: {
            id: true,
            birthday: true,
            email: true,
            createdAt: true,
            classId: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const registerStudentService = async ({email, password, birthday, registrationToken, privacyAccepted, dataProcessingAccepted}: RegisterStudentInput) => {
    if (!privacyAccepted || !dataProcessingAccepted) {
        throw new Error("Consent required");
    }

    const existing = await prisma.student.findFirst({where: {email,},});
    if (existing) {throw new Error("Email already exists");}
    const schoolClass = await prisma.schoolClass.findUnique({
        where: {registrationToken,},
    });

    if (!schoolClass) {
        throw new Error("Invalid registration token");
    }

    const hashedPassword = await bcrypt.hash(
        password,
        saltRounds
    );
    const now = new Date();

    return prisma.student.create({
        data: {
            birthday: new Date(birthday),
            email,
            password: hashedPassword,
            classId: schoolClass.id,
            privacyAcceptedAt: now,
            dataProcessingAcceptedAt: now,
        },
        select: {
            id: true,
            email: true,
            birthday: true,
        },
    });
};

export const loginStudentService = async (
    email: string
) => {

    return prisma.student.findFirst({
        where: {
            email,
        },
    });
};

export const getStudentService = async (
    studentId: number
) => {
    return prisma.student.findUnique({
        where: {
            id: studentId,
        },
        select: {
            id: true,
            email: true,
            birthday: true,
        },
    });
};


export const getAssignedTestsService = async (studentId: number) => {
    const student = await prisma.student.findUnique({
        where: {
            id: studentId,
        },
        select: {
            id: true,
            classId: true,
        },
    });

    if (!student) {throw new Error("Student not found");}
    if (!student.classId) {return [];}
    const now = new Date();
    const classTests = await prisma.classTestInstance.findMany({
        where: {
            classId: student.classId,
            active: true,
            survey: {
                teacherAssigned: true,
            },
        },
        include: {
            survey: {
                select: {id: true, title: true, description: true, mode: true,
                    instances: {
                        where: {
                            validFrom: {lte: now,},
                            validTo: {gte: now,},
                        },
                        orderBy: {validFrom: "asc",},
                        include: {
                            answer: {
                                where: {userId: String(studentId),},
                                select: {id: true, quizFinished: true,},
                            },
                            adaptiveAnswer: {
                                where: {userId: String(studentId),},
                                select: {id: true, quizFinished: true,},
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return classTests.flatMap((classTest) =>
        classTest.survey.instances.map((instance) => {
            let status: | "OPEN" | "IN_PROGRESS" | "FINISHED";
            const answer = instance.answer[0];
            const adaptiveAnswer = instance.adaptiveAnswer[0];
            const existingAnswer = answer ?? adaptiveAnswer;
            if (existingAnswer?.quizFinished) {
                status = "FINISHED";
            } else if (existingAnswer) {
                status = "IN_PROGRESS";
            } else {
                status = "OPEN";
            }

            return {
                id: classTest.id,
                instanceId: instance.id,
                surveyId: classTest.surveyId,
                classId: classTest.classId,
                title: classTest.survey.title,
                description: classTest.survey.description,
                mode: classTest.survey.mode,
                name: instance.name,
                validFrom: instance.validFrom,
                validTo: instance.validTo,
                status,
            };
        })
    );
};

interface Under14RegistrationInput {
    registrationToken: string;
}

export const requestUnder14RegistrationService = async ({registrationToken,}: Under14RegistrationInput) => {
    const schoolClass = await prisma.schoolClass.findUnique({
        where: {
            registrationToken,
        },
        include: {
            teacher: {
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                },
            },
        },
    });

    if (!schoolClass) {
        throw new Error("Invalid registration token");
    }

    if (!schoolClass.teacher) {
        throw new Error("Teacher not found");
    }

    await sendUnder14RegistrationEmail({teacherEmail: schoolClass.teacher.email, teacherFirstName: schoolClass.teacher.first_name, teacherLastName: schoolClass.teacher.last_name, className: schoolClass.name,});

    return {
        success: true,
    };
};

export const getStudentWithPasswordService = async (
    studentId: number
) => {
    return prisma.student.findUnique({
        where: {
            id: studentId,
        },
        select: {
            id: true,
            password: true,
        },
    });
};

export const changeStudentPasswordService = async (
    studentId: number,
    hashedPassword: string
) => {
    return prisma.student.update({
        where: {
            id: studentId,
        },
        data: {
            password: hashedPassword,
        },
    });
};