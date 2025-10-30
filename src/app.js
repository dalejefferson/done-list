/*
  Done List UI wired to a pluggable backend (localStorage for now).
  Focus: clarity, accessibility, and small API surface.
*/

import { backend } from './services/backend.js';
import { Particles } from './utils/particles.js';

/** @typedef {{ id: string, title: string, completed: boolean, assignedDate?: string, isEveryday?: boolean, subTasks?: SubTask[] }} Todo */
/** @typedef {{ id: string, title: string, completed: boolean }} SubTask */

/** @type {Todo[]} */
let todos = [];
let currentFilter = 'all'; // 'all' | 'active' | 'completed'
/** @type {Set<string>} */
const collapsedTodos = new Set(); // Track which todos have collapsed subtasks
/** @type {Set<string>} */
const manuallyExpandedTodos = new Set(); // Track which todos user has manually expanded
/** @type {Map<string, boolean>} */
const previousTodoStates = new Map(); // Track previous completion states to detect transitions
/** @type {Set<string>} */
const hiddenTodos = new Set(); // Track todos that should be hidden after completion animation

const listEl = document.getElementById('todo-list');
const countEl = document.getElementById('todo-count');
const formEl = document.getElementById('todo-form');
const inputEl = document.getElementById('todo-input');
const clearCompletedEl = document.getElementById('clear-completed');
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
const aiSuggestionsSectionEl = document.getElementById('ai-suggestions-section');
const chatAiStatusEl = document.getElementById('chat-ai-status');
const chatAiStepsEl = document.getElementById('chat-ai-steps');
const regenerateAiBtn = document.getElementById('regenerate-ai-btn');
const openCalendarBtn = document.getElementById('open-calendar-btn');

// API Base URL - use current origin in production, localhost in development
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001'
  : window.location.origin;

// Single-flight guard for AI calls to avoid bursts
let aiRequestInFlight = false;
// Track current task being analyzed for regeneration
let currentAnalyzedTask = null;
let currentAnalyzedTodoId = null;

// Page elements for routing
const calendarPageEl = document.getElementById('calendar-page');
const mainAppContentEl = document.getElementById('main-app-content');
const backToAppBtn = document.getElementById('back-to-app-btn');

async function loadTodos() {
  todos = await backend.listTodos();
  // Collapse all tasks with subtasks by default
  // But preserve user's manual expand state
  todos.forEach(todo => {
    if (todo.subTasks && todo.subTasks.length > 0) {
      // Only collapse if user hasn't manually expanded it
      if (!manuallyExpandedTodos.has(todo.id)) {
        collapsedTodos.add(todo.id);
      }
    }
  });
}

async function addTodo(title, assignedDate) {
  const newTodo = await backend.createTodo(title, assignedDate);
  await loadTodos();
  render();
  
  // Notify calendar page to refresh
  window.dispatchEvent(new CustomEvent('todos-updated'));

  // Fire-and-update: ask AI for suggestions for the newly added task
  if (newTodo) {
    // Show loading state immediately when task is created
    if (aiSuggestionsSectionEl) aiSuggestionsSectionEl.classList.remove('hidden');
    if (chatAiStatusEl) {
      chatAiStatusEl.innerHTML = '<span class="inline-flex items-center gap-2"><svg class="animate-spin h-3 w-3 text-accent-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Analyzing task...</span>';
    }
    if (chatAiStepsEl) chatAiStepsEl.innerHTML = '';
    
    analyzeTaskWithAI(title, newTodo.id).catch(() => {
      // errors are surfaced to status element; no throw
    });
  }
}

async function toggleTodo(id) {
  // Get previous state before toggling
  const previousTodo = todos.find(t => t.id === id);
  const wasCompleted = previousTodo ? previousTodo.completed : false;
  
  await backend.toggleTodo(id);
  await loadTodos();
  
  // Check if task was just completed (transitioned from incomplete to completed)
  const currentTodo = todos.find(t => t.id === id);
  const isNowCompleted = currentTodo ? currentTodo.completed : false;
  
  if (!wasCompleted && isNowCompleted) {
    // Task was just completed - trigger confetti and hide animation
    triggerConfetti();
    hideCompletedTask(id);
  }
  
  render();
  window.dispatchEvent(new CustomEvent('todos-updated'));
}

