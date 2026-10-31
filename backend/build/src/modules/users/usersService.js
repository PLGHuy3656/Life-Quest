import { usersRepository } from "./usersRepository.js";
import bcrypt from 'bcrypt';
import ApiError from "../../common/errors/ApiError.js";

// Lấy 1 User bằng Email
const getUserByEmail = async email => {
  const user = await usersRepository.findUserByEmail(email);
  return user;
};

// Tạo 1 User
const createUser = async userData => {
  // Function này tìm xem User đã tồn tại email và username chưa nếu rồi thì không cho tạo mới
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
  const user = await usersRepository.createUser({
    email: userData.email,
    username: userData.username,
    passwordHash
  });

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