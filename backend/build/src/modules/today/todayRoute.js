import express from 'express';
import { todayController } from "./todayController.js";
import { todayValidation } from "./todayValidation.js";
import validate from "../../common/middleware/validate.js";
import authenticate from "../../common/middleware/authenticate.js";
const Router = express.Router();

// /api/v1/today
Router.route('/').get(authenticate, validate(todayValidation.getToday), todayController.getToday);

// /api/v1/today/executions/:executionId/complete
Router.route('/executions/:executionId/complete').post(authenticate, validate(todayValidation.completeExecution), todayController.completeExecution);
export const todayRoute = Router;