async function toggleEveryday(id) {
  await backend.toggleEveryday(id);
  await loadTodos();
  render();
  window.dispatchEvent(new CustomEvent('todos-updated'));
}

async function deleteTodo(id) {
  await backend.deleteTodo(id);
  await loadTodos();
  render();
  window.dispatchEvent(new CustomEvent('todos-updated'));
}

async function toggleSubTask(todoId, subTaskId) {
  // Get previous state before toggling
  const previousTodo = todos.find(t => t.id === todoId);
  const wasCompleted = previousTodo ? previousTodo.completed : false;
  
  await backend.toggleSubTask(todoId, subTaskId);
  await loadTodos();
  
  // Check if all subtasks are completed, and if so, mark parent todo as completed
  const todo = todos.find(t => t.id === todoId);
  if (todo && todo.subTasks && todo.subTasks.length > 0) {
    const allSubTasksCompleted = todo.subTasks.every(st => st.completed);
    if (allSubTasksCompleted && !todo.completed) {
      await backend.toggleTodo(todoId);
      await loadTodos();
      
      // Task was just completed via subtasks - trigger confetti and hide animation
      triggerConfetti();
      hideCompletedTask(todoId);
    }
  }
  
  render();
  window.dispatchEvent(new CustomEvent('todos-updated'));
}

async function clearCompleted() {
  await backend.clearCompleted();
  await loadTodos();
  render();
  window.dispatchEvent(new CustomEvent('todos-updated'));
}

function setFilter(filter) {
  currentFilter = filter;
  render();
}

function getVisibleTodos() {
  let filteredTodos;
  switch (currentFilter) {
    case 'active':
      filteredTodos = todos.filter(t => !t.completed);
      break;
    case 'completed':
      filteredTodos = todos.filter(t => t.completed);
      break;
    default:
      filteredTodos = todos;
  }
  // Filter out hidden todos (ones that were just completed and are animating out)
  // But only if we're not viewing the "completed" filter (completed tasks stay visible there)
  if (currentFilter === 'completed') {
    return filteredTodos; // Show all completed tasks, even if they're marked as hidden
  }
  return filteredTodos.filter(t => !hiddenTodos.has(t.id));
}

function renderCount() {
  const remaining = todos.filter(t => !t.completed).length;
  const label = remaining === 1 ? 'item' : 'items';
  countEl.textContent = `${remaining} ${label} left`;
}

function renderFilters() {
  filterButtons.forEach(btn => {
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle('bg-accent-500', isActive);
    btn.classList.toggle('text-cream-50', isActive);
  });
}

