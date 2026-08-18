import prisma from "../config/prismaClient.js";
import bcrypt from "bcrypt";

const saltRounds = 10;

interface NewUserInput {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
}

export const saveNewUser = async ({first_name, last_name, email, password}: NewUserInput) => {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const existing = await prisma.users.findUnique({
        where: { email },
    });

    if (existing) {
        throw new Error("Email already exists");
    }
    return prisma.users.create({
        data: {
            first_name,
            last_name,
            email,
            password: hashedPassword,
            roles: ["GENERAL"],
        },
        select: {
            id: true,
            email: true,
        },
    });
};

export const loginUserService = async (email: string) => {
    return prisma.users.findUnique({
        where: {email}
    });
};

export const findUser = async (userId: string | number) => {
    const id = typeof userId === "string" ? Number(userId) : userId;

    return prisma.users.findUnique({
        where: { id },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            roles: true,
        },
    });

};

export const searchUsersService = async (query: string) => {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
        return [];
    }

    return prisma.users.findMany({
        where: {
            OR: [
                {
                    email: {
                        contains: cleanQuery,
                        mode: "insensitive",
                    },
                },
                {
                    first_name: {
                        contains: cleanQuery,
                        mode: "insensitive",
                    },
                },
                {
                    last_name: {
                        contains: cleanQuery,
                        mode: "insensitive",
                    },
                },
            ],
        },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
        },
        take: 10,
    });
};