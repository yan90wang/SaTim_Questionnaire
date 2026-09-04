import express from "express";
import { authenticateToken } from "../auth/authenticate.js";
import {
    activateClassTestAdmin,
    createClassAdmin, deactivateClassTestAdmin, deleteClassAdmin, getClassAdmin,
    getClassesAdmin,
    getClassTestsAdmin, registerUnder14StudentAdmin, updateClassAdmin
} from "../controllers/teacherAdminController.js";

const router = express.Router();

router.get(
    "/:teacherId/classes",
    authenticateToken,
    getClassesAdmin
);

router.post(
    "/:teacherId/classes",
    authenticateToken,
    createClassAdmin
);

router.get(
    "/:teacherId/classes/tests",
    authenticateToken,
    getClassTestsAdmin
);

router.post(
    "/:teacherId/classes/tests/activate",
    authenticateToken,
    activateClassTestAdmin
);

router.post(
    "/:teacherId/classes/tests/deactivate",
    authenticateToken,
    deactivateClassTestAdmin
);

router.get(
    "/:teacherId/classes/:id",
    authenticateToken,
    getClassAdmin
);

router.put(
    "/:teacherId/classes/:id",
    authenticateToken,
    updateClassAdmin
);

router.delete(
    "/:teacherId/classes/:id",
    authenticateToken,
    deleteClassAdmin
);

router.post(
    "/:teacherId/classes/:classId/register-under-14",
    authenticateToken,
    registerUnder14StudentAdmin
);

export default router;