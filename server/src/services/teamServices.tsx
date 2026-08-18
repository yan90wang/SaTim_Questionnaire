import prisma from "../config/prismaClient.js";


export const getTeamDetails = async (userId: number) => {
    const teamId = await getUserTeam(userId);

    const teamDetails = await prisma.team.findFirst({
        where: { id: teamId },
        include: {
            users: {
                include: {
                    user: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                        },
                    },
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

        users: teamDetails.users.map((entry) => ({
            id: entry.user.id,
            first_name: entry.user.first_name,
            last_name: entry.user.last_name,
            email: entry.user.email,
        })),
    };
};

export async function getUserTeam(userId: any) {
    const parsedUserId = Number(userId);
    if (isNaN(parsedUserId)) {
        throw new Error("Invalid userId");
    }
    const userTeams = await prisma.team_access.findMany({
        where: {user_id: parsedUserId},
        select: {team_id: true},
    });
    const teamId = userTeams[0]?.team_id;
    if (teamId === undefined) {
        throw new Error("No TeamId found!");
    }
    return teamId;
}

export const addUserToTeam = async (teamId: number, userId: number) => {
    return prisma.team_access.create({
        data: {
            team_id: teamId,
            user_id: userId,
        },
    });
};