function renderList() {
  const items = getVisibleTodos();
  listEl.innerHTML = '';
  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'text-xs text-base-900/60 px-3 py-4 text-center bg-accent-500/10 rounded-xl';
    empty.textContent = 'No tasks yet. Add one above!';
    listEl.appendChild(empty);
    return;
  }

  items.forEach(todo => {
    const li = document.createElement('li');
    li.setAttribute('data-todo-id', todo.id);
    li.className = 'group bg-accent-500/10 hover:bg-accent-500/20 rounded-xl px-3 py-3 ring-1 ring-accent-500/20 transition';

    const mainRow = document.createElement('div');
    mainRow.className = 'flex items-center gap-3';

    const checkbox = document.createElement('button');
    checkbox.setAttribute('aria-pressed', String(todo.completed));
    checkbox.setAttribute('aria-label', 'Toggle completed');
    checkbox.className = `h-5 w-5 rounded-md ring-1 ring-accent-500/30 grid place-items-center ${
      todo.completed ? 'bg-accent-500 text-cream-50' : 'bg-cream-50 text-base-900/40'
    }`;
    checkbox.innerHTML = todo.completed ?
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.3a1 1 0 0 1-1.42.008L3.29 9.26A1 1 0 0 1 4.71 7.84l3.01 3.01 6.54-6.556a1 1 0 0 1 1.444-.004z" clip-rule="evenodd"/></svg>'
      : '';
    checkbox.addEventListener('click', () => toggleTodo(todo.id));

    const title = document.createElement('div');
    title.className = `flex-1 text-sm text-center ${todo.completed ? 'line-through text-base-900/50' : 'text-accent-500'}`;
    title.textContent = todo.title;

    // Add everyday toggle button
    const everydayBtn = document.createElement('button');
    everydayBtn.setAttribute('aria-label', 'Toggle everyday task');
    everydayBtn.setAttribute('aria-pressed', String(todo.isEveryday || false));
    everydayBtn.className = `h-5 w-5 rounded-md ring-1 ring-accent-500/30 grid place-items-center transition ${
      todo.isEveryday ? 'bg-peach-500 text-cream-50' : 'bg-cream-50 text-base-900/40'
    }`;
    everydayBtn.innerHTML = todo.isEveryday
      ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3"><path d="M10.75 10.818v2.614A3.13 3.13 0 0111.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 01-1.138-.125zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.202.592.037.051.08.102.128.152z"></path><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-3 w-3"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg>';
    everydayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleEveryday(todo.id);
    });

    // Add collapse/expand button if subtasks exist
    let collapseBtn = null;
    if (todo.subTasks && todo.subTasks.length > 0) {
      collapseBtn = document.createElement('button');
      collapseBtn.setAttribute('aria-label', 'Toggle subtasks');
      collapseBtn.className = 'text-base-900/60 hover:text-base-900 transition-transform';
      const isCollapsed = collapsedTodos.has(todo.id);
      collapseBtn.innerHTML = isCollapsed
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd"/></svg>';
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (collapsedTodos.has(todo.id)) {
          collapsedTodos.delete(todo.id);
          manuallyExpandedTodos.add(todo.id); // Track that user manually expanded
        } else {
          collapsedTodos.add(todo.id);
          manuallyExpandedTodos.delete(todo.id); // User manually collapsed, remove from expanded set
        }
        render();
      });
    }

    // Add date assignment button
    const dateBtn = document.createElement('button');
    dateBtn.className = 'opacity-0 group-hover:opacity-100 transition text-base-900/60 hover:text-base-900 text-xs px-2 py-1 rounded-md bg-accent-500/20';
    dateBtn.setAttribute('aria-label', 'Assign date');
    if (todo.assignedDate) {
      const date = new Date(todo.assignedDate);
      dateBtn.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateBtn.classList.add('opacity-100');
    } else {
      dateBtn.textContent = '📅';
    }
    dateBtn.addEventListener('click', () => assignDateToTodo(todo.id));

    const del = document.createElement('button');
    del.className = 'opacity-0 group-hover:opacity-100 transition text-base-900/60 hover:text-base-900 text-xs px-2 py-1 rounded-md bg-accent-500/20';
    del.setAttribute('aria-label', 'Delete');
    del.textContent = 'Delete';
    del.addEventListener('click', () => deleteTodo(todo.id));

    mainRow.appendChild(checkbox);
    mainRow.appendChild(title);
    mainRow.appendChild(everydayBtn);
    if (collapseBtn) {
      mainRow.appendChild(collapseBtn);
    }
    mainRow.appendChild(dateBtn);
    mainRow.appendChild(del);
    li.appendChild(mainRow);

    // Render sub-tasks if they exist
    if (todo.subTasks && todo.subTasks.length > 0) {
      const isCollapsed = collapsedTodos.has(todo.id);
      const subTasksContainer = document.createElement('div');
      subTasksContainer.className = isCollapsed ? 'hidden' : 'mt-3 ml-8 space-y-2';
      
      todo.subTasks.forEach(subTask => {
        const subLi = document.createElement('div');
        subLi.className = 'flex items-center gap-2 bg-accent-500/5 hover:bg-accent-500/10 rounded-lg px-2 py-2';

        const subCheckbox = document.createElement('button');
        subCheckbox.setAttribute('aria-pressed', String(subTask.completed));
        subCheckbox.setAttribute('aria-label', 'Toggle sub-task completed');
        subCheckbox.className = `h-4 w-4 rounded-md ring-1 ring-accent-500/30 grid place-items-center ${
          subTask.completed ? 'bg-accent-500 text-cream-50' : 'bg-cream-50 text-base-900/40'
        }`;
        subCheckbox.innerHTML = subTask.completed ?
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-2.5 w-2.5"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.3a1 1 0 0 1-1.42.008L3.29 9.26A1 1 0 0 1 4.71 7.84l3.01 3.01 6.54-6.556a1 1 0 0 1 1.444-.004z" clip-rule="evenodd"/></svg>'
          : '';
        subCheckbox.addEventListener('click', () => toggleSubTask(todo.id, subTask.id));

        const subTitle = document.createElement('div');
        subTitle.className = `flex-1 text-xs text-center ${subTask.completed ? 'line-through text-base-900/50' : 'text-base-900/80'}`;
        subTitle.textContent = subTask.title;

        subLi.appendChild(subCheckbox);
        subLi.appendChild(subTitle);
        subTasksContainer.appendChild(subLi);
      });

      li.appendChild(subTasksContainer);
    }

    listEl.appendChild(li);
  });
}

