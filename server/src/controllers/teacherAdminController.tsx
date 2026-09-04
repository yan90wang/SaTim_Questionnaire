import type {Request, Response} from "express";

import {
    activateClassTestService,
    createClassService,
    deactivateClassTestService,
    deleteClassService,
    ensureTeacherBelongsToUserTeam,
    getClassesService,
    getClassService,
    getClassTestsService,
    updateClassService,
} from "../services/schoolClassService.js";

import {registerUnder14StudentService,} from "../services/teacherService.js";


interface CreateClassBody {
    name: string;
    type: string;
}

interface UpdateClassBody {
    name: string;
    type: string;
}

interface TestInstanceBody {
    instanceId: number;
}


/**
 * ADMIN
 * GET /api/admin/teacher/:teacherId/classes
 */
export const getClassesAdmin = async (
    req: Request<{ teacherId: string }>,
    res: Response
) => {
    try {
        const userId = Number((req as any).user?.id);
        const teacherId = Number(req.params.teacherId);

        if (!userId) {
            return res.status(401).json({
                message: "Not authenticated",
            });
        }

        if (isNaN(teacherId)) {
            return res.status(400).json({
                message: "Invalid teacher id",
            });
        }

        await ensureTeacherBelongsToUserTeam(
            userId,
            teacherId
        );

        const classes = await getClassesService(
            teacherId
        );

        return res.status(200).json(classes);

    } catch (err) {
        console.error(
            "Admin get classes error:",
            err
        );

        if (
            err instanceof Error &&
            err.message === "Teacher not found"
        ) {
            return res.status(404).json({
                message: "Teacher not found",
            });
        }

        if (
            err instanceof Error &&
            err.message === "Access denied"
        ) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        return res.status(500).json({
            message: "Server error",
        });
    }
};


/**
 * ADMIN
 * GET /api/admin/teacher/:teacherId/classes/:id
 */
export const getClassAdmin = async (
    req: Request<{
        teacherId: string;
        id: string;
    }>,
    res: Response
) => {
    try {
        const userId = Number((req as any).user?.id);
        const teacherId = Number(req.params.teacherId);
        const classId = Number(req.params.id);

        if (!userId) {
            return res.status(401).json({
                message: "Not authenticated",
            });
        }

        if (
            isNaN(teacherId) ||
            isNaN(classId)
        ) {
            return res.status(400).json({
                message: "Invalid id",
            });
        }

        await ensureTeacherBelongsToUserTeam(
            userId,
            teacherId
        );

        const schoolClass = await getClassService(
            teacherId,
            classId
        );

        if (!schoolClass) {
            return res.status(404).json({
                message: "Class not found",
            });
        }

        return res.status(200).json(
            schoolClass
        );

    } catch (err) {
        console.error(
            "Admin get class error:",
            err
        );

        if (
            err instanceof Error &&
            err.message === "Teacher not found"
        ) {
            return res.status(404).json({
                message: "Teacher not found",
            });
        }

        if (
            err instanceof Error &&
            err.message === "Access denied"
        ) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        return res.status(500).json({
            message: "Server error",
        });
    }
};


/**
 * ADMIN
 * POST /api/admin/teacher/:teacherId/classes
 */
export const createClassAdmin = async (
    req: Request<
        { teacherId: string },
        {},
        CreateClassBody
    >,
    res: Response
) => {
    try {
        const userId = Number((req as any).user?.id);
        const teacherId = Number(req.params.teacherId);

        const {
            name,
            type,
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Not authenticated",
            });
        }

        if (isNaN(teacherId)) {
            return res.status(400).json({
                message: "Invalid teacher id",
            });
        }

        if (!name || !type) {
            return res.status(400).json({
                message: "Name and type are required",
            });
        }

        await ensureTeacherBelongsToUserTeam(
            userId,
            teacherId
        );

        const schoolClass = await createClassService(
            teacherId,
            name,
            type
        );

        return res.status(201).json(
            schoolClass
        );

    } catch (err) {
        console.error(
            "Admin create class error:",
            err
        );

        if (
            err instanceof Error &&
            err.message === "Teacher not found"
        ) {
            return res.status(404).json({
                message: "Teacher not found",
            });
        }

        if (
            err instanceof Error &&
            err.message === "Access denied"
        ) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        return res.status(500).json({
            message: "Class could not be created",
        });
    }
};


