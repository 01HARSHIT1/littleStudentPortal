const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) return null;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const tx = getTransporter();
  if (!tx || !to) {
    return { sent: false, reason: 'Email not configured' };
  }

  try {
    await tx.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { sent: false, reason: err.message };
  }
};

const createNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  link,
  email,
  io,
}) => {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    link,
  });

  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }

  if (email) {
    await sendEmail({
      to: email,
      subject: title,
      text: message,
      html: `<p>${message}</p>${link ? `<p><a href="${link}">View details</a></p>` : ''}`,
    });
  }

  return notification;
};

module.exports = {
  createNotification,
  sendEmail,
};
