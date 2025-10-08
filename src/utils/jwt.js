import logger from '#config/logger.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-please-change-in-production';
const JWT_EXPIRES_IN = '1d';

export const jwttoken = {
  sign: (payload, options = {}) => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, ...options });
    } catch (error) {
      logger.error('Failed to sign token', error);
      throw new Error('Failed to sign token');
    }
  },
  verify: (token, options = {}) => {
    try {
      return jwt.verify(token, JWT_SECRET, options);
    } catch (error) {
      logger.error('Failed to verify token', error);
      throw new Error('Failed to verify token');
    }
  }
};
