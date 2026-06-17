import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const STORAGE_KEY = 'alertas_last_seen_id';

function getLastSeenId() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    return Number.parseInt(raw, 10) || 0;
  } catch {
    return 0;
  }
}

export function setAlertasLastSeenId(id) {
  try {
    localStorage.setItem(STORAGE_KEY, String(id));
  } catch {
    /* localStorage unavailable: badge silently does nothing */
  }
}

export function markAlertasSeen() {
  // Highest id seen so far is fetched on next poll; the page that
  // calls this (AlertasPage) has the freshest data right after reload.
  // We just clear the badge optimistically; the next tick will
  // re-write the real max id.
  try {
    api
      .get('/mascotas/', { params: { limit: 200 } })
      .then(({ data }) => {
        if (Array.isArray(data) && data.length) {
          const maxId = data.reduce((m, x) => Math.max(m, x.id || 0), 0);
          setAlertasLastSeenId(maxId);
        }
      })
      .catch(() => {});
  } catch {
    /* noop */
  }
}

export function useUnreadAlerts({ pollMs = 30000 } = {}) {
  const [unread, setUnread] = useState(0);

  const recompute = useCallback(async () => {
    try {
      const { data } = await api.get('/mascotas/', { params: { limit: 200 } });
      if (!Array.isArray(data)) return;
      const lastSeen = getLastSeenId();
      const count = data.filter((m) => (m.id || 0) > lastSeen).length;
      setUnread(count);
    } catch {
      /* keep previous unread on transient errors */
    }
  }, []);

  useEffect(() => {
    recompute();
    const id = setInterval(recompute, pollMs);
    const onFocus = () => recompute();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [recompute, pollMs]);

  return unread;
}
