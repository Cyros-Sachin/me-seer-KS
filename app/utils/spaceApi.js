import api from "./api";

// --- SPACE ---
export const fetchSpaces = () => api.get("spaces");

// --- SUBSPACE ---
export const fetchSubSpacesBySpaceId = (spaceId, userId) =>
  api.get(`subspaces/${spaceId}/${userId}`);

export const fetchSubSpaceById = (subspaceId, userId) =>
  api.get(`subspaces/${subspaceId}/${userId}`);

export const createSubSpace = (data) => api.post("subspaces", data);

export const updateSubSpace = (subspaceId, data) =>
  api.put(`subspaces/${subspaceId}`, data);

export const deleteSubSpace = (subspaceId, userId) =>
  api.delete(`subspaces/${subspaceId}/${userId}`);

// --- TODO ---
export const fetchTodoData = (subspaceId, userId) =>
  api.get(`todo-data/${subspaceId}/${userId}`);

export const fetchTodoVersions = (todoId, userId) =>
  api.get(`todos/${todoId}/${userId}`);

export const fetchTodosForSubspace = (subspaceId, userId) =>
  api.get(`todos-subspace/${subspaceId}/${userId}`);

export const createTodo = (data) => api.post("todos", data);

export const updateTodo = (todoId, data) => api.put(`todos/${todoId}`, data);

export const deleteTodo = (todoId, userId) =>
  api.delete(`todos/${todoId}/${userId}`);

// --- TODO CONTENT ---
export const fetchTodoContent = (todoId) =>
  api.get(`todo_content/${todoId}`);

export const createTodoContent = (data) => api.post("todo_content", data);

export const updateTodoContent = (tcId, data) =>
  api.put(`todo_content/${tcId}`, data);

export const deleteTodoContent = (tcId) =>
  api.delete(`todo_content/${tcId}`);

export const getTodoContentStatus = (userId) =>
  api.get(`todo_content/segregated/${userId}`);

export const fetchAllTodoContent = (userId) =>
  api.get(`todo_content/${userId}`);

// --- WORDPAD ---
export const fetchWordpadVersions = (wordpadId, userId) =>
  api.get(`wordpads/${wordpadId}/${userId}`);

export const createWordpad = (data) => api.post("wordpads", data);

export const updateWordpad = (wordpadId, data) =>
  api.put(`wordpads/${wordpadId}`, data);

export const deleteWordpad = (wordpadId, userId) =>
  api.delete(`wordpads/${wordpadId}/${userId}`);

export const fetchAllWordpads = (userId) =>
  api.get(`wordpads/${userId}`);

// --- WORDPAD CONTENT ---
export const fetchWordpadContent = (wcId) =>
  api.get(`wordpad-content/${wcId}`);

export const createWordpadContent = (data) =>
  api.post("wordpad-content", data);

export const updateWordpadContent = (wcId, data) =>
  api.put(`wordpad-content/${wcId}`, data);

export const deleteWordpadContent = (wcId) =>
  api.delete(`wordpad-content/${wcId}`);

export const fetchAllWordpadContent = (userId) =>
  api.get(`wordpad-content/${userId}`);
