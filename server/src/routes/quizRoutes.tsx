import express from 'express';
import {
    endQuestionSessionHandler, endQuizSessionHandler,
    getQuizHandler,
    skipQuestionHandler, startQuestionSessionHandler,
    submitAnswerHandler, submitFeedbackHandler, syncAnonymousUserHandler,
    trackQuestionTimeHandler
} from "../controllers/quizController.js";

const router = express.Router();

router.post('/instance/:id', getQuizHandler);
router.post('/question/:questionId/answer', submitAnswerHandler);
router.post('/question/:questionId/skip', skipQuestionHandler);
router.post('/track-time', trackQuestionTimeHandler);
router.post('/session/start', startQuestionSessionHandler);
router.post('/session/end', endQuestionSessionHandler);
router.post('/feedback', submitFeedbackHandler);
router.post('/end', endQuizSessionHandler);
router.post('/anonymous-user', syncAnonymousUserHandler);


export default router;
