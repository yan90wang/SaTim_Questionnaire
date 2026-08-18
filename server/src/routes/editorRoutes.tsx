import express from 'express';
import {
    createQuestionsForm,
    loadAllQuestions,
    getQuestionFormById,
    updateQuestionForm,
    uploadImage,
    updateQuestionContent,
    updateQuestionAnswers,
    updateQuestionStatus,
    duplicateQuestion
} from "../controllers/editorController.js";
import multer from "multer";
import {authenticateToken} from "../auth/authenticate.js";

const router = express.Router();

const upload = multer({ dest: "temp/" });
router.use(authenticateToken);

router.post('/imageUpload', upload.single('file'), uploadImage);
router.put("/question/:id", updateQuestionForm);
router.post("/question", createQuestionsForm);
router.get("/question/:id", getQuestionFormById);
router.get("/questions", loadAllQuestions);
router.patch('/question/:id/content', updateQuestionContent);
router.patch('/question/:id/answers', updateQuestionAnswers);
router.patch('/question/:id/status', updateQuestionStatus);
router.post('/question/:id/duplicate', duplicateQuestion);

export default router;
