import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import { auth, googleProvider, db } from '/js/firebase/firebase-config.js';
import { setState } from '/js/core/state.js';

/**
 * Sign in with Google. Tries a popup first (best UX on desktop); if the
 * browser blocks popups (common on some mobile browsers/in-app webviews)
 * it transparently falls back to a full-page redirect flow.
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(result.user);
    return result.user;
  } catch (err) {
    const popupBlockedCodes = [
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment'
    ];
    if (popupBlockedCodes.includes(err.code)) {
      await signInWithRedirect(auth, googleProvider);
      return null; // page will reload; handleRedirectResult() picks it up
    }
    throw err;
  }
}

/** Call once on app boot to finish a redirect-based sign-in, if one is pending. */
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) await ensureUserProfile(result.user);
  } catch (err) {
    console.error('[auth-service] Redirect sign-in failed:', err);
  }
}

export async function signOutUser() {
  await signOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await ensureUserProfile(firebaseUser);
      setState('user', { ...firebaseUser, profile });
    } else {
      setState('user', null);
    }
    callback(firebaseUser);
  });
}

/**
 * Ensures a `users/{uid}` document exists for the signed-in Firebase user,
 * creating it with sane defaults on first login. Returns the profile data.
 */
export async function ensureUserProfile(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const newProfile = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || 'VillageHub User',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || '',
      phone: '',
      role: 'user',
      status: 'active',
      location: null,
      verified: false,
      fcmTokens: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(ref, newProfile);
    return newProfile;
  }

  return snap.data();
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
}
