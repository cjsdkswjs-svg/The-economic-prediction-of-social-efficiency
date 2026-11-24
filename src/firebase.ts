import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type { Metrics, RoleType } from './simulation/engine';

export const ADMIN_EMAIL = 'cjsdkswjs@gmail.com';
export const SUBMISSIONS_COLLECTION = 'submissions';

// Blueprint validation constants (matched verbatim with firebase-blueprint.json & firestore.rules)
export const STUDENT_ID_MAX_LEN = 20;
export const STUDENT_NAME_MAX_LEN = 20;
export const ENDING_TITLE_MAX_LEN = 60;
export const STUDENT_INPUT_PATTERN = /^[0-9a-zA-Z가-힣_\-\s]{1,20}$/;

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export function isVerifiedAdmin(user: User | null): boolean {
  return Boolean(user && user.emailVerified && user.email === ADMIN_EMAIL);
}

export function subscribeAuthState(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function signInAdminWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export interface SubmissionPayload {
  studentId: string;
  studentName: string;
  role: RoleType;
  corporateScore: number;
  socialScore: number;
  combinedEfficiency: number;
  endingTitle: string;
  metrics: Metrics;
}

export interface SubmissionRecord extends SubmissionPayload {
  id: string;
  createdAtMs: number;
}

function clamp0to100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Number(n.toFixed(2))));
}

export function sanitizeSubmissionPayload(input: SubmissionPayload) {
  const studentId = input.studentId.trim().slice(0, STUDENT_ID_MAX_LEN);
  const studentName = input.studentName.trim().slice(0, STUDENT_NAME_MAX_LEN);
  const endingTitle = input.endingTitle.trim().slice(0, ENDING_TITLE_MAX_LEN);

  if (!STUDENT_INPUT_PATTERN.test(studentId)) {
    throw new Error('학번 형식이 올바르지 않습니다.');
  }
  if (!STUDENT_INPUT_PATTERN.test(studentName)) {
    throw new Error('이름 형식이 올바르지 않습니다.');
  }
  if (endingTitle.length < 1 || endingTitle.length > ENDING_TITLE_MAX_LEN) {
    throw new Error('엔딩 제목 길이가 유효하지 않습니다.');
  }

  return {
    studentId,
    studentName,
    role: input.role,
    corporateScore: clamp0to100(input.corporateScore),
    socialScore: clamp0to100(input.socialScore),
    combinedEfficiency: clamp0to100(input.combinedEfficiency),
    endingTitle,
    metrics: {
      Pd: clamp0to100(input.metrics.Pd),
      Pf: clamp0to100(input.metrics.Pf),
      E: clamp0to100(input.metrics.E),
      C: clamp0to100(input.metrics.C),
      D: clamp0to100(input.metrics.D),
      A: clamp0to100(input.metrics.A),
      S: clamp0to100(input.metrics.S),
    },
    createdAt: serverTimestamp(),
  };
}

export async function submitSimulationResult(payload: SubmissionPayload): Promise<string> {
  const cleanData = sanitizeSubmissionPayload(payload);
  try {
    const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, SUBMISSIONS_COLLECTION);
  }
}

export function subscribeSubmissionsForAdmin(
  onData: (records: SubmissionRecord[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const records: SubmissionRecord[] = snapshot.docs.map((d) => {
        const raw = d.data();
        const ts = raw.createdAt as { toMillis?: () => number } | null | undefined;
        return {
          id: d.id,
          studentId: String(raw.studentId ?? ''),
          studentName: String(raw.studentName ?? ''),
          role: raw.role === 'worker' ? 'worker' : 'ceo',
          corporateScore: Number(raw.corporateScore ?? 0),
          socialScore: Number(raw.socialScore ?? 0),
          combinedEfficiency: Number(raw.combinedEfficiency ?? 0),
          endingTitle: String(raw.endingTitle ?? ''),
          metrics: {
            Pd: Number(raw.metrics?.Pd ?? 0),
            Pf: Number(raw.metrics?.Pf ?? 0),
            E: Number(raw.metrics?.E ?? 0),
            C: Number(raw.metrics?.C ?? 0),
            D: Number(raw.metrics?.D ?? 0),
            A: Number(raw.metrics?.A ?? 0),
            S: Number(raw.metrics?.S ?? 0),
          },
          createdAtMs: ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Date.now(),
        };
      });
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, SUBMISSIONS_COLLECTION);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function deleteSubmissionForAdmin(id: string): Promise<void> {
  const docPath = `${SUBMISSIONS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
