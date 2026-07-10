let OpenAI;
try {
  OpenAI = require('openai');
} catch {
  OpenAI = null;
}

const hasApiKey = () => Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());

const getClient = () => {
  if (!hasApiKey() || !OpenAI) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const mockChat = (message, context = {}) => {
  const role = context.role || 'EMPLOYEE';
  return {
    reply: `I'm GPro Assistant (offline mode). As a ${role}, you asked: "${message}". Connect OPENAI_API_KEY for live AI responses. Meanwhile, check Attendance, Leave, Payroll, and Projects from your dashboard.`,
    source: 'mock',
  };
};

const mockAnalyzeResume = (text, requiredSkills = []) => {
  const lower = (text || '').toLowerCase();
  const matched = requiredSkills.filter((s) => lower.includes(String(s).toLowerCase()));
  const matchScore = requiredSkills.length
    ? Math.round((matched.length / requiredSkills.length) * 100)
    : 65;

  return {
    summary: 'Candidate shows relevant experience based on keyword matching (mock analysis).',
    matchScore,
    strengths: matched.length ? matched : ['Communication', 'Team collaboration'],
    gaps: requiredSkills.filter((s) => !matched.includes(s)),
    recommendation: matchScore >= 70 ? 'Proceed to screening' : 'Needs further review',
    source: 'mock',
  };
};

const mockSummarize = (text) => ({
  summary: `Summary (mock): ${(text || '').slice(0, 200)}${(text || '').length > 200 ? '...' : ''}`,
  keyPoints: ['Document received', 'Offline AI mode active', 'Add OPENAI_API_KEY for full analysis'],
  source: 'mock',
});

const mockExplainPayroll = (payroll = {}) => {
  const c = payroll.components || {};
  return {
    explanation: `Net salary is ${payroll.netSalary || 0}. Basic ${c.basic || 0} + HRA ${c.hra || 0} + overtime ${c.overtime || 0} + bonus ${c.bonus || 0} minus PF ${c.pf || 0}, tax ${c.tax || 0}, and other deductions ${c.deductions || 0}.`,
    source: 'mock',
  };
};

const mockAttendanceInsights = (records = []) => {
  const present = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  const total = records.length || 1;
  return {
    insights: [
      `Attendance rate: ${Math.round((present / total) * 100)}% over ${records.length} records.`,
      'Consider reviewing late arrivals and overtime patterns.',
      'Offline AI mode — connect OPENAI_API_KEY for deeper insights.',
    ],
    source: 'mock',
  };
};

const chat = async (message, context = {}) => {
  const client = getClient();
  if (!client) return mockChat(message, context);

  try {
    const system = `You are GPro, an enterprise workforce management assistant. User role: ${context.role || 'EMPLOYEE'}. Organization context: ${JSON.stringify(context.org || {})}. Be concise and helpful about HR, attendance, leave, payroll, projects, and tickets.`;
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: message },
      ],
      max_tokens: 500,
    });
    return {
      reply: completion.choices[0]?.message?.content || mockChat(message, context).reply,
      source: 'openai',
    };
  } catch (err) {
    console.error('OpenAI chat error:', err.message);
    return mockChat(message, context);
  }
};

const analyzeResume = async (text, requiredSkills = []) => {
  const client = getClient();
  if (!client) return mockAnalyzeResume(text, requiredSkills);

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Analyze the resume against required skills. Respond ONLY with valid JSON: {summary, matchScore (0-100), strengths[], gaps[], recommendation}',
        },
        {
          role: 'user',
          content: `Required skills: ${requiredSkills.join(', ')}\n\nResume:\n${text}`,
        },
      ],
      max_tokens: 600,
    });
    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return { ...parsed, source: 'openai' };
  } catch (err) {
    console.error('OpenAI resume error:', err.message);
    return mockAnalyzeResume(text, requiredSkills);
  }
};

const summarizeDocument = async (text) => {
  const client = getClient();
  if (!client) return mockSummarize(text);

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Summarize the document. Respond ONLY with JSON: {summary, keyPoints[]}',
        },
        { role: 'user', content: text },
      ],
      max_tokens: 400,
    });
    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return { ...parsed, source: 'openai' };
  } catch (err) {
    console.error('OpenAI summarize error:', err.message);
    return mockSummarize(text);
  }
};

const explainPayroll = async (payroll) => {
  const client = getClient();
  if (!client) return mockExplainPayroll(payroll);

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Explain this payroll breakdown simply for an employee. Respond with JSON: {explanation}',
        },
        { role: 'user', content: JSON.stringify(payroll) },
      ],
      max_tokens: 300,
    });
    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return { ...parsed, source: 'openai' };
  } catch (err) {
    console.error('OpenAI payroll error:', err.message);
    return mockExplainPayroll(payroll);
  }
};

const attendanceInsights = async (records) => {
  const client = getClient();
  if (!client) return mockAttendanceInsights(records);

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Analyze attendance records. Respond with JSON: {insights: string[]}',
        },
        { role: 'user', content: JSON.stringify(records.slice(0, 60)) },
      ],
      max_tokens: 400,
    });
    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return { ...parsed, source: 'openai' };
  } catch (err) {
    console.error('OpenAI attendance error:', err.message);
    return mockAttendanceInsights(records);
  }
};

module.exports = {
  chat,
  analyzeResume,
  summarizeDocument,
  explainPayroll,
  attendanceInsights,
};
