const Project = require('../models/Project');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/roles');

const orgFilter = (user) => {
  if (user.role === ROLES.SUPER_ADMIN) return {};
  return { organization: user.organization };
};

const createProject = asyncHandler(async (req, res) => {
  const project = await Project.create({
    ...req.body,
    organization: req.body.organization || req.user.organization,
  });
  const populated = await Project.findById(project._id)
    .populate('manager', 'employeeId personal')
    .populate('members', 'employeeId personal');
  res.status(201).json({ success: true, message: 'Project created', data: populated });
});

const getProjects = asyncHandler(async (req, res) => {
  const filter = { ...orgFilter(req.user) };
  if (req.query.status) filter.status = req.query.status;

  const projects = await Project.find(filter)
    .populate('manager', 'employeeId personal')
    .populate('members', 'employeeId personal')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: projects });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, ...orgFilter(req.user) })
    .populate('manager', 'employeeId personal')
    .populate('members', 'employeeId personal');
  if (!project) throw new ApiError(404, 'Project not found');

  const tasks = await Task.find({ project: project._id })
    .populate('assignedTo', 'employeeId personal')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { ...project.toObject(), tasks } });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter(req.user) },
    req.body,
    { new: true, runValidators: true }
  )
    .populate('manager', 'employeeId personal')
    .populate('members', 'employeeId personal');

  if (!project) throw new ApiError(404, 'Project not found');
  res.json({ success: true, message: 'Project updated', data: project });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOneAndDelete({
    _id: req.params.id,
    ...orgFilter(req.user),
  });
  if (!project) throw new ApiError(404, 'Project not found');
  await Task.deleteMany({ project: project._id });
  res.json({ success: true, message: 'Project deleted' });
});

const createTask = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.body.project || req.params.projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  const task = await Task.create({
    ...req.body,
    project: project._id,
    organization: project.organization,
    createdBy: req.user._id,
  });

  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'employeeId personal')
    .populate('project', 'name status');

  res.status(201).json({ success: true, message: 'Task created', data: populated });
});

const getTasks = asyncHandler(async (req, res) => {
  const filter = { ...orgFilter(req.user) };
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
  if (req.query.priority) filter.priority = req.query.priority;

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'employeeId personal')
    .populate('project', 'name status')
    .sort({ deadline: 1, createdAt: -1 });

  res.json({ success: true, data: tasks });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'employeeId personal')
    .populate('project', 'name status')
    .populate('comments.user', 'email role');
  if (!task) throw new ApiError(404, 'Task not found');
  res.json({ success: true, data: task });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('assignedTo', 'employeeId personal')
    .populate('project', 'name status');

  if (!task) throw new ApiError(404, 'Task not found');
  res.json({ success: true, message: 'Task updated', data: task });
});

const addTaskComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  if (!req.body.text) throw new ApiError(400, 'Comment text is required');

  task.comments.push({ user: req.user._id, text: req.body.text });
  await task.save();

  const populated = await Task.findById(task._id).populate('comments.user', 'email role');
  res.json({ success: true, message: 'Comment added', data: populated });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  res.json({ success: true, message: 'Task deleted' });
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  createTask,
  getTasks,
  getTask,
  updateTask,
  addTaskComment,
  deleteTask,
};
