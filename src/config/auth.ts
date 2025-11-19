import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';


dotenv.config();


interface JwtPayload {
  userId: string;
  clientId: string;
}


export const generateToken = (userId: string, clientId: string): string => {
  const payload: JwtPayload = { userId, clientId };
  const secret = process.env.JWT_SECRET || '';


  const options: SignOptions = {
    expiresIn: 604800, // 7 días en segundos
  };


  return jwt.sign(payload, secret as jwt.Secret, options);
};


export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
  } catch (error) {
    return null;
  }
};


export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};


export const comparePasswords = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};