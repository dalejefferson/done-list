/*
  Calendar window logic - reads from shared localStorage backend
*/

import { backend } from './services/backend.js';

/** @typedef {{ id: string, title: string, completed: boolean, assignedDate?: string, isEveryday?: boolean, subTasks?: SubTask[] }} Todo */

const calendarGridEl = document.getElementById('calendar-grid');
const calendarMonthYearEl = document.getElementById('calendar-month-year');
const calendarPrevBtn = document.getElementById('calendar-prev-month');
const calendarNextBtn = document.getElementById('calendar-next-month');

// Modal elements
const taskModalEl = document.getElementById('task-modal');
const taskModalTitleEl = document.getElementById('task-modal-title');
const taskModalInputEl = document.getElementById('task-modal-input');
const taskModalFormEl = document.getElementById('task-modal-form');
const taskModalCancelBtn = document.getElementById('task-modal-cancel');
const taskModalBackdropEl = document.getElementById('task-modal-backdrop');

// AI Suggestions elements
const aiSuggestionsSectionEl = document.getElementById('ai-suggestions-section');
const aiSuggestionsStatusEl = document.getElementById('ai-suggestions-status');
const aiSuggestionsListEl = document.getElementById('ai-suggestions-list');
const aiSuggestionsActionsEl = document.getElementById('ai-suggestions-actions');
const aiAddSubtasksBtn = document.getElementById('ai-add-subtasks-btn');
const aiRegenerateBtn = document.getElementById('ai-regenerate-btn');

const API_BASE = 'http://localhost:3001';
let currentAnalyzedTask = null;
let currentAnalyzedTodoId = null;
let currentAiSteps = [];
let aiRequestInFlight = false;

let currentCalendarDate = new Date();
let todos = [];
let pendingDateStr = null; // Store the date for which we're creating a task

function formatDateKey(date) {
  return date.toISOString().split('T')[0];
}

async function loadTodos() {
  todos = await backend.listTodos();
  renderCalendar();
}

function getTasksForDate(dateStr) {
  return todos.filter(t => t.assignedDate === dateStr);
}

function showTaskModal(dateStr) {
  if (!taskModalEl || !taskModalTitleEl || !taskModalInputEl) return;
  
  pendingDateStr = dateStr;
  const date = new Date(dateStr);
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  taskModalTitleEl.textContent = `Create a task for ${formattedDate}`;
  taskModalInputEl.value = '';
  taskModalEl.classList.remove('hidden');
  
  // Focus input after a brief delay to ensure modal is visible
  setTimeout(() => {
    taskModalInputEl.focus();
  }, 100);
}

function hideTaskModal() {
  if (!taskModalEl) return;
  taskModalEl.classList.add('hidden');
  pendingDateStr = null;
  taskModalInputEl.value = '';
  // Reset AI suggestions UI
  if (aiSuggestionsSectionEl) aiSuggestionsSectionEl.classList.add('hidden');
  if (aiSuggestionsListEl) aiSuggestionsListEl.innerHTML = '';
  if (aiSuggestionsActionsEl) aiSuggestionsActionsEl.classList.add('hidden');
  if (aiSuggestionsStatusEl) aiSuggestionsStatusEl.textContent = '';
  currentAnalyzedTask = null;
  currentAnalyzedTodoId = null;
  currentAiSteps = [];
  aiRequestInFlight = false;
}

function renderCalendar() {
  if (!calendarGridEl || !calendarMonthYearEl) return;
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  // Update month/year display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  calendarMonthYearEl.textContent = `${monthNames[month]} ${year}`;
  
  // Clear calendar grid
  calendarGridEl.innerHTML = '';
  
  // Add day headers
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayHeaders.forEach(day => {
    const header = document.createElement('div');
    header.className = 'text-xs font-semibold text-base-900/70 text-center py-2';
    header.textContent = day;
    calendarGridEl.appendChild(header);
  });
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    const empty = document.createElement('div');
    empty.className = 'aspect-square';
    calendarGridEl.appendChild(empty);
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDateKey(date);
    const dayTasks = getTasksForDate(dateStr);
    const isToday = formatDateKey(new Date()) === dateStr;
    
    const dayCell = document.createElement('div');
    dayCell.className = `aspect-square rounded-lg p-2 border ${
      isToday ? 'bg-accent-500/30 border-accent-500 ring-2 ring-accent-500/50' : 'bg-cream-50/50 border-accent-500/20'
    } hover:bg-accent-500/10 transition cursor-pointer`;
    
    const dayNumber = document.createElement('div');
    dayNumber.className = `text-xs font-medium ${isToday ? 'text-accent-600 font-bold' : 'text-base-900'}`;
    dayNumber.textContent = day;
    dayCell.appendChild(dayNumber);
    
    // Show task count
    if (dayTasks.length > 0) {
      const taskCount = document.createElement('div');
      taskCount.className = 'mt-1 text-xs text-accent-600 font-medium';
      taskCount.textContent = `${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}`;
      dayCell.appendChild(taskCount);
      
      // Show task titles on hover
      dayCell.title = dayTasks.map(t => t.title).join(', ');
    }
    
    // Click to assign date to a new task or view tasks
    dayCell.addEventListener('click', async () => {
      if (dayTasks.length > 0) {
        // Show tasks for this date
        const taskTitles = dayTasks.map(t => t.title).join('\n');
        alert(`Tasks for ${dateStr}:\n${taskTitles}`);
      } else {
        // Show modal to create a task for this date
        showTaskModal(dateStr);
      }
    });
    
    calendarGridEl.appendChild(dayCell);
  }
}

