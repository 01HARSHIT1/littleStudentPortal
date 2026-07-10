const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createNotification } = require('../services/notificationService');

const getNotifications = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.unread === 'true') filter.read = false;

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(parseInt(req.query.limit, 10) || 50);

  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

  res.json({ success: true, data: notifications, meta: { unreadCount } });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, message: 'Marked as read', data: notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: 'All notifications marked as read' });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, message: 'Notification deleted' });
});

const sendNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type, link, email } = req.body;
  if (!userId || !title || !message) {
    throw new ApiError(400, 'userId, title, and message are required');
  }

  const notification = await createNotification({
    userId,
    title,
    message,
    type,
    link,
    email,
    io: req.app.get('io'),
  });

  res.status(201).json({ success: true, message: 'Notification sent', data: notification });
});

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  sendNotification,
};
