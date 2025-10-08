import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger.error(`Error hashing password: ${error}`);
    throw new Error('Error hashing password');
  }
};

export const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error(`Error comparing password: ${error}`);
    throw new Error('Error comparing passwords');
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({ email, name, password: passwordHash, role })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.created_at
      });

    logger.info(`User ${newUser.email} created successfully`);

    return newUser;
  } catch (error) {
    logger.error(`Error creating the user: ${error}`);
    throw error;
  }
};

export const authenticateUser = async (email, password) => {
  try {
    const [userRecord] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.password,
        role: users.role,
        createdAt: users.created_at
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!userRecord) {
      throw new Error('Invalid email or password');
    }

    const passwordMatches = await comparePassword(password, userRecord.passwordHash);

    if (!passwordMatches) {
      throw new Error('Invalid email or password');
    }

    const { passwordHash, ...user } = userRecord;

    return user;
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      logger.warn(`Authentication failed for ${email}: ${error.message}`);
      throw error;
    }

    logger.error(`Error authenticating user: ${error}`);
    throw error;
  }
};
