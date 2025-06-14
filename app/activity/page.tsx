'use client';
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from 'react';
import { Mic, ChevronRight, ChevronDown, Plus, Edit, Hash, Eye, Repeat, Trash2, Settings, Pencil, CirclePlus, SquareChevronRight, SquareChevronLeft, Maximize2, Trash, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from "react";
import { WordpadEditor } from "../components/WordpadEditor";

// API Base URL
const API_BASE_URL = 'https://meseer.com/dog';

type ActivityAction = 'create' | 'edit' | 'delete' | null;
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

type ActivityType = {
    activity_type_id: string;
    name: string;
    description?: string;
};

type ActivityItem = {
    item_id: string;
    name: string;
    category_id: string;
    unit_id?: string;
    custom?: boolean;
};

type ActivityItemCustom = {
    custom_item_id: string;
    name: string;
    user_id: string;
    created_date: string;
};

type UserTableActivity = {
    activity_id: string;
    user_id: string;
    table_name: string;
    activity_type: string;
    record_id: string;
    activity_date: string;
    details?: string;
};

type ItemCategory = {
    category_id: string;
    name: string;
};

type ItemUnit = {
    unit_id: string;
    name: string;
    symbol: string;
};

type Group = {
    group_id: string;
    name: string;
    description?: string;
    created_by: string;
    created_date: string;
};

type Goal = {
    goal_id: string;
    name: string;
    description?: string;
    target_date?: string;
    completed: boolean;
    user_id: string;
};

type Task = {
    task_id: string;
    name: string;
    description?: string;
    due_date?: string;
    completed: boolean;
    goal_id?: string;
    user_id: string;
};

type Action = {
    action_id: string;
    name: string;
    description?: string;
    due_date?: string;
    completed: boolean;
    task_id?: string;
    user_id: string;
};

type Meal = {
    meal_id: string;
    name: string;
    description?: string;
    time: string;
    calories?: number;
    user_id: string;
    date: string;
};

type Workout = {
    workout_id: string;
    name: string;
    description?: string;
    duration: number;
    calories_burned?: number;
    user_id: string;
    date: string;
};

type MentorF = {
    mentor_id: string;
    name: string;
    expertise: string;
    contact_info: string;
    user_id: string;
};

type RelationF = {
    relation_id: string;
    name: string;
    type: string;
    contact_info: string;
    user_id: string;
};

const ActivityService = {
    getHeaders: () => {
        if (typeof window === 'undefined') {
            throw new Error('Running on server, cannot access localStorage');
        }

        const userInfo = Cookies.get("userInfo");
        if (!userInfo) throw new Error('User not authenticated');

        const { access_token } = JSON.parse(userInfo) as UserInfo;
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        };
    },

    // Activity Type
    getActivityTypes: async (): Promise<ActivityType[]> => {
        const response = await fetch(`${API_BASE_URL}/get-activity-types`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    // Activity Items
    getActivityItems: async (): Promise<ActivityItem[]> => {
        const response = await fetch(`${API_BASE_URL}/activity_items`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    // Custom Activity Items
    getCustomActivityItems: async (userId: string): Promise<ActivityItemCustom[]> => {
        const response = await fetch(`${API_BASE_URL}/activity_items_custom/${userId}`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    // User Table Activities
    getUserActivities: async (userId: string): Promise<UserTableActivity[]> => {
        const response = await fetch(`${API_BASE_URL}/user_table_activities/${userId}`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    createUserActivity: async (payload: {
        user_id: string;
        table_name: string;
        activity_type: string;
        record_id: string;
        details?: string;
    }) => {
        const response = await fetch(`${API_BASE_URL}/user_table_activities`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify(payload),
        });
        return response.json();
    },

    // Item Categories
    getItemCategories: async (): Promise<ItemCategory[]> => {
        const response = await fetch(`${API_BASE_URL}/item_categories`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    // Item Units
    getItemUnits: async (): Promise<ItemUnit[]> => {
        const response = await fetch(`${API_BASE_URL}/item_units`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    // Groups
    getGroups: async (userId: string): Promise<Group[]> => {
        const response = await fetch(`${API_BASE_URL}/groups/${userId}`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    createGroup: async (payload: {
        name: string;
        description?: string;
        created_by: string;
    }) => {
        const response = await fetch(`${API_BASE_URL}/groups`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify(payload),
        });
        return response.json();
    },

    // Goals
    getGoals: async (userId: string): Promise<Goal[]> => {
        const response = await fetch(`${API_BASE_URL}/goals/${userId}`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    createGoal: async (payload: {
        name: string;
        description?: string;
        target_date?: string;
        user_id: string;
    }) => {
        const response = await fetch(`${API_BASE_URL}/goals`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify(payload),
        });
        return response.json();
    },

    // Tasks
    getTasks: async (userId: string): Promise<Task[]> => {
        const response = await fetch(`${API_BASE_URL}/tasks/${userId}`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    createTask: async (payload: {
        name: string;
        description?: string;
        due_date?: string;
        goal_id?: string;
        user_id: string;
    }) => {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify(payload),
        });
        return response.json();
    },

    // Actions
    getActions: async (userId: string): Promise<Action[]> => {
        const response = await fetch(`${API_BASE_URL}/actions/${userId}`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    createAction: async (payload: {
        name: string;
        description?: string;
        due_date?: string;
        task_id?: string;
        user_id: string;
    }) => {
        const response = await fetch(`${API_BASE_URL}/actions`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify(payload),
        });
        return response.json();
    },

    // Meals
    getMeals: async (userId: string): Promise<Meal[]> => {
        const response = await fetch(`${API_BASE_URL}/meals/${userId}`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    createMeal: async (payload: {
        name: string;
        description?: string;
        time: string;
        calories?: number;
        user_id: string;
        date: string;
    }) => {
        const response = await fetch(`${API_BASE_URL}/meals`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify(payload),
        });
        return response.json();
    },

    // Workouts
    getWorkouts: async (userId: string): Promise<Workout[]> => {
        const response = await fetch(`${API_BASE_URL}/workouts/${userId}`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    createWorkout: async (payload: {
        name: string;
        description?: string;
        duration: number;
        calories_burned?: number;
        user_id: string;
        date: string;
    }) => {
        const response = await fetch(`${API_BASE_URL}/workouts`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify(payload),
        });
        return response.json();
    },

    // Mentors
    getMentors: async (userId: string): Promise<MentorF[]> => {
        const response = await fetch(`${API_BASE_URL}/mentors/${userId}`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    createMentor: async (payload: {
        name: string;
        expertise: string;
        contact_info: string;
        user_id: string;
    }) => {
        const response = await fetch(`${API_BASE_URL}/mentors`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify(payload),
        });
        return response.json();
    },

    // Relations
    getRelations: async (userId: string): Promise<RelationF[]> => {
        const response = await fetch(`${API_BASE_URL}/relations/${userId}`, {
            headers: ActivityService.getHeaders()
        });
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    createRelation: async (payload: {
        name: string;
        type: string;
        contact_info: string;
        user_id: string;
    }) => {
        const response = await fetch(`${API_BASE_URL}/relations`, {
            method: 'POST',
            headers: ActivityService.getHeaders(),
            body: JSON.stringify(payload),
        });
        return response.json();
    },
};

function ActivityPage() {
    const editorRefs = useRef<{
        [key: string]: HTMLDivElement | null
    }>({});
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
    const [customActivityItems, setCustomActivityItems] = useState<ActivityItemCustom[]>([]);
    const [userActivities, setUserActivities] = useState<UserTableActivity[]>([]);
    const [itemCategories, setItemCategories] = useState<ItemCategory[]>([]);
    const [itemUnits, setItemUnits] = useState<ItemUnit[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [actions, setActions] = useState<Action[]>([]);
    const [meals, setMeals] = useState<Meal[]>([]);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [mentors, setMentors] = useState<MentorF[]>([]);
    const [relations, setRelations] = useState<RelationF[]>([]);
    const router = useRouter();
    const [loading, setLoading] = useState({
        activityTypes: false,
        activityItems: false,
        customActivityItems: false,
        userActivities: false,
        itemCategories: false,
        itemUnits: false,
        groups: false,
        goals: false,
        tasks: false,
        actions: false,
        meals: false,
        workouts: false,
        mentors: false,
        relations: false
    });
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [activityAction, setActivityAction] = useState<ActivityAction>(null);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [newName, setNewName] = useState('');
    const [maximizedItem, setMaximizedItem] = useState<any>(null);
    const [collapsedItems, setCollapsedItems] = useState<string[]>([]);
    const [contentMap, setContentMap] = useState<{ [key: string]: string }>({});
    const [viewMap, setViewMap] = React.useState<{ [key: string]: string }>({});
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editingContentId, setEditingContentId] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const dropdownRef = useRef(null);

    const dropdownVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    const getUserId = (): string => {
        const userInfo = Cookies.get("userInfo");
        if (!userInfo) throw new Error('User not authenticated');
        return (JSON.parse(userInfo) as UserInfo).user_id;
    };

    // Fetch all activity data on component mount
    useEffect(() => {
        if (!mounted) return;

        const fetchAllData = async () => {
            try {
                setLoading(prev => ({ ...prev, activityTypes: true }));
                setError(null);

                const userId = getUserId();

                // Fetch all activity data in parallel
                const [
                    types,
                    items,
                    customItems,
                    activities,
                    categories,
                    units,
                    groupsData,
                    goalsData,
                    tasksData,
                    actionsData,
                    mealsData,
                    workoutsData,
                    mentorsData,
                    relationsData
                ] = await Promise.all([
                    ActivityService.getActivityTypes(),
                    ActivityService.getActivityItems(),
                    ActivityService.getCustomActivityItems(userId),
                    ActivityService.getUserActivities(userId),
                    ActivityService.getItemCategories(),
                    ActivityService.getItemUnits(),
                    ActivityService.getGroups(userId),
                    ActivityService.getGoals(userId),
                    ActivityService.getTasks(userId),
                    ActivityService.getActions(userId),
                    ActivityService.getMeals(userId),
                    ActivityService.getWorkouts(userId),
                    ActivityService.getMentors(userId),
                    ActivityService.getRelations(userId)
                ]);

                setActivityTypes(types);
                setActivityItems(items);
                setCustomActivityItems(customItems);
                setUserActivities(activities);
                setItemCategories(categories);
                setItemUnits(units);
                setGroups(groupsData);
                setGoals(goalsData);
                setTasks(tasksData);
                setActions(actionsData);
                setMeals(mealsData);
                setWorkouts(workoutsData);
                setMentors(mentorsData);
                setRelations(relationsData);

                // Set default active category if none is selected
                if (!activeCategory && categories.length > 0) {
                    setActiveCategory(categories[0].category_id);
                }
            } catch (err) {
                console.error('Error fetching activity data:', err);
                setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
            } finally {
                setLoading(prev => ({
                    ...prev,
                    activityTypes: false,
                    activityItems: false,
                    customActivityItems: false,
                    userActivities: false,
                    itemCategories: false,
                    itemUnits: false,
                    groups: false,
                    goals: false,
                    tasks: false,
                    actions: false,
                    meals: false,
                    workouts: false,
                    mentors: false,
                    relations: false
                }));
            }
        };

        fetchAllData();
    }, [mounted, activeCategory]);

    const handleActivityAction = (action: ActivityAction, item?: any) => {
        setActivityAction(action);
        setCurrentItem(item || null);
        setNewName(item?.name || '');
    };

    const handleSaveGroup = async () => {
        if (!newName.trim()) return;

        try {
            const userId = getUserId();

            if (activityAction === 'create') {
                await ActivityService.createGroup({
                    name: newName,
                    created_by: userId
                });
            } else if (activityAction === 'edit' && currentItem) {
                // Implement update functionality
                const response = await fetch(`${API_BASE_URL}/groups/${currentItem.group_id}`, {
                    method: 'PUT',
                    headers: ActivityService.getHeaders(),
                    body: JSON.stringify({
                        name: newName,
                        description: currentItem.description,
                        created_by: userId
                    }),
                });
                if (!response.ok) throw new Error('Failed to update group');
            }

            // Refresh groups
            const data = await ActivityService.getGroups(userId);
            setGroups(data);
            setShowModal(false);
        } catch (err) {
            setError(`Failed to ${activityAction} group`);
            console.error(`Error ${activityAction}ing group:`, err);
        }
    };

    const handleDeleteGroup = async () => {
        if (!currentItem) return;

        try {
            const userId = getUserId();
            const response = await fetch(`${API_BASE_URL}/groups/${currentItem.group_id}/${userId}`, {
                method: 'DELETE',
                headers: ActivityService.getHeaders(),
            });
            if (!response.ok) throw new Error('Failed to delete group');

            // Refresh groups
            const data = await ActivityService.getGroups(userId);
            setGroups(data);
            setShowModal(false);
        } catch (err) {
            setError('Failed to delete group');
            console.error('Error deleting group:', err);
        }
    };

    const handleCreateGoal = async () => {
        try {
            const userId = getUserId();
            await ActivityService.createGoal({
                name: 'New Goal',
                user_id: userId
            });

            // Refresh goals
            const data = await ActivityService.getGoals(userId);
            setGoals(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("Error creating goal:", message);
            setError('Failed to create goal');
        }
    };

    const handleCreateTask = async () => {
        try {
            const userId = getUserId();
            await ActivityService.createTask({
                name: 'New Task',
                user_id: userId
            });

            // Refresh tasks
            const data = await ActivityService.getTasks(userId);
            setTasks(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("Error creating task:", message);
            setError('Failed to create task');
        }
    };

    const handleCreateAction = async () => {
        try {
            const userId = getUserId();
            await ActivityService.createAction({
                name: 'New Action',
                user_id: userId
            });

            // Refresh actions
            const data = await ActivityService.getActions(userId);
            setActions(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("Error creating action:", message);
            setError('Failed to create action');
        }
    };

    const handleCreateMeal = async () => {
        try {
            const userId = getUserId();
            await ActivityService.createMeal({
                name: 'New Meal',
                time: new Date().toISOString(),
                user_id: userId,
                date: new Date().toISOString().split('T')[0]
            });

            // Refresh meals
            const data = await ActivityService.getMeals(userId);
            setMeals(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("Error creating meal:", message);
            setError('Failed to create meal');
        }
    };

    const handleCreateWorkout = async () => {
        try {
            const userId = getUserId();
            await ActivityService.createWorkout({
                name: 'New Workout',
                duration: 30,
                user_id: userId,
                date: new Date().toISOString().split('T')[0]
            });

            // Refresh workouts
            const data = await ActivityService.getWorkouts(userId);
            setWorkouts(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("Error creating workout:", message);
            setError('Failed to create workout');
        }
    };

    const handleCreateMentor = async () => {
        try {
            const userId = getUserId();
            await ActivityService.createMentor({
                name: 'New Mentor',
                expertise: '',
                contact_info: '',
                user_id: userId
            });

            // Refresh mentors
            const data = await ActivityService.getMentors(userId);
            setMentors(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("Error creating mentor:", message);
            setError('Failed to create mentor');
        }
    };

    const handleCreateRelation = async () => {
        try {
            const userId = getUserId();
            await ActivityService.createRelation({
                name: 'New Relation',
                type: '',
                contact_info: '',
                user_id: userId
            });

            // Refresh relations
            const data = await ActivityService.getRelations(userId);
            setRelations(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            console.error("Error creating relation:", message);
            setError('Failed to create relation');
        }
    };

    const handleToggleComplete = async (type: string, id: string, currentStatus: boolean) => {
        try {
            const userId = getUserId();
            let endpoint = '';
            let payload = {};

            switch (type) {
                case 'goal':
                    endpoint = `${API_BASE_URL}/goals/${id}`;
                    payload = { completed: !currentStatus, user_id: userId };
                    break;
                case 'task':
                    endpoint = `${API_BASE_URL}/tasks/${id}`;
                    payload = { completed: !currentStatus, user_id: userId };
                    break;
                case 'action':
                    endpoint = `${API_BASE_URL}/actions/${id}`;
                    payload = { completed: !currentStatus, user_id: userId };
                    break;
                default:
                    throw new Error('Invalid type');
            }

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: ActivityService.getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to update status');

            // Refresh the relevant data
            switch (type) {
                case 'goal':
                    const goalsData = await ActivityService.getGoals(userId);
                    setGoals(goalsData);
                    break;
                case 'task':
                    const tasksData = await ActivityService.getTasks(userId);
                    setTasks(tasksData);
                    break;
                case 'action':
                    const actionsData = await ActivityService.getActions(userId);
                    setActions(actionsData);
                    break;
            }

            if (maximizedItem && maximizedItem[`${type}_id`] === id) {
                setMaximizedItem({ ...maximizedItem, completed: !currentStatus });
            }
        } catch (err) {
            console.error('Failed to toggle status:', err);
            setError('Failed to update status');
        }
    };

    const handleDeleteItem = async (type: string, id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const userId = getUserId();
            let endpoint = '';

            switch (type) {
                case 'goal':
                    endpoint = `${API_BASE_URL}/goals/${id}/${userId}`;
                    break;
                case 'task':
                    endpoint = `${API_BASE_URL}/tasks/${id}/${userId}`;
                    break;
                case 'action':
                    endpoint = `${API_BASE_URL}/actions/${id}/${userId}`;
                    break;
                case 'meal':
                    endpoint = `${API_BASE_URL}/meals/${id}/${userId}`;
                    break;
                case 'workout':
                    endpoint = `${API_BASE_URL}/workouts/${id}/${userId}`;
                    break;
                case 'mentor':
                    endpoint = `${API_BASE_URL}/mentors/${id}/${userId}`;
                    break;
                case 'relation':
                    endpoint = `${API_BASE_URL}/relations/${id}/${userId}`;
                    break;
                case 'group':
                    endpoint = `${API_BASE_URL}/groups/${id}/${userId}`;
                    break;
                default:
                    throw new Error('Invalid type');
            }

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: ActivityService.getHeaders(),
            });

            if (!response.ok) throw new Error('Failed to delete item');

            // Refresh the relevant data
            switch (type) {
                case 'goal':
                    const goalsData = await ActivityService.getGoals(userId);
                    setGoals(goalsData);
                    break;
                case 'task':
                    const tasksData = await ActivityService.getTasks(userId);
                    setTasks(tasksData);
                    break;
                case 'action':
                    const actionsData = await ActivityService.getActions(userId);
                    setActions(actionsData);
                    break;
                case 'meal':
                    const mealsData = await ActivityService.getMeals(userId);
                    setMeals(mealsData);
                    break;
                case 'workout':
                    const workoutsData = await ActivityService.getWorkouts(userId);
                    setWorkouts(workoutsData);
                    break;
                case 'mentor':
                    const mentorsData = await ActivityService.getMentors(userId);
                    setMentors(mentorsData);
                    break;
                case 'relation':
                    const relationsData = await ActivityService.getRelations(userId);
                    setRelations(relationsData);
                    break;
                case 'group':
                    const groupsData = await ActivityService.getGroups(userId);
                    setGroups(groupsData);
                    break;
            }

            if (maximizedItem && maximizedItem[`${type}_id`] === id) {
                setMaximizedItem(null);
            }
        } catch (err) {
            console.error('Failed to delete item:', err);
            setError('Failed to delete item');
        }
    };

    const handleRenameItem = async (type: string, id: string, newName: string) => {
        try {
            const userId = getUserId();
            let endpoint = '';
            let payload = {};

            switch (type) {
                case 'goal':
                    endpoint = `${API_BASE_URL}/goals/${id}`;
                    payload = { name: newName, user_id: userId };
                    break;
                case 'task':
                    endpoint = `${API_BASE_URL}/tasks/${id}`;
                    payload = { name: newName, user_id: userId };
                    break;
                case 'action':
                    endpoint = `${API_BASE_URL}/actions/${id}`;
                    payload = { name: newName, user_id: userId };
                    break;
                case 'meal':
                    endpoint = `${API_BASE_URL}/meals/${id}`;
                    payload = { name: newName, user_id: userId };
                    break;
                case 'workout':
                    endpoint = `${API_BASE_URL}/workouts/${id}`;
                    payload = { name: newName, user_id: userId };
                    break;
                case 'mentor':
                    endpoint = `${API_BASE_URL}/mentors/${id}`;
                    payload = { name: newName, user_id: userId };
                    break;
                case 'relation':
                    endpoint = `${API_BASE_URL}/relations/${id}`;
                    payload = { name: newName, user_id: userId };
                    break;
                case 'group':
                    endpoint = `${API_BASE_URL}/groups/${id}`;
                    payload = { name: newName, user_id: userId };
                    break;
                default:
                    throw new Error('Invalid type');
            }

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: ActivityService.getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to rename item');

            // Update local state
            switch (type) {
                case 'goal':
                    setGoals(prev => prev.map(item => item.goal_id === id ? { ...item, name: newName } : item));
                    break;
                case 'task':
                    setTasks(prev => prev.map(item => item.task_id === id ? { ...item, name: newName } : item));
                    break;
                case 'action':
                    setActions(prev => prev.map(item => item.action_id === id ? { ...item, name: newName } : item));
                    break;
                case 'meal':
                    setMeals(prev => prev.map(item => item.meal_id === id ? { ...item, name: newName } : item));
                    break;
                case 'workout':
                    setWorkouts(prev => prev.map(item => item.workout_id === id ? { ...item, name: newName } : item));
                    break;
                case 'mentor':
                    setMentors(prev => prev.map(item => item.mentor_id === id ? { ...item, name: newName } : item));
                    break;
                case 'relation':
                    setRelations(prev => prev.map(item => item.relation_id === id ? { ...item, name: newName } : item));
                    break;
                case 'group':
                    setGroups(prev => prev.map(item => item.group_id === id ? { ...item, name: newName } : item));
                    break;
            }

            if (maximizedItem && maximizedItem[`${type}_id`] === id) {
                setMaximizedItem({ ...maximizedItem, name: newName });
            }
        } catch (error) {
            console.error("Rename failed:", error);
        }
    };

    const handleSaveContent = async (type: string, id: string, content: string) => {
        try {
            const userId = getUserId();
            let endpoint = '';
            let payload = {};

            switch (type) {
                case 'goal':
                    endpoint = `${API_BASE_URL}/goals/${id}`;
                    payload = { description: content, user_id: userId };
                    break;
                case 'task':
                    endpoint = `${API_BASE_URL}/tasks/${id}`;
                    payload = { description: content, user_id: userId };
                    break;
                case 'action':
                    endpoint = `${API_BASE_URL}/actions/${id}`;
                    payload = { description: content, user_id: userId };
                    break;
                case 'meal':
                    endpoint = `${API_BASE_URL}/meals/${id}`;
                    payload = { description: content, user_id: userId };
                    break;
                case 'workout':
                    endpoint = `${API_BASE_URL}/workouts/${id}`;
                    payload = { description: content, user_id: userId };
                    break;
                case 'mentor':
                    endpoint = `${API_BASE_URL}/mentors/${id}`;
                    payload = { expertise: content, user_id: userId };
                    break;
                case 'relation':
                    endpoint = `${API_BASE_URL}/relations/${id}`;
                    payload = { type: content, user_id: userId };
                    break;
                case 'group':
                    endpoint = `${API_BASE_URL}/groups/${id}`;
                    payload = { description: content, user_id: userId };
                    break;
                default:
                    throw new Error('Invalid type');
            }

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: ActivityService.getHeaders(),
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to save content');

            // Update local state
            switch (type) {
                case 'goal':
                    setGoals(prev => prev.map(item => item.goal_id === id ? { ...item, description: content } : item));
                    break;
                case 'task':
                    setTasks(prev => prev.map(item => item.task_id === id ? { ...item, description: content } : item));
                    break;
                case 'action':
                    setActions(prev => prev.map(item => item.action_id === id ? { ...item, description: content } : item));
                    break;
                case 'meal':
                    setMeals(prev => prev.map(item => item.meal_id === id ? { ...item, description: content } : item));
                    break;
                case 'workout':
                    setWorkouts(prev => prev.map(item => item.workout_id === id ? { ...item, description: content } : item));
                    break;
                case 'mentor':
                    setMentors(prev => prev.map(item => item.mentor_id === id ? { ...item, expertise: content } : item));
                    break;
                case 'relation':
                    setRelations(prev => prev.map(item => item.relation_id === id ? { ...item, type: content } : item));
                    break;
                case 'group':
                    setGroups(prev => prev.map(item => item.group_id === id ? { ...item, description: content } : item));
                    break;
            }

            if (maximizedItem && maximizedItem[`${type}_id`] === id) {
                setMaximizedItem({
                    ...maximizedItem,
                    description: type === 'goal' || type === 'task' || type === 'action' || type === 'meal' || type === 'workout' || type === 'group' ? content : undefined,
                    expertise: type === 'mentor' ? content : undefined,
                    type: type === 'relation' ? content : undefined
                });
            }
        } catch (err) {
            console.error('Failed to save content:', err);
            setError('Failed to save content');
        }
    };

    const handleMicInput = (type: string, id: string): void => {
        let currentContent = '';

        switch (type) {
            case 'goal':
                currentContent = goals.find(g => g.goal_id === id)?.description || '';
                break;
            case 'task':
                currentContent = tasks.find(t => t.task_id === id)?.description || '';
                break;
            case 'action':
                currentContent = actions.find(a => a.action_id === id)?.description || '';
                break;
            case 'meal':
                currentContent = meals.find(m => m.meal_id === id)?.description || '';
                break;
            case 'workout':
                currentContent = workouts.find(w => w.workout_id === id)?.description || '';
                break;
            case 'mentor':
                currentContent = mentors.find(m => m.mentor_id === id)?.expertise || '';
                break;
            case 'relation':
                currentContent = relations.find(r => r.relation_id === id)?.type || '';
                break;
            case 'group':
                currentContent = groups.find(g => g.group_id === id)?.description || '';
                break;
        }

        setContentMap(prev => ({
            ...prev,
            [`${type}-${id}`]: currentContent + ' ',
        }));
        setEditingContentId(`${type}-${id}`);
    };

    const renderItemCard = (item: any, type: string) => {
        const isCollapsed = collapsedItems.includes(`${type}-${item[`${type}_id`]}`);
        const currentView = viewMap[`${type}-${item[`${type}_id`]}`] || 'current';
        const contentKey = `${type}-${item[`${type}_id`]}`;
        const isEditing = editingContentId === contentKey;
        const content =
            (contentMap[contentKey] ??
                (type === 'mentor'
                    ? item.expertise
                    : type === 'relation'
                        ? item.type
                        : item.description)) || '';
        return (
            <motion.div
                key={item[`${type}_id`]}
                layout
                transition={{ duration: 0.4 }}
                className={`bg-white rounded-xl border border-gray-300 shadow text-sm flex flex-col overflow-hidden transition-[max-height] duration-400 ease-in-out ${isCollapsed ? "max-h-20" : "max-h-max"}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b group">
                    {editingId === item[`${type}_id`] ? (
                        <input
                            className="font-semibold truncate w-full border-b border-gray-300 focus:outline-none"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={() => {
                                if (newName.trim() && newName !== item.name) {
                                    handleRenameItem(type, item[`${type}_id`], newName.trim());
                                }
                                setEditingId(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    if (newName.trim() && newName !== item.name) {
                                        handleRenameItem(type, item[`${type}_id`], newName.trim());
                                    }
                                    setEditingId(null);
                                } else if (e.key === "Escape") {
                                    setNewName(item.name);
                                    setEditingId(null);
                                }
                            }}
                            autoFocus
                        />
                    ) : (
                        <span
                            className="font-semibold truncate cursor-pointer"
                            onClick={() => {
                                setEditingId(item[`${type}_id`]);
                                setNewName(item.name);
                            }}
                            title="Click to rename"
                        >
                            {item.name}
                        </span>
                    )}
                    <Trash2Icon
                        className="w-4 h-4 text-red-500 opacity-50 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                        onClick={() => handleDeleteItem(type, item[`${type}_id`])}
                    />
                </div>

                {/* Collapsible Content */}
                <AnimatePresence initial={false}>
                    {!isCollapsed && (
                        <motion.div
                            key={item[`${type}_id`]}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="overflow-hidden"
                        >
                            {/* View Label */}
                            <div className="bg-black text-white text-xs font-bold px-3 py-1 uppercase">
                                {currentView}
                            </div>

                            <div className="px-3 py-2 space-y-2 max-h-48 overflow-y-auto">
                                {currentView === 'current' ? (
                                    isEditing ? (
                                        <WordpadEditor
                                            content={content}
                                            onSave={(updatedHtml) => {
                                                handleSaveContent(type, item[`${type}_id`], updatedHtml);
                                                setContentMap(prev => {
                                                    const updated = { ...prev };
                                                    delete updated[contentKey];
                                                    return updated;
                                                });
                                                setEditingContentId(null);
                                            }}
                                            onVoiceInput={(transcript) => {
                                                setContentMap(prev => ({
                                                    ...prev,
                                                    [contentKey]: (prev[contentKey] || content) + ' ' + transcript,
                                                }));
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="p-2 text-sm text-gray-800 cursor-text min-h-[100px]"
                                            onClick={() => {
                                                setEditingContentId(contentKey);
                                                setContentMap(prev => ({
                                                    ...prev,
                                                    [contentKey]: content || '<p></p>',
                                                }));
                                            }}
                                            dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400 italic">Click to add content</p>' }}
                                        />
                                    )
                                ) : (
                                    <div className="p-3 border rounded min-h-[300px]">
                                        <h3 className="font-semibold mb-2">Activity History</h3>
                                        {userActivities.filter(a => a.record_id === item[`${type}_id`]).length > 0 ? (
                                            <div className="space-y-3">
                                                {userActivities
                                                    .filter(a => a.record_id === item[`${type}_id`])
                                                    .map((activity) => (
                                                        <div key={activity.activity_id} className="border-b pb-3">
                                                            <div className="text-xs text-gray-500 mb-1">
                                                                {activity.activity_type} | {new Date(activity.activity_date).toLocaleString()}
                                                            </div>
                                                            <div className="text-sm">
                                                                {activity.details}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 italic">No history available</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <div className="flex items-center justify-between border-t px-3 py-2">
                    {type === 'goal' || type === 'task' || type === 'action' ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => handleToggleComplete(type, item[`${type}_id`], item.completed)}
                                className="accent-blue-600 w-4 h-4 rounded"
                            />
                            <span className="text-xs">
                                {item.completed ? 'Completed' : 'Active'}
                            </span>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-500">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </div>
                    )}
                    <div className="flex gap-2 text-gray-600 items-center">
                        <Mic
                            className="w-4 h-4 text-blue-600 cursor-pointer"
                            onClick={() => handleMicInput(type, item[`${type}_id`])}
                        />
                        <SquareChevronLeft
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => {
                                setViewMap(prev => ({
                                    ...prev,
                                    [`${type}-${item[`${type}_id`]}`]: 'current',
                                }));
                            }}
                        />
                        <SquareChevronRight
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => {
                                setViewMap(prev => ({
                                    ...prev,
                                    [`${type}-${item[`${type}_id`]}`]: 'history',
                                }));
                            }}
                        />
                        <Maximize2
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => setMaximizedItem(item)}
                        />
                        <button
                            onClick={() =>
                                setCollapsedItems((prev: string[]) =>
                                    prev.includes(`${type}-${item[`${type}_id`]}`)
                                        ? prev.filter(id => id !== `${type}-${item[`${type}_id`]}`)
                                        : [...prev, `${type}-${item[`${type}_id`]}`]
                                )
                            }
                            className="text-xs"
                        >
                            {isCollapsed ? "🔼" : "🔽"}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    // Add the return statement for the ActivityPage component
    return (
        <div className="flex h-screen w-full overflow-hidden bg-white text-black">
            {/* Left Panel */}
            <div className="w-64 min-w-[220px] border-r border-gray-300 p-4 flex flex-col gap-4">
                <h2 className="text-xl font-semibold mb-2 mt-2">
                    <ChevronRight className="w-6 h-6 rotate-180 transform inline-flex mr-15 mb-1" onClick={() => router.push('/')} />
                    ACTIVITY</h2>
                {!mounted ? (
                    <div className="text-center py-4">Loading user data...</div>
                ) : error ? (
                    <div className="text-red-500 p-2 bg-red-50 rounded">{error}</div>
                ) : (
                    <>
                        {/* Categories Section */}
                        <div className='p-2'>
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Categories</h3>
                            <hr />
                            {loading.itemCategories ? (
                                <div className="mt-2 text-sm text-gray-500">Loading...</div>
                            ) : (
                                <ul className="mt-2 space-y-2">
                                    {itemCategories.map((category) => (
                                        <li
                                            key={category.category_id}
                                            className={`flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded cursor-pointer ${activeCategory === category.category_id ? 'bg-gray-100' : ''}`}
                                            onClick={() => setActiveCategory(category.category_id)}
                                        >
                                            <span className="truncate">{category.name}</span>
                                            <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Groups Section */}
                        <div className='p-2'>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-gray-500">Groups</h3>
                                <button
                                    onClick={() => {
                                        setShowModal(true);
                                        setActivityAction('create');
                                    }}
                                    className="text-gray-500 hover:text-black"
                                    title="Manage groups"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </div>
                            <hr />
                            {loading.groups ? (
                                <div className="mt-2 text-sm text-gray-500">Loading...</div>
                            ) : (
                                <ul className="mt-2 space-y-2">
                                    {groups.map((group) => (
                                        <li
                                            key={group.group_id}
                                            className={`flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded cursor-pointer`}
                                        >
                                            <span className="truncate">{group.name}</span>
                                            <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Add Section */}
                        <div className='p-2'>
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Add</h3>
                            <hr />
                            <div className="mt-2 space-y-2">
                                <button
                                    className="flex items-center justify-between w-full hover:bg-gray-100 px-2 py-1 rounded text-left"
                                    onClick={handleCreateGoal}
                                >
                                    <span>Goal</span>
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    className="flex items-center justify-between w-full hover:bg-gray-100 px-2 py-1 rounded text-left"
                                    onClick={handleCreateTask}
                                >
                                    <span>Task</span>
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    className="flex items-center justify-between w-full hover:bg-gray-100 px-2 py-1 rounded text-left"
                                    onClick={handleCreateAction}
                                >
                                    <span>Action</span>
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    className="flex items-center justify-between w-full hover:bg-gray-100 px-2 py-1 rounded text-left"
                                    onClick={handleCreateMeal}
                                >
                                    <span>Meal</span>
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    className="flex items-center justify-between w-full hover:bg-gray-100 px-2 py-1 rounded text-left"
                                    onClick={handleCreateWorkout}
                                >
                                    <span>Workout</span>
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    className="flex items-center justify-between w-full hover:bg-gray-100 px-2 py-1 rounded text-left"
                                    onClick={handleCreateMentor}
                                >
                                    <span>Mentor</span>
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    className="flex items-center justify-between w-full hover:bg-gray-100 px-2 py-1 rounded text-left"
                                    onClick={handleCreateRelation}
                                >
                                    <span>Relation</span>
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-auto">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        <div className="flex justify-between items-center">
                            <span>{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-2 font-bold"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Breadcrumbs */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                    {activeCategory && (
                        <span className="text-black">
                            {itemCategories.find(c => c.category_id === activeCategory)?.name}
                        </span>
                    )}
                </div>

                {/* Activity Cards */}
                {loading.activityTypes || loading.activityItems ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {/* Goals */}
                            {goals.map(goal => renderItemCard(goal, 'goal'))}

                            {/* Tasks */}
                            {tasks.map(task => renderItemCard(task, 'task'))}

                            {/* Actions */}
                            {actions.map(action => renderItemCard(action, 'action'))}

                            {/* Meals */}
                            {meals.map(meal => renderItemCard(meal, 'meal'))}

                            {/* Workouts */}
                            {workouts.map(workout => renderItemCard(workout, 'workout'))}

                            {/* Mentors */}
                            {mentors.map(mentor => renderItemCard(mentor, 'mentor'))}

                            {/* Relations */}
                            {relations.map(relation => renderItemCard(relation, 'relation'))}
                        </div>
                    </>
                )}
            </div>

            {/* Maximized Item Modal */}
            {maximizedItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 relative max-h-[90vh] flex flex-col">
                        <button
                            onClick={() => setMaximizedItem(null)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-black"
                        >
                            ✕
                        </button>

                        {/* Header */}
                        <div className="flex items-center justify-between border-b pb-2 mb-4">
                            {editingId === maximizedItem[`${maximizedItem.type}_id`] ? (
                                <input
                                    className="text-xl font-bold border-b border-gray-300 focus:outline-none flex-1 mr-2"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onBlur={() => {
                                        if (newName.trim() && newName !== maximizedItem.name) {
                                            handleRenameItem(maximizedItem.type, maximizedItem[`${maximizedItem.type}_id`], newName.trim());
                                        }
                                        setEditingId(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            if (newName.trim() && newName !== maximizedItem.name) {
                                                handleRenameItem(maximizedItem.type, maximizedItem[`${maximizedItem.type}_id`], newName.trim());
                                            }
                                            setEditingId(null);
                                        } else if (e.key === "Escape") {
                                            setNewName(maximizedItem.name);
                                            setEditingId(null);
                                        }
                                    }}
                                    autoFocus
                                />
                            ) : (
                                <span
                                    className="text-xl font-bold truncate cursor-pointer"
                                    onClick={() => {
                                        setEditingId(maximizedItem[`${maximizedItem.type}_id`]);
                                        setNewName(maximizedItem.name);
                                    }}
                                    title="Click to rename"
                                >
                                    {maximizedItem.name}
                                </span>
                            )}
                            <Trash2Icon
                                className="w-4 h-4 text-red-500 opacity-50 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                                onClick={() => {
                                    handleDeleteItem(maximizedItem.type, maximizedItem[`${maximizedItem.type}_id`]);
                                    setMaximizedItem(null);
                                }}
                            />
                        </div>

                        {/* View Label */}
                        <div className="bg-black text-white text-xs font-bold px-3 py-1 uppercase inline-block rounded mb-4">
                            {viewMap[`${maximizedItem.type}-${maximizedItem[`${maximizedItem.type}_id`]}`] || 'current'}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-auto mb-4">
                            {(viewMap[`${maximizedItem.type}-${maximizedItem[`${maximizedItem.type}_id`]}`] || 'current') === 'current' ? (
                                <WordpadEditor
                                    content={
                                        (contentMap[`${maximizedItem.type}-${maximizedItem[`${maximizedItem.type}_id`]}`] ??
                                            (maximizedItem.type === 'mentor'
                                                ? maximizedItem.expertise
                                                : maximizedItem.type === 'relation'
                                                    ? maximizedItem.type
                                                    : maximizedItem.description)) || ''
                                    }

                                    onSave={(updatedHtml) => {
                                        handleSaveContent(maximizedItem.type, maximizedItem[`${maximizedItem.type}_id`], updatedHtml);
                                        setContentMap(prev => {
                                            const updated = { ...prev };
                                            delete updated[`${maximizedItem.type}-${maximizedItem[`${maximizedItem.type}_id`]}`];
                                            return updated;
                                        });
                                    }}
                                    onVoiceInput={(transcript) => {
                                        setContentMap((prev) => ({
                                            ...prev,
                                            [`${maximizedItem.type}-${maximizedItem[`${maximizedItem.type}_id`]}`]:
                                                ((prev[`${maximizedItem.type}-${maximizedItem[`${maximizedItem.type}_id`]}`] ??
                                                    (maximizedItem.type === 'mentor'
                                                        ? maximizedItem.expertise
                                                        : maximizedItem.type === 'relation'
                                                            ? maximizedItem.type
                                                            : maximizedItem.description)) || '') + ' ' + transcript,
                                        }));
                                    }}
                                />
                            ) : (
                                <div className="p-3 border rounded min-h-[300px]">
                                    <h3 className="font-semibold mb-2">Activity History</h3>
                                    {userActivities.filter(a => a.record_id === maximizedItem[`${maximizedItem.type}_id`]).length > 0 ? (
                                        <div className="space-y-3">
                                            {userActivities
                                                .filter(a => a.record_id === maximizedItem[`${maximizedItem.type}_id`])
                                                .map((activity) => (
                                                    <div key={activity.activity_id} className="border-b pb-3">
                                                        <div className="text-xs text-gray-500 mb-1">
                                                            {activity.activity_type} | {new Date(activity.activity_date).toLocaleString()}
                                                        </div>
                                                        <div className="text-sm">
                                                            {activity.details}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic">No history available</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className="flex justify-between items-center border-t pt-4">
                            {maximizedItem.type === 'goal' || maximizedItem.type === 'task' || maximizedItem.type === 'action' ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={maximizedItem.completed}
                                        onChange={() => handleToggleComplete(maximizedItem.type, maximizedItem[`${maximizedItem.type}_id`], maximizedItem.completed)}
                                        className="accent-blue-600 w-4 h-4 rounded"
                                    />
                                    <span className="text-sm">
                                        {maximizedItem.completed ? 'Completed' : 'Active'}
                                    </span>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    {maximizedItem.type.charAt(0).toUpperCase() + maximizedItem.type.slice(1)}
                                </div>
                            )}
                            <div className="flex gap-3 text-gray-600">
                                <SquareChevronLeft
                                    className="w-4 h-4 cursor-pointer"
                                    onClick={() => {
                                        setViewMap(prev => ({
                                            ...prev,
                                            [`${maximizedItem.type}-${maximizedItem[`${maximizedItem.type}_id`]}`]: 'current',
                                        }));
                                    }}
                                />
                                <SquareChevronRight
                                    className="w-4 h-4 cursor-pointer"
                                    onClick={() => {
                                        setViewMap(prev => ({
                                            ...prev,
                                            [`${maximizedItem.type}-${maximizedItem[`${maximizedItem.type}_id`]}`]: 'history',
                                        }));
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Management Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
                    <div className="bg-zinc-900 text-white rounded-xl shadow-2xl w-full max-w-4xl h-[60vh] flex overflow-hidden">
                        {/* Left Panel: Groups List */}
                        <div className="w-1/3 bg-zinc-800 border-r border-zinc-700 overflow-y-auto">
                            <div className="p-4 border-b border-zinc-700 text-lg font-semibold">
                                Groups
                            </div>
                            <div className="divide-y divide-zinc-700">
                                {groups.map((group) => (
                                    <div key={group.group_id} className="flex justify-between items-center p-3 hover:bg-zinc-700 cursor-pointer">
                                        <span
                                            onClick={() => setCurrentItem(group)}
                                            className="truncate cursor-pointer"
                                        >
                                            {group.name}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleActivityAction('edit', group)}>
                                                <Edit className="w-4 h-4 text-blue-400 hover:text-blue-500" />
                                            </button>
                                            <button onClick={() => handleActivityAction('delete', group)}>
                                                <Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel: Form or Action */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">
                                    {activityAction === 'edit'
                                        ? 'Editing Group'
                                        : activityAction === 'create'
                                            ? 'Creating New Group'
                                            : 'Group Details'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-300 text-xl">
                                    ✕
                                </button>
                            </div>

                            {/* Create/Edit Form */}
                            {(activityAction === 'create' || activityAction === 'edit') && (
                                <>
                                    <label className="block text-sm font-medium mb-2">Group Name</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full px-4 py-2 mb-6 placeholder:text-white rounded-md border-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter group name"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-4">
                                        <button
                                            onClick={() => setActivityAction(null)}
                                            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={handleSaveGroup}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                        >
                                            {activityAction === 'create' ? 'Submit' : 'Update'}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Delete Confirmation */}
                            {activityAction === 'delete' && (
                                <>
                                    <p className="mb-4">
                                        Are you sure you want to delete <strong>{currentItem?.name}</strong>?
                                    </p>
                                    <div className="flex justify-end gap-4">
                                        <button
                                            onClick={() => setActivityAction(null)}
                                            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteGroup}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                                        >
                                            Confirm Delete
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Idle State */}
                            {!activityAction && (
                                <button
                                    onClick={() => handleActivityAction('create')}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                >
                                    + Create New Group
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default ActivityPage;