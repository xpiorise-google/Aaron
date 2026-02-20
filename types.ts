
import { Type } from "@google/genai";
import { ShieldCheck, Terminal, Activity, ClipboardList } from 'lucide-react';

export enum TaskStatus {
  PROPOSED = 'PROPOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DIVESTED = 'DIVESTED' // "Deleted" in corporate speak
}

export enum HandoverStatus {
  PENDING = 'PENDING',       // Waiting for receiver action
  ACCEPTED = 'ACCEPTED',     // Receiver clicked "Confirm"
  QUESTIONING = 'QUESTIONING', // Receiver asked a question
  REJECTED = 'REJECTED'      // Receiver rejected the task
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  deadline?: number; // New: Deadline timestamp
}

export interface UserContext {
  jobTitle: string;
  reportingTo: string;
  quarterlyGoal: string;
  annualGoal: string;
  directTeamSize: number;
  directTeamSkills: string;
  collabTeamSize: number;
  collabTeamSkills: string;
}

export interface TeamMember {
  id: string; // username
  name: string;
  role: string;
  avatarColor: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'excel' | 'word' | 'pdf' | 'other';
  mimeType: string;
  size: number;
  data: string; // Base64 string
  createdAt: number;
}

export interface HandoverRecord {
  fromUser: string;
  toUser: string;
  remark: string; // The specific message like "Please review"
  timestamp: number;
  // New fields for interaction
  status?: HandoverStatus;
  response?: string; // The reply message (e.g. "Okay", or a question)
  responseTimestamp?: number;
  receiverArchived?: boolean; // New: Allows receiver to hide/delete from their list
  senderArchived?: boolean;   // New: Allows sender to hide/delete from their list
}

export interface Task {
  id: string;
  originalInput: string;
  title: string;
  description: string;
  impactScore: number; // 1-10 (ROI)
  effortScore: number; // 1-10 (Cost)
  strategicAdvice: string;
  subTasks: SubTask[];
  attachments?: Attachment[]; // New field for files
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;   // New: Timestamp when moved to IN_PROGRESS
  completedAt?: number; // New: Timestamp when moved to COMPLETED
  deadline?: number;    // New: Task Deadline
  handovers?: HandoverRecord[]; // New field for collaboration history
  tags?: string[]; // New: Tactical tags (e.g., P0, Urgent)
  isMasked?: boolean; // New: Privacy mode
  isSharedToTeam?: boolean; // New: Share to Team Task Dashboard
  creatorId?: string; // New: Creator ID for shared tasks
  projectId?: string; // New: Associated Project ID
}

export const PREDEFINED_TAGS = [
  "P0", "P1", "P2", "P3",
  "重要", "不重要", "紧急", "赶紧做",
  "Bug", "Feature", "Blocked"
];

// --- NEW SAAS TYPES ---

export enum ProjectType {
  PRODUCT = 'PRODUCT',
  MARKETING = 'MARKETING',
  SALES = 'SALES',
  OPERATIONS = 'OPERATIONS',
  OTHER = 'OTHER'
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  subType: string;
  impactScore: number;
  effortScore: number;
  creatorId: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  id: string; // unique within org
  name: string; // Display name
  role: string; // Job Title
  password: string; 
  avatarColor: string;
  isAdmin?: boolean; // Is Organization Admin?
}

export interface Organization {
  id: string; // 1-4 chars, Uppercase (e.g., XER, NUT)
  name: string; // Full Name
  adminId: string; // The creator
  users: UserProfile[];
  createdAt: number;
}

// Gemini Response Schema
export const AnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A concise, executive summary title of the task." },
    description: { type: Type.STRING, description: "A brief strategic description." },
    impactScore: { type: Type.NUMBER, description: "Rating 1-10 on potential value/profit generated." },
    effortScore: { type: Type.NUMBER, description: "Rating 1-10 on complexity and time cost." },
    strategicAdvice: { type: Type.STRING, description: "One sentence of ruthless advice (e.g., 'Delegate this', 'Do immediately')." },
    subTasks: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: "Actionable step."
      }
    }
  },
  required: ["title", "description", "impactScore", "effortScore", "strategicAdvice", "subTasks"],
};
