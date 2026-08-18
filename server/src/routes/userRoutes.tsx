import express from 'express';
import {getUserById, loginUser, registerUser, searchUsers} from "../controllers/userController.js";

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/get', getUserById)
router.get('/search', searchUsers);

export default router;
