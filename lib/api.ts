/**
 * API Client for uunn
 *
 * Handles communication with Cloudflare Workers backend
 * All sensitive data is encrypted before sending
 */

import type {
  WorkplaceGroup,
  GroupMember,
  Invitation,
  Message,
  Action,
  ApiResponse,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    return {
      success: false,
      error: error.error || `HTTP ${response.status}`,
    };
  }

  const data = await response.json();
  return data;
}

// ==================== Group Operations ====================

export async function createGroup(
  group: Omit<WorkplaceGroup, 'id' | 'createdAt' | 'memberCount'>,
  creatorMember: Omit<GroupMember, 'id' | 'groupId' | 'joinedAt'>
): Promise<ApiResponse<{ group: WorkplaceGroup; member: GroupMember }>> {
  return fetchAPI('/groups', {
    method: 'POST',
    body: JSON.stringify({ group, member: creatorMember }),
  });
}

export async function getGroup(groupId: string): Promise<ApiResponse<WorkplaceGroup>> {
  return fetchAPI(`/groups/${groupId}`);
}

export async function getGroupMembers(
  groupId: string
): Promise<ApiResponse<GroupMember[]>> {
  return fetchAPI(`/groups/${groupId}/members`);
}

export async function joinGroup(
  inviteCode: string,
  member: Omit<GroupMember, 'id' | 'groupId' | 'joinedAt'>
): Promise<ApiResponse<{ group: WorkplaceGroup; member: GroupMember }>> {
  return fetchAPI('/groups/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode, member }),
  });
}

// ==================== Invitation Operations ====================

export async function createInvitation(
  invitation: Omit<Invitation, 'id' | 'createdAt' | 'currentUses'>
): Promise<ApiResponse<Invitation>> {
  return fetchAPI('/invitations', {
    method: 'POST',
    body: JSON.stringify(invitation),
  });
}

export async function getInvitation(code: string): Promise<ApiResponse<Invitation>> {
  return fetchAPI(`/invitations/${code}`);
}

export async function getGroupInvitations(
  groupId: string
): Promise<ApiResponse<Invitation[]>> {
  return fetchAPI(`/groups/${groupId}/invitations`);
}

// ==================== Message Operations ====================

export async function sendMessageMetadata(
  metadata: Omit<Message, 'id'>
): Promise<ApiResponse<{ id: string }>> {
  return fetchAPI('/messages', {
    method: 'POST',
    body: JSON.stringify(metadata),
  });
}

export async function getMessageMetadata(
  groupId: string,
  since?: number
): Promise<ApiResponse<Message[]>> {
  const params = since ? `?since=${since}` : '';
  return fetchAPI(`/groups/${groupId}/messages${params}`);
}

// ==================== Action Operations ====================

export async function createAction(
  action: Omit<Action, 'id' | 'createdAt'>
): Promise<ApiResponse<Action>> {
  return fetchAPI('/actions', {
    method: 'POST',
    body: JSON.stringify(action),
  });
}

export async function getAction(actionId: string): Promise<ApiResponse<Action>> {
  return fetchAPI(`/actions/${actionId}`);
}

export async function getGroupActions(
  groupId: string
): Promise<ApiResponse<Action[]>> {
  return fetchAPI(`/groups/${groupId}/actions`);
}

export async function updateAction(
  actionId: string,
  updates: Partial<Action>
): Promise<ApiResponse<Action>> {
  return fetchAPI(`/actions/${actionId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ==================== Sync Operations ====================

export async function getSyncEvents(
  groupId: string,
  since: number
): Promise<ApiResponse<any[]>> {
  return fetchAPI(`/groups/${groupId}/sync?since=${since}`);
}

// ==================== Health Check ====================

export async function healthCheck(): Promise<ApiResponse<{ status: string }>> {
  return fetchAPI('/health');
}
