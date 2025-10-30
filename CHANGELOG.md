# Changelog

## [Unreleased]

### Enhanced
- Improved particles background animation
  - Increased particle size from 0.4 to 0.7 for better visibility
  - Increased movement speed by 2.5x (from 0.1 to 0.25) for more dynamic motion
  - Added multi-color palette support with 9 colors from muted green-gray, gray, and off-white tones
  - Particles now randomly select colors from the palette for visual variety
  - Enhanced visual appeal while maintaining the subtle, elegant aesthetic

### Enhanced
- Added loading indicator for AI suggestions when tasks are created
  - AI suggestions section now appears immediately when a task is created
  - Animated spinner icon displays next to "Analyzing task..." status message
  - Loading state visible before AI analysis begins, providing immediate visual feedback
  - Spinner also displays during retry attempts and throughout the analysis process
  - Improved user experience by showing that AI is actively working on suggestions

### Changed
- Enabled physical device mode for iPhone testing
  - Updated `USE_PHYSICAL_DEVICE` flag to `true` in `app/index.js`
  - App now configured to connect to backend server at `http://192.168.2.70:3001` when running on physical iPhone
  - Both Expo dev server and backend server started automatically for mobile testing

### Added
- Confetti animation when tasks are fully completed
  - Tasks trigger a colorful confetti animation when marked as completed
  - Confetti uses app theme colors (teal, peach, cream) for visual consistency
  - Animation triggers when completing tasks directly or when all subtasks are completed
  - Completed tasks fade out and are automatically hidden after completion animation
  - Added canvas-confetti library via CDN for celebration effect

### Changed
- Moved AI suggestions section from bottom of page to inside the "Your Tasks" card, directly below the task input field
- Removed separate "AI Suggestions" card from bottom of page
- AI suggestions now appear inline with the create task box for better workflow integration

## 2025-01-28
- Enhanced: Tasks automatically expand when AI suggestions create subtasks
  - Modified `app/index.js` and `src/app.js` to automatically expand tasks after AI generates subtasks
  - Tasks now open immediately after AI suggestions are created, making it easier to see the generated subtasks
  - Changed behavior from collapsing tasks to expanding them and marking them as manually expanded

## 2025-01-28
- Updated: Changed AI model to OpenAI's fastest model for faster responses
  - Switched from `gpt-4o-mini` to `gpt-3.5-turbo` for faster AI suggestion generation
  - AI suggestions will now respond more quickly while maintaining quality
  - Model can still be overridden via `OPENAI_MODEL` environment variable

## 2025-01-28
- Fixed: Removed sign up page redirect from "Get Started" buttons
  - Updated all "Get Started" buttons in `index.html` to point directly to `app.html` instead of `signin.html`
  - Users can now access the app immediately without seeing sign in/sign up pages
  - Since authentication was removed, app is accessible directly

## 2025-01-28
- Reverted: Switched backend from Supabase to localStorage
  - Changed `app.js` to import `backend.js` (localStorage) instead of `backend-supabase.js`
  - Changed `calendar.js` to import `backend.js` instead of `backend-supabase.js`
  - Removed authentication checks and redirects from `app.js` - app now works without login
  - Removed logout button from app header
  - Removed `updateAIAnalysis` method call (not available in localStorage backend)
  - All todos now stored locally in browser storage using key `done_list_todos_v1`
  - No authentication required - app works immediately without signup/signin
  - Data persists locally per browser/device (no cloud sync)
  - Updated `backend.md` to reflect localStorage as primary backend
  - Supabase backend files preserved for future use if needed

## 2025-01-28
- Enhanced: Google OAuth sign-in configuration and setup
  - Updated `signInWithGoogle()` method to include proper OAuth query parameters (access_type: offline, prompt: consent)
  - Added OAuth callback handling in `app.js` to process redirect tokens
  - Improved redirect URL handling to always redirect to `app.html` after OAuth
  - Created `GOOGLE_OAUTH_SETUP.md` with detailed step-by-step instructions for configuring Google OAuth
  - Updated `backend.md` with Google OAuth setup information
  - Users can now sign in with their real Gmail accounts after configuring Google OAuth in Supabase dashboard

