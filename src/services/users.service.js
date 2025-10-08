import { db } from '#config/database.js';
import logger from '#config/logger.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

const userSelection = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  createdAt: users.created_at,
  updatedAt: users.updated_at,
};

export const getAllUsers = async () => {
  try {
    return await db.select(userSelection).from(users);
  } catch (error) {
    logger.error('Error getting users', error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const [user] = await db
      .select(userSelection)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  } catch (error) {
    logger.error(`Error getting user with id ${id}`, error);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const user = await getUserById(id);

    if (!user) {
      throw new Error('User not found');
    }

    const updatePayload = { ...updates, updated_at: new Date() };

    const [updatedUser] = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, id))
      .returning(userSelection);

    return updatedUser;
  } catch (error) {
    logger.error(`Error updating user with id ${id}`, error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning(userSelection);

    if (!deletedUser) {
      throw new Error('User not found');
    }

    return deletedUser;
  } catch (error) {
    logger.error(`Error deleting user with id ${id}`, error);
    throw error;
  }
};
