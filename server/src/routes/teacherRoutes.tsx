import express from 'express';
import {getTeacherById, getTeachers, loginTeacher, registerTeacher} from "../controllers/teacherController.js";

const router = express.Router();


router.post('/register', registerTeacher);
router.post('/login', loginTeacher);
router.get('/get', getTeachers)
router.get("/:id", getTeacherById);

//router.get('/search', searchTeacher);


export default router;
