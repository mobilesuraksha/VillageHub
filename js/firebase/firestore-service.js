import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, onSnapshot, serverTimestamp,
  increment, arrayUnion, arrayRemove
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import { db } from '/js/firebase/firebase-config.js';

// Re-export the pieces pages/components commonly need so callers only ever
// import from this one module instead of reaching into the CDN URL directly.
export { serverTimestamp, increment, arrayUnion, arrayRemove };

/** Fetch a single document by collection + id. Returns null if missing. */
export async function getDocument(collectionName, id) {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Fetch a list of documents with optional where/orderBy/limit constraints.
 * `constraints` is an array of Firestore query constraint objects built with
 * the exported `where`/`orderBy`/`limit` helpers below.
 */
export async function getDocuments(collectionName, constraints = []) {
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Same as getDocuments but also returns the last doc snapshot for pagination. */
export async function getDocumentsPage(collectionName, constraints = [], pageSize = 12, startAfterDoc = null) {
  const allConstraints = [...constraints, limit(pageSize)];
  if (startAfterDoc) allConstraints.push(startAfter(startAfterDoc));
  const q = query(collection(db, collectionName), ...allConstraints);
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === pageSize
  };
}

export async function addDocument(collectionName, data) {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateDocument(collectionName, id, data) {
  await updateDoc(doc(db, collectionName, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocument(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}

/** Subscribe in realtime. Returns an unsubscribe function. */
export function subscribeToCollection(collectionName, constraints, onNext, onError) {
  const q = query(collection(db, collectionName), ...constraints);
  return onSnapshot(q, (snap) => onNext(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export function subscribeToDocument(collectionName, id, onNext, onError) {
  return onSnapshot(doc(db, collectionName, id), (snap) => onNext(snap.exists() ? { id: snap.id, ...snap.data() } : null), onError);
}

// Re-export query builders so pages don't need a second CDN import line.
export { where, orderBy, limit, startAfter };

// ---------------------------------------------------------------------------
// Home-page specific query helpers (kept here so the query shape - and the
// composite indexes it needs - lives next to the rest of the data layer)
// ---------------------------------------------------------------------------

export function getLatestListings(count = 8) {
  return getDocuments('listings', [
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
    limit(count)
  ]);
}

export function getPopularShops(count = 6) {
  return getDocuments('shops', [
    where('status', '==', 'approved'),
    orderBy('rating', 'desc'),
    limit(count)
  ]);
}

export function getLatestJobs(count = 6) {
  return getDocuments('jobs', [
    where('status', '==', 'approved'),
    orderBy('createdAt', 'desc'),
    limit(count)
  ]);
}

export function getActiveOffers(count = 6) {
  return getDocuments('offers', [
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(count)
  ]);
}

export function getLatestNews(count = 4) {
  return getDocuments('news', [
    orderBy('createdAt', 'desc'),
    limit(count)
  ]);
}
