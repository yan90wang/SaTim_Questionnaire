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

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 20;

export const loginUserService = async (email: string, password: string) => {
    const user = await prisma.users.findUnique({
        where: { email }
    });
    if (!user) {
        return {success: false as const, reason: "INVALID_CREDENTIALS" as const};
    }
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
        return {
            success: false as const,
            reason: "ACCOUNT_LOCKED" as const,
            lockedUntil: user.lockedUntil
        };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        const previousAttempts = user.lockedUntil && user.lockedUntil <= now ? 0 : user.failedLoginAttempts;
        const failedAttempts = previousAttempts + 1;
        const lockedUntil = failedAttempts >= MAX_LOGIN_ATTEMPTS ? new Date(now.getTime() + LOCK_DURATION_MINUTES * 60 * 1000) : null;
        await prisma.users.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: failedAttempts,
                lockedUntil
            }
        });
        return {success: false as const, reason: lockedUntil ? "ACCOUNT_LOCKED" as const : "INVALID_CREDENTIALS" as const, lockedUntil};
    }

    await prisma.users.update({
        where: { id: user.id },
        data: {failedLoginAttempts: 0, lockedUntil: null}
    });

    return {
        success: true as const,
        user: {id: user.id, email: user.email}
    };
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