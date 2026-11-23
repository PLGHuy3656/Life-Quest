import express from 'express';
import { challengesController } from "./challengesController.js";
import { challengesValidation } from "./challengesValidation.js";
import validate from "../../common/middleware/validate.js";
import { authenticate, authenticateOptional } from "../../common/middleware/authenticate.js";
const Router = express.Router();

// GET /api/v1/challenges (Optional auth để lấy isJoined, myProgress nếu đã đăng nhập)
Router.get('/', authenticateOptional, validate(challengesValidation.getChallenges), challengesController.getChallenges);

// POST /api/v1/challenges
Router.post('/', authenticate, validate(challengesValidation.createChallenge), challengesController.createChallenge);

// POST /api/v1/challenges/:id/join
Router.post('/:id/join', authenticate, validate(challengesValidation.challengeIdParam), challengesController.joinChallenge);

// GET /api/v1/challenges/:id/leaderboard (Optional auth)
Router.get('/:id/leaderboard', authenticateOptional, validate(challengesValidation.challengeIdParam), challengesController.getLeaderboard);
export const challengesRoute = Router;
export default challengesRoute;