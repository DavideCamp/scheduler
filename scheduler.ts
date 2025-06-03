/**
 * Simple Scheduler for periodic task execution
 */

type IntervalUnit = 'second' | 'minute' | 'hour' | 'day' | 'week';
type TaskFunction = () => void | Promise<void>;

interface TaskInfo {
    name: string;
    interval: number;
    startTime: Date;
    executionCount: number;
    isActive: boolean;
}

interface ScheduleOptions {
    runImmediately?: boolean;
    maxExecutions?: number;
}

class Scheduler {
    private tasks = new Map<string, {
        timerId: ReturnType<typeof setInterval>;
        func: TaskFunction;
        interval: number;
        startTime: Date;
        executionCount: number;
        maxExecutions?: number;
    }>();

    private readonly intervals: Record<IntervalUnit, number> = {
        second: 1000,
        minute: 60 * 1000,
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000
    };

    /**
     * Schedule a task to run at specified intervals
     * @param taskName unique name for the task
     * @param func the function to run
     * @param interval the interval to run it at (in milliseconds)
     * @param options additional options
     * @option {boolean} runImmediately run the task immediately
     * @option {number} maxExecutions maximum number of times to run the task
     * @returns {this} this instance of the scheduler
     * @throws {Error} if task name is empty or if interval is invalid
     */
    schedule(
        taskName: string,
        func: TaskFunction,
        interval: IntervalUnit | number,
        options: ScheduleOptions = {}
    ): this {
        // Validation
        if (!taskName?.trim()) {
            throw new Error('Task name is required');
        }
        if (typeof func !== 'function') {
            throw new Error('Function is required');
        }

        // Parse interval
        const intervalMs = typeof interval === 'string'
            ? this.intervals[interval]
            : interval;

        if (!intervalMs || intervalMs <= 0) {
            throw new Error(`Invalid interval: ${interval}`);
        }

        // Stop existing task if exists
        this.stop(taskName);

        // Run immediately if requested
        if (options.runImmediately) {
            this.executeTask(func);
        }

        // Create and start the task
        const timerId = setInterval(async () => {
            const task = this.tasks.get(taskName);
            if (!task) return;

            await this.executeTask(task.func);
            task.executionCount++;

            // Check max executions
            if (task.maxExecutions && task.executionCount >= task.maxExecutions) {
                this.stop(taskName);
            }
        }, intervalMs);

        // Store task info
        this.tasks.set(taskName, {
            timerId,
            func,
            interval: intervalMs,
            startTime: new Date(),
            executionCount: 0,
            maxExecutions: options.maxExecutions
        });

        console.log(`✓ Task '${taskName}' scheduled every ${intervalMs}ms`);
        return this;
    }

    /**
     * Stop a specific task
     */
    stop(taskName: string): boolean {
        const task = this.tasks.get(taskName);
        if (!task) return false;

        clearInterval(task.timerId);
        this.tasks.delete(taskName);
        console.log(`✓ Task '${taskName}' stopped`);
        return true;
    }

    /**
     * Execute a task immediately (without affecting schedule)
     */
    async executeNow(taskName: string): Promise<boolean> {
        const task = this.tasks.get(taskName);
        if (!task) return false;

        await this.executeTask(task.func);
        task.executionCount++;
        return true;
    }

    /**
     * Stop all tasks
     */
    stopAll(): number {
        const count = this.tasks.size;
        for (const taskName of this.tasks.keys()) {
            this.stop(taskName);
        }
        return count;
    }

    /**
     * Get task information
     */
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

    /**
     * Get all active task names
     */
    getActiveTasks(): string[] {
        return Array.from(this.tasks.keys());
    }

    /**
     * Get all tasks info
     */
    getAllTasks(): Record<string, TaskInfo> {
        const result: Record<string, TaskInfo> = {};
        for (const [taskName] of this.tasks) {
            const taskInfo = this.getTask(taskName);
            if (taskInfo) {
                result[taskName] = taskInfo;
            }
        }
        return result;
    }

    /**
     * Check if a task exists
     */
    hasTask(taskName: string): boolean {
        return this.tasks.has(taskName);
    }

    /**
     * Get number of active tasks
     */
    get taskCount(): number {
        return this.tasks.size;
    }

    /**
     * Clean up all resources
     */
    destroy(): void {
        this.stopAll();
        console.log('✓ Scheduler destroyed');
    }

    // Private helper method
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
}


export { Scheduler, type TaskFunction, type ScheduleOptions, type TaskInfo, type IntervalUnit };