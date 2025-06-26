import axios from "axios";

const BASE_URL = "https://meseer.com";

import { Goal, Task } from "../features/calendar/calendarSlice"; // ✅ import both

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
        const [idStr, ...titleParts] = cleanKey.split(",");
        const goalId = idStr.trim();
        const title = titleParts.join(",").trim();

        const tasks: Task[] = (taskArray as any[]).map(task => ({
          id: task.task_id.toString(),                // Required as string
          title: task.task_name,
          goalId: task.goal_id.toString(),            // Required as string
          completed: false,                           // Default value since not in API
          color: getRandomColor(),                    // Generate or inherit from goal
        }));


        return {
          id: goalId,
          title,
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
