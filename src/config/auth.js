import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

export const generateToken = (userId, clientId) => {
  const payload = { userId, clientId };
  const secret = process.env.JWT_SECRET || '';

  const options = {
    expiresIn: 604800, // 7 días en segundos
  };

  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

export const comparePasswords = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
