import { Project, Role, TimesheetEntry, User } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Marco Rossi',
    email: 'admin@edgeworks.it',
    role: Role.ADMIN,
    avatar: 'https://picsum.photos/200/200?random=1',
  },
  {
    id: 'u2',
    name: 'Giulia Bianchi',
    email: 'user@edgeworks.it',
    role: Role.COLLABORATOR,
    avatar: 'https://picsum.photos/200/200?random=2',
  },
  {
    id: 'u3',
    name: 'Luca Conti',
    email: 'luca@edgeworks.it',
    role: Role.COLLABORATOR,
    avatar: 'https://picsum.photos/200/200?random=3',
  },
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Website Redesign', client: 'Acme Corp', color: '#3b82f6', status: 'ACTIVE' },
  { id: 'p2', name: 'Mobile App', client: 'Globex', color: '#10b981', status: 'ACTIVE' },
  { id: 'p3', name: 'Cloud Migration', client: 'Soylent Corp', color: '#f59e0b', status: 'ACTIVE' },
  { id: 'p4', name: 'Internal Audit', client: 'ChronoFlow', color: '#6366f1', status: 'ACTIVE' },
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
        entries.push({
          id: Math.random().toString(36).substr(2, 9),
          userId: user.id,
          projectId: MOCK_PROJECTS[Math.floor(Math.random() * MOCK_PROJECTS.length)].id,
          date: dateStr,
          hours: 4 + Math.floor(Math.random() * 5), // 4-8 hours
          description: 'Development and maintenance tasks.',
        });
      }
    }
  });
  return entries;
};

export const MOCK_ENTRIES: TimesheetEntry[] = generateEntries();

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];