// Modal form submission
if (taskModalFormEl) {
  taskModalFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskTitle = taskModalInputEl.value.trim();
    
    if (taskTitle && pendingDateStr) {
      // Collapse the previous task if it exists
      if (window.previousTodoId) {
        const previousTodo = todos.find(t => t.id === window.previousTodoId);
        if (previousTodo && !window.manuallyExpandedTodos.has(window.previousTodoId)) {
          window.collapsedTodos.add(window.previousTodoId);
        }
      }
      
      const newTodo = await backend.createTodo(taskTitle, pendingDateStr);
      await loadTodos();
      
      // Track this as the previous task for next time
      if (newTodo) {
        window.previousTodoId = newTodo.id;
      }
      
      // Dispatch custom event to notify main app to refresh
      window.dispatchEvent(new CustomEvent('todos-updated'));
      
      // Close modal first
      hideTaskModal();
      
      // Navigate to calendar view if we're in app.html (hash-based routing)
      // Check if calendar-page element exists (embedded calendar) or if we're on app.html
      const calendarPageEl = document.getElementById('calendar-page');
      if (calendarPageEl || window.location.pathname.includes('app.html')) {
        window.location.hash = '#calendar';
      }
      
      // Analyze task with AI after creation (don't block navigation)
      if (newTodo) {
        currentAnalyzedTodoId = newTodo.id;
        analyzeTaskWithAI(taskTitle, newTodo.id).catch(() => {
          // Errors are handled in the function
        });
      }
    }
  });
}

// Modal cancel button
if (taskModalCancelBtn) {
  taskModalCancelBtn.addEventListener('click', () => {
    hideTaskModal();
  });
}

// Close modal when clicking backdrop
if (taskModalBackdropEl) {
  taskModalBackdropEl.addEventListener('click', () => {
    hideTaskModal();
  });
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && taskModalEl && !taskModalEl.classList.contains('hidden')) {
    hideTaskModal();
  }
});

// Calendar navigation
if (calendarPrevBtn) {
  calendarPrevBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
  });
}

if (calendarNextBtn) {
  calendarNextBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
  });
}

function renderAISteps(steps) {
  if (!aiSuggestionsListEl) return;
  aiSuggestionsListEl.innerHTML = '';
  
  steps.forEach((s, idx) => {
    const li = document.createElement('li');
    li.className = 'text-sm text-base-900/90 px-3 py-2 bg-cream-50 rounded-lg ring-1 ring-accent-500/10';
    const title = document.createElement('div');
    title.className = 'text-xs font-medium text-base-900';
    title.textContent = `${idx + 1}. ${s?.title || 'Untitled step'}`;
    const why = document.createElement('div');
    why.className = 'mt-1 text-xs text-base-900/60 leading-relaxed';
    if (s?.why) why.textContent = s.why;
    li.appendChild(title);
    if (s?.why) li.appendChild(why);
    aiSuggestionsListEl.appendChild(li);
  });
}

