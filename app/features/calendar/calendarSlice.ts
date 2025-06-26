import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Task {
  id: string;
  title: string;
  goalId: string;
  completed: boolean;
  color: string;
  todo_id?: number | null; // ✅ optional, matches API
}

export interface Goal {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

export type EventCategory = 'exercise' | 'eating' | 'work' | 'relax' | 'family' | 'social';

export interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  category: EventCategory;
  goalId?: string;
  taskId?: string;
  color?: string;
}

interface CalendarState {
  selectedDate: Date;
  viewMode: 'day' | 'week' | 'month';
  events: Event[];
  goals: Goal[];
  selectedGoalId: string | null;
}

const initialState: CalendarState = {
  selectedDate: new Date(),
  viewMode: 'week',
  events: [],
  goals: [],
  selectedGoalId: null,
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setSelectedDate(state: { selectedDate: Date; }, action: PayloadAction<string>) {
      state.selectedDate = new Date(action.payload);
    },
    setViewMode(state: { viewMode: any; }, action: PayloadAction<'day' | 'week' | 'month'>) {
      state.viewMode = action.payload;
    },
    addEvent(state: { events: any[]; }, action: PayloadAction<Event>) {
      state.events.push(action.payload);
    },
    updateEvent(state: { events: any[]; }, action: PayloadAction<Event>) {
      const index = state.events.findIndex((e: { id: any; }) => e.id === action.payload.id);
      if (index !== -1) state.events[index] = action.payload;
    },
    deleteEvent(state: { events: any[]; }, action: PayloadAction<string>) {
      state.events = state.events.filter((e: { id: any; }) => e.id !== action.payload);
    },
    addGoal(state: { goals: any[]; }, action: PayloadAction<Goal>) {
      state.goals.push(action.payload);
    },
    updateGoal(state: { goals: any[]; }, action: PayloadAction<Goal>) {
      const index = state.goals.findIndex((g: { id: any; }) => g.id === action.payload.id);
      if (index !== -1) state.goals[index] = action.payload;
    },
    deleteGoal(state: { goals: any[]; }, action: PayloadAction<string>) {
      state.goals = state.goals.filter((g: { id: any; }) => g.id !== action.payload);
    },
    addTask(state: { goals: any[]; }, action: PayloadAction<Task>) {
      const goal = state.goals.find((g: { id: any; }) => g.id === action.payload.goalId);
      if (goal) {
        goal.tasks.push(action.payload);
      }
    },
    updateTask(state: { goals: any[]; }, action: PayloadAction<Task>) {
      const goal = state.goals.find((g: { id: any; }) => g.id === action.payload.goalId);
      if (goal) {
        const index = goal.tasks.findIndex((t: { id: any; }) => t.id === action.payload.id);
        if (index !== -1) goal.tasks[index] = action.payload;
      }
    },
    deleteTask(state: { goals: any[]; }, action: PayloadAction<{ goalId: string; taskId: string }>) {
      const goal = state.goals.find((g: { id: any; }) => g.id === action.payload.goalId);
      if (goal) {
        goal.tasks = goal.tasks.filter((t: { id: any; }) => t.id !== action.payload.taskId);
      }
    },
    selectGoal(state: { selectedGoalId: any; }, action: PayloadAction<string | null>) {
      state.selectedGoalId = action.payload;
    },
  },
});

export const {
  setSelectedDate,
  setViewMode,
  addEvent,
  updateEvent,
  deleteEvent,
  addGoal,
  updateGoal,
  deleteGoal,
  addTask,
  updateTask,
  deleteTask,
  selectGoal,
} = calendarSlice.actions;

export default calendarSlice.reducer;
