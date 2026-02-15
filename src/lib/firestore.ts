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
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        // Convert Firestore Timestamps to JavaScript Dates
        const convertedData = convertTimestamps(docData);
        return {
          id: doc.id,
          ...convertedData,
        };
      }) as T[];
      callback(data);
    });
  },
};

// Helper function to recursively convert Firestore Timestamps to JavaScript Dates
function convertTimestamps(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Check if it's a Firestore Timestamp
  if (obj && typeof obj.toDate === 'function') {
    return obj.toDate();
  }
  
  // If it's an array, convert each element
  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }
  
  // If it's an object, convert each property
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertTimestamps(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
}
