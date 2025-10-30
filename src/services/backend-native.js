/*
  AsyncStorage-backed backend service for todos (React Native).
  Provides a small async API that mimics network calls for easy future swap-out.
*/

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'done_list_todos_v1';

/** @typedef {{ id: string, title: string, completed: boolean, assignedDate?: string, isEveryday?: boolean, subTasks?: SubTask[] }} Todo */
/** @typedef {{ id: string, title: string, completed: boolean }} SubTask */

async function readTodos() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (_) {
    return [];
  }
}

async function writeTodos(todos) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const backend = {
  async listTodos() {
    return readTodos();
  },

  /** @param {string} title */
  /** @param {string} [assignedDate] */
  async createTodo(title, assignedDate) {
    const clean = title.trim();
    if (!clean) return null;
    const todos = await readTodos();
    const newTodo = { id: uid(), title: clean, completed: false, isEveryday: false, subTasks: [] };
    if (assignedDate) {
      newTodo.assignedDate = assignedDate;
    }
    const next = [newTodo, ...todos];
    await writeTodos(next);
    return next[0];
  },

  async toggleTodo(id) {
    const todos = await readTodos();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return null;
    todos[idx] = { ...todos[idx], completed: !todos[idx].completed };
    await writeTodos(todos);
    return todos[idx];
  },

  async toggleEveryday(id) {
    const todos = await readTodos();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return null;
    todos[idx] = { ...todos[idx], isEveryday: !(todos[idx].isEveryday || false) };
    await writeTodos(todos);
    return todos[idx];
  },

  async updateTodo(id, fields) {
    const todos = await readTodos();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return null;
    todos[idx] = { ...todos[idx], ...fields };
    await writeTodos(todos);
    return todos[idx];
  },

  async deleteTodo(id) {
    const todos = await readTodos();
    const next = todos.filter(t => t.id !== id);
    await writeTodos(next);
    return { ok: true };
  },

  async clearCompleted() {
    const todos = await readTodos();
    const next = todos.filter(t => !t.completed);
    await writeTodos(next);
    return { ok: true };
  },

  /** @param {string} todoId */
  /** @param {SubTask[]} subTasks */
  async addSubTasks(todoId, subTasks) {
    const todos = await readTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) return null;
    if (!todos[idx].subTasks) todos[idx].subTasks = [];
    todos[idx].subTasks.push(...subTasks);
    await writeTodos(todos);
    return todos[idx];
  },

  /** @param {string} todoId */
  /** @param {SubTask[]} subTasks */
  async replaceSubTasks(todoId, subTasks) {
    const todos = await readTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) return null;
    todos[idx].subTasks = subTasks || [];
    await writeTodos(todos);
    return todos[idx];
  },

  /** @param {string} todoId */
  /** @param {string} subTaskId */
  async toggleSubTask(todoId, subTaskId) {
    const todos = await readTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) return null;
    if (!todos[idx].subTasks) return null;
    const subIdx = todos[idx].subTasks.findIndex(st => st.id === subTaskId);
    if (subIdx === -1) return null;
    todos[idx].subTasks[subIdx] = { 
      ...todos[idx].subTasks[subIdx], 
      completed: !todos[idx].subTasks[subIdx].completed 
    };
    await writeTodos(todos);
    return todos[idx];
  },

  /** @param {string} todoId */
  /** @param {object} aiAnalysis */
  async updateAIAnalysis(todoId, aiAnalysis) {
    const todos = await readTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) return null;
    todos[idx] = { ...todos[idx], aiAnalysis };
    await writeTodos(todos);
    return todos[idx];
  }
};

