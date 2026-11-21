import { StatusCodes } from 'http-status-codes';
import { mascotService } from "./mascotService.js";
import { getCurrentUserId } from "../../common/utils/getCurrentUserId.js";
const getModels = async (req, res, next) => {
  try {
    const models = await mascotService.getModels();
    return res.status(StatusCodes.OK).json({
      success: true,
      data: models
    });
  } catch (error) {
    next(error);
  }
};
const getMascotState = async (req, res, next) => {
  try {
    const modelCode = req.query.modelCode || 'FOX_V2';
    const placement = req.query.placement || 'DASHBOARD';
    const userId = getCurrentUserId(req, true); // optional userId

    const state = await mascotService.getMascotState(modelCode, placement, userId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: state
    });
  } catch (error) {
    next(error);
  }
};
const getCosmetics = async (req, res, next) => {
  try {
    const modelCode = req.query.modelCode || 'FOX_V2';
    const userId = getCurrentUserId(req, true); // optional userId

    const cosmetics = await mascotService.getCosmetics(modelCode, userId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data: cosmetics
    });
  } catch (error) {
    next(error);
  }
};
const equipCosmetic = async (req, res, next) => {
  try {
    const {
      cosmeticCode
    } = req.params;
    const userId = getCurrentUserId(req, false); // required userId

    const data = await mascotService.equipCosmetic(cosmeticCode, userId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
const unequipCosmetic = async (req, res, next) => {
  try {
    const {
      cosmeticCode
    } = req.params;
    const userId = getCurrentUserId(req, false); // required userId

    const data = await mascotService.unequipCosmetic(cosmeticCode, userId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
const triggerAction = async (req, res, next) => {
  try {
    const {
      actionCode
    } = req.params;
    const userId = getCurrentUserId(req, false); // required userId

    const data = await mascotService.triggerAction(actionCode, userId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
export const mascotController = {
  getModels,
  getMascotState,
  getCosmetics,
  equipCosmetic,
  unequipCosmetic,
  triggerAction
};