## 2025-01-28
- Feature: Added user authentication with Supabase Auth
  - Created sign up page (`signup.html`) with email/password and Google OAuth support
  - Created sign in page (`signin.html`) for existing users
  - Created authentication service (`src/services/auth.js`) for managing user sessions
  - Updated backend (`backend-supabase.js`) to filter all todos by authenticated `user_id`
  - Updated app (`app.js`) to check authentication and redirect to signup if not logged in
  - Added logout button to app header
  - All tasks are now user-specific - users can only see and modify their own tasks
  - Tasks created by authenticated users are automatically associated with their `user_id`
  - Task deletion now verifies user ownership before deleting
  - Updated landing page links to point to signup page instead of app page
  - Calendar component updated to use Supabase backend with authentication
  - Users can sign up with any email (including fake emails) for testing
  - Updated `backend.md` with authentication documentation

## 2025-01-28
- Feature: AI responses now stored with tasks in database
  - Added `ai_analysis` JSONB column to todos table
  - Full AI analysis response (assumptions, steps, risks, testPlan) is now saved when tasks are analyzed
  - Updated backend services to support storing and retrieving AI analysis
  - AI responses persist with tasks and can be retrieved later
  - Updated backend.md documentation with new ai_analysis field

## 2025-01-28
- Feature: Migrated backend from localStorage to Supabase database
  - Created Supabase database schema with `todos` table
  - Implemented Row-Level Security (RLS) policies (currently public access for development)
  - Created `backend-supabase.js` for web app and `backend-native-supabase.js` for React Native
  - Updated web app (`src/app.js`) and React Native app (`app/index.js`) to use Supabase backend
  - Installed `@supabase/supabase-js` package
  - All task data now persists in PostgreSQL database instead of browser storage
  - Database schema includes: id, title, completed, is_everyday, assigned_date, subtasks (JSONB), timestamps
  - Updated `backend.md` documentation with Supabase setup details
  - Previous localStorage/AsyncStorage backends preserved for reference

## 2025-01-28
- Fixed: Calendar task creation modal now navigates to calendar view after clicking Create
  - After creating a task from the modal, users are automatically taken to the calendar window
  - Works for both embedded calendar in app.html and standalone calendar.html
  - Modal closes immediately after task creation before navigation

## 2025-01-28
- Enhanced: Added AI suggestions to calendar task creation
  - When creating a task in the calendar, AI automatically analyzes the task and provides suggestions
  - AI suggestions are displayed in the task creation modal with step-by-step breakdown
  - Users can add AI suggestions as subtasks with a single click
  - Added "Regenerate" button to get improved AI suggestions
  - Suggestions include step titles and explanations ("why" field)
  - Error handling for API quota issues with helpful links to add credits
  - Consistent AI functionality with main app task creation

## 2025-01-28
- Enhanced: Replaced browser prompt with custom modal for calendar task creation
  - Created beautiful modal dialog matching "Your Tasks" card styling
  - Modal features gradient background, rounded corners, and consistent design language
  - Added backdrop blur and smooth transitions for better UX
  - Modal includes Cancel and Create buttons with proper styling
  - Supports keyboard shortcuts (Escape to close, Enter to submit)
  - Clicking backdrop or Cancel button closes the modal
  - Input field automatically focuses when modal opens
  - Modal displays formatted date (e.g., "Create a task for Monday, January 28, 2025")
  - Works in both standalone calendar.html and embedded calendar in app.html

## 2025-01-28
- Removed: Footer CTA section from landing page
  - Removed "Experience Seamless Productivity" section with description and "Get Started" button
  - Section was located between pricing section and footer
  - Footer now directly follows pricing section

## 2025-01-28
- Enhanced: Modern minimalist logo design for Done List branding
  - Created new checkmark logo inside rounded square container with accent border
  - Updated logo styling across React Native app, landing page, and app page
  - Improved typography with better font weights and letter spacing
  - Added subtle shadows and modern styling to logo elements
  - Logo now features clean checkmark icon representing completion/productivity
  - Enhanced visual hierarchy with larger, bolder text and improved spacing

## 2025-01-28
- Updated: Footer gradient styling to match card design
  - Changed footer background from dark (`bg-base-900`) to light gradient (`from-[#EBEFEF] to-[#DCE0DC]`)
  - Updated all footer text colors from light (`text-cream-50`) to dark (`text-base-900`) for proper contrast
  - Removed dark gradient overlays that were designed for dark background
  - Footer now has a subtle vertical gradient matching the soft greenish-gray color scheme from the design reference

## 2025-01-28
- Removed: FAQ tab from navigation and footer
  - Removed FAQ link from header navigation in both index.html and app.html
  - Removed FAQ link from footer Product section in index.html
  - No FAQ section existed, only navigation links were present

