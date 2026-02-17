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
  Nudge,
  NudgesResponse,
  DailyPlanItem,
  DailyPlanResponse,
  TaskAction,
  TaskAttachment,
  HouseholdMember,
  ExternalProvider,
  HouseholdResponse,
  RecurringTemplate,
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

    const response: AxiosResponse<any> = await this.client.post(
      '/recommendations/what-now',
      payload
    );

    const data = response.data;

    // Map snake_case task fields inside recommendations to camelCase
    const mapTask = (t: any) => {
      if (!t) return undefined;
      return {
        id: t.id,
        userId: t.user_id ?? t.userId,
        title: t.title,
        description: t.description,
        domain: t.domain,
        status: t.status,
        priority: t.priority,
        priorityScore: t.priority_score ?? t.priorityScore ?? 0,
        importance: t.importance ?? 3,
        urgency: t.urgency ?? 3,
        dueDate: t.due_date ?? t.dueDate,
        estimatedDurationMin: t.estimated_duration_min ?? t.estimatedDurationMin,
        createdAt: t.created_at ?? t.createdAt,
        updatedAt: t.updated_at ?? t.updatedAt,
        source: t.source ?? 'unknown',
        requiresCalendarBlock: t.requires_calendar_block ?? t.requiresCalendarBlock ?? false,
        linkedCalendarEventId: t.linked_calendar_event_id ?? t.linkedCalendarEventId,
        linkedEmailThreadId: t.linked_email_thread_id ?? t.linkedEmailThreadId,
        aiMetadata: t.ai_metadata ?? t.aiMetadata ?? {},
        subtasks: t.subtasks ?? [],
      };
    };

    return {
      recommendations: (data.recommendations || []).map((r: any) => ({
        task: mapTask(r.task),
        reason: r.reason || '',
        estimatedTime: r.estimatedTime ?? r.estimated_time ?? 30,
        confidence: r.confidence ?? 0.5,
      })),
      reasoning: data.reasoning || '',
      contextSummary: data.context_summary ?? data.contextSummary ?? '',
    };
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

  // Nudges
  async getNudges(): Promise<Nudge[]> {
    const response: AxiosResponse<any> = await this.client.get('/recommendations/nudges');
    // Map snake_case to camelCase
    return (response.data.nudges || []).map((n: any) => ({
      type: n.type,
      message: n.message,
      taskId: n.task_id,
      action: n.action,
    }));
  }

  // Daily plan
  async getDailyPlan(): Promise<DailyPlanResponse> {
    const response: AxiosResponse<any> = await this.client.post('/recommendations/daily-plan');
    return {
      plan: (response.data.plan || []).map((item: any) => ({
        taskId: item.task_id,
        taskTitle: item.task_title,
        suggestedTime: item.suggested_time,
        reason: item.reason,
        estimatedDurationMin: item.estimated_duration_min,
      })),
      summary: response.data.summary,
    };
  }

  // ── Task Actions ──────────────────────────────────────────────────

  async getTaskActions(taskId: string): Promise<TaskAction[]> {
    const resp: AxiosResponse<any> = await this.client.get(`/tasks/${taskId}/actions`);
    return (resp.data.actions || []).map((a: any) => ({
      id: a.id,
      taskId: a.task_id,
      type: a.type,
      label: a.label,
      status: a.status,
      orderIndex: a.order_index,
      metadata: a.metadata || {},
      assignedTo: a.assigned_to,
      dueDate: a.due_date,
      completedAt: a.completed_at,
      createdAt: a.created_at,
    })) as TaskAction[];
  }

  async generateTaskActions(taskId: string): Promise<TaskAction[]> {
    const resp: AxiosResponse<any> = await this.client.post(`/tasks/${taskId}/actions/generate`);
    return (resp.data.actions || []).map((a: any) => ({
      id: a.id,
      taskId: a.task_id,
      type: a.type,
      label: a.label,
      status: a.status,
      orderIndex: a.order_index,
      metadata: a.metadata || {},
      assignedTo: a.assigned_to,
      dueDate: a.due_date,
      completedAt: a.completed_at,
      createdAt: a.created_at,
    })) as TaskAction[];
  }

  async updateTaskAction(
    taskId: string,
    actionId: string,
    updates: { status?: string; metadataUpdates?: Record<string, any> }
  ): Promise<TaskAction> {
    const resp: AxiosResponse<any> = await this.client.put(
      `/tasks/${taskId}/actions/${actionId}`,
      {
        action_id: actionId,
        status: updates.status,
        metadata_updates: updates.metadataUpdates || {},
      }
    );
    const a = resp.data.action;
    return {
      id: a.id,
      taskId: a.task_id,
      type: a.type,
      label: a.label,
      status: a.status,
      orderIndex: a.order_index,
      metadata: a.metadata || {},
      assignedTo: a.assigned_to,
      dueDate: a.due_date,
      completedAt: a.completed_at,
      createdAt: a.created_at,
    };
  }

  // ── Task Attachments ──────────────────────────────────────────────

  async getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
    const resp: AxiosResponse<any> = await this.client.get(`/tasks/${taskId}/attachments`);
    return (resp.data.attachments || []).map((a: any) => ({
      id: a.id,
      taskId: a.task_id,
      type: a.type,
      url: a.url,
      thumbnailUrl: a.thumbnail_url,
      caption: a.caption,
      createdAt: a.created_at,
    })) as TaskAttachment[];
  }

  async addTaskAttachment(taskId: string, attachment: Partial<TaskAttachment>): Promise<TaskAttachment> {
    const resp: AxiosResponse<any> = await this.client.post(`/tasks/${taskId}/attachments`, {
      task_id: taskId,
      type: attachment.type || 'image',
      url: attachment.url,
      thumbnail_url: attachment.thumbnailUrl,
      caption: attachment.caption,
    });
    const a = resp.data;
    return {
      id: a.id, taskId: a.task_id, type: a.type,
      url: a.url, thumbnailUrl: a.thumbnail_url,
      caption: a.caption, createdAt: a.created_at,
    };
  }

  // ── Household ─────────────────────────────────────────────────────

  async getHousehold(): Promise<HouseholdResponse> {
    const resp: AxiosResponse<any> = await this.client.get('/household');
    return {
      members: (resp.data.members || []).map((m: any) => ({
        id: m.id, userId: m.user_id, name: m.name, role: m.role,
        skills: m.skills || [], availability: m.availability || {},
        contact: m.contact, isExternal: m.is_external,
      })),
      providers: (resp.data.providers || []).map((p: any) => ({
        id: p.id, userId: p.user_id, name: p.name, serviceType: p.service_type,
        phone: p.phone, email: p.email, address: p.address,
        notes: p.notes, rating: p.rating,
      })),
    };
  }

  async addHouseholdMember(member: Partial<HouseholdMember>): Promise<HouseholdMember> {
    const resp: AxiosResponse<any> = await this.client.post('/household/members', {
      name: member.name, role: member.role || 'parent',
      skills: member.skills || [], availability: member.availability || {},
      contact: member.contact, is_external: member.isExternal || false,
    });
    const m = resp.data;
    return { id: m.id, userId: m.user_id, name: m.name, role: m.role,
      skills: m.skills || [], availability: m.availability || {},
      contact: m.contact, isExternal: m.is_external };
  }

  async removeHouseholdMember(memberId: string): Promise<void> {
    await this.client.delete(`/household/members/${memberId}`);
  }

  async addServiceProvider(provider: Partial<ExternalProvider>): Promise<ExternalProvider> {
    const resp: AxiosResponse<any> = await this.client.post('/household/providers', {
      name: provider.name, service_type: provider.serviceType,
      phone: provider.phone, email: provider.email,
      address: provider.address, notes: provider.notes, rating: provider.rating,
    });
    const p = resp.data;
    return { id: p.id, userId: p.user_id, name: p.name, serviceType: p.service_type,
      phone: p.phone, email: p.email, address: p.address,
      notes: p.notes, rating: p.rating };
  }

  async removeServiceProvider(providerId: string): Promise<void> {
    await this.client.delete(`/household/providers/${providerId}`);
  }

  // ── Recurring Templates ───────────────────────────────────────────

  async getRecurringTemplates(): Promise<RecurringTemplate[]> {
    const resp: AxiosResponse<any> = await this.client.get('/recurring-templates');
    return (resp.data.templates || []).map((t: any) => ({
      id: t.id, userId: t.user_id, title: t.title, domain: t.domain,
      frequency: t.frequency, cronExpression: t.cron_expression,
      defaultActions: t.default_actions || [], lastGenerated: t.last_generated,
      nextDue: t.next_due, active: t.active,
    }));
  }

  async createRecurringTemplate(template: Partial<RecurringTemplate>): Promise<RecurringTemplate> {
    const resp: AxiosResponse<any> = await this.client.post('/recurring-templates', {
      title: template.title, domain: template.domain || 'home',
      frequency: template.frequency || 'weekly',
      cron_expression: template.cronExpression,
      default_actions: template.defaultActions || [],
      next_due: template.nextDue, active: template.active ?? true,
    });
    const t = resp.data;
    return { id: t.id, userId: t.user_id, title: t.title, domain: t.domain,
      frequency: t.frequency, cronExpression: t.cron_expression,
      defaultActions: t.default_actions || [], lastGenerated: t.last_generated,
      nextDue: t.next_due, active: t.active };
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