async function assignDateToTodo(todoId) {
  const todo = todos.find(t => t.id === todoId);
  if (!todo) return;
  
  const currentDate = todo.assignedDate ? new Date(todo.assignedDate) : new Date();
  const dateStr = currentDate.toISOString().split('T')[0];
  
  const input = document.createElement('input');
  input.type = 'date';
  input.value = dateStr;
  input.className = 'rounded-lg px-2 py-1 text-sm border border-accent-500/30';
  
  const newDate = prompt('Assign a date (YYYY-MM-DD) or leave empty to remove:', dateStr);
  if (newDate === null) return; // User cancelled
  
  const assignedDate = newDate.trim() || undefined;
  await backend.updateTodo(todoId, { assignedDate });
  await loadTodos();
  render();
  window.dispatchEvent(new CustomEvent('todos-updated'));
}

function showCalendarPage() {
  if (calendarPageEl) calendarPageEl.classList.remove('hidden');
  if (mainAppContentEl) mainAppContentEl.classList.add('hidden');
  window.location.hash = '#calendar';
}

function showMainApp() {
  if (calendarPageEl) calendarPageEl.classList.add('hidden');
  if (mainAppContentEl) mainAppContentEl.classList.remove('hidden');
  window.location.hash = '';
}

function handleRoute() {
  if (window.location.hash === '#calendar') {
    showCalendarPage();
  } else {
    showMainApp();
  }
}

function triggerConfetti() {
  // Check if confetti library is available
  if (typeof confetti === 'undefined') return;
  
  // Trigger confetti with colors matching the app theme
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#5A8A8C', '#D4A574', '#F8F4F0', '#4A7C7E', '#C89A6A'],
    gravity: 0.8,
    ticks: 200,
  });
}

function hideCompletedTask(todoId) {
  // Mark task as hidden so it won't be rendered
  hiddenTodos.add(todoId);
  
  // Find the task element and animate it out
  const taskElement = document.querySelector(`[data-todo-id="${todoId}"]`);
  if (taskElement) {
    // Add fade-out animation
    taskElement.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    taskElement.style.opacity = '0';
    taskElement.style.transform = 'translateY(-10px) scale(0.95)';
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      if (taskElement.parentNode) {
        taskElement.remove();
      }
      // Re-render to update the list
      render();
    }, 500);
  } else {
    // If element not found, just re-render
    render();
  }
}