## 2025-01-28
- Updated: Centered task text alignment for better visual balance
  - Added `textAlign: 'center'` to task titles in React Native app
  - Added `text-center` class to task titles in web app
  - Applied centering to both main tasks and subtasks
  - Task text now appears centered within task items for improved readability

## 2025-01-28
- Updated: Reduced container widths for better responsiveness across all devices
  - Changed max-width from `max-w-6xl` (1152px) to `max-w-4xl` (896px) for main containers
  - Changed pricing section from `max-w-7xl` (1280px) to `max-w-4xl` (896px)
  - Changed calendar page from `max-w-4xl` to `max-w-3xl` (768px) for better mobile fit
  - Updated all container widths in both `index.html` and `app.html`
  - Improved mobile, tablet, and desktop experience with narrower, more focused content areas
  - Maintains responsive padding and spacing for all screen sizes

## 2025-01-28
- Updated: Moved AI Suggestions section underneath Your Tasks section
  - Changed layout from two-column grid to vertical stack
  - AI Suggestions now appears below Your Tasks card for better workflow
  - Removed responsive hiding of AI Suggestions section (now visible on all screen sizes)
  - Improved layout flow with vertical stacking instead of side-by-side columns

## 2025-01-28
- Feature: Added comprehensive footer component to landing page
  - Created footer with Done List branding matching app color scheme
  - Footer includes Product, Resources, Support, and Contact sections
  - Social media links (Twitter, GitHub, Instagram) with SVG icons
  - Contact information with email, phone, and address
  - Responsive grid layout (mobile-first, adapts to larger screens)
  - Uses app's color palette: base-900 background, cream-50 text, accent-500 highlights
  - Footer copy tailored to Done List brand (to-do list productivity app)
  - Added copyright notice and "All rights reserved" text
  - Live Chat link includes animated ping indicator
  - Enhanced with subtle gradient overlays matching app color palette
    - Diagonal gradient from accent-500 to peach-500 (matching logo gradient style)
    - Vertical depth gradient from bottom to top
    - Subtle top gradient bar using peach and accent colors
    - All gradients use low opacity (5-15%) for elegant, non-overwhelming effect

## 2025-01-28
- Feature: Separated to-do list app into dedicated page
  - Created separate `app.html` page for the to-do list functionality
  - Removed app section from landing page (`index.html`)
  - Updated all "Get Started" buttons to navigate to `app.html`
  - App page includes full to-do list functionality, calendar, and AI suggestions
  - Landing page now focuses on marketing content (hero, features, pricing)
  - Improved navigation with "Back to Home" button on app page
  - All app functionality preserved and working on dedicated page

## 2025-01-28
- Feature: Added comprehensive Features section highlighting AI auto-suggestions
  - Created new Features section explaining how the app auto-suggests task completion methods
  - Added 6 feature cards: AI Auto-Suggestions, Smart Subtasks, Calendar Integration, Everyday Tasks, Regenerate Suggestions, and Clean & Calm UI
  - Added "How It Works" section with 3-step process visualization
  - Updated hero section description to emphasize AI-powered task guidance
  - Features section accessible via #features anchor link in navigation
  - All features clearly explain the auto-suggestion capability and other app capabilities

## 2025-01-28
- Removed: "Click to Sale" buttons from pricing cards
  - Removed redundant secondary button that appeared below the main "Get started" button in each pricing tier
  - Pricing cards now only display the primary action button

## 2025-01-28
- Feature: Converted web app to Expo React Native mobile app
  - Set up Expo project structure with expo-router for navigation
  - Converted HTML/CSS to React Native components with StyleSheet
  - Replaced localStorage with AsyncStorage for mobile data persistence
  - Converted vanilla JavaScript to React hooks and state management
  - Created `src/services/backend-native.js` for AsyncStorage backend
  - Updated package.json with Expo dependencies (expo, expo-router, react-native, etc.)
  - Created app.json for Expo configuration
  - Added babel.config.js and tailwind.config.js for NativeWind support
  - App now runs on iOS, Android, and Web via Expo
  - Backend server still required for AI features (runs separately)
  - API base URL configured for iOS simulator, Android emulator, and physical devices
  - All core features preserved: todos, subtasks, AI suggestions, filters, etc.
  - Mobile-optimized UI with React Native components

