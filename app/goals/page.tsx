'use client';
import Cookies from 'js-cookie';
import { getUserId, getUserToken } from "../utils/auth";
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Dot, ChevronRight, Plus, X, Settings, Calendar, List, Grid, Edit, Trash2, Clock, Tag, Check, ChevronDown } from 'lucide-react';
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
  deleteCalendarEvent
} from "../lib/api"; // Adjust path if needed

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
  start: Date;
  end: Date;
  category: EventCategory;
  goalId?: string;
  taskId?: string;
  color?: string;
}

interface Task {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  color: string;
  collective_id: string;
}

interface Goal {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
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

  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch(resetGoals());
        const userId = getUserId();
        const token = getUserToken();

        const goals = await fetchGoalsAndTasks(userId, token);
        console.log("Fetched goals:", goals.map(g => g.id)); // See if duplicate IDs

        if (!Array.isArray(goals)) {
          console.error("goals is not an array", goals);
          return;
        }
        const existingGoalIds = new Set(goalsFromRedux.map(g => g.id));
        goals
          .filter(g => !existingGoalIds.has(g.id))
          .forEach(g => dispatch(addGoal(g)));

        for (const goal of goals) {
          if (!goal) continue;

          for (const task of goal.tasks) {
            if (typeof task.todo_id !== "number") continue;
            try {
              const todos = await fetchTodoItems(task.todo_id, userId, token);
              todos.forEach((e: Event) =>
                dispatch(addEvent({
                  ...e,
                  goalId: goal.id.toString(), // ✅ fix 2322
                  color: goal.color
                }))
              );
            } catch (err) {
              console.error("Failed to fetch items for", task.todo_id);
            }
          }
        }

      } catch (err) {
        console.error("User auth info missing or invalid", err);
      }
    };

    loadData();
  }, []);


  // Generate time slots from 5:30 AM to 8:30 PM
  const timeSlots = Array.from({ length: 31 }, (_, i) => {
    const hour = Math.floor(i / 2) + 5;
    const minute = i % 2 === 0 ? 30 : 0;
    const date = new Date(selectedDate);
    date.setHours(hour, minute, 0, 0);
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
    const start = new Date(day);
    start.setHours(time.getHours(), time.getMinutes());

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setCurrentEvent({
      id: '',
      title: '',
      start,
      end,
      category: 'work',
      color: '#3b82f6' // Default blue color
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
      start,
      end,
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 border-r bg-white p-4 overflow-y-auto">
        <div className="flex justify items-center mb-6">
          <ChevronLeft className='mr-3 text-black' onClick={() => router.push('/main')} />
          <h2 className="text-xl font-bold text-gray-800">My Planner</h2>
        </div>
        {/* Goals Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Goals</h2>
          <div className="space-y-1">
            {goals.map(goal => (
              <div
                key={goal.id}
                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors duration-150 ${selectedGoalId === goal.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'hover:bg-gray-100 text-gray-800'
                  }`}
                onClick={() => dispatch(selectGoal(goal.id))}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: goal.color }}
                />
                <span className="truncate">{goal.title}</span>
              </div>
            ))}
          </div>
        </div>


        {/* Tasks Section */}
        <div className='mt-10'>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Tasks</h2>
          {selectedGoalId ? (() => {
            const selectedGoal = goals.find(g => g.id === selectedGoalId);
            if (!selectedGoal) return <p className="text-sm text-gray-400">No goal selected</p>;

            const groupedTasks = selectedGoal.tasks.reduce((acc: Record<string, Task[]>, task) => {
              const key = task.collective_id || 'Uncategorized';
              if (!acc[key]) acc[key] = [];
              acc[key].push(task);
              return acc;
            }, {});

            return (
              <div className="space-y-6">
                {Object.entries(groupedTasks).map(([collectiveId, tasks]) => (
                  <div key={collectiveId}>
                    {tasks.map(task => (
                      <div
                        key={task.id}
                        className="ml-4 pl-2 border-l text-sm text-gray-700 py-1 flex items-center gap-2"
                        draggable
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
                ))}
              </div>
            );
          })() : (
            <p className="text-sm text-gray-400">No goal selected</p>
          )}
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Calendar Header */}
        <div className="border-b bg-white p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-800">Calendar</h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-1 rounded-full hover:bg-gray-100"
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
                  className="p-1 rounded-full hover:bg-gray-100"
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

              {/* Time slots */}
              <div className="flex-1 grid grid-cols-8 overflow-auto">
                {/* Time column */}
                <div className="border-r">
                  {timeSlots.map((time) => (
                    <div
                      key={time.toString()}
                      className="h-12 border-b flex items-start justify-end pr-2"
                    >
                      <span className="text-xs text-gray-500 -mt-2">
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
                          {slotEvents.map((event) => (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className={`absolute left-0 right-0 mx-1 p-1 rounded text-xs text-white font-medium overflow-hidden`}
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day view (simplified for example) */}
          {viewMode === 'day' && (
            <div className="h-full flex flex-col">
              <div className="border-b p-4 text-center font-medium">
                {formatDate(selectedDate)}
              </div>
              <div className="flex-1 grid grid-cols-1 overflow-auto">
                <div className="border-r">
                  {timeSlots.map((time) => (
                    <div
                      key={time.toString()}
                      className="h-12 border-b relative"
                      onClick={() => handleTimeSlotClick(time, selectedDate)}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-16 flex items-start justify-end pr-2">
                        <span className="text-xs text-gray-500 -mt-2">
                          {formatTime(time)}
                        </span>
                      </div>
                      <div className="ml-16 h-full">
                        {getEventsForSlot(selectedDate, time).map((event) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`h-full mx-1 p-1 rounded text-xs text-white font-medium overflow-hidden`}
                            style={{
                              backgroundColor: event.color || '#3b82f6',
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
                </div>
              </div>
            </div>
          )}

          {/* Month view (simplified for example) */}
          {viewMode === 'month' && (
            <div className="h-full p-4">
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-medium text-sm py-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 42 }).map((_, i) => {
                  const date = new Date(selectedDate);
                  date.setDate(1);
                  date.setDate(date.getDate() - date.getDay() + i);

                  const isCurrentMonth = date.getMonth() === new Date(selectedDate).getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();

                  const dayEvents = events.filter(event => {
                    const eventDate = new Date(event.start);
                    return (
                      eventDate.getDate() === date.getDate() &&
                      eventDate.getMonth() === date.getMonth() &&
                      eventDate.getFullYear() === date.getFullYear()
                    );
                  });
                  const dayNumber = date.getDate();
                  return (
                    <div
                      key={i}
                      className={`border rounded min-h-24 p-1 transition-all duration-200 ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                        } ${isToday ? 'border-blue-500' : ''}`}
                    >
                      <div
                        className={`text-right text-sm ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
                          } ${isToday ? 'font-bold' : ''}`}
                      >
                        {date.getDate()}
                      </div>

                      <div className="space-y-1 mt-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id || `${date.toISOString()}-${event.title}`}
                            role="button"
                            tabIndex={0}
                            className="text-xs p-1 rounded truncate hover:opacity-90 transition cursor-pointer"
                            style={{
                              backgroundColor: event.color || '#3b82f6',
                              color: 'white',
                            }}
                            onClick={() => {
                              setCurrentEvent(event);
                              setShowEventModal(true);
                            }}
                          >
                            {event.title?.slice(0, 25) || "Untitled"}
                          </div>
                        ))}

                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 2} more
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

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                  <select
                    value={currentEvent.category}
                    onChange={(e) =>
                      setCurrentEvent({ ...currentEvent, category: e.target.value as EventCategory })
                    }
                    className="w-full border rounded-lg px-4 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="exercise">Exercise</option>
                    <option value="eating">Eating</option>
                    <option value="work">Work</option>
                    <option value="relax">Relax</option>
                    <option value="family">Family</option>
                    <option value="social">Social</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      value={new Date(currentEvent.start).toISOString().slice(0, 16)}
                      onChange={(e) =>
                        setCurrentEvent({ ...currentEvent, start: new Date(e.target.value) })
                      }
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">End Time</label>
                    <input
                      type="datetime-local"
                      value={new Date(currentEvent.end).toISOString().slice(0, 16)}
                      onChange={(e) =>
                        setCurrentEvent({ ...currentEvent, end: new Date(e.target.value) })
                      }
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-800"
                    />
                  </div>
                </div>

                {currentEvent.color && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Color</label>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: currentEvent.color }}
                      />
                      <input
                        type="color"
                        value={currentEvent.color}
                        onChange={(e) =>
                          setCurrentEvent({ ...currentEvent, color: e.target.value })
                        }
                        className="w-10 h-10 p-0 border-none bg-transparent"
                      />
                    </div>
                  </div>
                )}
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

function fetchCalendarEvents(userId: string) {
  throw new Error('Function not implemented.');
}
