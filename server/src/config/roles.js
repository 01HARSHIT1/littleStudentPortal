const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  MANAGER: 'MANAGER',
  TEAM_LEAD: 'TEAM_LEAD',
  EMPLOYEE: 'EMPLOYEE',
  FINANCE: 'FINANCE',
  IT_ADMIN: 'IT_ADMIN',
  AUDITOR: 'AUDITOR',
};

const ALL_ROLES = Object.values(ROLES);

const PERMISSIONS = {
  // Organization
  'org:read': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.AUDITOR],
  'org:write': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN],

  // Departments & designations
  'department:read': ALL_ROLES,
  'department:write': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER],
  'designation:read': ALL_ROLES,
  'designation:write': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER],

  // Employees
  'employee:read': ALL_ROLES,
  'employee:write': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER],
  'employee:self': ALL_ROLES,

  // Recruitment
  'recruitment:read': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.AUDITOR],
  'recruitment:write': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER],

  // Attendance
  'attendance:read': ALL_ROLES,
  'attendance:write': ALL_ROLES,
  'attendance:manage': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.TEAM_LEAD],

  // Leave
  'leave:read': ALL_ROLES,
  'leave:write': ALL_ROLES,
  'leave:approve': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.TEAM_LEAD],

  // Payroll
  'payroll:read': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER, ROLES.FINANCE, ROLES.EMPLOYEE, ROLES.AUDITOR],
  'payroll:write': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.FINANCE, ROLES.HR_MANAGER],

  // Performance
  'performance:read': ALL_ROLES,
  'performance:write': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.TEAM_LEAD, ROLES.EMPLOYEE],

  // Projects & tasks
  'project:read': ALL_ROLES,
  'project:write': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD],
  'task:read': ALL_ROLES,
  'task:write': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.TEAM_LEAD, ROLES.EMPLOYEE],

  // Assets
  'asset:read': ALL_ROLES,
  'asset:write': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.IT_ADMIN, ROLES.HR_MANAGER],

  // Tickets
  'ticket:read': ALL_ROLES,
  'ticket:write': ALL_ROLES,
  'ticket:assign': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.IT_ADMIN],

  // Documents
  'document:read': ALL_ROLES,
  'document:write': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.IT_ADMIN],

  // Notifications
  'notification:read': ALL_ROLES,

  // Reports & AI
  'report:read': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER, ROLES.MANAGER, ROLES.FINANCE, ROLES.AUDITOR, ROLES.IT_ADMIN],
  'ai:use': ALL_ROLES,

  // Audit
  'audit:read': [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.AUDITOR],
};

const hasPermission = (role, permission) => {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
};

module.exports = {
  ROLES,
  ALL_ROLES,
  PERMISSIONS,
  hasPermission,
};
