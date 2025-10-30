/*
  Supabase-backed backend service for todos (React Native).
  Provides the same async API as AsyncStorage backend for easy swap-out.
*/

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - uses environment variables
// Note: For React Native, these should be set via app.json or config file
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://bmtqecovjalcgieoeyqx.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.warn('Warning: SUPABASE_ANON_KEY not set. Supabase features may not work.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** @typedef {{ id: string, title: string, completed: boolean, assignedDate?: string, isEveryday?: boolean, subTasks?: SubTask[] }} Todo */
/** @typedef {{ id: string, title: string, completed: boolean }} SubTask */

// Helper to convert database row to Todo format
function dbRowToTodo(row) {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    isEveryday: row.is_everyday || false,
    assignedDate: row.assigned_date || undefined,
    subTasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    aiAnalysis: row.ai_analysis || undefined
  };
}

// Helper to convert Todo to database format
function todoToDbRow(todo) {
  return {
    title: todo.title,
    completed: todo.completed,
    is_everyday: todo.isEveryday || false,
    assigned_date: todo.assignedDate || null,
    subtasks: todo.subTasks || []
  };
}

export const backend = {
  async listTodos() {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error listing todos:', error);
      return [];
    }
    
    return (data || []).map(dbRowToTodo);
  },

  /** @param {string} title */
  /** @param {string} [assignedDate] */
  async createTodo(title, assignedDate) {
    const clean = title.trim();
    if (!clean) return null;
    
    const newTodo = {
      title: clean,
      completed: false,
      is_everyday: false,
      assigned_date: assignedDate || null,
      subtasks: []
    };
    
    const { data, error } = await supabase
      .from('todos')
      .insert([newTodo])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating todo:', error);
      return null;
    }
    
    return dbRowToTodo(data);
  },

  async toggleTodo(id) {
    // First get the current todo
    const { data: currentTodo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentTodo) {
      console.error('Error fetching todo:', fetchError);
      return null;
    }
    
    const { data, error } = await supabase
      .from('todos')
      .update({ completed: !currentTodo.completed })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error toggling todo:', error);
      return null;
    }
    
    return dbRowToTodo(data);
  },

  async toggleEveryday(id) {
    // First get the current todo
    const { data: currentTodo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentTodo) {
      console.error('Error fetching todo:', fetchError);
      return null;
    }
    
    const { data, error } = await supabase
      .from('todos')
      .update({ is_everyday: !(currentTodo.is_everyday || false) })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error toggling everyday:', error);
      return null;
    }
    
    return dbRowToTodo(data);
  },

  async updateTodo(id, fields) {
    const updateData = {};
    
    if (fields.assignedDate !== undefined) {
      updateData.assigned_date = fields.assignedDate || null;
    }
    if (fields.title !== undefined) {
      updateData.title = fields.title;
    }
    if (fields.completed !== undefined) {
      updateData.completed = fields.completed;
    }
    if (fields.isEveryday !== undefined) {
      updateData.is_everyday = fields.isEveryday;
    }
    if (fields.aiAnalysis !== undefined) {
      updateData.ai_analysis = fields.aiAnalysis || null;
    }
    
    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating todo:', error);
      return null;
    }
    
    return dbRowToTodo(data);
  },

  async deleteTodo(id) {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting todo:', error);
      return { ok: false };
    }
    
    return { ok: true };
  },

  async clearCompleted() {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('completed', true);
    
    if (error) {
      console.error('Error clearing completed:', error);
      return { ok: false };
    }
    
    return { ok: true };
  },

  /** @param {string} todoId */
  /** @param {SubTask[]} subTasks */
  async addSubTasks(todoId, subTasks) {
    // First get the current todo
    const { data: currentTodo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .single();
    
    if (fetchError || !currentTodo) {
      console.error('Error fetching todo:', fetchError);
      return null;
    }
    
    const existingSubTasks = Array.isArray(currentTodo.subtasks) ? currentTodo.subtasks : [];
    const updatedSubTasks = [...existingSubTasks, ...subTasks];
    
    const { data, error } = await supabase
      .from('todos')
      .update({ subtasks: updatedSubTasks })
      .eq('id', todoId)
      .select()
      .single();
    
    if (error) {
      console.error('Error adding subtasks:', error);
      return null;
    }
    
    return dbRowToTodo(data);
  },

  /** @param {string} todoId */
  /** @param {SubTask[]} subTasks */
  async replaceSubTasks(todoId, subTasks) {
    const { data, error } = await supabase
      .from('todos')
      .update({ subtasks: subTasks || [] })
      .eq('id', todoId)
      .select()
      .single();
    
    if (error) {
      console.error('Error replacing subtasks:', error);
      return null;
    }
    
    return dbRowToTodo(data);
  },

  /** @param {string} todoId */
  /** @param {string} subTaskId */
  async toggleSubTask(todoId, subTaskId) {
    // First get the current todo
    const { data: currentTodo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .single();
    
    if (fetchError || !currentTodo) {
      console.error('Error fetching todo:', fetchError);
      return null;
    }
    
    const subTasks = Array.isArray(currentTodo.subtasks) ? currentTodo.subtasks : [];
    const subTaskIndex = subTasks.findIndex(st => st.id === subTaskId);
    
    if (subTaskIndex === -1) {
      console.error('Subtask not found');
      return null;
    }
    
    // Toggle the subtask
    const updatedSubTasks = [...subTasks];
    updatedSubTasks[subTaskIndex] = {
      ...updatedSubTasks[subTaskIndex],
      completed: !updatedSubTasks[subTaskIndex].completed
    };
    
    const { data, error } = await supabase
      .from('todos')
      .update({ subtasks: updatedSubTasks })
      .eq('id', todoId)
      .select()
      .single();
    
    if (error) {
      console.error('Error toggling subtask:', error);
      return null;
    }
    
    return dbRowToTodo(data);
  },

  /** @param {string} todoId */
  /** @param {object} aiAnalysis */
  async updateAIAnalysis(todoId, aiAnalysis) {
    const { data, error } = await supabase
      .from('todos')
      .update({ ai_analysis: aiAnalysis })
      .eq('id', todoId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating AI analysis:', error);
      return null;
    }
    
    return dbRowToTodo(data);
  }
};

