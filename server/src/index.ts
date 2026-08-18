import express from 'express';
import dotenv from 'dotenv';
import userRoutes from "./routes/userRoutes.js";
import editorRoutes from "./routes/editorRoutes.js";
import path from "path";
import cors from 'cors';
import surveyRoutes from "./routes/surveyRoutes.js";
import solverRoutes from "./routes/solverRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import { ComputeEngine } from "@cortex-js/compute-engine";
import teamRoutes from "./routes/teamRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import schoolclassRoutes from "./routes/schoolclassRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
app.set('trust proxy', 1);
app.use(express.json({ limit: "5mb" }));
app.use(cors());
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? 'https://satim-questionnaire-9y9s.onrender.com'
        : 'http://localhost:5173',
    credentials: true,
}));
app.use('/api/users', userRoutes);
app.use('/api/editor', editorRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/solver', solverRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/schoolclass', schoolclassRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
});
export const ce = new ComputeEngine();
