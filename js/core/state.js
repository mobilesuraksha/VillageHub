const state = {
  user: null,       // { uid, displayName, photoURL, profile: {...} } | null
  theme: 'light',
  unreadCount: 0,
  savedIds: new Set() // itemIds the current user has saved, for quick "is this saved?" checks
};

const listeners = {};

export function getState(key) {
  return state[key];
}

export function setState(key, value) {
  state[key] = value;
  (listeners[key] || []).forEach((cb) => {
    try { cb(value); } catch (err) { console.error(`[state] listener for "${key}" threw:`, err); }
  });
}

/** Subscribe to changes on a state key. Returns an unsubscribe function. */
export function subscribe(key, callback) {
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(callback);
  return () => {
    listeners[key] = listeners[key].filter((cb) => cb !== callback);
  };
}

export function isSignedIn() {
  return !!state.user;
}
