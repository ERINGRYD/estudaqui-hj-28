# Database Architecture & Persistence

## Overview

This project uses SQLite (sql.js) with IndexedDB persistence via the DBProvider context. All database operations now properly persist to IndexedDB automatically.

## Architecture

### Core Components

1. **DBProvider** (`src/contexts/DBProvider.tsx`)
   - Initializes SQLite database with schema
   - Provides `scheduleSave()` function with 1-second debounce
   - Handles IndexedDB persistence automatically

2. **Singleton** (`src/db/singleton.ts`)
   - Global database instance management
   - Injects `scheduleSave()` function for use outside React context
   - Provides safe access to database instance

3. **CRUD Modules** (`src/db/crud/`)
   - **appSettings.ts** - Application settings (pomodoro, theme, notifications)
   - **studyGoals.ts** - Study goals with deadlines and progress tracking
   - **performanceMetrics.ts** - Aggregated performance statistics
   - **index.ts** - Centralized exports

4. **Main Database** (`src/db/db.ts`)
   - Core study plan, subject, topic, subtopic operations
   - Study session management
   - Saved plans management
   - Daily logs management
   - Now properly calls `scheduleSave()` after all write operations

## Key Changes Made

### ✅ Fixed Persistence Issues

**Before:** Functions like `saveNamedStudyPlan()` and `saveDailyLogs()` didn't call `scheduleSave()`
**After:** All write operations now automatically persist to IndexedDB

### ✅ Implemented Missing CRUD Functions

**App Settings:**
- `saveAppSetting()`, `loadAppSetting()`, `loadAppSettings()`, `deleteAppSetting()`
- Utility functions: `saveTypedSetting()`, `loadTypedSetting()`

**Study Goals:**
- `saveStudyGoal()`, `loadStudyGoal()`, `loadStudyGoals()`, `deleteStudyGoal()`
- `updateStudyGoalProgress()`, `loadGoalsBySubject()`, `loadUpcomingGoals()`

**Performance Metrics:**
- `savePerformanceMetric()`, `loadPerformanceMetric()`, `loadPerformanceMetrics()`
- `deletePerformanceMetric()`, `loadDailyMetrics()`, `loadWeeklyMetrics()`, `loadMonthlyMetrics()`
- `calculateDailyMetrics()` - automatically calculates metrics from sessions

### ✅ Improved Architecture

- **Singleton Injection**: `scheduleSave()` is injected into singleton for global access
- **Modular CRUD**: Separated concerns into focused modules
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Comprehensive error handling and logging

## Usage Examples

### App Settings
```typescript
import { saveTypedSetting, loadTypedSetting } from '@/utils/sqlitePersistence';

// Save settings
saveTypedSetting('pomodoro_duration', 25, 'pomodoro', 'Duration in minutes');
saveTypedSetting('theme_mode', 'dark', 'theme');

// Load settings
const duration = loadTypedSetting('pomodoro_duration', 25); // Returns 25 if not found
const theme = loadTypedSetting('theme_mode', 'light');
```

### Study Goals
```typescript
import { saveStudyGoal, loadStudyGoals, updateStudyGoalProgress } from '@/utils/sqlitePersistence';

// Create goal
const goal = {
  id: 'goal_1',
  title: 'Study 100 hours of Math',
  targetType: 'hours' as const,
  targetValue: 100,
  currentValue: 0,
  status: 'active' as const,
  priority: 1
};
saveStudyGoal(goal);

// Update progress
updateStudyGoalProgress('goal_1', 25); // Updates to 25 hours

// Load goals
const activeGoals = loadStudyGoals('active');
```

### Performance Metrics
```typescript
import { calculateDailyMetrics, savePerformanceMetric, loadDailyMetrics } from '@/utils/sqlitePersistence';

// Calculate today's metrics automatically
const todayMetrics = calculateDailyMetrics('2024-01-15');
savePerformanceMetric(todayMetrics);

// Load last 30 days
const metrics = loadDailyMetrics(30);
```

## Migration Helper

The `migrationHelper.ts` utility helps transition from localStorage:

```typescript
import { runAllMigrations, checkForLegacyData } from '@/utils/migrationHelper';

// Check if migration is needed
const legacy = checkForLegacyData();
if (legacy.hasSettings || legacy.hasGoals) {
  runAllMigrations();
}
```

## Database Schema

The schema includes these main tables:
- `study_plans` - Study plan configurations
- `study_subjects` - Subjects within plans
- `study_topics` - Topics within subjects
- `study_subtopics` - Subtopics within topics
- `study_sessions` - Individual study sessions
- `saved_plans` - Named/saved study plans
- `daily_logs` - Daily study logs
- `app_settings` - Application configuration
- `study_goals` - Study goals and targets
- `performance_metrics` - Aggregated statistics

## Best Practices

1. **Always use CRUD functions** - Don't write raw SQL in components
2. **Handle errors gracefully** - All functions include error handling
3. **Use typed functions** - Prefer `saveTypedSetting()` over raw `saveAppSetting()`
4. **Batch operations** - Group related saves to reduce IndexedDB writes
5. **Check database readiness** - Use `withDatabase()` for safe operations

## Troubleshooting

### Database Not Ready Error
```typescript
// Wrong
const data = getDBOrThrow(); // May throw if DB not ready

// Right
import { withDatabase } from '@/utils/databaseUtils';
const data = withDatabase(() => getDBOrThrow(), null);
```

### Missing scheduleSave() Error
This should not happen after this refactor, but if it does:
1. Ensure DBProvider is wrapping your app
2. Check that `setScheduleSave()` is called during initialization
3. Verify you're using the updated CRUD functions

### Data Not Persisting
1. Check browser console for IndexedDB errors
2. Verify `scheduleSave()` is being called (should see "Database saved to IndexedDB" logs)
3. Check that the operation completed successfully before expecting persistence