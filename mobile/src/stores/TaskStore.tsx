/**
 * Task store using Zustand
 * Manages task state and operations
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import {
  Task,
  TaskState,
  TaskFilters,
  TaskCreateRequest,
  TaskUpdateRequest,
  VoiceCaptureRequest,
  VoiceCaptureResponse,
  WhatNowRequest,
  WhatNowResponse,
} from '../types';
import { apiService } from '../services/api';

interface TaskStore extends TaskState {
  refreshTasks: () => Promise<void>;
  getTaskById: (taskId: string) => Task | undefined;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearTasks: () => void;
}

export const useTaskStore = create<TaskStore>()(
  subscribeWithSelector((set, get) => ({
    tasks: [],
    isLoading: false,
    error: null,
    filters: {},

    fetchTasks: async () => {
      set({ isLoading: true, error: null });
      
      try {
        const { filters } = get();
        const response = await apiService.getTasks(
          filters.domain,
          filters.status,
          filters.priority
        );
        
        set({
          tasks: response.tasks,
          isLoading: false,
        });
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.message || 'Failed to fetch tasks',
        });
      }
    },

    refreshTasks: async () => {
      const { fetchTasks } = get();
      await fetchTasks();
    },

    createTask: async (taskData: TaskCreateRequest): Promise<Task> => {
      set({ isLoading: true, error: null });
      
      try {
        const newTask = await apiService.createTask(taskData);
        
        set((state) => ({
          tasks: [newTask, ...state.tasks],
          isLoading: false,
        }));
        
        return newTask;
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.message || 'Failed to create task',
        });
        throw error;
      }
    },

    updateTask: async (taskId: string, updates: TaskUpdateRequest): Promise<Task> => {
      set({ isLoading: true, error: null });
      
      try {
        const updatedTask = await apiService.updateTask(taskId, updates);
        
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId ? updatedTask : task
          ),
          isLoading: false,
        }));
        
        return updatedTask;
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.message || 'Failed to update task',
        });
        throw error;
      }
    },

    deleteTask: async (taskId: string): Promise<void> => {
      set({ isLoading: true, error: null });
      
      try {
        await apiService.deleteTask(taskId);
        
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
          isLoading: false,
        }));
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.message || 'Failed to delete task',
        });
        throw error;
      }
    },

    setFilters: (filters: TaskFilters) => {
      set({ filters });
      // Automatically refetch tasks when filters change
      const { fetchTasks } = get();
      fetchTasks();
    },

    processVoiceCapture: async (request: VoiceCaptureRequest): Promise<VoiceCaptureResponse> => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await apiService.processVoiceCapture(request);
        set({ isLoading: false });
        return response;
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.message || 'Voice capture failed',
        });
        throw error;
      }
    },

    getWhatNowRecommendations: async (request: WhatNowRequest): Promise<WhatNowResponse> => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await apiService.getWhatNowRecommendations(request);
        set({ isLoading: false });
        return response;
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.message || 'Failed to get recommendations',
        });
        throw error;
      }
    },

    // Utility methods
    getTaskById: (taskId: string) => {
      const { tasks } = get();
      return tasks.find((task) => task.id === taskId);
    },

    setError: (error: string | null) => {
      set({ error });
    },

    setLoading: (isLoading: boolean) => {
      set({ isLoading });
    },

    clearTasks: () => {
      set({ tasks: [], error: null });
    },
  }))
);

// React Context for task store
const TaskContext = createContext<TaskStore | null>(null);

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const store = useTaskStore();

  return (
    <TaskContext.Provider value={store}>
      {children}
    </TaskContext.Provider>
  );
};

// Hook to use task store
export const useTasks = (): TaskStore => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within TaskProvider');
  }
  return context;
};

// Selector hooks for specific task state
export const useTaskList = () => useTaskStore((state) => state.tasks);
export const useTaskLoading = () => useTaskStore((state) => state.isLoading);
export const useTaskError = () => useTaskStore((state) => state.error);
export const useTaskFilters = () => useTaskStore((state) => state.filters);
