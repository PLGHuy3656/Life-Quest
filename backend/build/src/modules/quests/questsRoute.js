import express from 'express';
import { questsController } from "./questsController.js";
import { questsValidation } from "./questsValidation.js";
import validate from "../../common/middleware/validate.js";
const Router = express.Router();

// /quests
Router.route('/').get(validate(questsValidation.getQuestsByUserId), questsController.getQuestsByUserId).post(validate(questsValidation.createQuest), questsController.createQuest);

//   /quests/:questId
Router.route('/:questId').get(validate(questsValidation.getQuestById), questsController.getQuestById).patch(validate(questsValidation.updateQuest), questsController.updateQuest).delete(validate(questsValidation.deleteQuest), questsController.deleteQuest);

//   /quests/:questId/pin
Router.route('/:questId/pin').post(validate(questsValidation.pinQuest), questsController.pinQuest).delete(validate(questsValidation.unpinQuest), questsController.unpinQuest);

//   /quests/:questId/archive
Router.post('/:questId/archive', validate(questsValidation.archiveQuest), questsController.archiveQuest);

//   /quests/:questId/restore
Router.post('/:questId/restore', validate(questsValidation.restoreQuest), questsController.restoreQuest);
export const questsRoute = Router;