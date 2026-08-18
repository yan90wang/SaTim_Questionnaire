import express from 'express';
import {authenticateToken} from "../auth/authenticate.js";
import {evaluateAnswersController} from "../controllers/solverController.js";

const router = express.Router();

router.use(authenticateToken);

router.post('/:id/evaluate', evaluateAnswersController);


export default router;
