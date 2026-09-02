import prisma from "../config/prismaClient.js";
import {getUserTeam} from "./teamServices.js";

export const getClassesService = async (teacherId: number) => {
    return prisma.schoolClass.findMany({
        where: {
            teacherId,
        },
        include: {
            _count: {
                select: {
                    student: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const createClassService = async (teacherId: number, name: string, type: string) => {
    return prisma.$transaction(async (tx) => {

        const schoolClass = await tx.schoolClass.create({
            data: {
                name,
                type,
                teacherId,
            },
            include: {
                _count: {
                    select: {
                        student: true,
                    },
                },
            },
        });

        const teacherAssignedSurveys = await tx.survey.findMany({
            where: {
                teacherAssigned: true,
            },
            select: {
                id: true,
            },
        });

        if (teacherAssignedSurveys.length > 0) {
            await tx.classTestInstance.createMany({
                data: teacherAssignedSurveys.map((survey) => ({
                    surveyId: survey.id,
                    classId: schoolClass.id,
                    active: false,
                })),
                skipDuplicates: true,
            });
        }
        return schoolClass;
    });
};

interface UpdateClassInput {
    name: string;
    type: string;
}

export const updateClassService = async (
    teacherId: number,
    classId: number,
    data: UpdateClassInput
) => {
    const schoolClass = await prisma.schoolClass.findFirst({
        where: {
            id: classId,
            teacherId,
        },
    });

    if (!schoolClass) {
        throw new Error("Class not found");
    }

    return prisma.schoolClass.update({
        where: {
            id: classId,
        },
        data: {
            name: data.name,
            type: data.type,
        },
        include: {
            _count: {
                select: {
                    student: true,
                },
            },
        },
    });
};

export const deleteClassService = async (
    teacherId: number,
    classId: number
) => {
    const schoolClass = await prisma.schoolClass.findFirst({
        where: {
            id: classId,
            teacherId,
        },
    });

    if (!schoolClass) {
        throw new Error("Class not found");
    }

    return prisma.schoolClass.delete({
        where: {
            id: classId,
        },
    });
};

export const getClassService = async (
    teacherId: number,
    classId: number
) => {
    return prisma.schoolClass.findFirst({
        where: {
            id: classId,
            teacherId,
        },
        include: {
            student: {
                select: {
                    id: true,
                    email: true,
                    birthday: true,
                    externalId: true,
                    createdAt: true,
                }
            },
        },
    });
};


export const ensureTeacherBelongsToUserTeam = async (
    userId: number,
    teacherId: number
): Promise<void> => {
    const userTeamId = await getUserTeam(userId);
    const teacher = await prisma.teacher.findUnique({
        where: {
            id: teacherId,
        },
        select: {
            teamId: true,
        },
    });

    if (!teacher) {
        throw new Error("Teacher not found");
    }

    if (teacher.teamId !== userTeamId) {
        throw new Error("Access denied");
    }
};

export const getClassTestsService = async (teacherId: number) => {
    const instances = await prisma.classTestInstance.findMany({
        where: {
            schoolClass: {
                teacherId: teacherId,
            },
            survey: {
                teacherAssigned: true,
            },
        },
        include: {
            survey: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    mode: true,
                    status: true,
                },
            },
            schoolClass: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    student: {
                        select: {
                            id: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return Promise.all(
        instances.map(async (instance) => {
            const studentIds = instance.schoolClass.student.map(
                (student) => String(student.id)
            );

            let finishedStudents = 0;

            if (studentIds.length > 0) {
                if (instance.survey.mode === "ADAPTIV") {
                    finishedStudents = await prisma.adaptiveAnswer.count({
                        where: {
                            surveyId: instance.surveyId,
                            userId: {
                                in: studentIds,
                            },
                            quizFinished: true,
                        },
                    });
                } else {
                    finishedStudents = await prisma.answer.count({
                        where: {
                            surveyId: instance.surveyId,
                            userId: {
                                in: studentIds,
                            },
                            quizFinished: true,
                        },
                    });
                }
            }

            return {
                id: instance.id,
                surveyId: instance.surveyId,
                classId: instance.classId,

                className: instance.schoolClass.name,
                classType: instance.schoolClass.type,

                title: instance.survey.title,
                description: instance.survey.description,

                status: instance.survey.status,
                mode: instance.survey.mode,

                active: instance.active,

                finishedStudents,
                totalStudents: instance.schoolClass.student.length,

                createdAt: instance.createdAt,
                updatedAt: instance.updatedAt,
            };
        })
    );
};

export const activateClassTestService = async (
    teacherId: number,
    instanceId: number
) => {
    const instance = await prisma.classTestInstance.findFirst({
        where: {
            id: instanceId,
            schoolClass: {
                teacherId,
            },
        },
    });

    if (!instance) {
        throw new Error("Test instance not found");
    }

    const updatedInstance = await prisma.classTestInstance.update({
        where: {
            id: instanceId,
        },
        data: {
            active: true,
        },
        include: {
            survey: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    mode: true,
                    status: true,
                },
            },
            schoolClass: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                },
            },
        },
    });

    return {
        id: updatedInstance.id,
        surveyId: updatedInstance.surveyId,
        classId: updatedInstance.classId,

        className: updatedInstance.schoolClass.name,
        classType: updatedInstance.schoolClass.type,

        title: updatedInstance.survey.title,
        description: updatedInstance.survey.description,

        status: updatedInstance.survey.status,
        mode: updatedInstance.survey.mode,

        active: updatedInstance.active,

        createdAt: updatedInstance.createdAt,
        updatedAt: updatedInstance.updatedAt,
    };
};


export const deactivateClassTestService = async (
    teacherId: number,
    instanceId: number
) => {
    const instance = await prisma.classTestInstance.findFirst({
        where: {
            id: instanceId,
            schoolClass: {
                teacherId,
            },
        },
    });

    if (!instance) {
        throw new Error("Test instance not found");
    }

    const updatedInstance = await prisma.classTestInstance.update({
        where: {
            id: instanceId,
        },
        data: {
            active: false,
        },
        include: {
            survey: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    mode: true,
                    status: true,
                },
            },
            schoolClass: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                },
            },
        },
    });

    return {
        id: updatedInstance.id,
        surveyId: updatedInstance.surveyId,
        classId: updatedInstance.classId,

        className: updatedInstance.schoolClass.name,
        classType: updatedInstance.schoolClass.type,

        title: updatedInstance.survey.title,
        description: updatedInstance.survey.description,

        status: updatedInstance.survey.status,
        mode: updatedInstance.survey.mode,

        active: updatedInstance.active,

        createdAt: updatedInstance.createdAt,
        updatedAt: updatedInstance.updatedAt,
    };
};