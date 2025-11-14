/**
 * Shared types for the Personal Assistant mobile app
 * These should match the backend API types
 */

export enum TaskDomain {
  FAMILY = 'family',
  HOME = 'home',
  JOB = 'job',
  COMPANY = 'company',
  PERSONAL = 'personal',
}

export enum TaskStatus {
  CAPTURED = 'captured',
  PARSED = 'parsed',
  TRIAGED = 'triaged',
  PLANNED = 'planned',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  SOMEDAY = 'someday',
}

export interface SubTask {
  id: string;
  taskId: string;
  title: string;
  status: TaskStatus;
  orderIndex: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  domain: TaskDomain;
  status: TaskStatus;
  priority: Priority;
  priorityScore: number;
  importance: number;
  urgency: number;
  dueDate?: string;
  estimatedDurationMin?: number;
  createdAt: string;
  updatedAt: string;
  source: string;
  requiresCalendarBlock: boolean;
  linkedCalendarEventId?: string;
  linkedEmailThreadId?: string;
  aiMetadata: Record<string, any>;
  subtasks: SubTask[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  timeZone: string;
  defaultWorkHours: Record<string, any>;
  defaultFamilyHours: Record<string, any>;
  preferences: Record<string, any>;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  source: string;
  externalId?: string;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  location?: string;
  isAllDay: boolean;
}

// API Request/Response types
export interface VoiceCaptureRequest {
  audioData?: string;
  transcript?: string;
  location?: string;
  context?: Record<string, any>;
}

export interface ParsedTaskOutput {
  title: string;
  description?: string;
  domain: TaskDomain;
  priorityHint: Priority;
  dueDate?: string;
  estimatedDurationMin?: number;
  requiresCalendarBlock: boolean;
  subtasks: string[];
  contextNotes?: string;
}

export interface VoiceCaptureResponse {
  tasks: ParsedTaskOutput[];
  summary?: string;
  processingTimeMs: number;
  confidenceScore: number;
  transcript?: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  domain: TaskDomain;
  priority: Priority;
  dueDate?: string;
  estimatedDurationMin?: number;
  requiresCalendarBlock: boolean;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  domain?: TaskDomain;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  estimatedDurationMin?: number;
}

export interface WhatNowRequest {
  currentTime: string;
  availableDurationMin?: number;
  energyLevel?: string;
  location?: string;
}

export interface WhatNowResponse {
  recommendations: Array<{
    task: Task;
    reason: string;
    estimatedTime: number;
    confidence: number;
  }>;
  reasoning: string;
  contextSummary: string;
}

export interface TaskListResponse {
  tasks: Task[];
  totalCount: number;
  hasMore: boolean;
}

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  TaskDetail: { taskId: string };
  VoiceCapture: undefined;
  CaptureReview: { captureResult: VoiceCaptureResponse };
};

export type MainTabParamList = {
  Home: undefined;
  Inbox: undefined;
  Tasks: undefined;
  Calendar: undefined;
  Assistant: undefined;
};

// Component props
export interface TaskItemProps {
  task: Task;
  onPress: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

export interface VoiceRecorderProps {
  onRecordingComplete: (audioData: string) => void;
  onTranscriptReady?: (transcript: string) => void;
}

export interface TaskFiltersProps {
  domain?: TaskDomain;
  status?: TaskStatus;
  priority?: Priority;
  onFiltersChange: (filters: TaskFilters) => void;
}

export interface TaskFilters {
  domain?: TaskDomain;
  status?: TaskStatus;
  priority?: Priority;
  search?: string;
}

// Store types
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
}

export interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  filters: TaskFilters;
  fetchTasks: () => Promise<void>;
  createTask: (taskData: TaskCreateRequest) => Promise<Task>;
  updateTask: (taskId: string, updates: TaskUpdateRequest) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  setFilters: (filters: TaskFilters) => void;
  processVoiceCapture: (request: VoiceCaptureRequest) => Promise<VoiceCaptureResponse>;
  getWhatNowRecommendations: (request: WhatNowRequest) => Promise<WhatNowResponse>;
}
