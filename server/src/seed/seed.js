require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { ROLES } = require('../config/roles');

const User = require('../models/User');
const Organization = require('../models/Organization');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const Employee = require('../models/Employee');
const Candidate = require('../models/Candidate');
const LeaveBalance = require('../models/LeaveBalance');
const Holiday = require('../models/Holiday');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Performance = require('../models/Performance');
const Document = require('../models/Document');
const Notification = require('../models/Notification');
const Shift = require('../models/Shift');
const AuditLog = require('../models/AuditLog');

const PASSWORD = 'Secure@123';
const year = new Date().getFullYear();

const clearAll = async () => {
  await Promise.all([
    User.deleteMany({}),
    Organization.deleteMany({}),
    Department.deleteMany({}),
    Designation.deleteMany({}),
    Employee.deleteMany({}),
    Candidate.deleteMany({}),
    LeaveBalance.deleteMany({}),
    Holiday.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Asset.deleteMany({}),
    Ticket.deleteMany({}),
    Attendance.deleteMany({}),
    Leave.deleteMany({}),
    Payroll.deleteMany({}),
    Performance.deleteMany({}),
    Document.deleteMany({}),
    Notification.deleteMany({}),
    Shift.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('Cleared existing data');
};

const seed = async () => {
  await connectDB();
  await clearAll();

  const org = await Organization.create({
    name: 'Acme Corp',
    code: 'ACME',
    address: {
      street: '100 Innovation Drive',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      zip: '560001',
    },
    settings: {
      officeHours: { start: '09:00', end: '18:00' },
      leavePolicy: { casual: 12, sick: 10, earned: 15, unpaid: 0 },
      payrollSettings: {
        hraPercent: 20,
        pfPercent: 12,
        taxPercent: 10,
        overtimeRate: 1.5,
        workingHoursPerDay: 8,
      },
    },
  });

  const deptData = [
    { name: 'Engineering', code: 'ENG' },
    { name: 'HR', code: 'HR' },
    { name: 'Finance', code: 'FIN' },
    { name: 'IT', code: 'IT' },
    { name: 'Marketing', code: 'MKT' },
  ];

  const departments = {};
  for (const d of deptData) {
    departments[d.code] = await Department.create({
      ...d,
      organization: org._id,
      status: 'Active',
    });
  }

  const designations = {
    CTO: await Designation.create({
      title: 'CTO',
      level: 5,
      organization: org._id,
      department: departments.ENG._id,
    }),
    EngineeringManager: await Designation.create({
      title: 'Engineering Manager',
      level: 4,
      organization: org._id,
      department: departments.ENG._id,
    }),
    TeamLead: await Designation.create({
      title: 'Team Lead',
      level: 3,
      organization: org._id,
      department: departments.ENG._id,
    }),
    SoftwareEngineer: await Designation.create({
      title: 'Software Engineer',
      level: 2,
      organization: org._id,
      department: departments.ENG._id,
    }),
    HRManager: await Designation.create({
      title: 'HR Manager',
      level: 4,
      organization: org._id,
      department: departments.HR._id,
    }),
    FinanceManager: await Designation.create({
      title: 'Finance Manager',
      level: 4,
      organization: org._id,
      department: departments.FIN._id,
    }),
    ITAdmin: await Designation.create({
      title: 'IT Administrator',
      level: 3,
      organization: org._id,
      department: departments.IT._id,
    }),
    MarketingExec: await Designation.create({
      title: 'Marketing Executive',
      level: 2,
      organization: org._id,
      department: departments.MKT._id,
    }),
  };

  const createEmpUser = async ({
    email,
    role,
    firstName,
    lastName,
    employeeId,
    department,
    designation,
    basicSalary,
    manager,
    mobile,
  }) => {
    const employee = await Employee.create({
      employeeId,
      personal: {
        firstName,
        lastName,
        email,
        mobile: mobile || '9876543210',
        gender: 'Other',
        address: {
          street: 'Acme Campus',
          city: 'Bengaluru',
          state: 'Karnataka',
          country: 'India',
          zip: '560001',
        },
      },
      professional: {
        department,
        designation,
        joiningDate: new Date(`${year - 1}-01-15`),
        manager,
        employmentType: 'Full-time',
        salaryGrade: 'L2',
        basicSalary,
      },
      status: 'Active',
      organization: org._id,
    });

    const user = await User.create({
      email,
      password: PASSWORD,
      role,
      organization: role === ROLES.SUPER_ADMIN ? undefined : org._id,
      employee: employee._id,
      isActive: true,
    });

    employee.user = user._id;
    await employee.save();

    await LeaveBalance.create({
      employee: employee._id,
      year,
      organization: org._id,
      balances: { casual: 12, sick: 10, earned: 15, unpaid: 0 },
    });

    return { employee, user };
  };

  const superAdminUser = await User.create({
    email: 'superadmin@gpro.com',
    password: PASSWORD,
    role: ROLES.SUPER_ADMIN,
    isActive: true,
  });

  const admin = await createEmpUser({
    email: 'admin@acme.com',
    role: ROLES.ORG_ADMIN,
    firstName: 'Alice',
    lastName: 'Admin',
    employeeId: 'EMP0001',
    department: departments.ENG._id,
    designation: designations.CTO._id,
    basicSalary: 150000,
  });

  const hr = await createEmpUser({
    email: 'hr@acme.com',
    role: ROLES.HR_MANAGER,
    firstName: 'Helen',
    lastName: 'Reed',
    employeeId: 'EMP0002',
    department: departments.HR._id,
    designation: designations.HRManager._id,
    basicSalary: 90000,
  });

  const manager = await createEmpUser({
    email: 'manager@acme.com',
    role: ROLES.MANAGER,
    firstName: 'Mike',
    lastName: 'Chen',
    employeeId: 'EMP0003',
    department: departments.ENG._id,
    designation: designations.EngineeringManager._id,
    basicSalary: 120000,
    manager: admin.employee._id,
  });

  const lead = await createEmpUser({
    email: 'lead@acme.com',
    role: ROLES.TEAM_LEAD,
    firstName: 'Lisa',
    lastName: 'Park',
    employeeId: 'EMP0004',
    department: departments.ENG._id,
    designation: designations.TeamLead._id,
    basicSalary: 100000,
    manager: manager.employee._id,
  });

  const employee = await createEmpUser({
    email: 'employee@acme.com',
    role: ROLES.EMPLOYEE,
    firstName: 'Evan',
    lastName: 'Brooks',
    employeeId: 'EMP0005',
    department: departments.ENG._id,
    designation: designations.SoftwareEngineer._id,
    basicSalary: 70000,
    manager: lead.employee._id,
  });

  const finance = await createEmpUser({
    email: 'finance@acme.com',
    role: ROLES.FINANCE,
    firstName: 'Fiona',
    lastName: 'Shah',
    employeeId: 'EMP0006',
    department: departments.FIN._id,
    designation: designations.FinanceManager._id,
    basicSalary: 95000,
  });

  const itAdmin = await createEmpUser({
    email: 'it@acme.com',
    role: ROLES.IT_ADMIN,
    firstName: 'Ian',
    lastName: 'Torres',
    employeeId: 'EMP0007',
    department: departments.IT._id,
    designation: designations.ITAdmin._id,
    basicSalary: 85000,
  });

  const auditor = await createEmpUser({
    email: 'auditor@acme.com',
    role: ROLES.AUDITOR,
    firstName: 'Ava',
    lastName: 'Singh',
    employeeId: 'EMP0008',
    department: departments.FIN._id,
    designation: designations.FinanceManager._id,
    basicSalary: 88000,
  });

  departments.ENG.manager = manager.employee._id;
  departments.HR.manager = hr.employee._id;
  departments.FIN.manager = finance.employee._id;
  departments.IT.manager = itAdmin.employee._id;
  await Promise.all([
    departments.ENG.save(),
    departments.HR.save(),
    departments.FIN.save(),
    departments.IT.save(),
  ]);

  await Holiday.insertMany([
    {
      name: 'Republic Day',
      date: new Date(`${year}-01-26`),
      organization: org._id,
      type: 'National',
    },
    {
      name: 'Independence Day',
      date: new Date(`${year}-08-15`),
      organization: org._id,
      type: 'National',
    },
    {
      name: 'Gandhi Jayanti',
      date: new Date(`${year}-10-02`),
      organization: org._id,
      type: 'National',
    },
    {
      name: 'Acme Foundation Day',
      date: new Date(`${year}-03-15`),
      organization: org._id,
      type: 'Company',
    },
  ]);

  await Shift.create({
    name: 'General Shift',
    startTime: '09:00',
    endTime: '18:00',
    organization: org._id,
  });

  await Candidate.insertMany([
    {
      name: 'Rahul Mehta',
      email: 'rahul.mehta@example.com',
      phone: '9988776655',
      experience: 4,
      skills: ['Node.js', 'React', 'MongoDB'],
      status: 'Technical',
      appliedFor: 'Software Engineer',
      organization: org._id,
      resumeUrl: 'https://example.com/resumes/rahul.pdf',
    },
    {
      name: 'Priya Nair',
      email: 'priya.nair@example.com',
      phone: '8877665544',
      experience: 6,
      skills: ['HRIS', 'Recruitment', 'Payroll'],
      status: 'HR Interview',
      appliedFor: 'HR Specialist',
      organization: org._id,
    },
    {
      name: 'Sam Patel',
      email: 'sam.patel@example.com',
      phone: '7766554433',
      experience: 2,
      skills: ['Python', 'SQL', 'Excel'],
      status: 'Applied',
      appliedFor: 'Data Analyst Intern',
      organization: org._id,
    },
  ]);

  const project = await Project.create({
    name: 'GPro Platform',
    description: 'Enterprise workforce management platform rollout',
    manager: manager.employee._id,
    members: [lead.employee._id, employee.employee._id, itAdmin.employee._id],
    status: 'Active',
    startDate: new Date(`${year}-01-01`),
    endDate: new Date(`${year}-12-31`),
    organization: org._id,
  });

  await Task.insertMany([
    {
      project: project._id,
      title: 'Build auth module',
      description: 'JWT login, refresh, RBAC',
      assignedTo: employee.employee._id,
      priority: 'High',
      status: 'Completed',
      deadline: new Date(`${year}-02-28`),
      timeSpent: 24,
      organization: org._id,
      createdBy: manager.user._id,
    },
    {
      project: project._id,
      title: 'Attendance clock-in API',
      description: 'Clock in/out with overtime calculation',
      assignedTo: lead.employee._id,
      priority: 'High',
      status: 'In Progress',
      deadline: new Date(`${year}-06-30`),
      timeSpent: 10,
      organization: org._id,
      createdBy: manager.user._id,
    },
    {
      project: project._id,
      title: 'Payroll generation',
      description: 'Monthly payroll from attendance and leave',
      assignedTo: employee.employee._id,
      priority: 'Medium',
      status: 'To Do',
      deadline: new Date(`${year}-07-31`),
      organization: org._id,
      createdBy: lead.user._id,
    },
  ]);

  await Asset.insertMany([
    {
      name: 'MacBook Pro 14',
      assetTag: 'ACM-LAP-001',
      category: 'Laptop',
      assignedTo: employee.employee._id,
      status: 'Assigned',
      purchaseDate: new Date(`${year - 1}-03-01`),
      purchaseCost: 180000,
      organization: org._id,
    },
    {
      name: 'Dell UltraSharp Monitor',
      assetTag: 'ACM-MON-002',
      category: 'Monitor',
      assignedTo: lead.employee._id,
      status: 'Assigned',
      purchaseDate: new Date(`${year - 1}-04-10`),
      purchaseCost: 35000,
      organization: org._id,
    },
    {
      name: 'Spare ThinkPad',
      assetTag: 'ACM-LAP-010',
      category: 'Laptop',
      status: 'Available',
      purchaseDate: new Date(`${year}-01-20`),
      purchaseCost: 95000,
      organization: org._id,
    },
  ]);

  await Ticket.insertMany([
    {
      ticketId: 'TKT00001',
      title: 'VPN access request',
      description: 'Need VPN for remote work',
      category: 'Access',
      priority: 'Medium',
      status: 'Open',
      raisedBy: employee.user._id,
      organization: org._id,
    },
    {
      ticketId: 'TKT00002',
      title: 'Laptop keyboard sticky keys',
      description: 'Several keys sticking on assigned laptop',
      category: 'Hardware',
      priority: 'High',
      status: 'In Progress',
      raisedBy: lead.user._id,
      assignedTo: itAdmin.user._id,
      organization: org._id,
    },
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const clockIn = new Date(today);
  clockIn.setHours(9, 5, 0, 0);

  await Attendance.create({
    employee: employee.employee._id,
    date: today,
    clockIn,
    status: 'Present',
    organization: org._id,
  });

  await Leave.create({
    employee: employee.employee._id,
    leaveType: 'casual',
    startDate: new Date(`${year}-08-10`),
    endDate: new Date(`${year}-08-11`),
    days: 2,
    reason: 'Family function',
    status: 'Pending',
    organization: org._id,
  });

  await Notification.create({
    user: employee.user._id,
    title: 'Welcome to GPro',
    message: 'Your Acme Corp account is ready. Explore attendance, leave, and projects.',
    type: 'system',
    link: '/dashboard',
  });

  console.log('\nSeed completed successfully!\n');
  console.log('Organization: Acme Corp (ACME)');
  console.log('Password for all users: Secure@123\n');
  console.log('Users:');
  console.log('  superadmin@gpro.com  SUPER_ADMIN');
  console.log('  admin@acme.com       ORG_ADMIN');
  console.log('  hr@acme.com          HR_MANAGER');
  console.log('  manager@acme.com     MANAGER');
  console.log('  lead@acme.com        TEAM_LEAD');
  console.log('  employee@acme.com    EMPLOYEE');
  console.log('  finance@acme.com     FINANCE');
  console.log('  it@acme.com          IT_ADMIN');
  console.log('  auditor@acme.com     AUDITOR');
  console.log(`\nSuper admin id: ${superAdminUser._id}`);

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
