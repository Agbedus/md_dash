'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';
import { startTaskTimer, pauseTaskTimer, stopTaskTimer as stopTaskTimerAction } from '@/app/tasks/actions';
import toast from 'react-hot-toast';

interface TaskTimerContextType {
    activeTask: Task | null;
    isPaused: boolean;
    elapsedTime: number;
    targetTime: number | null;
    startTimer: (task: Task, targetMinutes?: number) => Promise<void>;
    pauseTimer: () => Promise<void>;
    resumeTimer: () => Promise<void>;
    stopTimer: () => Promise<void>;
}

const TaskTimerContext = createContext<TaskTimerContextType | undefined>(undefined);

export function TaskTimerProvider({ children }: { children: React.ReactNode }) {
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [targetTime, setTargetTime] = useState<number | null>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (activeTask && !isPaused) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [activeTask, isPaused]);

    const startTimer = useCallback(async (task: Task, targetMinutes?: number) => {
        if (activeTask) {
            toast.error("Finish your current task first!");
            return;
        }

        const result = await startTaskTimer(task.id);
        if (result.success) {
            setActiveTask(task);
            setIsPaused(false);
            setElapsedTime(0);
            setTargetTime(targetMinutes ? targetMinutes * 60 : null);
            toast.success(`Starting work on: ${task.name}`);
        } else {
            toast.error(result.error || "Failed to start timer");
        }
    }, [activeTask]);

    const pauseTimer = useCallback(async () => {
        if (!activeTask) return;

        const result = await pauseTaskTimer(activeTask.id);
        if (result.success) {
            setIsPaused(true);
            toast.success("Timer paused (minimized)");
        } else {
            toast.error(result.error || "Failed to pause timer");
        }
    }, [activeTask]);

    const resumeTimer = useCallback(async () => {
        if (!activeTask) return;

        const result = await startTaskTimer(activeTask.id);
        if (result.success) {
            setIsPaused(false);
            toast.success("Resuming work");
        } else {
            toast.error(result.error || "Failed to resume timer");
        }
    }, [activeTask]);

    const stopTimer = useCallback(async () => {
        if (!activeTask) return;

        const result = await stopTaskTimerAction(activeTask.id);
        if (result.success) {
            setActiveTask(null);
            setIsPaused(false);
            setElapsedTime(0);
            setTargetTime(null);
            toast.success("Work session completed and logged");
        } else {
            toast.error(result.error || "Failed to stop timer");
        }
    }, [activeTask]);

    return (
        <TaskTimerContext.Provider value={{
            activeTask,
            isPaused,
            elapsedTime,
            targetTime,
            startTimer,
            pauseTimer,
            resumeTimer,
            stopTimer
        }}>
            {children}
        </TaskTimerContext.Provider>
    );
}

export function useTaskTimer() {
    const context = useContext(TaskTimerContext);
    if (!context) {
        throw new Error('useTaskTimer must be used within a TaskTimerProvider');
    }
    return context;
}
