import express from 'express';
import {
    getTeacherById,
    getTeachers,
    loginTeacher,
    registerTeacher,
    updateTeacher
} from "../controllers/teacherController.js";
import {teacherAuth} from "../auth/teacherAuthenticate.js";

const router = express.Router();


router.post('/register', registerTeacher);
router.post('/login', loginTeacher);
router.get('/get', getTeachers)
router.get("/:id", getTeacherById);
router.put("/:id", teacherAuth, updateTeacher);

//router.get('/search', searchTeacher);


export default router;
