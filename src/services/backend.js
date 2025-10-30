/*
  LocalStorage-backed backend service for todos.
  Provides a small async API that mimics network calls for easy future swap-out.
*/

const STORAGE_KEY = 'done_list_todos_v1';

/** @typedef {{ id: string, title: string, completed: boolean, assignedDate?: string, isEveryday?: boolean, subTasks?: SubTask[] }} Todo */
/** @typedef {{ id: string, title: string, completed: boolean }} SubTask */

function readTodos() {
  try {
    if (typeof localStorage === 'undefined') {
      console.error('localStorage is not available');
      return [];
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    console.error('Error reading todos from localStorage:', error);
    return [];
  }
}

function writeTodos(todos) {
  try {
    if (typeof localStorage === 'undefined') {
      console.error('localStorage is not available');
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error('Error writing todos to localStorage:', error);
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function delay(value) {
  // Tiny microtask tick to keep the API promise-based without noticeable lag
  return Promise.resolve(value);
}

export const backend = {
  async listTodos() {
    return delay(readTodos());
  },

  /** @param {string} title */
  /** @param {string} [assignedDate] */
  async createTodo(title, assignedDate) {
    const clean = title.trim();
    if (!clean) return delay(null);
    const todos = readTodos();
    const newTodo = { id: uid(), title: clean, completed: false, isEveryday: false, subTasks: [] };
    if (assignedDate) {
      newTodo.assignedDate = assignedDate;
    }
    const next = [newTodo, ...todos];
    writeTodos(next);
    return delay(next[0]);
  },

  async toggleTodo(id) {
    const todos = readTodos();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return delay(null);
    todos[idx] = { ...todos[idx], completed: !todos[idx].completed };
    writeTodos(todos);
    return delay(todos[idx]);
  },

  async toggleEveryday(id) {
    const todos = readTodos();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return delay(null);
    todos[idx] = { ...todos[idx], isEveryday: !(todos[idx].isEveryday || false) };
    writeTodos(todos);
    return delay(todos[idx]);
  },

  async updateTodo(id, fields) {
    const todos = readTodos();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return delay(null);
    todos[idx] = { ...todos[idx], ...fields };
    writeTodos(todos);
    return delay(todos[idx]);
  },

  async deleteTodo(id) {
    const todos = readTodos();
    const next = todos.filter(t => t.id !== id);
    writeTodos(next);
    return delay({ ok: true });
  },

  async clearCompleted() {
    const todos = readTodos();
    const next = todos.filter(t => !t.completed);
    writeTodos(next);
    return delay({ ok: true });
  },

  /** @param {string} todoId */
  /** @param {SubTask[]} subTasks */
  async addSubTasks(todoId, subTasks) {
    const todos = readTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) return delay(null);
    if (!todos[idx].subTasks) todos[idx].subTasks = [];
    todos[idx].subTasks.push(...subTasks);
    writeTodos(todos);
    return delay(todos[idx]);
  },

  /** @param {string} todoId */
  /** @param {SubTask[]} subTasks */
  async replaceSubTasks(todoId, subTasks) {
    const todos = readTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) return delay(null);
    todos[idx].subTasks = subTasks || [];
    writeTodos(todos);
    return delay(todos[idx]);
  },

  /** @param {string} todoId */
  /** @param {string} subTaskId */
  async toggleSubTask(todoId, subTaskId) {
    const todos = readTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) return delay(null);
    if (!todos[idx].subTasks) return delay(null);
    const subIdx = todos[idx].subTasks.findIndex(st => st.id === subTaskId);
    if (subIdx === -1) return delay(null);
    todos[idx].subTasks[subIdx] = { 
      ...todos[idx].subTasks[subIdx], 
      completed: !todos[idx].subTasks[subIdx].completed 
    };
    writeTodos(todos);
    return delay(todos[idx]);
  },

  /** @param {string} todoId */
  /** @param {object} aiAnalysis */
  async updateAIAnalysis(todoId, aiAnalysis) {
    const todos = readTodos();
    const idx = todos.findIndex(t => t.id === todoId);
    if (idx === -1) return delay(null);
    todos[idx] = { ...todos[idx], aiAnalysis };
    writeTodos(todos);
    return delay(todos[idx]);
  }
};


