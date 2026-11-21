import { usersRepository } from "./usersRepository.js";
import bcrypt from 'bcrypt';
import ApiError from "../../common/errors/ApiError.js";

// Lấy 1 User bằng Email
const getUserByEmail = async email => {
  const user = await usersRepository.findUserByEmail(email);
  if (!user) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  // Xử lý gửi dữ liệu từ BE lên cho FE
  const responseUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  return responseUser;
};

// Tạo 1 User
const createUser = async userData => {
  // Kiểm tra email hoặc username đã tồn tại
  const existingUser = await usersRepository.findExistingUser(userData.email, userData.username);
  if (existingUser) {
    if (existingUser.email === userData.email) {
      throw new ApiError(409, 'Email already exists', 'EMAIL_ALREADY_EXISTS');
    }
    if (existingUser.username === userData.username) {
      throw new ApiError(409, 'Username already exists', 'USERNAME_ALREADY_EXISTS');
    }
  }
  const passwordHash = await bcrypt.hash(userData.password, 10);
  let user;
  try {
    user = await usersRepository.createUser({
      email: userData.email,
      username: userData.username,
      passwordHash
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const duplicatedField = error.meta?.target;
      if (duplicatedField?.includes('email')) {
        throw new ApiError(409, 'Email already exists', 'EMAIL_ALREADY_EXISTS');
      }
      if (duplicatedField?.includes('username')) {
        throw new ApiError(409, 'Username already exists', 'USERNAME_ALREADY_EXISTS');
      }
    }
    throw error;
  }

  // Xử lý gửi dữ liệu từ BE lên cho FE
  const responseUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  return responseUser;
};
export const usersService = {
  getUserByEmail,
  createUser
};