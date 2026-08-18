import express from "express";
import {
    activateClassTest,
    createClass,
    deactivateClassTest,
    deleteClass,
    getClass,
    getClasses,
    getClassTests,
    updateClass,
} from "../controllers/schoolClassController.js";
import {teacherAuth} from "../auth/teacherAuthenticate.js";
import {authenticateToken} from "../auth/authenticate.js";
import {registerUnder14Student} from "../controllers/teacherController.js";

const router = express.Router();
router.get("/list", teacherAuth, getClasses);
router.get("/list/:teacherId", authenticateToken, getClasses);
router.get("/tests", teacherAuth, getClassTests);
router.post("/tests/activate", teacherAuth, activateClassTest);
router.post("/tests/deactivate", teacherAuth, deactivateClassTest);
router.get("/:id", teacherAuth, getClass);
router.post("/", teacherAuth, createClass);
router.put("/:id", teacherAuth, updateClass);
router.post("/:classId/register-under-14", teacherAuth, registerUnder14Student);

router.delete("/:id", teacherAuth, deleteClass);

export default router;