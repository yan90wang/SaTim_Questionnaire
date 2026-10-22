import express from 'express';
import {
    changeTeacherPassword,
    getTeacherById,
    getTeachers,
    loginTeacher,
    registerTeacher,
    updateTeacher
} from "../controllers/teacherController.js";
import {teacherAuth} from "../auth/teacherAuthenticate.js";
import {authenticateToken} from "../auth/authenticate.js";

const router = express.Router();


router.post('/register', registerTeacher);
router.post('/login', loginTeacher);
router.get('/get', authenticateToken, getTeachers)
router.get("/:id", getTeacherById);
router.put("/:id", teacherAuth, updateTeacher);
router.put("/change-password", teacherAuth, changeTeacherPassword);
//router.get('/search', searchTeacher);


export default router;