/**
 * ADMIN
 * PUT /api/admin/teacher/:teacherId/classes/:id
 */
export const updateClassAdmin = async (
    req: Request<
        {
            teacherId: string;
            id: string;
        },
        {},
        UpdateClassBody
    >,
    res: Response
) => {
    try {
        const userId = Number((req as any).user?.id);
        const teacherId = Number(req.params.teacherId);
        const classId = Number(req.params.id);

        if (!userId) {
            return res.status(401).json({
                message: "Not authenticated",
            });
        }

        if (
            isNaN(teacherId) ||
            isNaN(classId)
        ) {
            return res.status(400).json({
                message: "Invalid id",
            });
        }

        await ensureTeacherBelongsToUserTeam(
            userId,
            teacherId
        );

        const updatedClass = await updateClassService(
            teacherId,
            classId,
            req.body
        );

        return res.status(200).json(
            updatedClass
        );

    } catch (err) {
        console.error(
            "Admin update class error:",
            err
        );

        if (
            err instanceof Error &&
            err.message === "Class not found"
        ) {
            return res.status(404).json({
                message: "Class not found",
            });
        }

        if (
            err instanceof Error &&
            err.message === "Teacher not found"
        ) {
            return res.status(404).json({
                message: "Teacher not found",
            });
        }

        if (
            err instanceof Error &&
            err.message === "Access denied"
        ) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        return res.status(500).json({
            message: "Class could not be updated",
        });
    }
};


/**
 * ADMIN
 * DELETE /api/admin/teacher/:teacherId/classes/:id
 */
export const deleteClassAdmin = async (
    req: Request<{
        teacherId: string;
        id: string;
    }>,
    res: Response
) => {
    try {
        const userId = Number((req as any).user?.id);
        const teacherId = Number(req.params.teacherId);
        const classId = Number(req.params.id);

        if (!userId) {
            return res.status(401).json({
                message: "Not authenticated",
            });
        }

        if (
            isNaN(teacherId) ||
            isNaN(classId)
        ) {
            return res.status(400).json({
                message: "Invalid id",
            });
        }

        await ensureTeacherBelongsToUserTeam(
            userId,
            teacherId
        );

        await deleteClassService(
            teacherId,
            classId
        );

        return res.status(204).send();

    } catch (err) {
        console.error(
            "Admin delete class error:",
            err
        );

        if (
            err instanceof Error &&
            err.message === "Class not found"
        ) {
            return res.status(404).json({
                message: "Class not found",
            });
        }

        if (
            err instanceof Error &&
            err.message === "Teacher not found"
        ) {
            return res.status(404).json({
                message: "Teacher not found",
            });
        }

        if (
            err instanceof Error &&
            err.message === "Access denied"
        ) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        return res.status(500).json({
            message: "Class could not be deleted",
        });
    }
};


/**
 * ADMIN
 * GET /api/admin/teacher/:teacherId/classes/tests
 */
export const getClassTestsAdmin = async (
    req: Request<{ teacherId: string }>,
    res: Response
) => {
    try {
        const userId = Number((req as any).user?.id);
        const teacherId = Number(req.params.teacherId);

        if (!userId) {
            return res.status(401).json({
                message: "Not authenticated",
            });
        }

        if (isNaN(teacherId)) {
            return res.status(400).json({
                message: "Invalid teacher id",
            });
        }

        await ensureTeacherBelongsToUserTeam(
            userId,
            teacherId
        );

        const tests = await getClassTestsService(
            teacherId
        );

        return res.status(200).json(tests);

    } catch (err) {
        console.error(
            "Admin get class tests error:",
            err
        );

        if (
            err instanceof Error &&
            err.message === "Access denied"
        ) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        return res.status(500).json({
            message: "Server error",
        });
    }
};


/**
 * ADMIN
 * POST /api/admin/teacher/:teacherId/classes/tests/activate
 */
