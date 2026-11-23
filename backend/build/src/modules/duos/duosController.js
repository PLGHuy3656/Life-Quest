import { StatusCodes } from 'http-status-codes';
import { duosService } from "./duosService.js";
import { getCurrentUserId } from "../../common/utils/getCurrentUserId.js";
const inviteDuo = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);
    const data = await duosService.inviteDuo(userId, req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
const acceptDuo = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);
    const {
      id
    } = req.params;
    const data = await duosService.acceptDuo(userId, id);
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
const rejectDuo = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);
    const {
      id
    } = req.params;
    const data = await duosService.rejectDuo(userId, id);
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
const getActiveDuos = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);
    const data = await duosService.getActiveDuos(userId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
export const duosController = {
  inviteDuo,
  acceptDuo,
  rejectDuo,
  getActiveDuos
};