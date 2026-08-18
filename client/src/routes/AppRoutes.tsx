import {BrowserRouter, Route, Routes} from 'react-router-dom';
import DashboardPage from "../pages/survey/DashboardPage.tsx";
import NotFoundPage from "../pages/NotFoundPage.tsx";
import LandingPage from '../pages/LandingPage.tsx';
import AnswerEditorPage from "../pages/editor/AnswerEditorPage.tsx";
import EditorPage from "../pages/editor/QuestionEditorPage.tsx";
import AnswerPreviewPage from "../pages/editor/AnswerPreviewPage.tsx";
import QuestionsTablePage from "../pages/QuestionsTablePage.tsx";
import ProfilePage from "../pages/ProfilePage.tsx";
import MetaDataPage from "../pages/editor/MetaDataPage.tsx";
import SurveyUpdatePage from "../pages/survey/SurveyUpdatePage.tsx";
import SurveyInstancePage from "../pages/survey/SurveyInstancePage.tsx";
import QuizPage from "../pages/quiz/QuizPage.tsx";
import TeamPage from '../pages/TeamPage.tsx';
import LoggedInRoute from './LoggedInRoute.tsx';
import NoTeamPage from '../pages/NoTeamPage.tsx';
import TeacherPage from "../pages/TeacherPage.tsx";
import TeacherRegistrationPage from "../pages/teacher/TeacherRegistrationPage.tsx";
import ClassOverviewPage from "../pages/teacher/ClassOverviewPage.tsx";
import ClassPage from "../pages/teacher/ClassPage.tsx";
import StudentRegistrationPage from "../pages/sus/StudentRegistrationPage.tsx";
import StudentDashboardPage from "../pages/sus/StudentDashboardPage.tsx";
import TeacherProfilePage from "../pages/teacher/TeacherProfilePage.tsx";
import TestDashboardPage from "../pages/teacher/TestDashboardPage.tsx";
import StudentProfilePage from "../pages/sus/StudentProfilePage.tsx";

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />

                {/* PUBLIC */}
                <Route path="/quiz/:id" element={<QuizPage />} />
                <Route path="/table" element={<QuestionsTablePage />} />
                <Route path="/noTeam" element={<NoTeamPage />} />
                <Route path="/teacher/register/:userId" element={<TeacherRegistrationPage />} />
                <Route path="/student/register/:registrationToken" element={<StudentRegistrationPage />} />

                {/* TEACHER TODO ADD AUTH*/}
                <Route path="/teacher/classes" element={<ClassOverviewPage />} />
                <Route path="/teacher/class/:id" element={<ClassPage/>} />
                <Route path="/teacher/testboard" element={<TestDashboardPage/>} />
                <Route path="/teacher/classes/:teacherId" element={<LoggedInRoute><ClassOverviewPage /></LoggedInRoute>}/>
                <Route path="/teacher/profile" element={<TeacherProfilePage />} />

                {/* STUDENT TODO ADD AUTH */}
                <Route path="/student/tests" element={<StudentDashboardPage />} />
                <Route path="/student/profile" element={<StudentProfilePage />} />

                {/* PROTECTED */}
                <Route path="/dashboard" element={<LoggedInRoute><DashboardPage /></LoggedInRoute>} />
                <Route path="/survey/:id" element={<LoggedInRoute><SurveyUpdatePage /></LoggedInRoute>} />
                <Route path="/survey/details/:id" element={<LoggedInRoute><SurveyInstancePage /></LoggedInRoute>} />
                <Route path="/meta/:id?" element={<LoggedInRoute><MetaDataPage /></LoggedInRoute>} />
                <Route path="/editor/:id" element={<LoggedInRoute><EditorPage /></LoggedInRoute>} />
                <Route path="/answers/:id" element={<LoggedInRoute><AnswerEditorPage /></LoggedInRoute>} />
                <Route path="/preview/:id" element={<LoggedInRoute><AnswerPreviewPage /></LoggedInRoute>} />

                <Route path="/profile" element={<LoggedInRoute><ProfilePage /></LoggedInRoute>} />
                <Route path="/team" element={<LoggedInRoute><TeamPage /></LoggedInRoute>} />
                <Route path="/teachers" element={<LoggedInRoute><TeacherPage /></LoggedInRoute>} />

                {/* PUBLIC */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
