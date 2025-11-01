/**
 * Core type definitions for uunn platform
 */

// User / Identity Types
export interface UserIdentity {
  id: string;
  pseudonym: string;
  publicKey: string;
  createdAt: number;
}

export interface LocalUserData extends UserIdentity {
  privateKey: string;
  groups: string[]; // Group IDs user belongs to
}

// Group Types
export interface WorkplaceGroup {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  createdBy: string; // User ID
  memberCount: number;
  encryptedGroupKey?: string; // For group-level encryption
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  pseudonym: string;
  publicKey: string;
  joinedAt: number;
  invitedBy?: string; // User ID who invited them
  role: 'admin' | 'member';
}

// Message Types
export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderPseudonym: string;
  encryptedContent: string;
  iv: string;
  timestamp: number;
  type: 'text' | 'system' | 'action';
}

export interface DecryptedMessage extends Omit<Message, 'encryptedContent'> {
  content: string;
}

// Invitation Types
export interface Invitation {
  id: string;
  code: string;
  groupId: string;
  createdBy: string;
  createdAt: number;
  expiresAt?: number;
  maxUses?: number;
  currentUses: number;
  active: boolean;
}

export interface InvitationGraph {
  nodes: InvitationNode[];
  edges: InvitationEdge[];
}

export interface InvitationNode {
  id: string; // User ID
  pseudonym: string;
  joinedAt: number;
}

export interface InvitationEdge {
  from: string; // User ID who invited
  to: string;   // User ID who was invited
  timestamp: number;
}

// Action Template Types
export type ActionType = 'proposal' | 'vote' | 'petition' | 'grievance' | 'demand';

export interface Action {
  id: string;
  groupId: string;
  type: ActionType;
  title: string;
  description: string;
  createdBy: string;
  createdAt: number;
  deadline?: number;
  status: 'draft' | 'active' | 'closed' | 'approved' | 'rejected';
}

export interface Proposal extends Action {
  type: 'proposal';
  options: ProposalOption[];
  votingType: 'simple' | 'ranked' | 'approval';
  quorum?: number; // Percentage needed
}

export interface ProposalOption {
  id: string;
  text: string;
  votes: number;
}

export interface Vote {
  id: string;
  actionId: string;
  userId: string;
  optionId: string;
  timestamp: number;
  encryptedVote?: string; // For secret ballots
}

export interface Petition extends Action {
  type: 'petition';
  targetAudience: string; // e.g., "Management", "HR", "Board"
  demands: string[];
  signatures: Signature[];
  minimumSignatures?: number;
}

export interface Signature {
  userId: string;
  pseudonym: string;
  timestamp: number;
  comment?: string;
}

export interface Grievance extends Action {
  type: 'grievance';
  category: string;
  incidentDate: number;
  affectedWorkers: string[];
  desiredResolution: string;
  supportingEvidence?: string[];
}

// Document Generation Types
export interface GeneratedDocument {
  id: string;
  type: 'petition' | 'grievance' | 'demand_letter' | 'meeting_minutes';
  title: string;
  content: string; // Markdown or HTML
  createdAt: number;
  metadata: Record<string, any>;
}

// Legal Resources Types
export interface LegalResource {
  id: string;
  title: string;
  category: 'nlra' | 'rights' | 'template' | 'guide';
  content: string;
  tags: string[];
  source?: string;
  lastUpdated: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'new_message' | 'new_action' | 'action_update' | 'invitation' | 'system';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: number;
}

// Storage Types (IndexedDB)
export interface StoredMessage {
  id: string;
  groupId: string;
  encrypted: Message;
  decrypted?: string;
  timestamp: number;
}

export interface StoredGroup {
  id: string;
  group: WorkplaceGroup;
  members: GroupMember[];
  lastActivity: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Event Types (for real-time updates)
export type EventType =
  | 'message:new'
  | 'message:updated'
  | 'action:created'
  | 'action:updated'
  | 'member:joined'
  | 'member:left';

export interface RealtimeEvent {
  type: EventType;
  groupId: string;
  data: any;
  timestamp: number;
}