export const activateClassTestAdmin = async (
    req: Request<
        { teacherId: string },
        {},
        TestInstanceBody
    >,
    res: Response
) => {
    try {
        const userId = Number((req as any).user?.id);
        const teacherId = Number(req.params.teacherId);
        const instanceId = Number(req.body.instanceId);

        if (!userId) {
            return res.status(401).json({
                message: "Not authenticated",
            });
        }

        if (
            isNaN(teacherId) ||
            isNaN(instanceId)
        ) {
            return res.status(400).json({
                message: "Invalid id",
            });
        }

        await ensureTeacherBelongsToUserTeam(
            userId,
            teacherId
        );

        const result = await activateClassTestService(
            teacherId,
            instanceId
        );

        return res.status(200).json(result);

    } catch (err) {
        console.error(
            "Admin activate class test error:",
            err
        );

        if (
            err instanceof Error &&
            err.message === "Test instance not found"
        ) {
            return res.status(404).json({
                message: "Test instance not found",
            });
        }

        if (
            err instanceof Error &&
            err.message === "Access denied"
        ) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        return res.status(500).json({
            message: "Test could not be activated",
        });
    }
};


/**
 * ADMIN
 * POST /api/admin/teacher/:teacherId/classes/tests/deactivate
 */
export const deactivateClassTestAdmin = async (
    req: Request<
        { teacherId: string },
        {},
        TestInstanceBody
    >,
    res: Response
) => {
    try {
        const userId = Number((req as any).user?.id);
        const teacherId = Number(req.params.teacherId);
        const instanceId = Number(req.body.instanceId);

        if (!userId) {
            return res.status(401).json({
                message: "Not authenticated",
            });
        }

        if (
            isNaN(teacherId) ||
            isNaN(instanceId)
        ) {
            return res.status(400).json({
                message: "Invalid id",
            });
        }

        await ensureTeacherBelongsToUserTeam(
            userId,
            teacherId
        );

        const result = await deactivateClassTestService(
            teacherId,
            instanceId
        );

        return res.status(200).json(result);

    } catch (err) {
        console.error(
            "Admin deactivate class test error:",
            err
        );

        if (
            err instanceof Error &&
            err.message === "Test instance not found"
        ) {
            return res.status(404).json({
                message: "Test instance not found",
            });
        }

        if (
            err instanceof Error &&
            err.message === "Access denied"
        ) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        return res.status(500).json({
            message: "Test could not be deactivated",
        });
    }
};


/**
 * ADMIN
 * POST /api/admin/teacher/:teacherId/classes/:classId/register-under-14
 */
export const registerUnder14StudentAdmin = async (
    req: Request<
        {
            teacherId: string;
            classId: string;
        },
        {},
        {
            birthday: string;
        }
    >,
    res: Response
) => {
    try {
        const userId = Number((req as any).user?.id);
        const teacherId = Number(req.params.teacherId);
        const classId = Number(req.params.classId);
        const {birthday} = req.body;

        if (!userId) {
            return res.status(401).json({
                message: "Not authenticated",
            });
        }

        if (
            isNaN(teacherId) ||
            isNaN(classId)
        ) {
            return res.status(400).json({
                message: "Invalid id",
            });
        }

        if (!birthday) {
            return res.status(400).json({
                message: "Geburtsdatum ist erforderlich.",
            });
        }

        await ensureTeacherBelongsToUserTeam(
            userId,
            teacherId
        );

        /*
         * Verify that the class actually belongs
         * to this teacher.
         */
        const schoolClass = await getClassService(
            teacherId,
            classId
        );

        if (!schoolClass) {
            return res.status(404).json({
                message: "Class not found",
            });
        }

        const result =
            await registerUnder14StudentService(
                classId,
                teacherId,
                birthday
            );

        return res.status(201).json(result);

    } catch (err) {
        console.error(
            "Admin under-14 student registration error:",
            err
        );

        if (
            err instanceof Error &&
            err.message === "Access denied"
        ) {
            return res.status(403).json({
                message: "Access denied",
            });
        }

        return res.status(500).json({
            message:
                "Schüler konnte nicht registriert werden.",
        });
    }
};