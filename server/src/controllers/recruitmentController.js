const Candidate = require('../models/Candidate');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const aiService = require('../services/aiService');
const { ROLES } = require('../config/roles');

const orgFilter = (user) => {
  if (user.role === ROLES.SUPER_ADMIN) return {};
  return { organization: user.organization };
};

const createCandidate = asyncHandler(async (req, res) => {
  const organization = req.body.organization || req.user.organization;
  if (!organization) throw new ApiError(400, 'Organization is required');

  const candidate = await Candidate.create({ ...req.body, organization });
  res.status(201).json({ success: true, message: 'Candidate created', data: candidate });
});

const getCandidates = asyncHandler(async (req, res) => {
  const filter = { ...orgFilter(req.user) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const s = req.query.search;
    filter.$or = [
      { name: new RegExp(s, 'i') },
      { email: new RegExp(s, 'i') },
      { skills: new RegExp(s, 'i') },
    ];
  }

  const candidates = await Candidate.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: candidates });
});

const getCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne({ _id: req.params.id, ...orgFilter(req.user) })
    .populate('interviews.interviewer', 'employeeId personal');
  if (!candidate) throw new ApiError(404, 'Candidate not found');
  res.json({ success: true, data: candidate });
});

const updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter(req.user) },
    req.body,
    { new: true, runValidators: true }
  );
  if (!candidate) throw new ApiError(404, 'Candidate not found');
  res.json({ success: true, message: 'Candidate updated', data: candidate });
});

const deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOneAndDelete({
    _id: req.params.id,
    ...orgFilter(req.user),
  });
  if (!candidate) throw new ApiError(404, 'Candidate not found');
  res.json({ success: true, message: 'Candidate deleted' });
});

const addInterview = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne({ _id: req.params.id, ...orgFilter(req.user) });
  if (!candidate) throw new ApiError(404, 'Candidate not found');

  candidate.interviews.push(req.body);
  await candidate.save();

  res.status(201).json({ success: true, message: 'Interview added', data: candidate });
});

const analyzeCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findOne({ _id: req.params.id, ...orgFilter(req.user) });
  if (!candidate) throw new ApiError(404, 'Candidate not found');

  const text =
    req.body.resumeText ||
    `${candidate.name}. Skills: ${(candidate.skills || []).join(', ')}. Experience: ${candidate.experience} years. Applied for: ${candidate.appliedFor || 'N/A'}`;

  const requiredSkills = req.body.requiredSkills || candidate.skills || [];
  const analysis = await aiService.analyzeResume(text, requiredSkills);

  candidate.aiAnalysis = {
    summary: analysis.summary,
    matchScore: analysis.matchScore,
    strengths: analysis.strengths,
    gaps: analysis.gaps,
    recommendation: analysis.recommendation,
    analyzedAt: new Date(),
  };
  await candidate.save();

  res.json({ success: true, message: 'Resume analyzed', data: candidate });
});

module.exports = {
  createCandidate,
  getCandidates,
  getCandidate,
  updateCandidate,
  deleteCandidate,
  addInterview,
  analyzeCandidate,
};
