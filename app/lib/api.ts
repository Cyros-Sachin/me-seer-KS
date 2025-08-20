import axios from "axios";
// ✅ Import from the actual Redux slice

const BASE_URL = "https://meseer.com";

import { Goal, Task } from "../features/calendar/calendarSlice"; // ✅ import both
type EventCategory = 'exercise' | 'eating' | 'work' | 'relax' | 'family' | 'social';

export const fetchGoalsAndTasks = async (userId: string, token: string): Promise<Goal[]> => {
  const res = await axios.get(`${BASE_URL}/dog/get_all_goals_tasks/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const rawData = res.data;

  const colors = ["red", "blue", "green", "purple", "orange"];
  const getRandomColor = () =>
    colors[Math.floor(Math.random() * colors.length)];

  const goals = Object.entries(rawData)
    .map(([key, taskArray]) => {
      try {
        const cleanKey = key.replace(/^\[|\]$/g, "");
        const [idStr, title,effort,effort_unit] = cleanKey.split(",");
        const goalId = idStr.trim();
        const tasks: Task[] = (taskArray as any[]).map(task => ({
          id: task.task_id.toString(),                // Required as string
          collective_id: task.collective_id.toString(),                // Required as string
          title: task.task_name,
          todo_id: task?.todo_id,
          goalId: task.goal_id.toString(),            // Required as string
          completed: false,                           // Default value since not in API
          color: getRandomColor(), 
          effort: task.effort,
          effort_unit : task.effort_unit                 // Generate or inherit from goal
        }));


        return {
          id: goalId,
          title,
          effort,
          effort_unit,
          color: getRandomColor(),
          tasks,
        };
      } catch (err) {
        console.error("Failed to parse goal key:", key, err);
        return null;
      }
    })
    .filter((g): g is Goal => g !== null); // ✅ now this is safe

  return goals;
};


export const fetchTodoItems = async (todoId: number, userId: string, token: string) => {
  try {
    const res = await axios.get(`${BASE_URL}/dog/todos/${todoId}/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error(`Failed to fetch todos for task ${todoId}:`, err);
    throw err;
  }
};

export const createCalendarEvent = async (data: any) => {
  try {
    const res = await axios.post(`${BASE_URL}/dog/add-data/calendar-event/`, data);
    return res.data;
  } catch (err) {
    console.error("Failed to create calendar event:", err);
    throw err;
  }
};

export const updateCalendarEvent = async (eventId: string, data: any) => {
  try {
    const res = await axios.put(`${BASE_URL}/dog/update/calendar-event/${eventId}`, data);
    return res.data;
  } catch (err) {
    console.error(`Failed to update calendar event ${eventId}:`, err);
    throw err;
  }
};

export const deleteCalendarEvent = async (eventId: string) => {
  try {
    const res = await axios.delete(`${BASE_URL}/dog/delete/calendar-event/${eventId}`);
    return res.data;
  } catch (err) {
    console.error(`Failed to delete calendar event ${eventId}:`, err);
    throw err;
  }
};

export const fetchActionsForTasks = async (
  taskIds: string[],
  userId: string,
  token: string
): Promise<Record<string, any[]>> => {
  const actionsByTask: Record<string, any[]> = {};
  const fixedAIds = [30, 31, 32];

  for (const taskId of taskIds) {
    const allActions: any[] = [];

    for (const aid of fixedAIds) {
      try {
        const res = await axios.get(
          `https://meseer.com/dog/get_actions/${taskId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (Array.isArray(res.data)) {
          // Check validity ONLY when the key exists
          const filtered = res.data.filter(action => {
            if (action.validity_flag && action.validity_flag === "expired") {
              return false;
            }
            return true;
          });
          // console.log(filtered);
          allActions.push(...filtered);
        }
      } catch (err) {
        console.error(
          `Failed to fetch actions for task ${taskId} with a_id ${aid}`,
          err
        );
      }
    }

    actionsByTask[taskId] = allActions;
  }

  return actionsByTask;
};

// Helper to parse "20/11/2025 00:00"
export function parseCustomDateTime(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [dd, mm, rest] = dateStr.split('/');
  if (!rest) return null;
  const [yyyy, hhmm] = rest.split(' ');
  const [hh, min] = hhmm?.split(':') ?? [];

  const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
  return isNaN(parsed.getTime()) ? null : parsed;
}

export async function fetchEvents(userId: string, collectiveId: string) {
  const response = await fetch(`https://meseer.com/dog/generic/get-it/${userId}/33/${collectiveId}`);
  if (!response.ok) throw new Error("Failed to fetch action events");
  return response.json();
}

