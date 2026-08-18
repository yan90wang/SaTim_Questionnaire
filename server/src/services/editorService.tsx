import fs from "fs/promises";
import prisma from "../config/prismaClient.js";
import {type question, question_status} from "@prisma/client";
import {supabase} from "../supabaseClient.js";
import {getUserTeam} from "./teamServices.js";

interface CreateQuestionInput {
    metadata: Record<string, any>;
    createdById: number;
    updatedById: number;
}

interface UpdateQuestionInput {
    updatedById: number;
    contentJson: object;
    contentHtml: string | null;
}

interface UpdateMetadataInput {
    metadata: Record<string, any>;
    updatedById: number;
}

type QuestionWithEditFlag = question & {
    isEditable: boolean;
};

export const saveImage = async (file: Express.Multer.File): Promise<string> => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    const fileName = `${Date.now()}_${safeName}`;
    const filePath = `uploads/${fileName}`;

    const fileBuffer = await fs.readFile(file.path);

    const { error } = await supabase.storage
        .from("images")
        .upload(filePath, fileBuffer, {
            contentType: file.mimetype,
        });

    await fs.unlink(file.path);

    if (error) throw new Error("Failed to upload image: " + error.message);

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);
    return data.publicUrl;
};
/**
 * Create a new metadata entry
 */
export const createQuestionMeta = async (data: CreateQuestionInput): Promise<question> => {
    const teamId = await getUserTeam(data.createdById);
    return prisma.question.create({
        data: {
            metadata: data.metadata,
            createdById: data.createdById,
            updatedById: data.updatedById,
            status: question_status.ACTIVE,
            team_id: teamId
        },
    });
};

/**
 * Find a metadata entry by ID
 */
export const findQuestionById = async (id: number, userId: number): Promise<QuestionWithEditFlag | null> => {
    const teamId = await getUserTeam(userId);

    const result = await prisma.question.findUnique({
        where: { id , team_id: teamId},
        include: {
            bookletQuestion: {
                select: { questionId: true }
            }
        }
    });

    if (!result) return null;

    const appearsInBooklet = result.bookletQuestion.length > 0;
    const isFinished = result.status === "FINISHED";
    const isEditable = true;
  // TODO enable again  const isEditable = !(appearsInBooklet && isFinished);
    const { bookletQuestion, ...questionData } = result;

    return {
        ...questionData,
        isEditable
    };
};
/**
 * Update question metadata
 */
export const updateQuestionMetaById = async (id: number, data: UpdateMetadataInput): Promise<question> => {
    const teamId = await getUserTeam(data.updatedById);

    return prisma.question.update({
        where: { id , team_id : teamId},
        data: {
            metadata: data.metadata,
            updatedById: data.updatedById,
        },
    });
};

/**
 * Update question content (JSON + HTML)
 */
export const updateQuestionContentById = async (id: number, data: UpdateQuestionInput): Promise<question> => {
    const teamId = await getUserTeam(data.updatedById);

    return prisma.question.update({
        where: { id , team_id: teamId},
        data: {
            contentJson: data.contentJson,
            contentHtml: data.contentHtml,
            updatedById: data.updatedById,
        },
    });
};

/**
 * Get all questions belonging to a group
 */
export const getQuestionsFromTeam = async (userId: number) => {
    const teamId = await getUserTeam(userId);

    return prisma.question.findMany({
        where: { team_id: teamId},
        orderBy: {createdAt: "desc"},
        include: {
            createdBy: {
                select: {id: true, first_name: true, last_name: true, email: true},
            },
            updatedBy: {
                select: {id: true, first_name: true, last_name: true, email: true},
            },
        },
    });
}

/**
 * Update the correct answers JSON for a question
 */
export async function updateQuestionAnswersById(id: number, data: { updatedById: number; answersJson: any }) {
    const teamId = await getUserTeam(data.updatedById);

    return prisma.question.update({
        where: { id, team_id: teamId },
        data: {correctAnswers: data.answersJson, updatedById: data.updatedById,},
    });
}

export const updateQuestionStatusById = async (id: number, { updatedById, status }: { updatedById: number; status: question_status}) => {
    const teamId = await getUserTeam(updatedById);

    return prisma.question.update({
        where: { id , team_id: teamId},
        data: {
            status,
            updatedById,
            updatedAt: new Date(),
        },
    });
};

export const duplicateQuestionById = async (id: number, userId: number): Promise<question> => {
    const teamId = await getUserTeam(userId);

    const original = await prisma.question.findUnique({
        where: { id },
    });

    if (!original) throw new Error("Original question not found");

    const metadata: Record<string, any> = original.metadata
        ? JSON.parse(JSON.stringify(original.metadata))
        : {};

    const contentJson: Record<string, any> = original.contentJson
        ? JSON.parse(JSON.stringify(original.contentJson))
        : {};

    const correctAnswers: Record<string, any> = original.correctAnswers
        ? JSON.parse(JSON.stringify(original.correctAnswers))
        : {};

    const contentHtml = original.contentHtml || null;

    const duplicate = await prisma.question.create({
        data: {
            team_id: teamId,
            metadata,
            createdById: userId,
            updatedById: userId,
            status: question_status.ACTIVE,
            contentJson,
            contentHtml,
            correctAnswers
        },
    });

    return duplicate;
};