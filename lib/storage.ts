/**
 * Client-side storage using IndexedDB
 *
 * All sensitive data (messages, keys, group info) is stored locally
 * in the browser's IndexedDB. Nothing sensitive touches the server.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  LocalUserData,
  StoredGroup,
  StoredMessage,
  Message,
  WorkplaceGroup,
  GroupMember,
  Action,
  Notification,
} from '@/types';

// Database schema
interface UunnDB extends DBSchema {
  user: {
    key: string;
    value: LocalUserData;
  };
  groups: {
    key: string;
    value: StoredGroup;
    indexes: { 'by-activity': number };
  };
  messages: {
    key: string;
    value: StoredMessage;
    indexes: { 'by-group': string; 'by-timestamp': number };
  };
  actions: {
    key: string;
    value: Action;
    indexes: { 'by-group': string; 'by-status': string };
  };
  notifications: {
    key: string;
    value: Notification;
    indexes: { 'by-user': string; 'by-read': boolean };
  };
}

const DB_NAME = 'uunn-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<UunnDB> | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase<UunnDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<UunnDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // User store
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'id' });
      }

      // Groups store
      if (!db.objectStoreNames.contains('groups')) {
        const groupStore = db.createObjectStore('groups', { keyPath: 'id' });
        groupStore.createIndex('by-activity', 'lastActivity');
      }

      // Messages store
      if (!db.objectStoreNames.contains('messages')) {
        const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
        messageStore.createIndex('by-group', 'groupId');
        messageStore.createIndex('by-timestamp', 'timestamp');
      }

      // Actions store
      if (!db.objectStoreNames.contains('actions')) {
        const actionStore = db.createObjectStore('actions', { keyPath: 'id' });
        actionStore.createIndex('by-group', 'groupId');
        actionStore.createIndex('by-status', 'status');
      }

      // Notifications store
      if (!db.objectStoreNames.contains('notifications')) {
        const notificationStore = db.createObjectStore('notifications', {
          keyPath: 'id',
        });
        notificationStore.createIndex('by-user', 'userId');
        notificationStore.createIndex('by-read', 'read');
      }
    },
  });

  return dbInstance;
}

/**
 * Get the database instance (initializes if needed)
 */
async function getDB(): Promise<IDBPDatabase<UunnDB>> {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}

// ==================== User Operations ====================

/**
 * Save user data (identity + keys) locally
 */
export async function saveUser(userData: LocalUserData): Promise<void> {
  const db = await getDB();
  await db.put('user', userData);
}

/**
 * Get current user data
 */
export async function getUser(): Promise<LocalUserData | undefined> {
  const db = await getDB();
  const users = await db.getAll('user');
  return users[0]; // Single user per device
}

/**
 * Delete user data (logout / reset)
 */
export async function deleteUser(): Promise<void> {
  const db = await getDB();
  const users = await db.getAll('user');
  for (const user of users) {
    await db.delete('user', user.id);
  }
}

// ==================== Group Operations ====================

/**
 * Save a group locally
 */
export async function saveGroup(
  group: WorkplaceGroup,
  members: GroupMember[]
): Promise<void> {
  const db = await getDB();
  const storedGroup: StoredGroup = {
    id: group.id,
    group,
    members,
    lastActivity: Date.now(),
  };
  await db.put('groups', storedGroup);
}

/**
 * Get a specific group
 */
export async function getGroup(groupId: string): Promise<StoredGroup | undefined> {
  const db = await getDB();
  return await db.get('groups', groupId);
}

/**
 * Get all groups
 */
export async function getAllGroups(): Promise<StoredGroup[]> {
  const db = await getDB();
  return await db.getAll('groups');
}

/**
 * Update group last activity
 */
export async function updateGroupActivity(groupId: string): Promise<void> {
  const db = await getDB();
  const group = await db.get('groups', groupId);
  if (group) {
    group.lastActivity = Date.now();
    await db.put('groups', group);
  }
}

/**
 * Delete a group
 */
export async function deleteGroup(groupId: string): Promise<void> {
  const db = await getDB();
  await db.delete('groups', groupId);

  // Also delete all messages for this group
  const messages = await db.getAllFromIndex('messages', 'by-group', groupId);
  for (const message of messages) {
    await db.delete('messages', message.id);
  }

  // Delete all actions for this group
  const actions = await db.getAllFromIndex('actions', 'by-group', groupId);
  for (const action of actions) {
    await db.delete('actions', action.id);
  }
}

// ==================== Message Operations ====================

/**
 * Save a message locally
 */
