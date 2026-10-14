import prisma from "../config/prismaClient.js";


export const getTeamDetails = async (userId: number) => {
    const teamId = await getUserTeam(userId);

    const teamDetails = await prisma.team.findUnique({
        where: {
            id: teamId,
        },
        include: {
            users: {
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                },
            },
        },
    });

    if (!teamDetails) {
        throw new Error("Could not fetch team details!");
    }

    return {
        id: teamDetails.id,
        name: teamDetails.name,
        description: teamDetails.description,
        users: teamDetails.users.map((user) => ({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
        })),
    };
};

export async function getUserTeam(userId: any) {
    const parsedUserId = Number(userId);
    if (isNaN(parsedUserId)) {
        throw new Error("Invalid userId");
    }
    const user = await prisma.users.findUnique({
        where: {
            id: parsedUserId,
        },
        select: {
            team_id: true,
        },
    });
    if (!user || user.team_id === null) {
        throw new Error("No TeamId found!");
    }
    return user.team_id;
}

export const addUserToTeam = async (teamId: number, userId: number) => {
    return prisma.users.update({
        where: {
            id: userId,
        },
        data: {
            team_id: teamId,
        },
    });
};