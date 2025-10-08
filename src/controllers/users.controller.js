import logger from "#config/logger.js";
import {
  deleteUser as deleteUserService,
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
} from "#services/users.service.js";
import {
  updateUserSchema,
  userIdSchema,
} from "#validations/users.validation.js";
import { formatValidationError } from "#utils/format.js";

export const fetchAllusers = async (req, res, next) => {
  try {
    logger.info("Getting users ...");

    const allUsers = await getAllUsers();

    res.json({
      message: "Successfully retrieved users",
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      const details = formatValidationError(validationResult.error);
      logger.warn("Invalid user id provided", { id: req.params.id, details });
      return res.status(400).json({
        error: "Validation failed",
        details,
      });
    }

    const { id } = validationResult.data;

    const user = await getUserByIdService(id);

    if (!user) {
      logger.warn("User not found", { id });
      return res.status(404).json({ error: "User not found" });
    }

    logger.info("User retrieved successfully", { id });

    return res.status(200).json({
      message: "Successfully retrieved user",
      user,
    });
  } catch (error) {
    logger.error("Error fetching user by id", error);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const idValidationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!idValidationResult.success) {
      const details = formatValidationError(idValidationResult.error);
      logger.warn("Invalid user id provided for update", {
        id: req.params.id,
        details,
      });
      return res.status(400).json({
        error: "Validation failed",
        details,
      });
    }

    const bodyValidationResult = updateUserSchema.safeParse(req.body);

    if (!bodyValidationResult.success) {
      const details = formatValidationError(bodyValidationResult.error);
      logger.warn("Invalid payload supplied for user update", {
        id: req.params.id,
        details,
      });
      return res.status(400).json({
        error: "Validation failed",
        details,
      });
    }

    const { id } = idValidationResult.data;
    const updates = Object.fromEntries(
      Object.entries(bodyValidationResult.data).filter(
        ([, value]) => value !== undefined
      )
    );

    const requester = req.user;

    if (!requester) {
      logger.warn("Unauthenticated user attempted to update account", { id });
      return res.status(401).json({ error: "Authentication required" });
    }

    const requesterId = Number(requester.id);
    const isAdmin = requester.role === "admin";
    const isSelf = requesterId === id;

    if (!isAdmin && !isSelf) {
      logger.warn("User attempted to update another user's account", {
        id,
        requesterId,
      });
      return res.status(403).json({
        error: "You do not have permission to update this user",
      });
    }

    if (updates.role && !isAdmin) {
      logger.warn("Non-admin attempted to update user role", {
        id,
        requesterId,
      });
      return res.status(403).json({
        error: "Only administrators can update user roles",
      });
    }

    const user = await updateUserService(id, updates);

    logger.info("User updated successfully", { id, updatedBy: requesterId });

    return res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    if (error.message === "User not found") {
      logger.warn("Attempted to update non-existent user", {
        id: req.params.id,
      });
      return res.status(404).json({ error: "User not found" });
    }

    logger.error("Error updating user", error);
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      const details = formatValidationError(validationResult.error);
      logger.warn("Invalid user id provided for delete", {
        id: req.params.id,
        details,
      });
      return res.status(400).json({
        error: "Validation failed",
        details,
      });
    }

    const { id } = validationResult.data;

    const requester = req.user;

    if (!requester) {
      logger.warn("Unauthenticated user attempted to delete account", { id });
      return res.status(401).json({ error: "Authentication required" });
    }

    const requesterId = Number(requester.id);
    const isAdmin = requester.role === "admin";
    const isSelf = requesterId === id;

    if (!isAdmin && !isSelf) {
      logger.warn("User attempted to delete another user's account", {
        id,
        requesterId,
      });
      return res.status(403).json({
        error: "You do not have permission to delete this user",
      });
    }

    await deleteUserService(id);

    logger.info("User deleted successfully", { id, deletedBy: requesterId });

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    if (error.message === "User not found") {
      logger.warn("Attempted to delete non-existent user", {
        id: req.params.id,
      });
      return res.status(404).json({ error: "User not found" });
    }

    logger.error("Error deleting user", error);
    next(error);
  }
};
