import { Project, Role, TimesheetEntry, User } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@edgeworks.it',
    first_name: 'Marco',
    last_name: 'Rossi',
    name: 'Marco Rossi',
    is_staff: true,
    is_superuser: true,
    is_active: true,
    employee_id: 101,
    role: Role.Admin,
    vacation_days_total: 20,
    vacation_days_used: 0,
    vacation_days_remaining: 20,
    sick_days_total: 10,
    sick_days_used: 0,
    sick_days_remaining: 10,
    hire_date: '2020-01-01',
  },
  {
    id: 2,
    username: 'giulia',
    email: 'user@edgeworks.it',
    first_name: 'Giulia',
    last_name: 'Bianchi',
    name: 'Giulia Bianchi',
    is_staff: false,
    is_superuser: false,
    is_active: true,
    employee_id: 102,
    role: Role.User,
    vacation_days_total: 20,
    vacation_days_used: 0,
    vacation_days_remaining: 20,
    sick_days_total: 10,
    sick_days_used: 0,
    sick_days_remaining: 10,
    hire_date: '2020-01-01',
  },
];

export const MOCK_PROJECTS: Project[] = [
  { id: 1, name: 'Website Redesign', customer_id: 1, customerId: 1 },
  { id: 2, name: 'Mobile App', customer_id: 2, customerId: 2 },
  { id: 3, name: 'Cloud Migration', customer_id: 1, customerId: 1 },
];

// Helper to generate some history
const generateEntries = (): TimesheetEntry[] => {
  const entries: TimesheetEntry[] = [];
  const today = new Date();

  MOCK_USERS.forEach(user => {
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Random entries
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
        const projId = MOCK_PROJECTS[Math.floor(Math.random() * MOCK_PROJECTS.length)].id;
        entries.push({
          id: Math.floor(Math.random() * 1000000),
          timesheet_id: Math.floor(Math.random() * 1000000),
          employee_id: user.employee_id || 1,
          user_id: user.id,
          userId: user.id,
          project_id: projId,
          projectId: projId,
          date: dateStr,
          day: dateStr,
          hours: 4 + Math.floor(Math.random() * 5), // 4-8 hours
          entry_type: 'Work', // Added to satisfy TimesheetEntry type
        });
      }
    }
  });
  return entries;
};

export const MOCK_ENTRIES: TimesheetEntry[] = generateEntries();

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];