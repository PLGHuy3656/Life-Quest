import { StatusCodes } from 'http-status-codes';
import { challengesService } from "./challengesService.js";
import { getCurrentUserId } from "../../common/utils/getCurrentUserId.js";
const getChallenges = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req, true); // optional
    const data = await challengesService.getChallenges(userId);
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
const createChallenge = async (req, res, next) => {
  try {
    const data = await challengesService.createChallenge(req.body);
    return res.status(StatusCodes.CREATED).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
const joinChallenge = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);
    const {
      id
    } = req.params;
    const data = await challengesService.joinChallenge(userId, id);
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
const getLeaderboard = async (req, res, next) => {
  try {
    const {
      id
    } = req.params;
    const data = await challengesService.getLeaderboard(id);
    return res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};
export const challengesController = {
  getChallenges,
  createChallenge,
  joinChallenge,
  getLeaderboard
};