function render() {
  renderList();
  renderCount();
  renderFilters();
}

function renderAISteps(steps) {
  if (!chatAiStepsEl) return;
  chatAiStepsEl.innerHTML = '';
  if (!Array.isArray(steps) || steps.length === 0) {
    const li = document.createElement('li');
    li.className = 'text-sm text-base-900/60 px-4 py-6 bg-accent-500/10 rounded-xl text-center';
    li.textContent = 'No suggestions yet. Add a task to get AI-powered breakdown suggestions!';
    chatAiStepsEl.appendChild(li);
    if (regenerateAiBtn) regenerateAiBtn.classList.add('hidden');
    return;
  }

  steps.forEach((s, idx) => {
    const li = document.createElement('li');
    li.className = 'bg-accent-500/10 hover:bg-accent-500/20 rounded-xl px-4 py-3 ring-1 ring-accent-500/20 transition';
    const title = document.createElement('div');
    title.className = 'text-sm font-medium text-base-900';
    title.textContent = `${idx + 1}. ${s?.title || 'Untitled step'}`;
    const why = document.createElement('div');
    why.className = 'mt-1 text-xs text-base-900/60 leading-relaxed';
    if (s?.why) why.textContent = s.why;
    li.appendChild(title);
    if (s?.why) li.appendChild(why);
    chatAiStepsEl.appendChild(li);
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
  if (chatAiStatusEl) {
    const statusText = isRegenerate ? 'Generating better version…' : 'Analyzing…';
    chatAiStatusEl.innerHTML = `<span class="inline-flex items-center gap-2"><svg class="animate-spin h-3 w-3 text-accent-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>${statusText}</span>`;
  }
  if (chatAiStepsEl) chatAiStepsEl.innerHTML = '';
  try {
    // up to 2 retries on 429 with simple backoff
    let attempt = 0;
    let json = null;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = await fetch(`${API_BASE}/api/ai/analyze-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          taskText: trimmed,
          regenerate: isRegenerate,
          context: isRegenerate ? { previousAnalysis: true } : undefined
        })
      });
      if (res.ok) {
        json = await res.json();
        break;
      }
      const status = res.status;
      const data = await res.json().catch(() => ({}));
      const errorDetails = data?.details || data?.error || `Request failed (${status})`;
      
      // Don't retry on OpenAI quota errors - retrying won't help
      if (status === 429 && (errorDetails.includes('quota') || errorDetails.includes('billing'))) {
        throw new Error(errorDetails);
      }
      
      // Only retry on actual rate limit errors (from our server, not OpenAI)
      if (status === 429 && attempt < 2) {
        const retryAfter = Number(res.headers.get('retry-after') || 1);
        if (chatAiStatusEl) {
          chatAiStatusEl.innerHTML = `<span class="inline-flex items-center gap-2"><svg class="animate-spin h-3 w-3 text-accent-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Rate limited, retrying in ${retryAfter}s…</span>`;
        }
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        attempt += 1;
        continue;
      }
      throw new Error(errorDetails);
    }
    
    // Convert AI suggestions into sub-tasks
    const steps = json?.result?.steps || [];
    if (steps.length > 0) {
      const subTasks = steps.map((step, idx) => ({
        id: `sub-${todoId}-${idx}-${Date.now()}`,
        title: step.title || `Step ${idx + 1}`,
        completed: false
      }));
      
      // Replace subtasks if regenerating, otherwise add them
      if (isRegenerate) {
        await backend.replaceSubTasks(todoId, subTasks);
      } else {
        await backend.addSubTasks(todoId, subTasks);
      }
      // Automatically expand the task when AI suggestions create subtasks
      collapsedTodos.delete(todoId);
      manuallyExpandedTodos.add(todoId);
      await loadTodos();
      render();
    }
    
    renderAISteps(steps);
    
    // Show regenerate button if we have steps
    if (steps.length > 0 && regenerateAiBtn) {
      regenerateAiBtn.classList.remove('hidden');
    }
    
    if (chatAiStatusEl) {
      chatAiStatusEl.textContent = isRegenerate ? 'Better version generated' : 'Sub-tasks created';
      setTimeout(() => { if (chatAiStatusEl) chatAiStatusEl.textContent = ''; }, 1500);
    }
  } catch (err) {
    const msg = String(err?.message || 'AI analysis failed');
    const isQuotaError = msg.includes('quota') || msg.includes('billing') || msg.includes('insufficient_quota');
    
    if (chatAiStatusEl) {
      chatAiStatusEl.textContent = isQuotaError ? 'OpenAI quota exceeded' : 'AI unavailable';
    }
    
    if (chatAiStepsEl) {
      const li = document.createElement('li');
      li.className = 'text-sm text-base-900/90 px-4 py-4 bg-peach-500/20 rounded-xl ring-1 ring-peach-500/30';
      
      // Show clear error message
      const errorText = document.createElement('div');
      errorText.textContent = isQuotaError 
        ? 'Your OpenAI API key has exceeded its quota. Please add credits to continue using AI suggestions.'
        : msg;
      li.appendChild(errorText);
      
      // Add billing link for quota errors
      if (isQuotaError) {
        const link = document.createElement('a');
        link.href = 'https://platform.openai.com/account/billing';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'block mt-2 text-accent-600 hover:text-accent-500 underline font-medium text-xs';
        link.textContent = '→ Add credits to OpenAI account';
        li.appendChild(link);
      }
      
      chatAiStepsEl.innerHTML = '';
      chatAiStepsEl.appendChild(li);
    }
    if (regenerateAiBtn) regenerateAiBtn.classList.add('hidden');
  } finally {
    aiRequestInFlight = false;
  }
}