## 2025-01-28
- Updated: Calendar converted from separate window to separate page
  - Calendar now displays as a separate page using hash-based routing (#calendar)
  - Added calendar page content directly to index.html (hidden by default)
  - Updated "Open Calendar" button to navigate to calendar page instead of opening popup window
  - Added "Back to Tasks" button on calendar page to return to main app
  - Calendar and main app stay synchronized via custom events
  - Removed window.open() logic and window.opener.postMessage communication
  - Calendar.js now works as a page component instead of separate window
  - Improved user experience with seamless navigation between pages

## 2025-01-28
- Feature: Added interactive particles background covering entire page
  - Converted React Particles component to vanilla JavaScript for compatibility
  - Particles respond to mouse movement with smooth magnetic effect
  - Uses accent-500 color (#5A8A8C) for particles matching theme
  - Configured with 100 particles, optimized for performance
  - Particles animate smoothly and fade near edges
  - Created `src/utils/particles.js` module for particle animation
  - Particles container uses fixed positioning to cover entire viewport background
  - All page sections have proper z-index layering to appear above particles

## 2025-01-28
- Feature: Calendar moved to separate window
  - Calendar now opens in a dedicated popup window instead of being embedded in main page
  - Added "Open Calendar" button in main app to launch calendar window
  - Calendar window syncs with main window via localStorage and postMessage
  - Both windows stay synchronized when tasks are added/updated
  - Calendar window size: 800x600, resizable
  - Created separate calendar.html and calendar.js files for calendar window
  - Removed calendar section from main index.html

## 2025-01-28
- Feature: Added calendar view for task scheduling
  - Calendar displays tasks assigned to specific dates
  - Monthly calendar view with navigation (prev/next month)
  - Tasks show assigned date badge in task list
  - Click calendar date to view tasks or create new task for that date
  - Tasks can be assigned dates via date button on each task
  - Calendar highlights today's date
  - Date format: YYYY-MM-DD stored in `assignedDate` field
  - Updated Todo schema to include optional `assignedDate` field
  - Calendar grid shows task count per day
  - Tasks persist assigned dates in localStorage

## 2025-01-28
- Feature: Added everyday task toggle button
  - Tasks can now be marked as "everyday" tasks with a toggle button
  - Toggle button displays a clock icon when enabled (peach color) and calendar icon when disabled
  - Everyday toggle persists in localStorage alongside other task properties
  - Added `isEveryday` field to Todo schema (optional boolean)
  - Added `backend.toggleEveryday(id)` method to toggle everyday status
  - UI displays toggle button next to task title in the task list
  - Updated backend.md to document the new field and method

## 2025-01-28
- Fixed: Billing cycle selector visual overlap issue
  - Removed border-4 class from switch indicator that was extending beyond container padding
  - Adjusted indicator positioning to account for container padding (top-1 left-1)
  - Replaced border with box-shadow for cleaner border effect that respects container bounds
  - Updated width calculation to properly account for padding on both sides
  - Fixed visual layering issue where blue border appeared to overlap the light grey container

## 2025-01-28
- Feature: Added pricing component section
  - Converted React pricing component to vanilla JavaScript for compatibility
  - Added three pricing tiers: Starter ($12/mo), Business ($48/mo), Enterprise ($96/mo)
  - Implemented monthly/yearly billing toggle with animated switch indicator
  - Added animated number transitions when switching between billing periods
  - Includes scroll-triggered animations for title, description, and pricing cards
  - Maintains Inter font family throughout (consistent with existing design)
  - Updated color scheme to match app's teal/accent palette (accent-500, accent-600, base-900, cream-50)
  - Replaced orange colors with accent teal colors throughout pricing component
  - Pricing section accessible via #pricing anchor link in navigation
  - Cards feature gradient buttons with accent colors, feature lists, and "Popular" badge for Business plan

## 2025-01-28
- Feature: Added "Generate Better Version" button for AI suggestions
  - New button appears in AI Suggestions panel after initial analysis
  - Allows users to regenerate improved and more detailed suggestions
  - Replaces existing subtasks with better versions when regenerating
  - Button is hidden when no suggestions are available
  - Updated backend to accept `regenerate` flag in analyze-task endpoint
  - Added `backend.replaceSubTasks()` method to replace instead of append subtasks

## 2025-01-28
- Feature: Added collapse/expand functionality for subtasks
  - Tasks with subtasks now display a chevron icon button next to the title
  - Clicking the chevron collapses or expands the subtasks list
  - Chevron points down when collapsed (to expand) and up when expanded (to collapse)
  - Complete state is tracked per task using a Set data structure
  - Improves UI cleanliness when dealing with tasks that have many subtasks

## 2025-01-28
- Updated: AI suggestions now display in the chat preview area (left side)
  - Moved AI suggestions from the right column to the dedicated chat preview area
  - Improved layout with larger, more readable suggestion cards
  - Removed duplicate AI suggestions section from the task list area
  - Chat preview area now shows AI suggestions with improved styling and spacing
  - Suggestions appear in a scrollable container with better visual hierarchy

## 2025-01-28
- Updated: Changed active task text color to muted teal (accent-500: #5A8A8C) to match design
  - Replaced bright green with the muted teal accent color from the theme
  - Provides better visual consistency with the app's color palette

## 2025-01-28
- Feature: Parent todo automatically completes when all subtasks are checked
  - When a subtask is checked off, the system checks if all subtasks are completed
  - If all subtasks are completed, the parent todo is automatically marked as completed
  - Parent todo text is crossed out when completed (existing styling)
  - Updated `toggleSubTask()` function to check and update parent todo status

## 2025-01-28
- Feature: AI suggestions now automatically convert to checkable sub-tasks
  - When a task is created, AI analyzes it and generates step-by-step suggestions
  - AI suggestions are automatically converted into sub-tasks that can be checked off
  - Sub-tasks appear nested under their parent task with individual checkboxes
  - Updated Todo schema to include optional `subTasks` array
  - Added `backend.addSubTasks()` and `backend.toggleSubTask()` methods
  - UI displays sub-tasks with smaller checkboxes and indented styling
  - Sub-tasks persist in localStorage alongside parent tasks

## 2025-01-28
- Fixed: Changed active task text color from dark teal to green (text-green-600) for better visibility
  - Newly created tasks now display in green instead of dark teal/white
  - Completed tasks remain gray with strikethrough

## 2025-01-28
- Rebranded: Changed app name from "Dialogix To‑Do" to "Done List"
- Updated: All UI text, titles, and branding references
- Updated: Package name from "todo-ai-analyst" to "done-list"
- Updated: localStorage key from "dialogix_todos_v1" to "done_list_todos_v1"

## 2025-01-28
- Updated: Complete color scheme redesign to match new palette
  - Background: Light cream (#F8F4F0) replacing dark theme
  - Accent colors: Deep muted teal (#5A8A8C) for primary actions
  - Secondary: Warm muted peach (#D4A574) for accents
  - Text: Dark teal (#1A2F30) for primary text on light background
  - Updated all UI components, cards, buttons, and interactive elements
  - Changed from dark theme to light, calm aesthetic

## 2025-01-28
- Fixed: Incorrect OpenAI API call (client.responses.create -> client.chat.completions.create)
- Fixed: Updated response parsing to use response.choices[0].message.content
- Fixed: Parameter name correction (input -> messages, max_output_tokens -> max_tokens)
- Fixed: Added static file serving in server.js to serve frontend HTML and assets
- Security: Removed exposed API key from backend.md documentation
- Updated: backend.md to reference Chat Completions API instead of Responses API
- App now accessible at http://localhost:3001
- Note: AI suggestions require valid OpenAI API key with billing enabled

## 2025-10-30
- Wire frontend to call `/api/ai/analyze-task` after adding a task
- Add AI Suggestions panel (`#ai-steps`, `#ai-status`) to render model steps
- No backend schema changes; existing AI route reused
- Introduced localStorage-backed backend service (`src/services/backend.js`)
- Refactored UI to use backend API (`src/app.js` imports service)
- Switched to ES modules in `index.html` (`<script type="module" src="./app.js">`)
- Updated `backend.md` with local backend API details

### Fixes
- **RATE LIMITER COMPLETELY DISABLED IN DEVELOPMENT** - No more false 429s from your own server
- Rate limiting is now OFF by default in development (NODE_ENV !== 'production')
- Must explicitly set `AI_RATELIMIT_ENABLED=true` to enable rate limiting in dev
- Improved error handling: Client now distinguishes OpenAI quota errors from rate limit errors
- Enhanced error display: Clear message showing "OpenAI quota exceeded" with direct billing link
- Client no longer retries on OpenAI quota errors (retrying won't help)
- Added server-side error logging for debugging OpenAI API failures

## 0.1.0
- Added AI Task Analyst backend API
- Added `backend.md` with API contract and env docs
- Scaffolding: Express server, route `/api/ai/analyze-task`
- Initial creation of Done List app
- Added Tailwind 3 Play CDN UI and interactions
- Implemented add/toggle/delete/filter/clear with localStorage persistence
- Added docs (`README.md`) and `backend.md`


