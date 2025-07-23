'use client';
import Cookies from 'js-cookie';
import { getUserId, getUserToken } from "../utils/auth";
import { Calendar as CalendarIcon } from 'lucide-react';
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
  updateGoal,
  deleteGoal,
  addTask,
  updateTask,
  deleteTask,
  selectGoal
} from '../features/calendar/calendarSlice';
import {
  fetchGoalsAndTasks,
  fetchTodoItems,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  fetchActionsForTasks,
  mapActionToEvent,
  fetchEvents
} from "../lib/api"; // Adjust path if needed
import { Calendar as ReactCalendar, CalendarProps } from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // still needed
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
type UserInfo = {
  access_token: string;
  email: string;
  message: string;
  name: string;
  payment_details: string;
  payment_type: string;
  phone: string;
  user_id: string;
};
type ViewMode = 'day' | 'week' | 'month';
type EventCategory = 'exercise' | 'eating' | 'work' | 'relax' | 'family' | 'social';

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  category: EventCategory;
  goalId?: string;
  taskId?: string;
  color?: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly' | 'once';
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

const GoalsPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const {
    selectedDate: selectedDateStr,
    viewMode,
    events,
    goals,
    selectedGoalId
  } = useSelector((state: RootState) => state.calendar);

  const selectedDate = useMemo(() => new Date(selectedDateStr), [selectedDateStr]);

  // State for UI controls
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [timeSlotClicked, setTimeSlotClicked] = useState<{ time: Date; day: Date } | null>(null);
  const goalsFromRedux = useSelector((state: RootState) => state.calendar.goals);
  const [clickedTaskActions, setClickedTaskActions] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedGoalIdFromSidebar = useSelector((state: RootState) => state.calendar.selectedGoalId);
  const [allActions, setAllActions] = useState<Record<string, any[]>>({});
  const [sidebarDate, setSidebarDate] = useState<Date>(new Date());
  const timeGridRef = useRef<HTMLDivElement>(null);
  // Add these state variables inside the GoalsPage component
  const [selectedTaskTodo, setSelectedTaskTodo] = useState<Todo | null>(null);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskContent, setEditingTaskContent] = useState("");
  const [todoView, setTodoView] = useState<'unchecked' | 'checked' | 'history'>('unchecked');
  const sensors = useSensors(useSensor(PointerSensor));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedGoalIds, setExpandedGoalIds] = useState<string[]>([]);
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);

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
      const response = await fetch(`https://meseer.com/dog/todos/${task.todo_id}/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`Status ${response.status}`);

      const data = await response.json();

      let finalTodo: Todo = {
        todo_id: task.todo_id.toString(),
        name: "Untitled",
        contents: [],
        refresh_type: "daily"
      };

      if (data.todo_data && Array.isArray(data.todo_data)) {
        // CASE 1: grouped format (object with keys like "304, Check 1")
        const group = data.todo_data.find((obj: any) =>
          typeof obj === 'object' && Object.keys(obj).length > 0
        );
        if (group) {
          const [key, rawContents] = Object.entries(group)[0];
          const contents = rawContents as TodoContent[];

          finalTodo = {
            todo_id: key.split(',')[0].trim(),
            name: key.split(',').slice(1).join(',').trim() || "Untitled",
            contents,
            refresh_type: contents?.[0]?.refresh_type || "daily"
          };
        }

      } else if (Array.isArray(data)) {
        // CASE 2: flat array of todos (like your current JSON)
        finalTodo = {
          todo_id: data[0]?.todo_id?.toString() || task.todo_id.toString(),
          name: data[0]?.name || "Untitled",
          contents: data,
          refresh_type: data[0]?.refresh_type || "daily"
        };
      }

      setSelectedTaskTodo(finalTodo);
    } catch (err) {
      console.error("Error fetching todo:", err);
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
    if (!selectedTaskTodo) return;

    setSelectedTaskTodo(prev => {
      if (!prev) return prev;

      const updatedContents = (prev as any).contents.map((item: any) => {
        if (item.tc_id === tcId) {
          const updatedItem = {
            ...item,
            checked: !item.checked
          };
          updateCheckStatus(updatedItem);
          return updatedItem;
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
    if (!selectedTaskTodo || !newTaskContent.trim()) return;

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
          todo_id: selectedTaskTodo.todo_id,
          user_id: userId,
          content: newTaskContent.trim(),
          checked: false,
          urgent: true,
          important: false,
          version: "v1",
          created_date: now,
          last_updated: now,
          refresh_type: selectedTaskTodo.refresh_type || "daily",
        }),
      });

      if (response.ok) {
        // Refresh the todo data
        const refreshResponse = await fetch(`https://meseer.com/dog/get-todo-wordpad/lastest-version/${userId}/${selectedTaskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const todos: Todo[] = [];
          data.todo_data.forEach((todoObj: Record<string, Todo[]>) => {
            Object.values(todoObj).forEach(todoArray => {
              todos.push(...todoArray);
            });
          });

          if (todos.length > 0) {
            setSelectedTaskTodo(todos[0]);
          }
        }

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

  useEffect(() => {
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
              const eventsData = await fetchEvents(userId, '33', collectiveId);

              eventsData.forEach((action: any) => {
                const event = mapActionToEvent(action, task.id, goal.id, goal.color);
                if (event) {
                  const safeEvent = {
                    ...event,
                    start: new Date(event.start).toISOString(),
                    end: new Date(event.end).toISOString(),
                  };
                  dispatch(addEvent(safeEvent));
                }

              });
            } catch (error) {
              console.error(`❌ Failed to fetch events for collectiveId ${collectiveId}`, error);
            }
          }
        }

      } catch (err) {
        console.error("🚨 Error in loadData:", err);
      }
    };

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

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    dispatch(setViewMode(mode));
  };

  // Handle time slot click
  const handleTimeSlotClick = (time: Date, day: Date) => {
    const startDate = new Date(day);
    startDate.setHours(time.getHours(), time.getMinutes());

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);

    setCurrentEvent({
      id: '',
      title: '',
      start: startDate.toISOString(), // ✅ convert to string
      end: endDate.toISOString(),     // ✅ convert to string
      category: 'work',
      color: '#3b82f6',
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
      category: 'work',
      goalId: draggedTask.goalId,
      taskId: draggedTask.id,
      color: draggedTask.color
    });

    setShowEventModal(true);
    setDraggedTask(null);
  };

  // Handle event save
  const handleEventSave = async () => {
    if (!currentEvent) return;

    if (currentEvent.id) {
      dispatch(updateEvent(currentEvent));
      await updateEvent(currentEvent); // <-- API call
    } else {
      const newEvent = { ...currentEvent, id: Date.now().toString() };
      dispatch(addEvent(newEvent));
      await createCalendarEvent(newEvent);
    }

    setShowEventModal(false);
    setCurrentEvent(null);
  };

  const handleEventDelete = async () => {
    if (!currentEvent?.id) return;

    dispatch(deleteEvent(currentEvent.id));
    await deleteEvent(currentEvent.id); // <-- API call
    setShowEventModal(false);
    setCurrentEvent(null);
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

  const handleSidebarDateChange: CalendarProps['onChange'] = (value, _event) => {
    const date = Array.isArray(value) ? value[0] : value;
    if (date instanceof Date) {
      setSidebarDate(date);
      dispatch(setSelectedDate(date.toISOString()));
    }
  };

  const getActionsForDay = (day: Date, allActions: Record<string, any[]>, goals: Goal[]): {
    title: string;
    color: string;
    time: string;
    durationMinutes: number;
  }[] => {
    const actions: {
      title: string;
      color: string;
      time: string;
      durationMinutes: number;
    }[] = [];

    const weekdayName = day.toLocaleDateString('en-US', { weekday: 'long' });

    for (const goal of goals) {
      for (const task of goal.tasks) {
        const taskActions = allActions[task.id] || [];

        for (const action of taskActions) {
          const title = action.value3 || "Action";
          const color = task.color || "#3b82f6";
          const timeStr = (action.value5 || "00:00").trim();
          const [hh, mm] = timeStr.split(":").map(Number);
          if (isNaN(hh) || isNaN(mm)) continue;

          const unit = action.cat_qty_id6?.find((u: any) => u.Selected)?.name || "mins";
          let duration = parseInt(action.value6 || "30");
          if (isNaN(duration)) duration = 30;
          if (unit === "hours") duration *= 60;

          const isWeekly = Array.isArray(action.cat_qty_id4) &&
            action.cat_qty_id4.some((e: any) => e.Selected);
          const weekdays = isWeekly
            ? action.cat_qty_id4.filter((e: any) => e.Selected).map((e: any) => e.name)
            : [];

          if (weekdays.includes(weekdayName)) {
            actions.push({
              title,
              color,
              time: timeStr,
              durationMinutes: duration,
            });
          }
        }
      }
    }

    return actions;
  };

  const addMinutes = (date: Date, minutes: number): Date => {
    return new Date(date.getTime() + minutes * 60000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white p-4 overflow-y-auto custom-scrollbar">
        <div className="flex justify items-center mb-6">
          <ChevronLeft className='mr-3 text-black' onClick={() => router.push('/main')} />
          <h2 className="text-xl font-bold text-gray-800">Goals</h2>
        </div>
        {/* <div className="mb-6">
          <ReactCalendar
            value={sidebarDate}
            onChange={handleSidebarDateChange}
            selectRange={false}
            calendarType="gregory"
            className="!border-none !shadow-sm"
            tileClassName={({ date, view }) =>
              view === 'month' && date.toDateString() === new Date().toDateString()
                ? '!bg-blue-600 !text-white font-bold'
                : undefined
            }
            navigationLabel={({ date }) => (
              <span className="text-sm font-medium text-gray-700">
                {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
            formatShortWeekday={(locale, date) =>
              ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]
            }
            minDetail="month"
            nextLabel={<ChevronRight size={16} className="text-gray-500" />}
            prevLabel={<ChevronLeft size={16} className="text-gray-500" />}
            next2Label={null}
            prev2Label={null}
          />
        </div> */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">My Goals</h2>
          <div className="space-y-1">
            {goals.map(goal => {
              const isExpanded = expandedGoalIds.includes(goal.id);

              return (
                <div key={goal.id}>
                  {/* Goal Header */}
                  <div
                    className="flex items-center justify-between px-2 py-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() =>
                      setExpandedGoalIds(prev =>
                        prev.includes(goal.id)
                          ? prev.filter(id => id !== goal.id)
                          : [...prev, goal.id]
                      )
                    }
                  >
                    <span className="truncate font-medium text-gray-800">{goal.title}</span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </motion.div>
                  </div>

                  {/* Tasks with animation */}
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
                          {goal.tasks.map(task => (
                            <div
                              key={task.id}
                              className={`text-sm text-gray-700 py-1 flex items-center gap-2 ${selectedTaskId === task.id ? 'bg-gray-100 font-medium rounded' : ''
                                }`}
                              draggable
                              onClick={() => handleTaskClick(task.id)}
                              onDragStart={() => handleTaskDragStart(task)}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: task.color }}
                              />
                              {task.title}
                            </div>
                          ))}
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
          <div className="mt-6 border-t pt-4">
            <h3 className="text-md font-bold text-gray-900 mb-2">Todos</h3>
            <h3 className="text-md font-semibold text-gray-800 mb-2">Task Todo</h3>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Todo Header */}
              <div className="px-3 py-2 bg-gray-50 border-b flex justify-between items-center">
                <span className="font-medium text-sm text-gray-500">{selectedTaskTodo.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setTodoView(prev =>
                      prev === 'unchecked' ? 'checked' :
                        prev === 'checked' ? 'history' : 'unchecked'
                    )}
                    className="p-1 text-gray-500 hover:text-blue-600"
                    title="Change view"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Todo Content */}
              <div className="max-h-64 overflow-y-auto p-2">
                {/* Filter tasks based on view */}
                {(() => {
                  const items = selectedTaskTodo?.contents || [];

                  if (todoView === 'history') {
                    const grouped = items.reduce((acc: Record<string, TodoContent[]>, item: TodoContent) => {
                      const date = new Date(item.last_updated || '').toLocaleDateString();
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(item);
                      return acc;
                    }, {});

                    return Object.entries(grouped).map(([date, tasks]) => (
                      <div key={date} className="mb-3">
                        <div className="text-xs text-gray-500 font-medium mb-1">{date}</div>
                        {tasks.map((task) => (
                          <div key={task.tc_id} className="flex items-center gap-2 p-1 text-sm">
                            <input
                              type="checkbox"
                              checked={task.checked}
                              onChange={() => handleToggleCheck(task.tc_id)}
                              className="h-3 w-3"
                            />
                            <span className={`text-gray-600 ${task.checked ? 'line-through text-gray-400' : ''}`}>
                              {task.content}
                            </span>
                          </div>
                        ))}
                      </div>
                    ));
                  } else {
                    return items
                      .filter((item) => todoView === 'unchecked' ? !item.checked : item.checked)
                      .map((item) => (
                        <div key={item.tc_id} className="flex items-center justify-between p-1 text-sm">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => handleToggleCheck(item.tc_id)}
                              className="h-3 w-3"
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
                                className="text-sm border-b border-gray-300 focus:outline-none w-full"
                                autoFocus
                              />
                            ) : (
                              <span
                                className={`cursor-pointer text-gray-600 ${item.checked ? 'line-through text-gray-400' : ''}`}
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
                            onClick={() => handleDeleteTask(item.tc_id)}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ));
                  }
                })()}

                {/* Add new task input */}
                {newTaskContent !== null && (
                  <div className="p-1">
                    <input
                      type="text"
                      value={newTaskContent}
                      onChange={(e) => setNewTaskContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddTask();
                        } else if (e.key === 'Escape') {
                          setNewTaskContent("");
                        }
                      }}
                      placeholder="Add task and press Enter"
                      className="w-full text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Todo Footer */}
              <div className="px-3 py-1 bg-gray-50 border-t text-xs text-gray-500 flex justify-between">
                <span>{todoView} view</span>
                <span>{selectedTaskTodo.refresh_type}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
                  <div className="absolute top-10 right-0 z-50 bg-white border rounded-lg shadow-md">
                    <ReactCalendar
                      onChange={(value) => {
                        const selected = Array.isArray(value) ? value[0] : value;
                        if (selected instanceof Date) {
                          dispatch(setSelectedDate(selected.toISOString()));
                          setShowMiniCalendar(false);
                        }
                      }}
                      value={selectedDate}
                      calendarType="gregory"
                      className="!border-none !shadow-none"
                      tileClassName={({ date, view }) =>
                        view === 'month' && date.toDateString() === new Date().toDateString()
                          ? '!bg-blue-600 !text-white font-bold'
                          : undefined
                      }
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

                  // 🆕 Get actions that match this day and have no specific time
                  const actionsForDay = (() => {
                    const result: { title: string; color: string }[] = [];

                    for (const goal of goals) {
                      for (const task of goal.tasks) {
                        const actions = allActions[task.id] || [];

                        actions.forEach(action => {
                          const title = action.value3 || "Action";
                          const color = task.color;

                          const repeat = (() => {
                            if (action.value4?.includes('/')) return 'daily';
                            if (Array.isArray(action.cat_qty_id4) && action.cat_qty_id4.some((e: any) => e.Selected)) return 'weekly';
                            if (!isNaN(Number(action.value4))) return 'monthly';
                            return 'once';
                          })();

                          if (repeat === 'daily' && action.value4) {
                            const actionDate = new Date(action.value4);
                            if (actionDate.toDateString() === day.toDateString() && !action.value5) {
                              result.push({ title, color });
                            }
                          }

                          if (repeat === 'weekly') {
                            const weekdays = action.cat_qty_id4?.filter((e: any) => e.Selected).map((e: any) => e.name);
                            const weekdayName = day.toLocaleDateString('en-US', { weekday: 'long' });
                            if (weekdays?.includes(weekdayName) && !action.value5) {
                              result.push({ title, color });
                            }
                          }

                          if (repeat === 'monthly' && action.value4) {
                            const dayNum = parseInt(action.value4);
                            if (day.getDate() === dayNum && !action.value5) {
                              result.push({ title, color });
                            }
                          }
                        });
                      }
                    }

                    return result;
                  })();

                  return (
                    <div key={dayStr} className="border-r px-1 py-0.5 space-y-1">
                      {/* Existing all-day events */}
                      {allDayEvents.map(event => (
                        <div
                          key={event.id}
                          className="bg-blue-100 text-white px-2 py-0.5 rounded text-xs truncate cursor-pointer"
                          style={{ backgroundColor: event.color || '#3b82f6' }}
                          onClick={() => {
                            setCurrentEvent(event);
                            setShowEventModal(true);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}

                      {/* 🆕 Actions that fall on this day but have no time */}
                      {actionsForDay.map((action, i) => (
                        <div
                          key={`action-${i}-${dayStr}`}
                          className="bg-purple-600 text-white px-2 py-0.5 rounded text-xs truncate"
                          style={{ backgroundColor: action.color }}
                        >
                          {action.title}
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

                      return (
                        <motion.div
                          key={`action-${index}-${day.toISOString()}`}
                          className="absolute left-0 right-0 mx-1 p-1 rounded text-xs text-white font-medium overflow-hidden"
                          style={{
                            top: `${topOffset}%`,
                            height: `${heightPercent}%`,
                            backgroundColor: action.color,
                            zIndex: 6,
                          }}
                        >
                          <div className="truncate">{action.title}</div>
                          <div className="text-xs opacity-80">
                            {action.time} — {formatTime(
                              addMinutes(new Date(day.setHours(hh, mm, 0, 0)), action.durationMinutes)
                            )}
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

              {/* All-day row */}
              <div className="border-b grid grid-cols-12 bg-gray-50 text-xs">
                <div className="col-span-2 text-right pr-2 py-2 text-gray-600 font-semibold">
                  All-day
                </div>
                <div className="col-span-10 py-2 space-y-1">
                  {events
                    .filter(ev =>
                      ev.allDay &&
                      new Date(ev.start).toDateString() === selectedDate.toDateString()
                    )
                    .map(ev => (
                      <div
                        key={ev.id}
                        className="w-full max-w-xs text-white text-[13px] font-semibold rounded-md px-3 py-1 cursor-pointer shadow-sm hover:brightness-105 transition"
                        style={{ backgroundColor: ev.color || '#0f9d58' }}
                        onClick={() => {
                          setCurrentEvent(ev);
                          setShowEventModal(true);
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                </div>
              </div>

              {/* Time Grid */}
              <div className="flex-1 overflow-auto relative" ref={timeGridRef}>
                {/* 💡 Add a relative wrapper to hold both time grid and actions */}
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
                          .map((event) => (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute left-1 right-1 top-1 bottom-1 px-2 py-1 rounded text-xs text-white font-medium overflow-hidden"
                              style={{
                                backgroundColor: event.color || '#3b82f6',
                                zIndex: 10
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentEvent(event);
                                setShowEventModal(true);
                              }}
                            >
                              <div className="truncate">{event.title}</div>
                              <div className="text-xs opacity-80">
                                {formatTime(new Date(event.start))} - {formatTime(new Date(event.end))}
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    </div>
                  ))}
                  {/* 🔴 Now line for Day View */}
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
                  {/* ✅ Render all actions once per day — positioned accurately */}
                  {getActionsForDay(selectedDate, allActions, goals).map((action, index) => {
                    const [hh, mm] = action.time.split(':').map(Number);
                    const startMins = hh * 60 + mm;
                    const topOffset = (startMins / (24 * 60)) * 100;
                    const heightPercent = (action.durationMinutes / (24 * 60)) * 100;

                    return (
                      <motion.div
                        key={`action-${index}-${selectedDate.toISOString()}`}
                        className="absolute left-[80px] right-2 p-1 rounded text-xs text-white font-semibold overflow-hidden"
                        style={{
                          top: `${topOffset}%`,
                          height: `${heightPercent}%`,
                          backgroundColor: action.color,
                          zIndex: 6,
                        }}
                      >
                        <div className="truncate">{action.title}</div>
                        <div className="text-[10px] opacity-80">
                          {action.time} — {formatTime(
                            addMinutes(new Date(selectedDate.setHours(hh, mm, 0, 0)), action.durationMinutes)
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

                {/* weekday labels */}
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

                  /* ───── Events in this cell ───── */
                  const dayEvents = events.filter(ev => {
                    const d = new Date(ev.start);
                    return (
                      d.getDate() === cellDate.getDate() &&
                      d.getMonth() === cellDate.getMonth() &&
                      d.getFullYear() === cellDate.getFullYear()
                    );
                  });

                  /* ───── Actions in this cell ───── */
                  const actionsForDate = goals.flatMap(goal =>
                    goal.tasks.flatMap(task =>
                      (allActions[task.id] || []).filter(action => {
                        /* determine repeat type */
                        const repeat = (() => {
                          if (action.value4?.includes('/')) return 'daily';

                          const cat4 = action.cat_qty_id4 || [];

                          // Weekly: cat_qty_id4 includes item_name === "Days"
                          if (cat4.some((e: any) => e.item_name === 'Days')) return 'weekly';

                          // Monthly: cat_qty_id4 includes item_name === "day of month"
                          if (cat4.some((e: any) => e.item_name === 'day of month')) return 'monthly';

                          return 'once';
                        })();

                        /* daily */
                        if (repeat === 'daily') {
                          return new Date(action.value4).toDateString() === cellDate.toDateString();
                        }

                        /* weekly */
                        if (repeat === 'weekly') {
                          const weekdays = action.cat_qty_id4
                            ?.filter((e: any) => e.Selected)
                            .map((e: any) => e.name);
                          const wdName = cellDate.toLocaleDateString('en-US', { weekday: 'long' });
                          return weekdays?.includes(wdName);
                        }

                        /* monthly */
                        if (repeat === 'monthly') {
                          const dayNum = Number(action.value4);
                          return dayNum >= 1 && dayNum <= 31 && cellDate.getDate() === dayNum;
                        }

                        return false;
                      }).map(action => ({
                        title: action.value3 || 'Action',
                        color: task.color
                      }))
                    )
                  );

                  /* ───── Cell UI ───── */
                  return (
                    <div
                      key={i}
                      className={`border rounded min-h-24 p-1 transition-all duration-200
              ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
              ${isToday ? 'border-blue-500' : ''}`}
                    >
                      {/* date number */}
                      <div className={`text-right text-sm
              ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
              ${isToday ? 'font-bold' : ''}`}>
                        {cellDate.getDate()}
                      </div>

                      {/* event & action pills */}
                      <div className="space-y-1 mt-1">

                        {/* events (max 2) */}
                        {dayEvents.slice(0, 2).map(ev => (
                          <div
                            key={`${cellDate.toISOString()}-${ev.id}`}
                            className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-90 transition"
                            style={{ backgroundColor: ev.color || '#3b82f6', color: 'white' }}
                            onClick={() => { setCurrentEvent(ev); setShowEventModal(true); }}
                          >
                            {(ev.title || 'Untitled').slice(0, 25)}
                          </div>
                        ))}

                        {/* actions (max 2 minus events already shown) */}
                        {actionsForDate.slice(0, 2 - Math.min(2, dayEvents.length)).map((act, idx) => (
                          <div
                            key={`act-${idx}-${cellDate.toDateString()}`}
                            className="text-xs p-1 rounded truncate text-white"
                            style={{ backgroundColor: act.color }}
                          >
                            {act.title.slice(0, 25)}
                          </div>
                        ))}

                        {/* overflow badge */}
                        {(dayEvents.length + actionsForDate.length) > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{(dayEvents.length + actionsForDate.length) - 2} more
                          </div>
                        )}

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
      <div className="w-80 border-l bg-white p-6 overflow-y-auto space-y-8 shadow-inner">
        {/* 🟦 Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Progress Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Viewing: <span className="font-medium">All Goals</span></p>
        </div>

        {/* 📊 Bar Chart */}
        <div className="space-y-3">
          <div className="w-full h-32 flex items-end gap-2 bg-gray-50 rounded-xl px-3 py-2 border">
            {[3, 5, 6, 5.5, 4, 2.5, 2].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                {/* 🏷️ Hover Label */}
                <div className="absolute -top-5 text-xs text-gray-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {val}h
                </div>

                {/* 📊 Bar */}
                <div
                  className="w-3 rounded-full bg-gradient-to-b from-blue-500 to-blue-400 group-hover:scale-105 transition-transform duration-150"
                  style={{ height: `${val * 12}px` }}
                />
                <span className="text-[10px] text-gray-400 mt-1">{2 + i}/6</span>
              </div>
            ))}
          </div>


          {/* 🧠 Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="font-semibold">35h</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Average</p>
              <p className="font-semibold">5.5h</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Peak</p>
              <p className="font-semibold">6h</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg. Effort</p>
              <p className="font-semibold">2.5</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          {/* 📅 Upcoming */}
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Upcoming</h3>
          <ul className="space-y-3">
            {[
              { title: "Research Story ideas", date: "14th July 2025", time: "12:00 PM" },
              { title: "Reflect on goals", date: "15th July 2025", time: "10:00 AM" },
              { title: "UX Workshop", date: "16th July 2025", time: "3:30 PM" }
            ].map((item, i) => (
              <li key={i} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition">
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.date} • {item.time}</p>
              </li>
            ))}
          </ul>
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
                  {currentEvent.id ? 'Edit Event' : 'Create Event'}
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
                    value={currentEvent.repeat || 'none'}
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
                    <option value="none">No repeat</option>
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
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default GoalsPage;