async function analyzeTaskWithAI(taskText, todoId, isRegenerate = false) {
  const trimmed = String(taskText || '').trim();
  if (!trimmed || !todoId) return;
  if (aiRequestInFlight) return; // drop if one is already in progress
  aiRequestInFlight = true;
  
  // Store current task for regeneration
  if (!isRegenerate) {
    currentAnalyzedTask = trimmed;
    currentAnalyzedTodoId = todoId;
  }
  
  // Show AI suggestions section
  if (aiSuggestionsSectionEl) aiSuggestionsSectionEl.classList.remove('hidden');
  if (aiSuggestionsStatusEl) aiSuggestionsStatusEl.textContent = isRegenerate ? 'Generating better version…' : 'Analyzing…';
  if (aiSuggestionsListEl) aiSuggestionsListEl.innerHTML = '';
  if (aiSuggestionsActionsEl) aiSuggestionsActionsEl.classList.add('hidden');
  
  try {
    // Use streaming for faster response
    const res = await fetch(`${API_BASE}/api/ai/analyze-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        taskText: trimmed,
        regenerate: isRegenerate,
        context: isRegenerate ? { previousAnalysis: true } : undefined
      })
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorDetails = data?.details || data?.error || `Request failed (${res.status})`;
      throw new Error(errorDetails);
    }
    
    // Check if response is streaming (text/event-stream) or regular JSON
    const contentType = res.headers.get('content-type') || '';
    let json = null;
    
    if (contentType.includes('text/event-stream')) {
      // Handle streaming response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') {
                fullText += data.content;
                if (aiSuggestionsStatusEl) {
                  aiSuggestionsStatusEl.textContent = 'Generating suggestions…';
                }
              } else if (data.type === 'complete') {
                json = data;
                break;
              } else if (data.type === 'error') {
                throw new Error(data.error || 'AI analysis failed');
              }
            } catch (e) {
              // Skip malformed JSON lines
            }
          }
        }
        
        if (json) break;
      }
      
      if (!json) {
        // Try to parse accumulated text as JSON
        try {
          const match = fullText.match(/\{[\s\S]*\}$/);
          if (match) {
            json = { result: JSON.parse(match[0]) };
          } else {
            throw new Error('Invalid response from AI');
          }
        } catch (e) {
          throw new Error('Failed to parse AI response');
        }
      }
    } else {
      // Fallback to regular JSON response
      json = await res.json();
    }
    
    const steps = json?.result?.steps || [];
    currentAiSteps = steps;
    
    if (steps.length > 0) {
      renderAISteps(steps);
      if (aiSuggestionsActionsEl) aiSuggestionsActionsEl.classList.remove('hidden');
      if (aiSuggestionsStatusEl) {
        aiSuggestionsStatusEl.textContent = isRegenerate ? 'Better version generated' : 'Suggestions ready';
      }
    } else {
      if (aiSuggestionsStatusEl) aiSuggestionsStatusEl.textContent = 'No suggestions available';
    }
  } catch (err) {
    const msg = String(err?.message || 'AI analysis failed');
    const isQuotaError = msg.includes('quota') || msg.includes('billing') || msg.includes('insufficient_quota');
    
    if (aiSuggestionsStatusEl) {
      aiSuggestionsStatusEl.textContent = isQuotaError ? 'OpenAI quota exceeded' : 'AI unavailable';
    }
    
    if (aiSuggestionsListEl) {
      const li = document.createElement('li');
      li.className = 'text-sm text-base-900/90 px-4 py-4 bg-peach-500/20 rounded-xl ring-1 ring-peach-500/30';
      
      const errorText = document.createElement('div');
      errorText.textContent = isQuotaError 
        ? 'Your OpenAI API key has exceeded its quota. Please add credits to continue using AI suggestions.'
        : msg;
      li.appendChild(errorText);
      
      if (isQuotaError) {
        const link = document.createElement('a');
        link.href = 'https://platform.openai.com/account/billing';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'block mt-2 text-accent-600 hover:text-accent-500 underline font-medium text-xs';
        link.textContent = '→ Add credits to OpenAI account';
        li.appendChild(link);
      }
      
      aiSuggestionsListEl.innerHTML = '';
      aiSuggestionsListEl.appendChild(li);
    }
    if (aiSuggestionsActionsEl) aiSuggestionsActionsEl.classList.add('hidden');
  } finally {
    aiRequestInFlight = false;
  }
}

async function addSubtasksFromAI() {
  if (!currentAnalyzedTodoId || !currentAiSteps || currentAiSteps.length === 0) return;
  
  const subTasks = currentAiSteps.map((step, idx) => ({
    id: `sub-${currentAnalyzedTodoId}-${idx}-${Date.now()}`,
    title: step.title || `Step ${idx + 1}`,
    completed: false
  }));
  
  await backend.addSubTasks(currentAnalyzedTodoId, subTasks);
  await loadTodos();
  window.dispatchEvent(new CustomEvent('todos-updated'));
  
  // Show success message and close modal after a brief delay
  if (aiSuggestionsStatusEl) {
    aiSuggestionsStatusEl.textContent = 'Subtasks added!';
  }
  setTimeout(() => {
    hideTaskModal();
  }, 1000);
}

async function regenerateAI() {
  if (!currentAnalyzedTask || !currentAnalyzedTodoId) return;
  await analyzeTaskWithAI(currentAnalyzedTask, currentAnalyzedTodoId, true);
}

// AI action button handlers
if (aiAddSubtasksBtn) {
  aiAddSubtasksBtn.addEventListener('click', async () => {
    await addSubtasksFromAI();
  });
}

if (aiRegenerateBtn) {
  aiRegenerateBtn.addEventListener('click', async () => {
    await regenerateAI();
  });
}

// Listen for custom events to sync with main app
window.addEventListener('todos-updated', () => {
  loadTodos();
});

// Poll for changes (localStorage events don't fire in same window)
let lastTodosHash = '';
setInterval(async () => {
  const currentTodos = await backend.listTodos();
  const currentHash = JSON.stringify(currentTodos);
  if (currentHash !== lastTodosHash) {
    lastTodosHash = currentHash;
    todos = currentTodos;
    renderCalendar();
  }
}, 500);

// Init
(async function init() {
  await loadTodos();
})();

