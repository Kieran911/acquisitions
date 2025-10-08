import logger from "#config/logger.js"
import { getAllUsers } from "#services/users.services.js";

export const fetchAllusers = async (req, res, next) => {
    try {
        logger.info('Getting users ...');

        const allUsers = await getAllUsers();

        res.json({
           message: 'Successfully retrieved users',
           users: allUsers,
           count: allUsers.length,
        })
    } catch (e) {
        logger.error(e);
        next(e)
    }
}