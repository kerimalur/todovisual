import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import app from './firebase';

export const db = getFirestore(app);

// Collection names
export const COLLECTIONS = {
  TASKS: 'tasks',
  GOALS: 'goals',
  PROJECTS: 'projects',
  EVENTS: 'events',
  HABITS: 'habits',
  HABIT_COMPLETIONS: 'habitCompletions',
  HABIT_CATEGORIES: 'habitCategories',
  JOURNAL_ENTRIES: 'journalEntries',
  FOCUS_SESSIONS: 'focusSessions',
  // Neue Collections
  TAGS: 'tags',
  NOTES: 'notes',
  BRAINSTORM_SESSIONS: 'brainstormSessions',
  TIME_ENTRIES: 'timeEntries',
  WEEKLY_REFLECTIONS: 'weeklyReflections',
} as const;

// Helper function to create a query for user-specific data
export const createUserQuery = (collectionName: string, userId: string) => {
  return query(
    collection(db, collectionName),
    where('userId', '==', userId)
  );
};

// Helper function to create a query with ordering
export const createUserQueryWithOrder = (
  collectionName: string,
  userId: string,
  orderByField: string,
  direction: 'asc' | 'desc' = 'desc'
) => {
  return query(
    collection(db, collectionName),
    where('userId', '==', userId),
    orderBy(orderByField, direction)
  );
};

// Generic CRUD operations
export const firestoreService = {
  // Create
  async create<T extends { userId: string }>(collectionName: string, data: T) {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Update
  async update(collectionName: string, id: string, data: Partial<any>) {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete
  async delete(collectionName: string, id: string) {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  },

  // Subscribe to user-specific collection
  subscribe<T>(
    collectionName: string,
    userId: string,
    callback: (data: T[]) => void,
    orderByField?: string
  ) {
    const q = orderByField
      ? createUserQueryWithOrder(collectionName, userId, orderByField)
      : createUserQuery(collectionName, userId);

    return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
      callback(data);
    });
  },
};
