import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

export function useFetch(path, { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: payload } = await api.get(path);
      setData(payload);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    if (!skip) load();
  }, [load, skip]);

  return { data, loading, error, reload: load, setData };
}
