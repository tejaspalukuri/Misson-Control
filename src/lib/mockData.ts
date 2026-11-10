import { Task, CalendarEvent } from '@/types';

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// Helper to get today's date formatted at specific hours
export function getTodayTime(hours: number, minutes: number = 0): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function getRelativeDate(daysFromNow: number, hours: number = 23, minutes: number = 59): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export const INITIAL_TASKS: Task[] = [
  {
    id: 't-1',
    user_id: DEMO_USER_ID,
    title: 'CS 1337: Problem Set 4 - Dynamic Programming & Trees',
    category: 'course',
    context_tag: 'CS 1337',
    status: 'in_progress',
    progress_percent: 66,
    due_date: getRelativeDate(1, 23, 59), // Due in < 48 hours -> Urgent Academic
    external_id: 'canvas-ps4-cs1337',
    subtasks: [
      { id: 'st-1-1', task_id: 't-1', title: 'Implement memoized Fibonacci & Knapsack', is_completed: true },
      { id: 'st-1-2', task_id: 't-1', title: 'Write unit tests with edge cases', is_completed: true },
      { id: 'st-1-3', task_id: 't-1', title: 'Complete LaTeX writeup and complexity analysis', is_completed: false },
    ]
  },
  {
    id: 't-2',
    user_id: DEMO_USER_ID,
    title: 'MATH 2414: Multivariable Calculus Midterm Review',
    category: 'course',
    context_tag: 'MATH 2414',
    status: 'in_progress',
    progress_percent: 50,
    due_date: getRelativeDate(0, 21, 0), // Due tonight -> Urgent Academic
    external_id: 'canvas-midterm-math2414',
    subtasks: [
      { id: 'st-2-1', task_id: 't-2', title: 'Review Lagrange Multipliers & directional derivatives', is_completed: true },
      { id: 'st-2-2', task_id: 't-2', title: 'Practice 2025 past exams under timed conditions', is_completed: false },
    ]
  },
  {
    id: 't-3',
    user_id: DEMO_USER_ID,
    title: 'PHYS 2325: Electromagnetism Lab Report #3',
    category: 'course',
    context_tag: 'PHYS 2325',
    status: 'not_started',
    progress_percent: 0,
    due_date: getRelativeDate(4, 17, 0),
    external_id: 'canvas-lab3-phys2325',
    subtasks: [
      { id: 'st-3-1', task_id: 't-3', title: 'Plot oscilloscope oscilloscope voltage curves', is_completed: false },
      { id: 'st-3-2', task_id: 't-3', title: 'Compute error propagation and uncertainty', is_completed: false },
      { id: 'st-3-3', task_id: 't-3', title: 'Submit PDF to Canvas portal', is_completed: false },
    ]
  },
  {
    id: 't-4',
    user_id: DEMO_USER_ID,
    title: 'Formula SAE: Front Suspension Double-Wishbone CAD',
    category: 'club',
    context_tag: 'Formula SAE',
    status: 'blocked',
    progress_percent: 33,
    due_date: getRelativeDate(3, 18, 0),
    subtasks: [
      { id: 'st-4-1', task_id: 't-4', title: 'Export roll center kinematics from Lotus Suspension', is_completed: true },
      { id: 'st-4-2', task_id: 't-4', title: 'Awaiting chassis team tab welding dimensions (BLOCKED)', is_completed: false },
      { id: 'st-4-3', task_id: 't-4', title: 'FEA stress test upright bracket in SolidWorks', is_completed: false },
    ]
  },
  {
    id: 't-5',
    user_id: DEMO_USER_ID,
    title: 'Hackathon Committee: Finalize Cloud Sponsor & Catering',
    category: 'club',
    context_tag: 'HackUTD',
    status: 'in_progress',
    progress_percent: 75,
    due_date: getRelativeDate(6, 12, 0),
    subtasks: [
      { id: 'st-5-1', task_id: 't-5', title: 'Send revised invoice tier to Google Cloud team', is_completed: true },
      { id: 'st-5-2', task_id: 't-5', title: 'Confirm dietary accommodations with Student Union Catering', is_completed: true },
      { id: 'st-5-3', task_id: 't-5', title: 'Order mentor T-shirts and badge lanyards', is_completed: true },
      { id: 'st-5-4', task_id: 't-5', title: 'Sign security permit for 24-hr overnight lab access', is_completed: false },
    ]
  },
  {
    id: 't-6',
    user_id: DEMO_USER_ID,
    title: 'Personal: Summer SWE Internship Behavioral Prep',
    category: 'personal',
    context_tag: 'Career',
    status: 'in_progress',
    progress_percent: 50,
    due_date: getRelativeDate(5, 20, 0),
    subtasks: [
      { id: 'st-6-1', task_id: 't-6', title: 'Draft 5 STAR method stories for leadership & conflict', is_completed: true },
      { id: 'st-6-2', task_id: 't-6', title: 'Mock interview session with peer mentor', is_completed: false },
    ]
  }
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    user_id: DEMO_USER_ID,
    title: 'CS 1337 Lecture: Graph Algorithms & DFS/BFS',
    start_time: getTodayTime(9, 30),
    end_time: getTodayTime(10, 45),
    external_id: 'gcal-cs1337-lec'
  },
  {
    id: 'ev-2',
    user_id: DEMO_USER_ID,
    title: 'MATH 2414 Discussion & Quiz #5',
    start_time: getTodayTime(11, 0),
    end_time: getTodayTime(12, 15),
    external_id: 'gcal-math2414-disc'
  },
  {
    id: 'ev-3',
    user_id: DEMO_USER_ID,
    title: 'Formula SAE Aerodynamics & Powertrain Standup',
    start_time: getTodayTime(14, 0),
    end_time: getTodayTime(15, 30),
    external_id: 'gcal-fsae-standup'
  },
  {
    id: 'ev-4',
    user_id: DEMO_USER_ID,
    title: 'CS 1337 TA Office Hours (ECSS 2.102)',
    start_time: getTodayTime(16, 0),
    end_time: getTodayTime(17, 0),
    external_id: 'gcal-cs-ta-hours'
  },
  {
    id: 'ev-5',
    user_id: DEMO_USER_ID,
    title: 'Intramural Soccer Match vs. Engineering FC',
    start_time: getTodayTime(18, 30),
    end_time: getTodayTime(19, 45),
    external_id: 'gcal-soccer-game'
  }
];
