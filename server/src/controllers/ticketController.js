const Ticket = require('../models/Ticket');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createNotification } = require('../services/notificationService');
const { ROLES } = require('../config/roles');

const generateTicketId = async () => {
  const count = await Ticket.countDocuments();
  return `TKT${String(count + 1).padStart(5, '0')}`;
};

const createTicket = asyncHandler(async (req, res) => {
  const ticketId = await generateTicketId();
  const ticket = await Ticket.create({
    ...req.body,
    ticketId,
    raisedBy: req.user._id,
    organization: req.user.organization,
  });

  const populated = await Ticket.findById(ticket._id)
    .populate('raisedBy', 'email role')
    .populate('assignedTo', 'email role');

  res.status(201).json({ success: true, message: 'Ticket created', data: populated });
});

const getTickets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    filter.organization = req.user.organization;
  }

  const adminRoles = [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.IT_ADMIN];
  if (!adminRoles.includes(req.user.role)) {
    filter.$or = [{ raisedBy: req.user._id }, { assignedTo: req.user._id }];
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.priority) filter.priority = req.query.priority;

  const tickets = await Ticket.find(filter)
    .populate('raisedBy', 'email role')
    .populate('assignedTo', 'email role')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: tickets });
});

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('raisedBy', 'email role')
    .populate('assignedTo', 'email role')
    .populate('comments.user', 'email role');
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  res.json({ success: true, data: ticket });
});

const updateTicket = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.status === 'Resolved' || updates.status === 'Closed') {
    updates.resolvedAt = new Date();
  }

  const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('raisedBy', 'email role')
    .populate('assignedTo', 'email role');

  if (!ticket) throw new ApiError(404, 'Ticket not found');
  res.json({ success: true, message: 'Ticket updated', data: ticket });
});

const assignTicket = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  if (!assignedTo) throw new ApiError(400, 'assignedTo is required');

  const ticket = await Ticket.findByIdAndUpdate(
    req.params.id,
    { assignedTo, status: 'In Progress' },
    { new: true }
  )
    .populate('raisedBy', 'email role')
    .populate('assignedTo', 'email role');

  if (!ticket) throw new ApiError(404, 'Ticket not found');

  await createNotification({
    userId: assignedTo,
    title: 'Ticket assigned',
    message: `Ticket ${ticket.ticketId} has been assigned to you.`,
    type: 'ticket',
    link: `/tickets/${ticket._id}`,
    io: req.app.get('io'),
  });

  res.json({ success: true, message: 'Ticket assigned', data: ticket });
});

const addComment = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  if (!req.body.text) throw new ApiError(400, 'Comment text is required');

  ticket.comments.push({ user: req.user._id, text: req.body.text });
  await ticket.save();

  const populated = await Ticket.findById(ticket._id).populate('comments.user', 'email role');
  res.json({ success: true, message: 'Comment added', data: populated });
});

const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  res.json({ success: true, message: 'Ticket deleted' });
});

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  assignTicket,
  addComment,
  deleteTicket,
};
