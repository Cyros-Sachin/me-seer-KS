'use client';
import Cookies from 'js-cookie';
import MiniCalendar from '../components/ui/MiniCalendar'; // or wherever you saved it
import { getUserId, getUserToken } from "../utils/auth";
import { Calendar as CalendarIcon, Maximize2 } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Dot, ChevronRight, Plus, X, Settings, List, Grid, Edit, Trash2, Clock, Tag, Check, ChevronDown, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { resetGoals } from '../features/calendar/calendarSlice';
import {
  setSelectedDate,
  setViewMode,
  addEvent,
  updateEvent,
  deleteEvent,
  addGoal,
} from '../features/calendar/calendarSlice';
import {
  fetchGoalsAndTasks,
  createCalendarEvent,
  fetchActionsForTasks,
  fetchEvents
} from "../lib/api"; // Adjust path if needed
import { Calendar as ReactCalendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // still needed
import { Action } from '@reduxjs/toolkit';
import React from 'react';

type ViewMode = 'day' | 'week' | 'month';
type EventCategory = 'exercise' | 'eating' | 'work' | 'relax' | 'family' | 'social';

interface Event {
  isaction_log?: boolean;
  id: string;
  title: string;
  start: string;
  end: string;
  goalId?: string;
  taskId?: string;
  color?: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'once';
  allDay?: boolean;
  ua_id?: string;
  action_id?: number;
  action_log_id?: number;
}

interface TaskAction {
  a_id: number;
  at_id: number;
  ua_id: number;
  value1: string | null;
  value2: string | null;
  value3: string | null;
  value4: string | null; // ISO datetime
  value5: string | null;
  value6: string | null;
  cat_qty_id1?: any;
  cat_qty_id2?: any;
  cat_qty_id3?: any[];
  cat_qty_id4?: any[];
  cat_qty_id5?: any[];
  cat_qty_id6?: any[];
  start?: string;
  end?: string;
}

export interface Task {
  id: string;
  title: string;
  goalId: string;
  collective_id: string;
  completed: boolean;
  color: string;
  todo_id?: number | null;
  actions?: TaskAction[]; // Add this
}

interface Goal {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

interface TodoContent {
  tc_id: number;
  content: string;
  checked: boolean;
  urgent?: boolean;
  important?: boolean;
  version?: string;
  created_date?: string;
  last_updated?: string;
  refresh_type?: string;
}

interface Todo {
  todo_id: string;
  name: string;
  refresh_type?: string;
  contents?: TodoContent[];
}

interface DailyBreakdownItem {
  date: string;
  hour_spent: number;
}

interface MapStats {
  average: number;
  daily_breakdown: DailyBreakdownItem[];
  peak: number;
  total_hours: number;
  weekly_breakdown: any; // or define a type if needed
}
// at the top of the component
type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  repeat?: string;
  allDay: boolean;
  goalId?: string | number;
  taskId?: string;
  ua_id?: string | number;
  action_id?: string | number;
  isaction_log?: boolean;
  action_log_id?: string | number;
};


const GoalsPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const {
    selectedDate: selectedDateStr,
    viewMode,
    events,
    goals,
  } = useSelector((state: RootState) => state.calendar);

  const selectedDate = useMemo(() => new Date(selectedDateStr), [selectedDateStr]);

  // State for UI controls
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [showEventOnlyModal, setShowEventOnlyModal] = useState(false);
  const [newEventData, setNewEventData] = useState<Event | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [timeSlotClicked, setTimeSlotClicked] = useState<{ time: Date; day: Date } | null>(null);
  const goalsFromRedux = useSelector((state: RootState) => state.calendar.goals);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [allActions, setAllActions] = useState<Record<string, any[]>>({});
  const [sidebarDate, setSidebarDate] = useState<Date>(new Date());
  const timeGridRef = useRef<HTMLDivElement>(null);
  // Add these state variables inside the GoalsPage component
  const [selectedTaskTodo, setSelectedTaskTodo] = useState<Todo | null>(null);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskContent, setEditingTaskContent] = useState("");
  const [todoView, setTodoView] = useState<'unchecked' | 'checked' | 'history'>('unchecked');
  const [expandedGoalIds, setExpandedGoalIds] = useState<string[]>([]);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const [maximizedTodo, setMaximizedTodo] = useState<Todo | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [goalProgress, setGoalProgress] = useState<Record<string, any>>({});
  const [taskProgressMap, setTaskProgressMap] = useState<Record<string, Record<string, any>>>({});
  const [currentMapStats, setcurrentMapStats] = useState<MapStats>({
    average: 0,
    daily_breakdown: [],
    peak: 0,
    total_hours: 0,
    weekly_breakdown: null,
  });
  const [currentViewName, setCurrentViewName] = useState<string>("All Goals");
  const [draggedAction, setDraggedAction] = useState<Event | null>(null);
  const [dropTarget, setDropTarget] = useState<{ day: Date; time: Date } | null>(null);
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [draggingActionId, setDraggingActionId] = React.useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  // Handle drop
  const handleActionDrop = (
    e: React.DragEvent<HTMLDivElement>,
    day: Date,
    time: Date
  ) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/x-calendar-action");
    if (!data) return;

    const draggedEvent = JSON.parse(data) as CalendarEvent;

    // ✅ Snap start to nearest slot
    const snappedStart = new Date(day);
    snappedStart.setHours(time.getHours(), time.getMinutes(), 0, 0);

    // ✅ Keep same duration
    const duration =
      (new Date(draggedEvent.end).getTime() -
        new Date(draggedEvent.start).getTime()) /
      60000;
    const snappedEnd = new Date(snappedStart);
    snappedEnd.setMinutes(snappedEnd.getMinutes() + duration);

    // 🐞 Log full updated payload
    const updatedPayload: Event = {
      id: draggedEvent.id,
      title: draggedEvent.title,
      start: toLocalDateTimeInputValue(snappedStart.toISOString()),
      end: toLocalDateTimeInputValue(snappedEnd.toISOString()),
      color: draggedEvent.color,
      repeat: draggedEvent.repeat as 'none' | 'daily' | 'weekly' | 'monthly' | 'once' | undefined,
      allDay: false,
      goalId: draggedEvent.goalId ? draggedEvent.goalId.toString() : undefined,
      taskId: draggedEvent.taskId ? draggedEvent.taskId.toString() : undefined,
      ua_id: draggedEvent.ua_id ? draggedEvent.ua_id.toString() : undefined,
      action_id: draggedEvent.action_id ? Number(draggedEvent.action_id) : undefined,
      isaction_log: draggedEvent.isaction_log,
      action_log_id: draggedEvent.action_log_id ? Number(draggedEvent.action_log_id) : undefined
    };
    setCurrentEvent(updatedPayload);
    // console.log(updatedPayload);
    handleEventSave();
    setShowSavePopup(true);
  };

  // Confirm save
  const confirmDragSave = () => {
    if (!draggedAction || !dropTarget) return;

    const start = new Date(dropTarget.day);
    start.setHours(dropTarget.time.getHours(), dropTarget.time.getMinutes());
    const end = new Date(start);
    const duration = (new Date(draggedAction.end || "").getTime() - new Date(draggedAction.start || "").getTime()) / 60000;
    end.setMinutes(end.getMinutes() + duration);

    // console.log(draggedAction, start.toISOString(), end.toISOString());

    handleEventSave(); // your existing update function
    setDraggedAction(null);
    setDropTarget(null);
    setShowSavePopup(false);
  };

  // Cancel move
  const cancelDragSave = () => {
    setDraggedAction(null);
    setDropTarget(null);
    setShowSavePopup(false);
  };

  const handleActionDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    actionEvent: CalendarEvent
  ) => {
    setDraggingActionId(actionEvent.id);

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/x-calendar-action", JSON.stringify(actionEvent));

    // ✅ Create ghost element
    const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
    ghost.style.position = "absolute";
    ghost.style.top = `${e.currentTarget.getBoundingClientRect().top}px`;
    ghost.style.left = `${e.currentTarget.getBoundingClientRect().left}px`;
    ghost.style.width = `${e.currentTarget.offsetWidth}px`;
    ghost.style.height = `${e.currentTarget.offsetHeight}px`;
    ghost.style.pointerEvents = "none";
    ghost.style.opacity = "0.8";
    ghost.style.transform = "scale(1.02)";
    ghost.style.zIndex = "9999";

    document.body.appendChild(ghost);

    // Force browser to use this ghost instead of default
    e.dataTransfer.setDragImage(ghost, e.currentTarget.offsetWidth / 2, e.currentTarget.offsetHeight / 2);

    // Remove the ghost after snapshot (instant remove but browser still uses cached image)
    setTimeout(() => {
      try { document.body.removeChild(ghost); } catch { }
    }, 0);
  };

  const handleActionDragEnd = () => {
    setDraggingActionId(null);
  };


  const fetchTaskProgress = async (goalId: string) => {
    try {
      const res = await fetch(`https://meseer.com/dog/get-progress`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getUserToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          stats_type: "task_level",
          goal_id: goalId
        })
      });
      const data = await res.json();
      setTaskProgressMap(prev => ({ ...prev, [goalId]: data || {} }));
      const response = await fetch('https://meseer.com/dog/get-timely-stats', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getUserToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          flag: 2,
          goal_id: goalId,
          task_id: 0
        })
      });
      const stats = await response.json();
      setcurrentMapStats(normalizeDailyBreakdown(stats));
    } catch (err) {
      console.error(`Task progress fetch failed for goal ${goalId}:`, err);
    }
  };

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`https://meseer.com/dog/get-progress`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${getUserToken()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            stats_type: "goal_level",
            goal_id: "0"
          })
        });
        const data = await res.json();
        // API returns something like { "314": { progress: 25, ... }, "315": { ... } }
        setCurrentViewName("All Goals");
        setGoalProgress(data || {});
      } catch (err) {
        console.error("Progress fetch failed:", err);
      }
    };
    fetchProgress();
  }, []);

  useEffect(() => {
    const fetchAllGoalsStats = async () => {
      try {
        const res = await fetch(`https://meseer.com/dog/get-timely-stats`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${getUserToken()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            flag: 4,
            goal_id: null,
            task_id: null
          })
        });

        if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
        const stats = await res.json();
        setcurrentMapStats(normalizeDailyBreakdown(stats)); // this updates the graph
      } catch (err) {
        console.error("Failed to fetch all goals stats:", err);
      }
    };

    fetchAllGoalsStats();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = document.activeElement && (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement).isContentEditable
      );

      if (isTyping) return;

      if (e.key === 'm' || e.key === 'M') {
        dispatch(setViewMode('month'));
      } else if (e.key === 'w' || e.key === 'W') {
        dispatch(setViewMode('week'));
      } else if (e.key === 'd' || e.key === 'D') {
        dispatch(setViewMode('day'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch]);

  const handleTaskClick = async (taskId: string) => {
    const userId = getUserId();
    const token = getUserToken();
    setSelectedTaskId(taskId);

    const allTasks = goals.flatMap(g => g.tasks);
    const task = allTasks.find(t => t.id === taskId);

    if (!task || !task.todo_id) {
      setSelectedTaskTodo(null);
      return;
    }

    try {
      // STEP 1: Fetch all todos
      const todoRes = await fetch(`https://meseer.com/dog/todos/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!todoRes.ok) throw new Error(`Todo fetch failed: ${todoRes.status}`);
      const todoData = await todoRes.json();

      // STEP 2: Find the todo item matching task.todo_id
      const matchedTodo = Array.isArray(todoData)
        ? todoData.find(item => item.todo_id?.toString() === task.todo_id?.toString())
        : null;

      if (!matchedTodo) {
        console.warn("Todo ID not found in response.");
        setSelectedTaskTodo({
          todo_id: task.todo_id.toString(),
          name: "Untitled",
          contents: [],
          refresh_type: "daily"
        });
        return;
      }

      // STEP 3: Fetch todo contents
      const contentRes = await fetch(`https://meseer.com/dog/todo_content/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!contentRes.ok) throw new Error(`Content fetch failed: ${contentRes.status}`);
      const allContents = await contentRes.json();

      // STEP 4: Filter contents by todo_id
      const filteredContents = Array.isArray(allContents)
        ? allContents.filter(content => content.todo_id?.toString() === task.todo_id?.toString())
        : [];

      // STEP 5: Build and set final todo object
      const finalTodo: Todo = {
        todo_id: matchedTodo.todo_id.toString(),
        name: matchedTodo.name || "Untitled",
        contents: filteredContents,
        refresh_type: matchedTodo.refresh_type || "daily"
      };

      setSelectedTaskTodo(finalTodo);
      const response = await fetch('https://meseer.com/dog/get-timely-stats', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getUserToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          flag: 1,
          goal_id: 0,
          task_id: taskId
        })
      });
      const stats = await response.json();
      setcurrentMapStats(normalizeDailyBreakdown(stats));
    } catch (err) {
      console.error("Error fetching todo or content:", err);
      setSelectedTaskTodo({
        todo_id: task.todo_id.toString(),
        name: "Untitled",
        contents: [],
        refresh_type: "daily"
      });
    }
  };

  // Add these helper functions for todo operations
  const handleToggleCheck = async (tcId: number) => {
    setSelectedTaskTodo(prev => {
      if (!prev) return prev;

      const updatedContents = prev?.contents?.map(item => {
        if (item.tc_id === tcId) {
          const updatedItem = { ...item, checked: !item.checked };
          updateCheckStatus(updatedItem);
          return updatedItem;
        }
        return item;
      });

      return { ...prev, contents: updatedContents };
    });

    setMaximizedTodo(prev => {
      if (!prev) return prev;

      const updatedContents = prev?.contents?.map(item => {
        if (item.tc_id === tcId) {
          return { ...item, checked: !item.checked };
        }
        return item;
      });

      return { ...prev, contents: updatedContents };
    });
  };


  const updateCheckStatus = async (item: TodoContent) => {
    try {
      const token = getUserToken();
      await fetch(`https://meseer.com/dog/todo_content/${item.tc_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: item.content,
          checked: item.checked,
          urgent: item.urgent ?? false,
          important: item.important ?? false
        })
      });
    } catch (err) {
      console.error('Failed to update todo:', err);
    }
  };

  const handleAddTask = async () => {
    // console.log("recieved")
    const userId = getUserId();
    const token = getUserToken();
    const now = new Date().toISOString();

    try {
      const response = await fetch(`https://meseer.com/dog/todo_content`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          todo_id: maximizedTodo?.todo_id || selectedTaskTodo?.todo_id,
          user_id: userId,
          content: newTaskContent.trim(),
          checked: false,
          urgent: true,
          important: false,
          version: "v1",
          created_date: now,
          last_updated: now,
          refresh_type: maximizedTodo?.refresh_type || selectedTaskTodo?.refresh_type || "daily",
        }),
      });

      if (response.ok) {
        // Fetch fresh content
        const contentRes = await fetch(`https://meseer.com/dog/todo_content/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const allContents = await contentRes.json();
        const refreshedContents = Array.isArray(allContents)
          ? allContents.filter(content => (content.todo_id?.toString() === maximizedTodo?.todo_id?.toString()) || (content.todo_id?.toString() === selectedTaskTodo?.todo_id?.toString()))
          : [];

        {
          maximizedTodo?.todo_id && setMaximizedTodo(prev => ({
            ...prev!,
            contents: refreshedContents
          }));
        }
        setSelectedTaskTodo(prev => ({
          ...prev!,
          contents: refreshedContents
        }));
        setNewTaskContent("");
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  const handleDeleteTask = async (tcId: number) => {
    if (!selectedTaskTodo) return;

    try {
      const token = getUserToken();
      await fetch(`https://meseer.com/dog/todo_content/${tcId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update local state
      setSelectedTaskTodo(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          contents: (prev as any).contents.filter((item: any) => item.tc_id !== tcId)
        };
      });
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const scrollToCurrentTime = () => {
    const container = timeGridRef.current;
    if (!container) return;

    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();

    // Total minutes covered by your timeSlots (5:30 AM to 8:30 PM)
    const startMinutes = 5 * 60 + 30; // 5:30 AM in minutes
    const endMinutes = 20 * 60 + 30;  // 8:30 PM in minutes
    const totalVisibleMinutes = endMinutes - startMinutes;

    const containerHeight = container.scrollHeight;
    const relativeMinutes = minutesSinceMidnight - startMinutes;

    // Calculate top offset in pixels
    const topOffset = (relativeMinutes / totalVisibleMinutes) * containerHeight;

    // Scroll so the line is in the middle of the visible area
    container.scrollTop = topOffset - container.clientHeight / 2;
  };

  function toLocalDateTimeInputValue(dateStr: string): string {
    const d = new Date(dateStr);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16); // e.g., "2025-07-03T14:30"
  }

  useEffect(() => {
    if (viewMode === 'day' || viewMode === 'week') {
      // Delay to ensure DOM has rendered
      setTimeout(() => {
        scrollToCurrentTime();
      }, 100);
    }
  }, [viewMode, selectedDate]);

  const loadData = async () => {
    try {
      dispatch(resetGoals());
      const userId = getUserId();
      const token = getUserToken();

      const goals = await fetchGoalsAndTasks(userId, token);

      if (!Array.isArray(goals)) {
        console.error("❌ goals is not an array", goals);
        return;
      }

      const existingGoalIds = new Set(goalsFromRedux.map(g => g.id));
      const filteredGoals = goals.filter(g => !existingGoalIds.has(g.id));
      const allTaskIds = filteredGoals.flatMap(goal => goal.tasks.map(task => task.id));
      const actionsMap = await fetchActionsForTasks(allTaskIds, userId, token);
      setAllActions(actionsMap);

      // Dispatch goals directly
      filteredGoals.forEach(g => dispatch(addGoal(g)));

      // Now for each task, fetch events
      for (const goal of filteredGoals) {
        for (const task of goal.tasks) {
          const collectiveId = task.collective_id;

          if (!collectiveId) continue;

          try {
            const eventsData = await fetchEvents(userId, collectiveId);

            if (Array.isArray(eventsData)) {
              const transformedEvents: Event[] = eventsData.map((item) => {
                const startDate = new Date(item.value4);
                const endDate = new Date(startDate); // same day for all-day event

                return {
                  id: `event-${item.a_id}`,
                  title: item.value3 || "Untitled Event",
                  start: startDate.toISOString(),
                  end: endDate.toISOString(),
                  ua_id: item.ua_id,
                  goalId: goal.id,
                  taskId: task.collective_id,
                  color: task.color || '#3b82f6',
                  repeat: 'none',
                  allDay: true // 🟢 Important for rendering in All-day row
                };
              });
              transformedEvents.forEach(evt => dispatch(addEvent(evt)));
            }
          } catch (error) {
            console.error(`❌ Failed to fetch events for collectiveId ${collectiveId}`, error);
          }
        }
      }

    } catch (err) {
      console.error("🚨 Error in loadData:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!showEventModal || !goals.length) return;

    setCurrentEvent(prev => {
      if (!prev) return prev;

      const fallbackGoalId = prev.goalId || goals[0]?.id;
      const goal = goals.find(g => g.id === fallbackGoalId);
      const fallbackTaskId = prev.taskId || goal?.tasks?.[0]?.id || "";

      return {
        ...prev,
        goalId: fallbackGoalId,
        taskId: fallbackTaskId,
      } as Event;
    });
  }, [showEventModal, goals]);

  useEffect(() => {
    scrollToCurrentTime();
  }, []);

  // Generate time slots from 5:30 AM to 8:30 PM
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const date = new Date(selectedDate);
    date.setHours(i, 0, 0, 0);
    return date;
  });

  // Get the current week based on selected date
  const getWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const weekDays = getWeekDays();

  // Handle date navigation
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);

    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
    }

    dispatch(setSelectedDate(newDate.toISOString()));
  };

  const repeatToAidMap: Record<string, number> = {
    daily: 30,
    weekly: 31,
    monthly: 32,
    once: 30,
  };

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    dispatch(setViewMode(mode));
  };

  // Handle time slot click
  const handleTimeSlotClick = (time: Date, day: Date) => {
    const startDate = new Date(day);
    startDate.setHours(time.getHours(), time.getMinutes());
    const selectedGoalObj = goals.find(g => g.id === selectedGoalId);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);
    setCurrentEvent({
      goalId: selectedGoalId || goals[0]?.id || '',
      taskId: selectedTaskId || selectedGoalObj?.id,
      id: '',
      title: '',
      start: startDate.toISOString(), // ✅ convert to string
      end: endDate.toISOString(),     // ✅ convert to string
      color: '#3b82f6',
      repeat: "once"
    });

    setTimeSlotClicked({ time, day });
    setShowEventModal(true);
  };

  // Handle task drag start
  const handleTaskDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  // Handle calendar drop
  const handleCalendarDrop = (time: Date, day: Date) => {
    if (!draggedTask) return;

    const start = new Date(day);
    start.setHours(time.getHours(), time.getMinutes());

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setCurrentEvent({
      id: '',
      title: draggedTask.title,
      start: start.toISOString(),
      end: end.toISOString(),
      goalId: draggedTask.goalId,
      taskId: draggedTask.id,
      color: draggedTask.color
    });

    setShowEventModal(true);
    setDraggedTask(null);
  };

  const reload = async () => {
    try {
      dispatch(resetGoals());
      const userId = getUserId();
      const token = getUserToken();

      // Step 1: Fetch all goals with tasks
      const goals = await fetchGoalsAndTasks(userId, token);
      if (!Array.isArray(goals)) {
        console.error("❌ goals is not an array", goals);
        return;
      }

      // Step 2: Dispatch all goals to Redux
      goals.forEach(goal => dispatch(addGoal(goal)));

      // Step 3: Fetch all actions for all tasks
      const allTaskIds = goals.flatMap(goal => goal.tasks.map(task => task.id));
      const actionsMap = await fetchActionsForTasks(allTaskIds, userId, token);
      setAllActions(actionsMap);

      // Step 4: Fetch all events for all tasks
      for (const goal of goals) {
        for (const task of goal.tasks) {
          const collectiveId = task.collective_id;
          if (!collectiveId) continue;

          try {
            const eventsData = await fetchEvents(userId, collectiveId);

            if (Array.isArray(eventsData)) {
              const transformedEvents = eventsData.map((item) => {
                const startDate = new Date(item.value4);
                const endDate = new Date(startDate);

                return {
                  id: `event-${item.a_id}`,
                  title: item.value3 || "Untitled Event",
                  start: startDate.toISOString(),
                  end: endDate.toISOString(),
                  goalId: goal.id,
                  taskId: task.id,
                  ua_id: item.ua_id,
                  color: task.color || '#3b82f6',
                  repeat: 'none',
                  allDay: true,
                };
              });
              transformedEvents.forEach(evt => dispatch(addEvent(evt)));
            }
          } catch (error) {
            console.error(`❌ Failed to fetch events for collectiveId ${collectiveId}`, error);
          }
        }
      }
    } catch (err) {
      console.error("🚨 Error in loadData:", err);
    }
  };


  // Handle event save
  const handleEventSave = async () => {
    if (!currentEvent) return;

    const { start, end, title, taskId, repeat, id } = currentEvent;

    const dayToCatIdMap: Record<
      "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday",
      number
    > = {
      Monday: 76,
      Tuesday: 77,
      Wednesday: 78,
      Thursday: 79,
      Friday: 80,
      Saturday: 81,
      Sunday: 82,
    };

    const aid = repeatToAidMap[repeat ?? "once"];
    const startDate = new Date(start);
    const endDate = new Date(end);
    const start_time = toLocalDateTimeInputValue(start).slice(11, 16);
    const start_day = startDate.toLocaleDateString("en-US", { weekday: "long" });
    const start_date = toLocalDateTimeInputValue(start).split("T")[0].split("-")[2];
    const diffInMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    const duration = diffInMinutes % 60 === 0 ? diffInMinutes / 60 : Math.round(diffInMinutes);
    const duration_unit = diffInMinutes % 60 === 0 ? "hour" : "minutes";

    const event_time = new Date().toISOString().slice(0, 19);
    const isUpdate = id?.startsWith("event-") && id.length > 6;
    // console.log(isUpdate);
    const payload: any = {
      a_id: aid,
      at_id: 302,
      flag: "PT",
      trigger: "action",
      is_active: "Y",
      user_id: getUserId(),
      event_time,
      description: isUpdate ? "update action" : "add action",
      cat_qty_id1: isUpdate ? Number(currentEvent.action_id) : Number(taskId),
      value1: "",
      value2: "",
      value3: title,
      value4: "",
      value5: "",
      value6: "",
      cat_qty_id2: repeat === "once" ? 129 : 128,
      cat_qty_id3: 23,
      cat_qty_id4: 0,
      cat_qty_id5: 0,
      cat_qty_id6: 0,
      by_datetime_value: "",
    };

    if (isUpdate || currentEvent.isaction_log) {
      payload.action = "UPDATE";
      payload.ua_id = Number(currentEvent.ua_id);
    }
    if (currentEvent.isaction_log) {
      payload.cat_qty_id1 = currentEvent.action_log_id;
    }

    // One-time
    if (aid === 30) {
      payload.cat_qty_id4 = 58;
      payload.value4 = toLocalDateTimeInputValue(start);
      payload.cat_qty_id5 = duration_unit === "hour" ? 57 : 56;
      payload.value5 = String(duration);
      payload.action_timestamp = event_time;
      payload.by_datetime_value = payload.value4;
    }

    // Weekly
    if (aid === 31) {
      const selectedDayCatId = dayToCatIdMap[start_day as keyof typeof dayToCatIdMap];
      const selectedTime = start_time;
      const dayNameMap: Record<number, number> = {
        76: 1, 77: 2, 78: 3, 79: 4, 80: 5, 81: 6, 82: 0,
      };
      const targetDayIndex = dayNameMap[selectedDayCatId];

      if (!isNaN(targetDayIndex) && selectedTime) {
        const now = new Date();
        const currentDay = now.getDay();
        const daysUntilTarget = (targetDayIndex + 7 - currentDay) % 7 || 7;
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + daysUntilTarget);

        const [hourStr, minStr] = selectedTime.split(":");
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minStr, 10);

        if (!isNaN(hour) && !isNaN(minute)) {
          targetDate.setHours(hour, minute, 0, 0);
          payload.by_datetime_value = targetDate.toISOString().slice(0, 16);
          payload.action_timestamp = event_time;
          payload.cat_qty_id4 = selectedDayCatId;
          payload.cat_qty_id5 = 59;
          payload.value5 = start_time;
          payload.cat_qty_id6 = duration_unit === "hour" ? 57 : 56;
          payload.value6 = String(duration);
        }
      }
    }

    // Monthly
    if (aid === 32) {
      const selectedDay = Number(start_date);
      const selectedTime = start_time;

      if (selectedDay && selectedTime && /^\d{2}:\d{2}$/.test(selectedTime)) {
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth(), selectedDay);
        const [hourStr, minuteStr] = selectedTime.split(":");
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        if (!isNaN(hour) && !isNaN(minute)) {
          targetDate.setHours(hour, minute, 0, 0);
          const yyyy = targetDate.getFullYear();
          const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
          const dd = String(targetDate.getDate()).padStart(2, "0");
          const hh = String(targetDate.getHours()).padStart(2, "0");
          const min = String(targetDate.getMinutes()).padStart(2, "0");

          payload.by_datetime_value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
          payload.action_timestamp = event_time;
          payload.cat_qty_id4 = 39;
          payload.value4 = start_date;
          payload.cat_qty_id5 = 59;
          payload.value5 = start_time;
          payload.cat_qty_id6 = duration_unit === "hour" ? 57 : 56;
          payload.value6 = String(duration);
        }
      }
    }
    try {
      const endpoint = currentEvent?.isaction_log
        ? `https://meseer.com/dog/update_delete_actionlogs/${currentEvent.action_log_id}`
        : isUpdate
          ? "https://meseer.com/dog/update-delete-data/primary-mwb"
          : "https://meseer.com/dog/add-data/primary-mwb/";

      await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getUserToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      // console.log(payload);
      // console.log(endpoint);
      setShowEventModal(false);
      await reload();
      setCurrentEvent(null);
    } catch (err) {
      console.error("Submission failed", err);
    }
  };


  const handleEventDelete = async () => {
    try {
      const isActionLog = !!currentEvent?.action_log_id;

      const payload = {
        ua_id: currentEvent?.ua_id,
        a_id: repeatToAidMap[currentEvent?.repeat ?? "once"],
        at_id: 302,
        flag: "PT",
        action: "DELETE",
        cat_qty_id1: isActionLog ? currentEvent?.action_log_id : currentEvent?.action_id,
      };

      const endpoint = isActionLog
        ? `https://meseer.com/dog/update_delete_actionlogs/${currentEvent.action_log_id}`
        : `https://meseer.com/dog/update-delete-data/primary-mwb`;

      await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      await reload();
      setShowEventModal(false);
      setCurrentEvent(null);
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  // Get events for a specific day and time slot
  const getEventsForSlot = (day: Date, time: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      const slotStart = new Date(day);
      slotStart.setHours(time.getHours(), time.getMinutes());

      const slotEnd = new Date(slotStart);
      slotEnd.setHours(slotStart.getHours(), slotStart.getMinutes() + 30);

      return (
        (eventStart >= slotStart && eventStart < slotEnd) ||
        (eventEnd > slotStart && eventEnd <= slotEnd) ||
        (eventStart <= slotStart && eventEnd >= slotEnd)
      );
    });
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getActionsForDay = (
    day: Date,
    allActions: Record<string, any[]>,
    goals: Goal[]
  ): {
    isaction_log: boolean;
    title: string;
    color: string;
    action_log_id: number;
    time: string;
    durationMinutes: number;
    action_id: number;
    goal: Goal;
    ua_id: string;
    task: Task;
    repeatType: 'once' | 'daily' | 'weekly' | 'monthly';
  }[] => {
    const actions: {
      isaction_log: boolean;
      title: string;
      color: string;
      time: string;
      ua_id: string;
      durationMinutes: number;
      action_id: number;
      action_log_id: number;
      goal: Goal;
      task: Task;
      repeatType: 'once' | 'daily' | 'weekly' | 'monthly';
    }[] = [];

    const parseToLiteral = (dateStr: string): Date => {
      if (dateStr.includes("GMT")) {
        const noGmt = dateStr.replace("GMT", "").trim();
        return new Date(noGmt);
      }
      return new Date(dateStr);
    };

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const isAfterOrSameDay = (target: Date, base: Date) =>
      target.setHours(0, 0, 0, 0) >= base.setHours(0, 0, 0, 0);

    const durationUnitMap: Record<number, string> = {
      57: "hours",
      56: "minutes",
    };

    const dayWeekMap: Record<number, string> = {
      76: "Monday",
      77: "Tuesday",
      78: "Wednesday",
      79: "Thursday",
      80: "Friday",
      81: "Saturday",
      82: "Sunday",
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const goal of goals) {
      for (const task of goal.tasks) {
        const taskActions = allActions[task.id?.toString()] || [];

        for (const action of taskActions) {
          const actionDate = parseToLiteral(action.by_datetime_value);
          if (isNaN(actionDate.getTime())) continue;

          const isaction_log =
            typeof action.action_log_id === "number" &&
            !Number.isNaN(action.action_log_id);
          const action_log_id = action.action_log_id;
          const ua_id = action.ua_id;
          const action_id = action.action_id;
          const isRepeating = action.repeat_status === "128";
          const canRepeatFuture = action.repeat_status === "129";

          let shouldRender = false;
          const weekdayName = day.toLocaleDateString("en-US", {
            weekday: "long",
          });

          if (isRepeating) {
            const dayWeekName = dayWeekMap[action.day_week];
            const isWeekly = !!dayWeekName;
            const dayMonth = Number(action.day_month);
            const isMonthly = !isWeekly && dayMonth >= 1 && dayMonth <= 31;
            const isDaily = !isWeekly && !isMonthly;

            // ✅ If it's an action log, restrict future repetition unless repeat_status === 129
            if (isaction_log && !canRepeatFuture && day > today) {
              shouldRender = false;
            } else {
              if (
                isWeekly &&
                dayWeekName === weekdayName &&
                isAfterOrSameDay(day, actionDate)
              ) {
                shouldRender = true;
              } else if (
                isMonthly &&
                day.getDate() === dayMonth &&
                isAfterOrSameDay(day, actionDate)
              ) {
                shouldRender = true;
              } else if (isDaily && isAfterOrSameDay(day, actionDate)) {
                shouldRender = true;
              }
            }
          } else {
            shouldRender = isSameDay(day, actionDate);
          }

          if (!shouldRender) continue;

          const title = action.name || "Untitled Action";
          const color = task.color || "#3b82f6";

          let timeStr: string;
          if (action.time_of_day_value) {
            timeStr = action.time_of_day_value.trim();
          } else if (action.by_datetime_value) {
            const dateObj = parseToLiteral(action.by_datetime_value);
            const hh = dateObj.getHours().toString().padStart(2, "0");
            const mm = dateObj.getMinutes().toString().padStart(2, "0");
            timeStr = `${hh}:${mm}`;
          } else {
            timeStr = "00:00";
          }

          let duration = parseInt(action.duration_value || "30", 10);
          const unit = durationUnitMap[action.duration_unit];
          if (unit === "hours") duration *= 60;
          if (isNaN(duration)) duration = 30;

          actions.push({
            action_log_id,
            isaction_log,
            title,
            goal,
            task,
            color,
            ua_id,
            action_id,
            time: timeStr,
            durationMinutes: duration,
            repeatType: isRepeating
              ? action.day_week
                ? "weekly"
                : action.day_month
                  ? "monthly"
                  : "daily"
              : "once",
          });
        }
      }
    }

    return actions;
  };

  const addMinutes = (date: Date, minutes: number): Date => {
    return new Date(date.getTime() + minutes * 60000);
  };

  const handleDeleteContent = async (tc_id: number) => {
    if (!maximizedTodo) return;

    const token = getUserToken();
    try {
      const response = await fetch(`https://meseer.com/dog/todo_content/${tc_id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMaximizedTodo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            contents: (prev.contents ?? []).map(item =>
              item.tc_id === tc_id ? { ...item, checked: !item.checked } : item
            ),
          };
        });
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  function formatTimes(input: string | Date): string {
    const date = typeof input === "string"
      ? new Date(`1970-01-01T${input}:00`)
      : input;

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  const normalizeDailyBreakdown = (data: any) => {
    // Make a date map from API
    const map = new Map(
      (data.daily_breakdown || []).map((item: any) => [item.date, item.hour_spent])
    );

    const today = new Date();
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const formatted = d.toLocaleDateString('en-GB').split('/').join('-'); // dd-mm-yyyy
      past7Days.push({
        date: formatted,
        hour_spent: map.get(formatted) || 0
      });
    }

    return {
      ...data,
      daily_breakdown: past7Days
    };
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white p-4 overflow-y-auto custom-scrollbar">
        <div className="flex justify items-center mb-6">
          <ChevronLeft className='mr-3 text-black' onClick={() => router.push('/main')} />
          <h2 className="text-xl font-bold text-gray-800">Goals</h2>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">My Goals</h2>
          <div className="space-y-1">
            {goals.map(goal => {
              const isExpanded = expandedGoalIds.includes(goal.id);
              const progressData = goalProgress[goal.id] || {};
              const timeSpent = progressData.time_spent ?? 0;
              const timeAllotted = progressData.time_allotted ?? goal.effort ?? 0;
              const progressPercent = progressData.progress ?? 0;
              const goalUnit = progressData.goal_unit ?? goal.effort_unit ?? 0;

              return (
                <div key={goal.id} className="mb-3">
                  {/* Goal Header */}
                  <div
                    className="flex items-center justify-between px-2 py-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setExpandedGoalIds(prev =>
                        prev.includes(goal.id)
                          ? prev.filter(id => id !== goal.id)
                          : [...prev, goal.id]
                      );
                      setCurrentViewName(goal.title);
                      fetchTaskProgress(goal.id);
                      setSelectedGoalId(goal.id);
                    }
                    }
                  >
                    <div>
                      <span className="truncate font-medium text-gray-800">{goal.title}</span>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                        <span>{timeSpent}h / {timeAllotted}h</span>
                        <span>•</span>
                        <span>{progressPercent}%</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800`}>
                          {goalUnit}
                        </span>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </motion.div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 h-2 rounded mt-1">
                    <div
                      className="bg-blue-500 h-2 rounded transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Tasks */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-1 space-y-1 border-l border-gray-300 pl-3">
                          {goal.tasks.map(task => {
                            const taskStats = taskProgressMap[goal.id]?.[task.id] || {};
                            const timeSpent = taskStats.time_spent ?? 0;
                            const timeAllotted = taskStats.time_allotted ?? task.effort ?? 0;
                            const progressPercent = taskStats.progress ?? 0;
                            const taskUnit = taskStats.task_unit ?? task.effort_unit ?? 0;

                            let priorityLabel = "Low";
                            let priorityColor = "bg-green-100 text-green-800";
                            if (timeAllotted < 3) {
                              priorityLabel = "High";
                              priorityColor = "bg-red-100 text-red-800";
                            } else if (timeAllotted < 6) {
                              priorityLabel = "Medium";
                              priorityColor = "bg-yellow-100 text-yellow-800";
                            }

                            return (
                              <div
                                key={task.id}
                                className={`text-sm text-gray-700 py-1 flex items-center gap-2 ${selectedTaskId === task.id ? 'bg-gray-100 font-medium rounded' : ''
                                  }`}
                                draggable
                                onClick={() => {
                                  setCurrentViewName(task.title);
                                  handleTaskClick(task.id);
                                }}
                                onMouseEnter={() => {
                                  setHoveredTaskId(task.id);
                                }}
                                onMouseLeave={() => {
                                  setHoveredTaskId(null);
                                }}
                              >
                                <div>
                                  <div className="text-sm font-medium text-gray-800">{task.title}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <span>{timeSpent}h / {timeAllotted}h</span>
                                    <span>•</span>
                                    <span>{progressPercent}%</span>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800`}>
                                      {taskUnit}
                                    </span>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityColor}`}>
                                  {priorityLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

          </div>
        </div>
        {/* Selected Task Todo Section */}
        {selectedTaskTodo && (
          <div className="mt-4">
            {/* Header */}
            <h2 className="text-base font-semibold text-gray-900">To-do List</h2>
            <p className="text-xs text-gray-500 mt-0.5">{selectedTaskTodo.name}</p>

            {/* Todo Container */}
            <div className="bg-white rounded-md border border-gray-200 mt-2 overflow-hidden">
              {/* Task List */}
              <div className="max-h-56 overflow-y-auto px-2 py-1.5 space-y-2">
                {(() => {
                  const items = selectedTaskTodo?.contents || [];
                  const filteredItems =
                    todoView === 'history'
                      ? items
                      : items.filter((item) =>
                        todoView === 'unchecked' ? !item.checked : item.checked
                      );

                  if (todoView === 'history') {
                    const grouped = items.reduce((acc: Record<string, TodoContent[]>, item: TodoContent) => {
                      const dateObj = new Date(item.last_updated || '');
                      let groupKey = '';

                      if (selectedTaskTodo.refresh_type === 'monthly') {
                        // Example: "August 2025"
                        groupKey = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
                      }
                      else if (selectedTaskTodo.refresh_type === 'weekly') {
                        // Calculate week number
                        const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
                        const days = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
                        const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);

                        groupKey = `Week ${weekNum}, ${dateObj.getFullYear()}`;
                      }
                      else {
                        // Default: Daily
                        groupKey = dateObj.toLocaleDateString();
                      }

                      if (!acc[groupKey]) acc[groupKey] = [];
                      acc[groupKey].push(item);

                      return acc;
                    }, {});

                    return Object.entries(grouped).map(([date, tasks]) => (
                      <div key={date} className="mb-2">
                        <div className="text-[10px] text-gray-500 font-medium mb-0.5">{date}</div>
                        {tasks.map((task) => (
                          <label
                            key={task.tc_id}
                            className="group flex items-center justify-between py-0.5 cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                checked={task.checked}
                                onChange={() => handleToggleCheck(task.tc_id)}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span
                                className={`${task.checked ? 'line-through text-gray-400' : 'text-gray-700'} text-xs`}
                              >
                                {task.content}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeleteTask(task.tc_id)}
                              className="text-gray-400 hover:text-red-500 text-[10px] opacity-0 group-hover:opacity-100 transition"
                            >
                              ×
                            </button>
                          </label>
                        ))}
                      </div>
                    ));
                  } else {
                    return filteredItems.map((item) => (
                      <div
                        key={item.tc_id}
                        className="group flex items-center justify-between py-0.5"
                      >
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleToggleCheck(item.tc_id)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          {editingTaskId === item.tc_id ? (
                            <input
                              type="text"
                              value={editingTaskContent}
                              onChange={(e) => setEditingTaskContent(e.target.value)}
                              onBlur={() => {
                                if (editingTaskContent.trim() && editingTaskContent !== item.content) {
                                  updateCheckStatus({ ...item, content: editingTaskContent });
                                }
                                setEditingTaskId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (editingTaskContent.trim() && editingTaskContent !== item.content) {
                                    updateCheckStatus({ ...item, content: editingTaskContent });
                                  }
                                  setEditingTaskId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingTaskId(null);
                                }
                              }}
                              className="text-xs border-b border-gray-300 focus:outline-none w-full"
                              autoFocus
                            />
                          ) : (
                            <span
                              className={`${item.checked ? 'line-through text-gray-400' : 'text-gray-700'} text-xs`}
                              onClick={() => {
                                setEditingTaskId(item.tc_id);
                                setEditingTaskContent(item.content);
                              }}
                            >
                              {item.content}
                            </span>
                          )}
                        </label>
                        <button
                          onClick={() => handleDeleteTask(item.tc_id)}
                          className="text-gray-400 hover:text-red-500 text-[10px] opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                      </div>
                    ));
                  }
                })()}

                {/* Add task */}
                <div className="flex gap-1 mt-1">
                  <input
                    type="text"
                    value={newTaskContent || ''}
                    onChange={(e) => setNewTaskContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask();
                    }}
                    placeholder="Add Task"
                    className="w-40 text-black text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddTask}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>

              </div>

              {/* Footer */}
              <div className="px-2 py-1 bg-gray-50 border-t text-[10px] text-gray-500 flex justify-between items-center">
                <div className="flex gap-1 items-center">
                  <button className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                    {selectedTaskTodo.refresh_type}
                  </button>
                </div>
                <div className="flex gap-0.5 text-black">
                  <button
                    onClick={() =>
                      setTodoView((prev) =>
                        prev === 'unchecked'
                          ? 'checked'
                          : prev === 'checked'
                            ? 'history'
                            : 'unchecked'
                      )
                    }
                    className="p-0.5 hover:text-blue-600"
                    title="Previous view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span>
                    {todoView === 'unchecked'
                      ? 'Pending Tasks'
                      : todoView === 'checked'
                        ? 'Completed Tasks'
                        : 'Task History'}
                  </span>
                  <button
                    onClick={() =>
                      setTodoView((prev) =>
                        prev === 'unchecked'
                          ? 'checked'
                          : prev === 'checked'
                            ? 'history'
                            : 'unchecked'
                      )
                    }
                    className="p-0.5 hover:text-blue-600"
                    title="Next view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <button onClick={() => setMaximizedTodo(selectedTaskTodo)}>
                  <Maximize2 className='h-4 w-4 text-gray-700' />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden custom-scrollbar">
        {/* Calendar Header */}
        <div className="border-b bg-white p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800">Planner</h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-1 rounded-full hover:bg-gray-100 text-black"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => dispatch(setSelectedDate(new Date().toISOString()))}
                  className="px-3 py-1 text-sm text-black font-medium rounded-md bg-blue-50 hover:bg-blue-100"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-1 rounded-full hover:bg-gray-100 text-black"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <span className="text-lg font-semibold text-black">
                {viewMode === 'day' && formatDate(selectedDate)}
                {viewMode === 'week' && `
                  ${formatDate(weekDays[0])} - 
                  ${formatDate(weekDays[6])}
                `}
                {viewMode === 'month' && new Date(selectedDate).toLocaleDateString([], {
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  ref={calendarButtonRef}
                  onClick={() => setShowMiniCalendar(prev => !prev)}
                  className="p-2 rounded-md hover:bg-gray-100 text-black"
                  title="Open calendar"
                >
                  <CalendarIcon size={18} />
                </button>

                {showMiniCalendar && (
                  <div className="absolute top-10 right-0 z-50">
                    <MiniCalendar
                      selectedDate={selectedDate}
                      onChange={(date) => {
                        dispatch(setSelectedDate(date.toISOString()));
                        setShowMiniCalendar(false);
                      }}
                    />
                  </div>
                )}

              </div>

              <button
                onClick={() => handleViewModeChange('day')}
                className={`px-3 py-1 text-sm text-black rounded-md ${viewMode === 'day' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                Day
              </button>
              <button
                onClick={() => handleViewModeChange('week')}
                className={`px-3 py-1 text-sm text-black rounded-md ${viewMode === 'week' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                Week
              </button>
              <button
                onClick={() => handleViewModeChange('month')}
                className={`px-3 py-1 text-sm text-black rounded-md ${viewMode === 'month' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'week' && (
            <div className="h-full flex flex-col">
              {/* Day headers */}
              <div className="grid grid-cols-8 border-b">
                <div className="border-r p-2"></div>
                {weekDays.map((day) => (
                  <div key={day.toString()} className="p-2 text-center">
                    <div className="text-sm font-medium text-black">
                      {day.toLocaleDateString([], { weekday: 'short' })}
                    </div>
                    <div
                      className={`text-sm w-8 h-8 flex items-center justify-center mx-auto rounded-full ${day.toDateString() === new Date().toDateString()
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700'
                        }`}
                    >
                      {day.getDate()}
                    </div>
                  </div>

                ))}
              </div>

              <div className="grid grid-cols-8 border-b bg-gray-50 text-xs">
                <div className="border-r p-1 text-right text-gray-600 font-semibold">All-day</div>
                {weekDays.map((day) => {
                  const dayStr = day.toDateString();
                  const allDayEvents = events.filter(event => {
                    const eventDate = new Date(event.start).toDateString();
                    return event.allDay && eventDate === dayStr;
                  });
                  const selectedGoalObj = goals.find(g => g.id === selectedGoalId);
                  return (
                    <div
                      key={dayStr}
                      className="border-r px-1 py-0.5 space-y-1"
                      onClick={(e) => {
                        e.stopPropagation();

                        const dayStart = new Date(day);
                        dayStart.setHours(0, 0, 0, 0);

                        const dayEnd = new Date(day);
                        dayEnd.setHours(23, 59, 59, 999);

                        setNewEventData({
                          id: '',
                          goalId: selectedGoalId || goals[0]?.id || '',
                          taskId: selectedTaskId || selectedGoalObj?.id || goals[0]?.tasks?.[0]?.collective_id || '',
                          title: '',
                          start: toLocalDateTimeInputValue(dayStart.toISOString()),
                          end: dayEnd.toISOString(),
                        });
                        setShowEventOnlyModal(true);
                      }}

                    >
                      {/* Existing all-day events */}
                      {Array.from(new Map(allDayEvents.map(ev => [ev.id, ev])).values()).map(event => (
                        <div
                          key={event.id || `${event.title}-${event.start}`}
                          className="bg-blue-100 text-white px-2 py-0.5 rounded text-xs truncate cursor-pointer z-100"
                          style={{ backgroundColor: event.color || '#3b82f6' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewEventData(event);
                            setShowEventOnlyModal(true);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}

                    </div>
                  );
                })}
              </div>

              {/* Time slots */}
              <div className="flex-1 grid grid-cols-8 overflow-auto" ref={timeGridRef}>
                {/* Time column */}
                <div className="border-r">
                  {timeSlots.map((time) => (
                    <div
                      key={time.toString()}
                      className="h-12 border-b flex items-start justify-end pr-2"
                    >
                      <span className="text-xs text-gray-500">
                        {formatTime(time)}
                      </span>
                    </div>
                  ))}

                </div>

                {/* Day columns */}
                {weekDays.map((day) => (
                  <div
                    key={day.toString()}
                    className="border-r relative"
                    onDrop={(e) => {
                      e.preventDefault();
                      if (timeSlotClicked) {
                        handleCalendarDrop(timeSlotClicked.time, day);
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {timeSlots.map((time) => {
                      const slotEvents = getEventsForSlot(day, time);
                      return (
                        <div
                          key={time.toString()}
                          className="h-12 border-b relative"
                          onClick={() => handleTimeSlotClick(time, day)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleActionDrop(e, day, time)}
                        >
                          {slotEvents.filter(event => !event.allDay).map((event) => (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute left-0 right-0 mx-1 p-1 rounded text-xs text-white font-medium overflow-hidden"
                              style={{
                                top: `${((new Date(event.start).getMinutes() / 60) * 100)}%`,
                                height: `${((new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60) * 100)}%`,
                                backgroundColor: event.color || '#3b82f6',
                                zIndex: 10
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentEvent(event);
                                setShowEventModal(true);
                              }}
                              draggable
                              onDragStartCapture={(e: React.DragEvent<HTMLDivElement>) => {
                                e.dataTransfer.setData('text/plain', event.id);
                              }}
                            >
                              <div className="truncate">{event.title}</div>
                              <div className="text-xs opacity-80">
                                {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      );
                    })}

                    {getActionsForDay(day, allActions, goals).map((action, index) => {
                      const [hh, mm] = action.time.split(':').map(Number);
                      const startMins = hh * 60 + mm;
                      const topOffset = (startMins / (24 * 60)) * 100;
                      const heightPercent = (action.durationMinutes / (24 * 60)) * 100;

                      // ⛔ avoid mutating day
                      const startDate = new Date(day);
                      startDate.setHours(hh, mm, 0, 0);
                      const endDate = addMinutes(startDate, action.durationMinutes);

                      return (
                        <motion.div
                          key={`action-${index}-${day.toISOString()}`}
                          draggable
                          onDragStartCapture={(e: React.DragEvent<HTMLDivElement>) => {
                            const evt: CalendarEvent = {
                              id: `event-${index}-${day.toISOString()}`,
                              title: action.title,
                              start: startDate.toISOString(),
                              end: endDate.toISOString(),
                              color: action.color,
                              repeat: action.repeatType,
                              allDay: false,
                              goalId: action.goal.id,
                              taskId: action?.task?.todo_id?.toString(),
                              ua_id: action.ua_id,
                              action_id: action.action_id,
                              isaction_log: action.isaction_log,
                              action_log_id: action.action_log_id,
                            };
                            handleActionDragStart(e, evt);
                          }}
                          onDragEnd={handleActionDragEnd}
                          className={`absolute left-0 right-0 mx-1 p-1 rounded text-xs text-white font-medium overflow-hidden select-none
    ${hoveredTaskId === action.task.id ? 'animate-hoverPulse' : ''}
    ${draggingActionId === `event-${index}` ? 'opacity-50 scale-[.98] cursor-grabbing' : 'cursor-grab'}
  `}
                          style={{
                            top: `${topOffset}%`,
                            height: `${heightPercent}%`,
                            backgroundColor: action.color,
                            zIndex: 6,
                            transition: 'transform 120ms ease, opacity 120ms ease',
                          }}
                          onClick={() => {
                            // Convert action data to Event format
                            const startDate = new Date(day);
                            const [hh, mm] = action.time.split(':').map(Number);
                            startDate.setHours(hh, mm, 0, 0);
                            const endDate = new Date(startDate);
                            endDate.setMinutes(startDate.getMinutes() + action.durationMinutes);
                            setCurrentEvent({
                              id: `event-${index}`, // or use action.a_id if available
                              title: action.title,
                              start: startDate.toISOString(),
                              end: endDate.toISOString(),
                              color: action.color,
                              repeat: action.repeatType,
                              allDay: false,
                              goalId: action.goal.id,
                              taskId: action?.task?.todo_id?.toString(),
                              ua_id: action.ua_id,
                              action_id: action.action_id,
                              isaction_log: action.isaction_log,
                              action_log_id: action.action_log_id
                            });

                            setShowEventModal(true);
                          }}
                        >
                          <div className="truncate">{action.title}</div>
                          <div className="text-xs opacity-80">
                            {formatTimes(action.time)} — {formatTimes(endDate)}
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* 🔴 Now line — only on today's column */}
                    {day.toDateString() === new Date().toDateString() && (() => {
                      const now = new Date();
                      const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
                      const topOffset = (minutesSinceMidnight / (24 * 60)) * 100;

                      return (
                        <div
                          className="absolute left-0 right-0 h-[1px] bg-red-500 z-30"
                          style={{ top: `${topOffset}%` }}
                        >
                          <div className="absolute w-2 h-2 bg-red-500 rounded-full -top-1 left-[-4px]"></div>
                        </div>
                      );
                    })()}
                  </div>
                ))}

              </div>
            </div>
          )}

          {/* Day view (simplified for example) */}
          {viewMode === 'day' && (
            <div className="h-full flex flex-col">
              {/* Date Header */}
              <div className="border-b p-4 text-center font-medium text-black">
                {formatDate(selectedDate)}
              </div>

              {/* All-day Row */}
              <div className="border-b grid grid-cols-12 bg-gray-50 text-xs">
                <div className="col-span-1 text-right pr-2 py-2 text-gray-600 font-semibold">
                  All-day
                </div>

                <div
                  className="col-span-10 py-2 space-y-1 relative"
                  onClick={(e) => {
                    e.stopPropagation();

                    const dayStart = new Date(selectedDate);
                    dayStart.setHours(0, 0, 0, 0);

                    const dayEnd = new Date(selectedDate);
                    dayEnd.setHours(23, 59, 59, 999);

                    setNewEventData({
                      id: '',
                      goalId: goals[0]?.id || '',
                      taskId: goals[0]?.tasks?.[0]?.collective_id || '',
                      title: '',
                      start: toLocalDateTimeInputValue(dayStart.toISOString()),
                      end: dayEnd.toISOString(),
                      allDay: true,
                      ua_id: getUserId(),
                    });
                    setShowEventOnlyModal(true);
                  }}
                >
                  {Array.from(
                    new Map(
                      events
                        .filter(ev =>
                          ev.allDay &&
                          new Date(ev.start).toDateString() === selectedDate.toDateString()
                        )
                        .map(ev => [ev.id, ev])
                    ).values()
                  ).map(ev => (
                    <div
                      key={ev.id || `${ev.title}-${ev.start}`}
                      className="w-full text-white text-[13px] font-semibold rounded-md px-3 py-1 cursor-pointer shadow-sm hover:brightness-105 transition z-10 relative"
                      style={{ backgroundColor: ev.color || '#0f9d58' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewEventData(ev);
                        setShowEventOnlyModal(true);
                      }}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Grid */}
              <div className="flex-1 overflow-auto relative" ref={timeGridRef}>
                <div className="relative">
                  {timeSlots.map((time) => (
                    <div
                      key={time.toString()}
                      className="flex h-12 border-b items-start"
                      onClick={() => handleTimeSlotClick(time, selectedDate)}
                    >
                      {/* Time Label */}
                      <div className="w-18 flex-shrink-0 text-right pr-2 pt-1">
                        <span className="text-xs text-gray-500">{formatTime(time)}</span>
                      </div>

                      {/* Event Cell */}
                      <div className="flex-1 h-full relative">
                        {getEventsForSlot(selectedDate, time)
                          .filter(event => !event.allDay)
                          .map((event) => {
                            const start = new Date(event.start);
                            const end = new Date(event.end);
                            const startMinutes = start.getHours() * 60 + start.getMinutes();
                            const endMinutes = end.getHours() * 60 + end.getMinutes();
                            const top = (startMinutes / (24 * 60)) * 100;
                            const height = ((endMinutes - startMinutes) / (24 * 60)) * 100;

                            return (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute left-1 right-1 rounded px-2 py-1 text-xs text-white font-medium overflow-hidden cursor-pointer hover:opacity-90 transition"
                                style={{
                                  backgroundColor: event.color || '#3b82f6',
                                  top: `${top}%`,
                                  height: `${height}%`,
                                  zIndex: 10,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentEvent(event);
                                  setShowEventModal(true);
                                }}
                              >
                                <div className="truncate">{event.title}</div>
                                <div className="text-xs opacity-80">
                                  {formatTime(start)} - {formatTime(end)}
                                </div>
                              </motion.div>
                            );
                          })}
                      </div>
                    </div>
                  ))}

                  {/* 🔴 Now Line */}
                  {selectedDate.toDateString() === new Date().toDateString() && (() => {
                    const now = new Date();
                    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
                    const topOffset = (minutesSinceMidnight / (24 * 60)) * 100;

                    return (
                      <div
                        className="absolute left-[80px] right-0 h-[1px] bg-red-500 z-30"
                        style={{ top: `${topOffset}%` }}
                      >
                        <div className="absolute w-2 h-2 bg-red-500 rounded-full -top-1 left-[-4px]"></div>
                      </div>
                    );
                  })()}

                  {/* ✅ Actions */}
                  {getActionsForDay(selectedDate, allActions, goals).map((action, index) => {
                    const [hh, mm] = action.time.split(':').map(Number);
                    const startMins = hh * 60 + mm;
                    const topOffset = (startMins / (24 * 60)) * 100;
                    const heightPercent = (action.durationMinutes / (24 * 60)) * 100;

                    return (
                      <motion.div
                        key={`action-${index}-${selectedDate.toISOString()}`}
                        className={`
                absolute left-[80px] right-2 p-1 rounded text-xs text-white font-semibold overflow-hidden
                ${hoveredTaskId === action.task.id ? 'animate-hoverPulse' : ''}
              `}
                        style={{
                          top: `${topOffset}%`,
                          height: `${heightPercent}%`,
                          backgroundColor: action.color,
                          zIndex: 6,
                        }}
                        onClick={() => {
                          const startDate = new Date(selectedDate);
                          startDate.setHours(hh, mm, 0, 0);
                          const endDate = new Date(startDate);
                          endDate.setMinutes(startDate.getMinutes() + action.durationMinutes);

                          setCurrentEvent({
                            id: `event-${index}`,
                            title: action.title,
                            start: startDate.toISOString(),
                            end: endDate.toISOString(),
                            color: action.color,
                            repeat: action.repeatType,
                            allDay: false,
                            goalId: action.goal.id,
                            taskId: action?.task?.todo_id?.toString(),
                            ua_id: action.ua_id,
                            action_id: action.action_id,
                            isaction_log: action.isaction_log,
                            action_log_id: action.action_log_id,
                          });

                          setShowEventModal(true);
                        }}
                      >
                        <div className="truncate">{action.title}</div>
                        <div className="text-[10px] opacity-80">
                          {formatTime(
                            new Date(
                              selectedDate.getFullYear(),
                              selectedDate.getMonth(),
                              selectedDate.getDate(),
                              hh,
                              mm
                            )
                          )} — {formatTime(
                            addMinutes(
                              new Date(
                                selectedDate.getFullYear(),
                                selectedDate.getMonth(),
                                selectedDate.getDate(),
                                hh,
                                mm
                              ),
                              action.durationMinutes
                            )
                          )}
                        </div>

                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}


          {/* Month view (simplified for example) */}
          {viewMode === 'month' && (
            <div className="h-full p-4">
              <div className="grid grid-cols-7 gap-1">
                {/* Weekday Labels */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-black text-center font-medium text-sm py-2">
                    {d}
                  </div>
                ))}

                {/* 42 calendar cells */}
                {Array.from({ length: 42 }).map((_, i) => {
                  const cellDate = new Date(selectedDate);
                  cellDate.setDate(1);
                  cellDate.setDate(cellDate.getDate() - cellDate.getDay() + i);

                  const isCurrentMonth = cellDate.getMonth() === new Date(selectedDate).getMonth();
                  const isToday = cellDate.toDateString() === new Date().toDateString();

                  const dayEvents = events.filter(ev => {
                    const d = new Date(ev.start);
                    return (
                      d.getDate() === cellDate.getDate() &&
                      d.getMonth() === cellDate.getMonth() &&
                      d.getFullYear() === cellDate.getFullYear()
                    );
                  });

                  const actionsForDate = goals.flatMap(goal =>
                    goal.tasks.flatMap(task =>
                      (allActions[task.id] || []).filter(action => {
                        const actionStart = new Date(action.by_datetime_value);
                        if (isNaN(actionStart.getTime()) || cellDate < actionStart) return false;

                        const isRepeating = action.repeat_status === "128";
                        const weekdayMap: Record<number, string> = {
                          76: "Monday",
                          77: "Tuesday",
                          78: "Wednesday",
                          79: "Thursday",
                          80: "Friday",
                          81: "Saturday",
                          82: "Sunday",
                        };
                        const cellWeekday = cellDate.toLocaleDateString("en-US", { weekday: "long" });

                        if (isRepeating) {
                          if (action.day_week && weekdayMap[action.day_week] === cellWeekday) return true;
                          if (action.day_month && cellDate.getDate() === Number(action.day_month)) return true;
                          if (!action.day_week && !action.day_month) return true;
                          return false;
                        } else {
                          return (
                            actionStart.getDate() === cellDate.getDate() &&
                            actionStart.getMonth() === cellDate.getMonth() &&
                            actionStart.getFullYear() === cellDate.getFullYear()
                          );
                        }
                      }).map(action => ({
                        title: action.name || 'Action',
                        color: task.color,
                      }))
                    )
                  );

                  return (
                    <div
                      key={i}
                      className={`border rounded min-h-24 p-1 transition-all duration-200
              ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
              ${isToday ? 'border-blue-500' : ''}`}
                    >
                      {/* Date Number */}
                      <div className={`text-right text-sm
              ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
              ${isToday ? 'font-bold' : ''}`}>
                        {cellDate.getDate()}
                      </div>

                      {/* Events & Actions */}
                      <div className="space-y-1 mt-1">
                        {/* Show up to 2 events */}
                        {dayEvents
                          .filter((ev, idx, self) =>
                            self.findIndex(e =>
                              new Date(e.start).toDateString() === new Date(ev.start).toDateString() &&
                              e.id === ev.id
                            ) === idx
                          )
                          .slice(0, 2)
                          .map(ev => (
                            <div
                              key={ev.id}
                              className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-90 transition"
                              style={{ backgroundColor: ev.color || '#3b82f6', color: 'white' }}
                              onClick={() => {
                                setCurrentEvent(ev);
                                setShowEventModal(true);
                              }}
                            >
                              {(ev.title || 'Untitled').slice(0, 25)}
                            </div>
                          ))}


                        {/* Show actions after event slots filled */}
                        {actionsForDate.slice(0, 2 - Math.min(2, dayEvents.length)).map((act, idx) => (
                          <div
                            key={`act-${idx}-${cellDate.toDateString()}`}
                            className="text-xs p-1 rounded truncate text-white"
                            style={{ backgroundColor: act.color }}
                          >
                            {act.title.slice(0, 25)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Right Content */}
      <div className="w-80 border-l bg-white p-6 overflow-y-auto space-y-8 shadow-inner custom-scrollbar">
        {/* 🟦 Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Progress Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Viewing: <span className="font-medium">{currentViewName}</span></p>
        </div>

        <div className="w-full h-40 flex items-end justify-between bg-white rounded-xl px-4 py-4 border shadow-sm">
          {currentMapStats.daily_breakdown.map((day, i) => (
            <div key={i} className="flex flex-col items-center group relative">
              {/* Hover Value */}
              <div className="absolute -top-6 text-xs text-gray-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {day.hour_spent}h
              </div>

              {/* Bar */}
              <div
                className="w-6 rounded-t-xl bg-gradient-to-t from-blue-500 to-blue-400 shadow-md group-hover:scale-105 transition-transform duration-200"
                style={{
                  height: `${day.hour_spent * 15}px`,
                  minHeight: "4px"
                }}
              />

              {/* Date Label */}
              <span className="text-[9px] text-gray-500 mt-2 font-medium">
                {day.date?.slice(0, 5)}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-semibold text-xl">{currentMapStats?.total_hours || 0}</p>
            <p className="text-md text-gray-500">Total</p>
          </div>
          <div>
            <p className="font-semibold text-xl">{currentMapStats?.average || 0}</p>
            <p className="text-md text-gray-500">Average</p>
          </div>
          <div>
            <p className="font-semibold text-xl">{currentMapStats?.peak || 0}</p>
            <p className="text-md text-gray-500">Peak</p>
          </div>
        </div>
        <div className='inline-flex gap-20'>
          <p className="text-md text-gray-500">Avg. Effort</p>
          <p className="font-semibold text-xl text-black">{currentMapStats?.average || 0}</p>
        </div>

        {/* Upcoming Actions Section */}
        <div className="bg-white rounded-lg shadow p-4 h-full overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3 text-black">Upcoming Actions</h2>

          {allActions && Object.keys(allActions).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(allActions).map(([goalId, actions]: [string, any[]]) => {
                const upcoming = actions.filter(
                  (a) => !a.validity_flag || a.validity_flag === "valid"
                );

                if (upcoming.length === 0) return null;

                return (
                  <div key={goalId}>

                    <div className="space-y-3">
                      {upcoming.map((action, idx) => {
                        const dateStr = action.by_datetime_value
                          ? new Date(action.by_datetime_value).toLocaleString()
                          : new Date(action.action_timestamp).toLocaleString();

                        return (
                          <div
                            key={idx}
                            className="border rounded-lg p-3 flex justify-between items-center"
                          >
                            <div>
                              <div className="font-medium text-gray-900">{action.name}</div>
                              <div className="text-xs text-gray-500">{dateStr}</div>
                              <div className="text-xs text-gray-400">
                                {action.duration_value} hour
                              </div>
                            </div>
                            <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-green-100 text-green-800">
                              Upcoming
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No upcoming actions</p>
          )}
        </div>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {showEventModal && currentEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">
                  {currentEvent.id ? 'Edit Action' : 'Create Action'}
                </h3>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Goal</label>
                  <select
                    value={currentEvent.goalId}
                    onChange={(e) => {
                      const newGoalId = e.target.value;
                      const newTaskId = goals.find(g => g.id === newGoalId)?.tasks?.[0]?.id || "";

                      setCurrentEvent(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          goalId: newGoalId,
                          taskId: newTaskId,
                        } as Event;
                      });
                    }}
                    className="w-full border rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {goals.map(goal => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Task</label>
                  <select
                    value={currentEvent.taskId}
                    onChange={(e) => {
                      const newTaskId = e.target.value;
                      setCurrentEvent(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          taskId: newTaskId,
                        } as Event;
                      });
                    }}
                    className="w-full border rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {(goals.find(g => g.id === currentEvent.goalId)?.tasks || []).map(task => (
                      <option key={task.collective_id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={currentEvent.title}
                    onChange={(e) =>
                      setCurrentEvent({ ...currentEvent, title: e.target.value })
                    }
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                    placeholder="Event title"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      value={toLocalDateTimeInputValue(currentEvent.start)}
                      onChange={(e) =>
                        setCurrentEvent({ ...currentEvent, start: new Date(e.target.value).toISOString() })
                      }
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">End Time</label>
                    <input
                      type="datetime-local"
                      value={toLocalDateTimeInputValue(currentEvent.end)}
                      onChange={(e) =>
                        setCurrentEvent({ ...currentEvent, end: new Date(e.target.value).toISOString() })
                      }
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Repeat</label>
                  <select
                    value={currentEvent.repeat ?? 'once'}
                    onChange={(e) => {
                      const newRepeat = e.target.value as Event['repeat'];
                      setCurrentEvent(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          repeat: newRepeat,
                        } as Event;
                      });
                    }}
                    className="w-full border rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="once">Just once</option>
                  </select>
                </div>


              </div>

              <div className="flex justify-between items-center border-t border-gray-200 p-4">
                {currentEvent.id && (
                  <button
                    onClick={handleEventDelete}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 text-sm rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEventSave}
                    className="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {currentEvent.id ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEventOnlyModal && newEventData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50"
            onClick={() => setShowEventOnlyModal(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">
                  {newEventData?.id ? "Edit Event" : "Create Event"}
                </h3>

              </div>

              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Goal</label>
                  <select
                    value={newEventData.goalId}
                    onChange={(e) => {
                      const newGoalId = e.target.value;
                      const newTaskId = goals.find(g => g.id === newGoalId)?.tasks?.[0]?.id || '';
                      setNewEventData(prev => ({ ...prev!, goalId: newGoalId, taskId: newTaskId }));
                    }}
                    className="w-full border rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {goals.map(goal => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Task</label>
                  <select
                    value={newEventData.taskId}
                    onChange={(e) =>
                      setNewEventData(prev => ({ ...prev!, taskId: e.target.value }))
                    }
                    className="w-full border rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {(goals.find(g => g.id === newEventData.goalId)?.tasks || []).map(task => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={newEventData.title}
                    onChange={(e) =>
                      setNewEventData(prev => ({ ...prev!, title: e.target.value }))
                    }
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                    placeholder="Event title"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Event Day-Time</label>
                    <input
                      type="datetime-local"
                      value={toLocalDateTimeInputValue(newEventData.start)}
                      onChange={(e) =>
                        setNewEventData(prev => ({ ...prev!, start: e.target.value }))
                      }
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-center border-t border-gray-200 p-4 gap-2">
                {newEventData.id && (
                  <button
                    onClick={async () => {
                      try {
                        const payload = {
                          ua_id: newEventData?.ua_id,
                          a_id: 33,
                          at_id: 302,
                          flag: "PT",
                          action: "DELETE",
                          cat_qty_id1: newEventData.taskId
                        };
                        await fetch(`https://meseer.com/dog/update-delete-data/primary-mwb`, {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify(payload),
                        });
                        setShowEventOnlyModal(false);
                        setNewEventData(null);
                        await reload();
                      } catch (err) {
                        console.error("Failed to delete item", err);
                      }
                    }}
                    className="px-4 py-2 text-sm rounded-lg  bg-gray-100 hover:bg-gray-200 text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setShowEventOnlyModal(false)}
                  className="px-4 py-2 text-sm rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const token = getUserToken();
                    const isEditing = !!newEventData?.id;

                    const payload: any = {
                      a_id: 33,
                      at_id: 302,
                      flag: "PT",
                      trigger: "Event",
                      is_active: "Y",
                      user_id: getUserId(),
                      event_time: new Date().toISOString().slice(0, 19),
                      description: "Event",
                      cat_qty_id1: Number(newEventData.taskId),
                      value1: "",
                      value2: "",
                      value3: newEventData.title,
                      value4: newEventData.start,
                      value5: "",
                      value6: "",
                      cat_qty_id2: 0,
                      cat_qty_id3: 23,
                      cat_qty_id4: 58,
                      cat_qty_id5: 0,
                      cat_qty_id6: 0,
                    };
                    if (isEditing) {
                      payload.ua_id = newEventData.ua_id;
                      payload.action = "UPDATE";
                    }
                    try {
                      const endpoint = isEditing
                        ? 'https://meseer.com/dog/update-delete-data/primary-mwb'  // use correct endpoint
                        : 'https://meseer.com/dog/add-data/primary-mwb/';

                      await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                      });

                      setShowEventOnlyModal(false);
                      setNewEventData(null);
                      await reload();
                    } catch (err) {
                      console.error(isEditing ? "Failed to update event" : "Failed to create event", err);
                    }
                  }}
                  className="px-4 py-2 text-sm rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  {newEventData?.id ? "Update" : "Save"}
                </button>


              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {maximizedTodo && (
        <div className="fixed inset-0 z-50 flex justify-center backdrop-brightness-50 items-center bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-auto relative p-5">

            {/* Close & View Switch */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              onClick={() => setMaximizedTodo(null)}
            >
              ✕
            </button>

            {/* Title */}
            <h2 className="text-lg font-semibold text-gray-900 mb-1">To-do List</h2>
            <p className="text-sm text-gray-500 mb-4">{maximizedTodo.name}</p>

            {/* Task List */}
            <div className="space-y-2">
              {(() => {
                const items = maximizedTodo.contents ?? [];
                if (todoView === "history") {
                  const grouped = items.reduce((acc: Record<string, TodoContent[]>, item: TodoContent) => {
                    const dateObj = new Date(item.last_updated || '');
                    let groupKey = '';

                    if (maximizedTodo.refresh_type === 'monthly') {
                      // Example: "August 2025"
                      groupKey = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
                    }
                    else if (maximizedTodo.refresh_type === 'weekly') {
                      // Calculate week number
                      const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
                      const days = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
                      const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);

                      groupKey = `Week ${weekNum}, ${dateObj.getFullYear()}`;
                    }
                    else {
                      // Default: Daily
                      groupKey = dateObj.toLocaleDateString();
                    }

                    if (!acc[groupKey]) acc[groupKey] = [];
                    acc[groupKey].push(item);

                    return acc;
                  }, {});

                  return Object.entries(grouped).map(([date, tasks]) => (
                    <div key={date}>
                      <div className="text-[10px] text-gray-500 font-medium mb-0.5">{date}</div>
                      {tasks.map((task) => (
                        <div
                          key={task.tc_id}
                          className="group flex items-center justify-between px-3 py-2 rounded-md bg-gray-50 hover:bg-gray-100 transition"
                        >
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={task.checked}
                              onChange={() => handleToggleCheck(task.tc_id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span
                              className={`text-sm ${task.checked ? "line-through text-gray-400" : "text-gray-700"
                                }`}
                            >
                              {task.content}
                            </span>
                          </label>
                          <button
                            onClick={() => handleDeleteContent(task.tc_id)}
                            className="text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ));
                } else {
                  return items
                    .filter((item) => (todoView === "unchecked" ? !item.checked : item.checked))
                    .map((item) => (
                      <div
                        key={item.tc_id}
                        className="group flex items-center justify-between px-3 py-2 rounded-md bg-gray-50 hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleToggleCheck(item.tc_id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          {editingTaskId === item.tc_id ? (
                            <input
                              type="text"
                              value={editingTaskContent}
                              onChange={(e) => setEditingTaskContent(e.target.value)}
                              onBlur={() => {
                                if (
                                  editingTaskContent.trim() &&
                                  editingTaskContent !== item.content
                                ) {
                                  updateCheckStatus({ ...item, content: editingTaskContent });
                                }
                                setEditingTaskId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  if (
                                    editingTaskContent.trim() &&
                                    editingTaskContent !== item.content
                                  ) {
                                    updateCheckStatus({ ...item, content: editingTaskContent });
                                  }
                                  setEditingTaskId(null);
                                } else if (e.key === "Escape") {
                                  setEditingTaskId(null);
                                }
                              }}
                              className="text-sm border-b border-gray-300 focus:outline-none w-full"
                              autoFocus
                            />
                          ) : (
                            <span
                              className={`cursor-pointer text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-700"
                                }`}
                              onClick={() => {
                                setEditingTaskId(item.tc_id);
                                setEditingTaskContent(item.content);
                              }}
                            >
                              {item.content}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteContent(item.tc_id)}
                          className="text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                      </div>
                    ));
                }
              })()}
            </div>

            {/* Add Task */}
            {todoView === "unchecked" && (
              <div className="flex gap-2 mt-4 p-2 bg-gray-100 rounded-md">
                <input
                  value={newTaskContent}
                  onChange={(e) => setNewTaskContent(e.target.value)}
                  placeholder="Add Task"
                  className="flex-1 border text-black rounded-md px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddTask();
                    else if (e.key === "Escape") setNewTaskContent("");
                  }}
                />
                <button
                  onClick={handleAddTask}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                >
                  Add
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center mt-5 text-xs text-gray-500 border-t pt-3">
              <div className="flex gap-1 items-center">
                <button className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                  {maximizedTodo.refresh_type}
                </button>
              </div>
              <div className="flex gap-0.5 text-black">
                <button
                  onClick={() =>
                    setTodoView((prev) =>
                      prev === 'unchecked'
                        ? 'checked'
                        : prev === 'checked'
                          ? 'history'
                          : 'unchecked'
                    )
                  }
                  className="p-0.5 hover:text-blue-600"
                  title="Previous view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span>
                  {todoView === 'unchecked'
                    ? 'Pending Tasks'
                    : todoView === 'checked'
                      ? 'Completed Tasks'
                      : 'Task History'}
                </span>
                <button
                  onClick={() =>
                    setTodoView((prev) =>
                      prev === 'unchecked'
                        ? 'checked'
                        : prev === 'checked'
                          ? 'history'
                          : 'unchecked'
                    )
                  }
                  className="p-0.5 hover:text-blue-600"
                  title="Next view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;