export async function saveMessage(
  message: Message,
  decrypted?: string
): Promise<void> {
  const db = await getDB();
  const storedMessage: StoredMessage = {
    id: message.id,
    groupId: message.groupId,
    encrypted: message,
    decrypted,
    timestamp: message.timestamp,
  };
  await db.put('messages', storedMessage);
  await updateGroupActivity(message.groupId);
}

/**
 * Get messages for a group
 */
export async function getMessages(
  groupId: string,
  limit: number = 100
): Promise<StoredMessage[]> {
  const db = await getDB();
  const messages = await db.getAllFromIndex('messages', 'by-group', groupId);

  // Sort by timestamp descending and limit
  return messages
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

/**
 * Get a single message
 */
export async function getMessage(messageId: string): Promise<StoredMessage | undefined> {
  const db = await getDB();
  return await db.get('messages', messageId);
}

/**
 * Delete old messages (cleanup)
 */
export async function deleteOldMessages(
  groupId: string,
  olderThanDays: number = 90
): Promise<void> {
  const db = await getDB();
  const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  const messages = await db.getAllFromIndex('messages', 'by-group', groupId);

  for (const message of messages) {
    if (message.timestamp < cutoffTime) {
      await db.delete('messages', message.id);
    }
  }
}

// ==================== Action Operations ====================

/**
 * Save an action (proposal, petition, etc.)
 */
export async function saveAction(action: Action): Promise<void> {
  const db = await getDB();
  await db.put('actions', action);
}

/**
 * Get actions for a group
 */
export async function getActions(
  groupId: string,
  status?: string
): Promise<Action[]> {
  const db = await getDB();

  if (status) {
    const allActions = await db.getAllFromIndex('actions', 'by-status', status);
    return allActions.filter((a) => a.groupId === groupId);
  }

  return await db.getAllFromIndex('actions', 'by-group', groupId);
}

/**
 * Get a single action
 */
export async function getAction(actionId: string): Promise<Action | undefined> {
  const db = await getDB();
  return await db.get('actions', actionId);
}

/**
 * Update action status
 */
export async function updateActionStatus(
  actionId: string,
  status: Action['status']
): Promise<void> {
  const db = await getDB();
  const action = await db.get('actions', actionId);
  if (action) {
    action.status = status;
    await db.put('actions', action);
  }
}

/**
 * Delete an action
 */
export async function deleteAction(actionId: string): Promise<void> {
  const db = await getDB();
  await db.delete('actions', actionId);
}

// ==================== Notification Operations ====================

/**
 * Save a notification
 */
export async function saveNotification(notification: Notification): Promise<void> {
  const db = await getDB();
  await db.put('notifications', notification);
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  const db = await getDB();
  const notifications = await db.getAllFromIndex('notifications', 'by-user', userId);

  if (unreadOnly) {
    return notifications.filter((n) => !n.read);
  }

  return notifications.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const db = await getDB();
  const notification = await db.get('notifications', notificationId);
  if (notification) {
    notification.read = true;
    await db.put('notifications', notification);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const db = await getDB();
  const notifications = await db.getAllFromIndex('notifications', 'by-user', userId);

  for (const notification of notifications) {
    if (!notification.read) {
      notification.read = true;
      await db.put('notifications', notification);
    }
  }
}

/**
 * Delete old notifications
 */
export async function deleteOldNotifications(
  userId: string,
  olderThanDays: number = 30
): Promise<void> {
  const db = await getDB();
  const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  const notifications = await db.getAllFromIndex('notifications', 'by-user', userId);

  for (const notification of notifications) {
    if (notification.createdAt < cutoffTime && notification.read) {
      await db.delete('notifications', notification.id);
    }
  }
}

// ==================== Database Maintenance ====================

/**
 * Clear all data (use with caution)
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();

  await db.clear('user');
  await db.clear('groups');
  await db.clear('messages');
  await db.clear('actions');
  await db.clear('notifications');
}

/**
 * Export all data (for backup)
 */
export async function exportData(): Promise<string> {
  const db = await getDB();

  const data = {
    user: await db.getAll('user'),
    groups: await db.getAll('groups'),
    messages: await db.getAll('messages'),
    actions: await db.getAll('actions'),
    notifications: await db.getAll('notifications'),
    exportedAt: Date.now(),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(): Promise<{
  groups: number;
  messages: number;
  actions: number;
  notifications: number;
}> {
  const db = await getDB();

  return {
    groups: (await db.getAll('groups')).length,
    messages: (await db.getAll('messages')).length,
    actions: (await db.getAll('actions')).length,
    notifications: (await db.getAll('notifications')).length,
  };
}
