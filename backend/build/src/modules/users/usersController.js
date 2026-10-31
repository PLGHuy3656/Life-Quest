import { StatusCodes } from 'http-status-codes';
import { usersService } from "./usersService.js";
const getUserByEmail = async (req, res, next) => {
  try {
    const email = req.params.email;
    const user = await usersService.getUserByEmail(email);
    res.status(StatusCodes.OK).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Tạo 1 User
const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const user = await usersService.createUser(userData);
    const responseData = {
      success: true,
      data: user
    };
    return res.status(StatusCodes.CREATED).json(responseData);
  } catch (error) {
    next(error);
  }
};
export const usersController = {
  getUserByEmail,
  createUser
};