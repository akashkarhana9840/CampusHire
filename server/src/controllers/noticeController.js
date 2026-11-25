const Notice = require('../models/Notice');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * @desc    Get all campus placement notices (sorted newest first)
 * @route   GET /api/notices
 * @access  Protected (All authenticated roles: student, recruiter, officer)
 */
const getNotices = async (req, res, next) => {
  try {
    const notices = await Notice.find()
      .populate('postedBy', 'name email role')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Notices retrieved successfully', notices);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Publish a new campus notice
 * @route   POST /api/notices
 * @access  Protected (Officer only)
 */
const createNotice = async (req, res, next) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return sendError(res, 'Both title and message are required', 400);
    }

    const notice = await Notice.create({
      title: title.trim(),
      message: message.trim(),
      postedBy: req.user._id,
    });

    const populated = await Notice.findById(notice._id).populate('postedBy', 'name email role');
    return sendSuccess(res, 'Notice published successfully', populated, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a notice
 * @route   DELETE /api/notices/:id
 * @access  Protected (Officer only)
 */
const deleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notice = await Notice.findById(id);
    if (!notice) {
      return sendError(res, 'Notice not found', 404);
    }

    await Notice.findByIdAndDelete(id);
    return sendSuccess(res, 'Notice deleted successfully', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotices,
  createNotice,
  deleteNotice,
};

