import express from 'express';
import { duosController } from "./duosController.js";
import { duosValidation } from "./duosValidation.js";
import validate from "../../common/middleware/validate.js";
import authenticate from "../../common/middleware/authenticate.js";
const Router = express.Router();

// Tất cả các route Duos đều yêu cầu đăng nhập
Router.use(authenticate);

// POST /api/v1/duos/invite
Router.post('/invite', validate(duosValidation.inviteDuo), duosController.inviteDuo);

// POST /api/v1/duos/:id/accept
Router.post('/:id/accept', validate(duosValidation.duoIdParam), duosController.acceptDuo);

// POST /api/v1/duos/:id/reject
Router.post('/:id/reject', validate(duosValidation.duoIdParam), duosController.rejectDuo);

// GET /api/v1/duos/active
Router.get('/active', validate(duosValidation.getActiveDuos), duosController.getActiveDuos);
export const duosRoute = Router;
export default duosRoute;