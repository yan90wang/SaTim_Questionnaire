import express from 'express';
import {
    changeStudentPassword,
    getAssignedTests,
    getStudent,
    getStudents,
    loginStudent,
    registerStudent, requestUnder14Registration
} from "../controllers/studentController.js";
import {teacherAuth} from "../auth/teacherAuthenticate.js";
import {studentAuth} from "../auth/studentAuthenticate.js";

const router = express.Router();

router.post('/register', registerStudent);
router.post('/register-under-14', requestUnder14Registration);
router.post('/login', loginStudent);
router.get("/assigned-tests", studentAuth, getAssignedTests);
router.get("/profile/:id", studentAuth, getStudent);
router.get("/:classId", teacherAuth, getStudents);
router.put("/change-password", studentAuth, changeStudentPassword);

export default router;
