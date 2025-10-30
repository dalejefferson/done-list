# Backend: LocalStorage and AI Task Analyst API

## Overview
The Done List app uses **localStorage** (web) and **AsyncStorage** (React Native) as the primary backend for storing todos and subtasks. The backend exposes an async API (Promise-based) that can be easily swapped between implementations. Additionally, notes below document a separate AI Task Analyst API scaffold.

### Current Done List Backend: LocalStorage Service
Files: 
- `src/services/backend.js` (Web - uses localStorage)
- `src/services/backend-native.js` (React Native - uses AsyncStorage)

The localStorage backend stores all todos in browser storage using the key `done_list_todos_v1`. All data persists locally in the user's browser/device.

API:
```
backend.listTodos()                    -> Promise<Todo[]>
backend.createTodo(title, assignedDate?) -> Promise<Todo|null>
backend.toggleTodo(id)                 -> Promise<Todo|null>
backend.toggleEveryday(id)             -> Promise<Todo|null>
backend.updateTodo(id, fields)         -> Promise<Todo|null>
backend.deleteTodo(id)                 -> Promise<{ ok: true }>
backend.clearCompleted()               -> Promise<{ ok: true }>
backend.addSubTasks(todoId, subTasks)  -> Promise<Todo|null>
backend.replaceSubTasks(todoId, subTasks) -> Promise<Todo|null>
backend.toggleSubTask(todoId, subTaskId) -> Promise<Todo|null>
```

Note: `createTodo` accepts an optional `assignedDate` parameter (YYYY-MM-DD format string) to assign a task to a specific date.

`Todo` shape:
```
{ 
  id: string, 
  title: string, 
  completed: boolean,
  isEveryday?: boolean,
  assignedDate?: string,
  subTasks?: SubTask[]
}
```

`SubTask` shape:
```
{ 
  id: string, 
  title: string, 
  completed: boolean 
}
```

UI integration: 
- Web: `src/app.js` imports `backend.js` and calls these methods
- React Native: `app/index.js` imports `backend-native.js`

**Data Storage:**
Todos are stored as a JSON array in browser storage:
- Storage key: `done_list_todos_v1`
- Each todo is a plain JavaScript object with the following structure:
  - `id` (string) - Generated unique identifier
  - `title` (string) - Task title
  - `completed` (boolean) - Completion status
  - `isEveryday` (boolean, optional) - Whether task repeats daily
  - `assignedDate` (string, optional) - Date in YYYY-MM-DD format
  - `subTasks` (array, optional) - Array of subtask objects
    - Each subtask has: `id`, `title`, `completed`

**Note:** All data is stored locally in the browser/device. No authentication is required, and data is not synced across devices.

## Stack
- Node.js + Express
- OpenAI SDK (Chat Completions API)

## Environment Variables
- `OPENAI_API_KEY` (required) – never commit; store in `.env.local` for development
- `OPENAI_MODEL` (optional, default `gpt-4o-mini`)
- `AI_MAX_TOKENS` (optional, default `1200`)
- `PORT` (optional, default `3001`)
 - `AI_RATELIMIT_WINDOW_MS` (optional, default `60000`) – in-memory limiter window
 - `AI_RATELIMIT_MAX` (optional, default `100`) – max requests per window per IP
 - `AI_RATELIMIT_ENABLED` (optional, default `true`) – set to `false` to disable rate limiting
 - `NODE_ENV` (optional) – when not `production`, localhost IPs bypass rate limiting

Create `.env.local` in the project root for local development:

```
OPENAI_API_KEY=YOUR_KEY_HERE
OPENAI_MODEL=gpt-4o-mini
AI_MAX_TOKENS=1200
# Rate limiting (auto-bypassed for localhost in dev)
AI_RATELIMIT_ENABLED=true
AI_RATELIMIT_WINDOW_MS=60000
AI_RATELIMIT_MAX=100
```

## API
### POST `/api/ai/analyze-task`
Request body (JSON):
```
{
  "taskText": string,            // required
  "context": object | undefined, // optional, additional metadata
  "regenerate": boolean          // optional, set to true to generate improved version
}
```

Response (JSON):
```
{
  "ok": true,
  "model": string,
  "result": {
    "title": string,
    "assumptions": string[],
    "steps": [
      { "title": string, "why": string, "how": string, "filesToTouch": string[] }
    ],
    "risks": string[],
    "testPlan": string[]
  }
}
```

Errors:
- `400` invalid input
- `429` rate limited
- `500/502` upstream/model errors

## Security
- API key is server-only; never exposed to the client
- Basic in-memory rate limit per IP
- JSON body size limited (512kb)
- CORS enabled by default; tighten per environment when integrating frontend

## Run locally
1. `npm install`
2. Add `.env.local` with `OPENAI_API_KEY`
3. `npm run dev`
4. `POST http://localhost:3001/api/ai/analyze-task` with JSON body

## Future work
- Auth guard (RBAC)
- Streaming responses
- Cache last analysis per task id
- Stronger schema validation


## Future Work
- [ ] Add data export/import functionality
- [ ] Implement cloud sync option
- [ ] Add data backup capabilities


