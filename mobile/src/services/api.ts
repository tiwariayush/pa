/**
 * API service for communicating with the Personal Assistant backend
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Task,
  User,
  VoiceCaptureRequest,
  VoiceCaptureResponse,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskListResponse,
  WhatNowRequest,
  WhatNowResponse,
  CalendarEvent,
  TaskDomain,
  TaskStatus,
  Priority,
} from '../types';

class APIService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    /**
     * Base URL resolution
     *
     * - Prefer EXPO_PUBLIC_API_URL when defined (Expo public env var)
     * - Fallback to localhost:8000 for simulator / local dev
     *
     * NOTE: If you run the app on a physical device, set EXPO_PUBLIC_API_URL
     * to your machine's LAN IP, e.g. http://192.168.1.10:8000
     */
    const envBaseUrl = process.env.EXPO_PUBLIC_API_URL;

    this.baseURL =
      (envBaseUrl && envBaseUrl.trim().length > 0
        ? envBaseUrl.trim()
        : 'http://localhost:8000');

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
          // Could trigger logout/redirect to login
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response: AxiosResponse<{ user: User; token: string }> = await this.client.post(
      '/auth/login',
      { email, password }
    );
    
    // Store token and user data
    await AsyncStorage.setItem('auth_token', response.data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
    
    return response.data;
  }

  async register(userData: any): Promise<{ user: User; token: string }> {
    const response: AxiosResponse<{ user: User; token: string }> = await this.client.post(
      '/auth/register',
      userData
    );
    
    await AsyncStorage.setItem('auth_token', response.data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
    
    return response.data;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  }

  // Voice capture
  async processVoiceCapture(request: VoiceCaptureRequest): Promise<VoiceCaptureResponse> {
    // Map mobile-friendly camelCase to API's snake_case schema
    const payload = {
      audio_data: request.audioData,
      transcript: request.transcript,
      location: request.location,
      context: request.context ?? {},
    };

    const response: AxiosResponse<VoiceCaptureResponse> = await this.client.post(
      '/capture/voice',
      payload
    );
    return response.data;
  }

  // Task management
  async getTasks(
    domain?: TaskDomain,
    status?: TaskStatus,
    priority?: Priority,
    limit: number = 50,
    offset: number = 0
  ): Promise<TaskListResponse> {
    const params = new URLSearchParams();
    if (domain) params.append('domain', domain);
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response: AxiosResponse<TaskListResponse> = await this.client.get(
      `/tasks?${params.toString()}`
    );
    return response.data;
  }

  async getTask(taskId: string): Promise<Task> {
    const response: AxiosResponse<Task> = await this.client.get(`/tasks/${taskId}`);
    return response.data;
  }

  async createTask(taskData: TaskCreateRequest): Promise<Task> {
    const response: AxiosResponse<Task> = await this.client.post('/tasks', taskData);
    return response.data;
  }

  async updateTask(taskId: string, updates: TaskUpdateRequest): Promise<Task> {
    const response: AxiosResponse<Task> = await this.client.put(`/tasks/${taskId}`, updates);
    return response.data;
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.client.delete(`/tasks/${taskId}`);
  }

  // Recommendations
  async getWhatNowRecommendations(request: WhatNowRequest): Promise<WhatNowResponse> {
    const payload = {
      current_time: request.currentTime,
      available_duration_min: request.availableDurationMin,
      energy_level: request.energyLevel,
      location: request.location,
    };

    const response: AxiosResponse<WhatNowResponse> = await this.client.post(
      '/recommendations/what-now',
      payload
    );
    return response.data;
  }

  // Calendar
  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const response: AxiosResponse<any[]> = await this.client.get(
      `/calendar/events?start_date=${startDate}&end_date=${endDate}`
    );

    // Map backend snake_case fields to frontend camelCase CalendarEvent type
    return response.data.map((event: any) => ({
      id: event.id,
      userId: event.user_id,
      source: event.source,
      externalId: event.external_id,
      startTime: event.start_time,
      endTime: event.end_time,
      title: event.title,
      description: event.description,
      location: event.location,
      isAllDay: event.is_all_day,
    })) as CalendarEvent[];
  }

  async syncCalendar(): Promise<void> {
    await this.client.post('/calendar/sync');
  }

  async importCalendarEventAsTask(eventId: string): Promise<Task> {
    const response: AxiosResponse<Task> = await this.client.post(
      `/calendar/events/${eventId}/import-to-task`
    );
    return response.data;
  }

  // Email
  async draftEmail(taskId: string, context?: string): Promise<any> {
    const response = await this.client.post('/email/draft', {
      task_id: taskId,
      context,
      tone: 'professional',
    });
    return response.data;
  }

  // Research
  async performResearch(taskId: string, query: string, type: string = 'general'): Promise<any> {
    const response = await this.client.post('/research', {
      task_id: taskId,
      query,
      research_type: type,
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response: AxiosResponse<{ status: string }> = await this.client.get('/health');
    return response.data;
  }

  // Utility methods
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('auth_token');
    return !!token;
  }

  async getCurrentUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;