async function regenerateAI() {
  if (!currentAnalyzedTask || !currentAnalyzedTodoId) return;
  await analyzeTaskWithAI(currentAnalyzedTask, currentAnalyzedTodoId, true);
}

// Calendar page navigation
if (openCalendarBtn) {
  openCalendarBtn.addEventListener('click', () => {
    showCalendarPage();
  });
}

if (backToAppBtn) {
  backToAppBtn.addEventListener('click', () => {
    showMainApp();
  });
}

// Handle hash changes for routing
window.addEventListener('hashchange', handleRoute);

// Listen for todos updates from calendar page
window.addEventListener('todos-updated', async () => {
  await loadTodos();
  render();
});

// Events
formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  await addTodo(inputEl.value);
  inputEl.value = '';
  inputEl.focus();
  // Hide AI suggestions section when starting a new task
  if (aiSuggestionsSectionEl) aiSuggestionsSectionEl.classList.add('hidden');
});

clearCompletedEl.addEventListener('click', async () => { await clearCompleted(); });

filterButtons.forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));

regenerateAiBtn.addEventListener('click', async () => {
  await regenerateAI();
});

// Init particles background
let particlesInstance = null;
function initParticles() {
  const container = document.getElementById('particles-container');
  if (container) {
    // Color palette: muted greens, grays, and off-white tones
    const colorPalette = [
      '#5A8A8C', // muted green-gray (accent)
      '#6B9A9D', // lighter muted green
      '#4A7A7C', // darker muted green
      '#8B8B8B', // medium gray
      '#A0A0A0', // lighter gray
      '#6B6B6B', // darker gray
      '#F5F5F0', // off-white
      '#E8E8E3', // cream
      '#DADAD5', // muted cream
    ];
    
    particlesInstance = new Particles({
      container,
      quantity: 100,
      staticity: 50,
      ease: 50,
      size: 0.7, // Increased from 0.4 for bigger particles
      colors: colorPalette,
      vx: 0,
      vy: 0,
    });
  }
}


// Init
(async function init() {
  await loadTodos();
  render();
  initParticles();
  handleRoute(); // Set initial route
})();


