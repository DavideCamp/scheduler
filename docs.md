# 🔍 Complete TypeScript Scheduler Code Explanation

## 📋 Table of Contents
1. [Type Definitions](#type-definitions)
2. [Class Structure](#class-structure)
3. [Private Properties](#private-properties)
4. [Core Methods](#core-methods)
5. [Helper Methods](#helper-methods)
6. [Usage Examples](#usage-examples)
7. [Memory Management](#memory-management)

---

## 1. Type Definitions

### `IntervalUnit` Type
```typescript
type IntervalUnit = 'second' | 'minute' | 'hour' | 'day' | 'week';
```
**Purpose**: Creates a union type that restricts interval strings to only valid time units.
- **Union Type**: Means the value can ONLY be one of these exact strings
- **Type Safety**: Prevents typos like `'secnod'` or `'hor'`
- **IntelliSense**: Your IDE will show autocomplete suggestions

### `TaskFunction` Type
```typescript
type TaskFunction = () => void | Promise<void>;
```
**Purpose**: Defines what kind of functions can be scheduled.
- **No Parameters**: `()` means the function takes no arguments
- **Return Types**: Can return `void` (nothing) or `Promise<void>` (async function)
- **Flexibility**: Supports both synchronous and asynchronous functions

**Examples**:
```typescript
// Sync function
const syncTask: TaskFunction = () => console.log('Done');

// Async function  
const asyncTask: TaskFunction = async () => {
  await fetch('/api/health');
};
```

### `TaskInfo` Interface
```typescript
interface TaskInfo {
  name: string;
  interval: number;
  startTime: Date;
  executionCount: number;
  isActive: boolean;
}
```
**Purpose**: Defines the shape of task information objects.
- **Interface**: Contract that objects must follow
- **Public Data**: Information safe to expose to users
- **Readonly Snapshot**: Represents task state at a point in time

### `ScheduleOptions` Interface
```typescript
interface ScheduleOptions {
  runImmediately?: boolean;
  maxExecutions?: number;
}
```
**Purpose**: Optional configuration for scheduling tasks.
- **Optional Properties**: `?` means these can be omitted
- **Flexibility**: Allows customization without complexity

---

## 2. Class Structure

### Class Declaration
```typescript
class Scheduler {
```
**Purpose**: Creates a class that encapsulates all scheduling functionality.
- **Encapsulation**: Keeps related data and methods together
- **Instantiation**: `new Scheduler()` creates independent instances
- **State Management**: Each instance maintains its own tasks

---

## 3. Private Properties

### Task Storage Map
```typescript
private tasks = new Map<string, {
  timerId: ReturnType<typeof setInterval>;
  func: TaskFunction;
  interval: number;
  startTime: Date;
  executionCount: number;
  maxExecutions?: number;
}>();
```

**Deep Breakdown**:

**`private`**: 
- Property is only accessible inside the class
- External code cannot directly modify `scheduler.tasks`
- Encapsulation principle - protects internal state

**`Map<string, {...}>`**:
- **Key**: `string` (task name like 'backup', 'healthCheck')
- **Value**: Object containing task data
- **Why Map vs Object?**: 
  - Better performance for frequent additions/deletions
  - Keys can be any type (though we use strings)
  - Size property available
  - Iteration order guaranteed

**Task Object Properties**:
- **`timerId`**: The interval ID returned by `setInterval()`
  - `ReturnType<typeof setInterval>` gets the return type of setInterval
  - Cross-platform compatible (works in browser and Node.js)
- **`func`**: The actual function to execute
- **`interval`**: Milliseconds between executions  
- **`startTime`**: When the task was created
- **`executionCount`**: How many times it has run
- **`maxExecutions?`**: Optional limit (? means optional)

### Intervals Configuration
```typescript
private readonly intervals: Record<IntervalUnit, number> = {
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000
};
```

**Deep Breakdown**:

**`readonly`**: 
- Property cannot be reassigned after initialization
- Prevents accidental modification of time constants
- Still allows object property changes (but we don't change these)

**`Record<IntervalUnit, number>`**:
- Creates an object type where:
  - Keys must be IntervalUnit types ('second', 'minute', etc.)
  - Values must be numbers
- **Type Safety**: Ensures all interval units are defined
- **Autocomplete**: IDE shows available intervals

**Time Calculations**:
- **1000**: 1 second = 1000 milliseconds
- **60 * 1000**: 1 minute = 60 seconds × 1000ms
- **60 * 60 * 1000**: 1 hour = 60 minutes × 60 seconds × 1000ms
- **24 * 60 * 60 * 1000**: 1 day = 24 hours × 60 minutes × 60 seconds × 1000ms
- **7 * 24 * 60 * 60 * 1000**: 1 week = 7 days × 24 hours × 60 minutes × 60 seconds × 1000ms

---

## 4. Core Methods

### Schedule Method
```typescript
schedule(
  taskName: string,
  func: TaskFunction,
  interval: IntervalUnit | number,
  options: ScheduleOptions = {}
): this {
```

**Method Signature Breakdown**:
- **Parameters**: 
  - `taskName`: Unique identifier for the task
  - `func`: The function to execute
  - `interval`: Either a string ('day') or milliseconds (5000)
  - `options`: Optional configuration with default empty object
- **Return Type**: `this` enables method chaining

**Validation Section**:
```typescript
if (!taskName?.trim()) {
  throw new Error('Task name is required');
}
```
- **`taskName?.trim()`**: Optional chaining - if taskName is null/undefined, returns undefined
- **`!`**: Converts to boolean and negates
- **Logic**: Throws error if taskName is falsy or empty after trimming whitespace

```typescript
if (typeof func !== 'function') {
  throw new Error('Function is required');
}
```
- **Runtime Type Check**: TypeScript types are compile-time only
- **`typeof`**: Returns string representation of the type
- **Safety**: Prevents passing non-functions that would cause runtime errors

**Interval Parsing**:
```typescript
const intervalMs = typeof interval === 'string' 
  ? this.intervals[interval] 
  : interval;
```
- **Ternary Operator**: `condition ? valueIfTrue : valueIfFalse`
- **String Case**: Look up milliseconds in intervals object
- **Number Case**: Use the number directly
- **Type Narrowing**: TypeScript knows the type in each branch

**Interval Validation**:
```typescript
if (!intervalMs || intervalMs <= 0) {
  throw new Error(`Invalid interval: ${interval}`);
}
```
- **`!intervalMs`**: Checks for falsy values (0, null, undefined, NaN)
- **`intervalMs <= 0`**: Ensures positive intervals
- **Template Literal**: `${interval}` embeds the variable in the string

**Task Cleanup**:
```typescript
this.stop(taskName);
```
- **Idempotent**: Safe to call even if task doesn't exist
- **Prevents Duplicates**: Ensures we don't have multiple intervals for same task
- **Resource Management**: Cleans up previous timers

**Immediate Execution**:
```typescript
if (options.runImmediately) {
  this.executeTask(func);
}
```
- **Optional Feature**: Only runs if user requested it
- **Separate from Schedule**: Doesn't affect the timer schedule
- **Async Safe**: executeTask handles both sync and async functions

**Timer Creation**:
```typescript
const timerId = setInterval(async () => {
  const task = this.tasks.get(taskName);
  if (!task) return;

  await this.executeTask(task.func);
  task.executionCount++;

  if (task.maxExecutions && task.executionCount >= task.maxExecutions) {
    this.stop(taskName);
  }
}, intervalMs);
```

**Deep Breakdown**:
- **`setInterval`**: Browser/Node.js API that repeatedly calls a function
- **`async () =>`**: Arrow function that can use await
- **Task Lookup**: `this.tasks.get(taskName)` retrieves task data
- **Safety Check**: `if (!task) return` handles case where task was deleted
- **Execution**: `await this.executeTask()` handles both sync/async functions
- **Counter**: Increments how many times task has run
- **Auto-stop**: Stops task when max executions reached

**Task Storage**:
```typescript
this.tasks.set(taskName, {
  timerId,
  func,
  interval: intervalMs,
  startTime: new Date(),
  executionCount: 0,
  maxExecutions: options.maxExecutions
});
```
- **Map.set()**: Stores task data with taskName as key
- **Object Literal**: Creates task data object
- **Current Time**: `new Date()` captures when task was created
- **Initial Counter**: Starts at 0 executions
- **Optional Property**: maxExecutions might be undefined

### Stop Method
```typescript
stop(taskName: string): boolean {
  const task = this.tasks.get(taskName);
  if (!task) return false;

  clearInterval(task.timerId);
  this.tasks.delete(taskName);
  console.log(`✓ Task '${taskName}' stopped`);
  return true;
}
```

**Step by Step**:
1. **Lookup**: Try to find the task in our Map
2. **Guard Clause**: Return false early if task doesn't exist
3. **Clear Timer**: `clearInterval()` stops the repeating execution
4. **Remove Data**: Delete task from our storage
5. **Log Success**: Provide user feedback
6. **Return Success**: True indicates task was actually stopped

### Execute Now Method
```typescript
async executeNow(taskName: string): Promise<boolean> {
  const task = this.tasks.get(taskName);
  if (!task) return false;

  await this.executeTask(task.func);
  task.executionCount++;
  return true;
}
```

**Async Method**:
- **`async`**: Method returns a Promise
- **`await`**: Waits for task execution to complete
- **Manual Trigger**: Executes task outside its normal schedule
- **Counter Update**: Increments execution count
- **Return Promise**: Caller can await completion

### Get Task Method
```typescript
getTask(taskName: string): TaskInfo | null {
  const task = this.tasks.get(taskName);
  if (!task) return null;

  return {
    name: taskName,
    interval: task.interval,
    startTime: task.startTime,
    executionCount: task.executionCount,
    isActive: true
  };
}
```

**Data Transformation**:
- **Internal to Public**: Converts internal task data to public interface
- **Null Safety**: Returns null instead of undefined for consistency
- **Data Copying**: Creates new object instead of exposing internal data
- **Computed Property**: `isActive: true` - all returned tasks are active

---

## 5. Helper Methods

### Execute Task (Private)
```typescript
private async executeTask(func: TaskFunction): Promise<void> {
  try {
    const result = func();
    if (result instanceof Promise) {
      await result;
    }
  } catch (error) {
    console.error('Task execution error:', error);
  }
}
```

**Error Handling**:
- **Try-Catch**: Prevents task errors from crashing the scheduler
- **Promise Detection**: `instanceof Promise` checks if function returned a promise
- **Await Async**: Only awaits if it's actually a promise
- **Error Logging**: Logs errors but continues running other tasks

**Why This Pattern?**:
- **Flexibility**: Handles both sync and async functions
- **Safety**: Isolates errors to individual tasks
- **Performance**: Doesn't unnecessarily await sync functions

---

## 6. Memory Management

### Destroy Method
```typescript
destroy(): void {
  this.stopAll();
  console.log('✓ Scheduler destroyed');
}
```

**Cleanup Process**:
1. **Stop All Tasks**: Clears all intervals and removes all task data
2. **Log Completion**: Confirms cleanup is done
3. **Memory Safety**: Prevents memory leaks from running intervals

**Why Important?**:
- **Browser**: Long-running intervals can consume memory
- **Node.js**: Intervals prevent process from exiting
- **Testing**: Clean shutdown between tests

---

## 7. Usage Flow Example

Let's trace through a complete example:

```typescript
const scheduler = new Scheduler();
scheduler.schedule('backup', backupFunction, 'day');
```

**Step by Step Execution**:

1. **Constructor**: 
   - Creates empty Map for tasks
   - Sets up interval constants

2. **Schedule Call**:
   - Validates 'backup' is valid task name ✓
   - Validates backupFunction is function ✓
   - Looks up 'day' → 86400000 milliseconds
   - Validates 86400000 > 0 ✓
   - Calls stop('backup') → returns false (task doesn't exist)
   - Creates setInterval with 86400000ms delay
   - Stores task data in Map with key 'backup'
   - Logs success message

3. **Timer Execution** (every 24 hours):
   - Interval callback runs
   - Looks up 'backup' task → found
   - Calls executeTask(backupFunction)
   - Increments executionCount
   - No maxExecutions set, so continues

4. **Internal State**:
```typescript
tasks.get('backup') = {
  timerId: 12345,
  func: backupFunction,
  interval: 86400000,
  startTime: Date('2025-06-03T10:00:00'),
  executionCount: 3,
  maxExecutions: undefined
}
```

---

## 8. Key Design Patterns

### Encapsulation
- Private properties protect internal state
- Public methods provide controlled access
- Clear API boundary

### Type Safety
- Compile-time error prevention
- Runtime validation for critical paths
- Clear contracts via interfaces

### Error Handling
- Graceful degradation (tasks fail independently)
- User-friendly error messages
- No silent failures

### Resource Management
- Automatic cleanup on destroy
- Prevention of duplicate timers
- Memory leak prevention

### Flexibility
- Support for both sync and async functions
- Multiple interval formats
- Optional configuration

