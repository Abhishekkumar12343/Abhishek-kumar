import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { toast } from 'sonner';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function getFriendlyErrorMessage(error: any, operationType: OperationType): string {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    switch (operationType) {
      case OperationType.CREATE: return 'Permission Denied: You cannot create this item.';
      case OperationType.UPDATE: return 'Permission Denied: You cannot update this item.';
      case OperationType.DELETE: return 'Permission Denied: You cannot delete this item.';
      case OperationType.LIST: return 'Permission Denied: You cannot view this list.';
      case OperationType.GET: return 'Permission Denied: Access to this data is restricted.';
      case OperationType.WRITE: return 'Permission Denied: Your changes could not be saved.';
      default: return 'Access denied. Please check your permissions.';
    }
  }

  if (message.includes('not-found')) {
    return 'The requested data could not be found.';
  }

  if (message.includes('quota-exceeded')) {
    return 'Database quota exceeded. Please try again later.';
  }

  if (message.includes('unavailable')) {
    return 'The database is currently offline. Please check your internet connection.';
  }

  return `Database Error (${operationType}): ${message}`;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const friendlyMessage = getFriendlyErrorMessage(error, operationType);

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error:', JSON.stringify(errInfo));
  
  // Show toast notification
  toast.error(friendlyMessage, {
    description: path ? `Path: ${path}` : undefined,
    duration: 5000,
  });

  // We throw a custom error that includes both the JSON for the system and the friendly message for the UI
  const finalError = new Error(JSON.stringify(errInfo));
  (finalError as any).friendlyMessage = friendlyMessage;
  throw finalError;
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = () => signOut(auth);
