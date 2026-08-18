import express from "express";
import {
    createSurveyHandler,
    getAllSurveysHandler,
    getSurveyByIdHandler,
    updateSurveyHandler,
    deleteSurveyHandler,
    createSurveyInstanceHandler,
    getSurveyInstancesHandler,
    updateSurveyInstanceHandler,
    deleteSurveyInstanceHandler,
    uploadSurveyExcelsHandler,
    getSurveyBookletsHandler,
    getSurveyExportHandler,
    getQuestionsByIdsHandler,
    getQuestionDetailsByIdsHandler,
    setSurveyTeacherAssignableHandler,
    uploadKnowledgeSpace,
    uploadProbabilityDistribution,
} from "../controllers/surveyController.js";
import { authenticateToken } from "../auth/authenticate.js";
import multer from "multer";

const router = express.Router();

router.use(authenticateToken);
const upload = multer({ storage: multer.memoryStorage() });


router.post("/", createSurveyHandler);
router.get("/", getAllSurveysHandler);
router.get("/:id", getSurveyByIdHandler);
router.put("/:id", updateSurveyHandler);
router.delete("/:id", deleteSurveyHandler);

router.post("/:surveyId/instance", createSurveyInstanceHandler);
router.get("/:surveyId/instances", getSurveyInstancesHandler);
router.post("/:surveyId/knowledge-space", upload.single("knowledgeSpace"), uploadKnowledgeSpace);
router.post("/:surveyId/probability-distribution", upload.single("probabilityDistribution"), uploadProbabilityDistribution);
router.put("/instance/:id", updateSurveyInstanceHandler);
router.delete("/instance/:id", deleteSurveyInstanceHandler);

router.get("/:id/booklets", getSurveyBookletsHandler);
router.post("/:id/export", getSurveyExportHandler);
router.post("/teacher-assign/:surveyId", setSurveyTeacherAssignableHandler);
router.post("/questions", getQuestionsByIdsHandler);
router.post("/questionDetails", getQuestionDetailsByIdsHandler);

router.post(
    "/:id/upload-excels",
    upload.fields([
        { name: "slotQuestionFile", maxCount: 1 },
        { name: "bookletSlotFile", maxCount: 1 },
    ]),
    uploadSurveyExcelsHandler
);

export default router;
