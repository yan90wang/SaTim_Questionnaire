import express from 'express';
import {authenticateToken} from "../auth/authenticate.js";
import {addTeamMember, getTeamInfos} from "../controllers/teamController.js";

const router = express.Router();

router.use(authenticateToken);

router.post('/info', getTeamInfos);
router.post('/addmember', addTeamMember);


export default router;
