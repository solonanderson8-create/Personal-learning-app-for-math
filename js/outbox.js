// Nothing you save is ever lost.
// Every save goes into a queue in this browser first (localStorage), then is sent
// to the cloud. If sending fails, it stays queued and is retried until it works.
// Like a letter tray: the letter only leaves the tray once the post office has it.

import { write, currentUser } from './cloud.js';

const KEY = 'll.outbox';
const RETRY_MS = 20000;
const listeners = new Set();
let sending = false;

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function store(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const pendingCount = () => load().length;

export function onChange(fn) {
  listeners.add(fn);
  fn(pendingCount());
}
const notify = () => listeners.forEach((fn) => fn(pendingCount()));

// path is inside the user's folder, e.g. 'test/plumbing'.
export function queue(path, data) {
  const items = load();
  items.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, path, data });
  store(items);
  notify();
  return flush();
}

export async function flush() {
  if (sending || !currentUser()) return;
  sending = true;
  try {
    for (const item of load()) {
      try {
        await write(item.path, item.data);
      } catch {
        break; // offline or refused: keep it, try again later
      }
      store(load().filter((x) => x.id !== item.id));
      notify();
    }
  } finally {
    sending = false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) flush(); });
  setInterval(flush, RETRY_MS);
}
