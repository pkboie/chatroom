import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const UsersContext = createContext({
  users: [],
  usersById: {},
  loading: true,
  error: null,
});

export function UsersProvider({ children }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('UsersProvider snapshot error:', err);
        setError(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [currentUser]);

  const usersById = useMemo(() => {
    const map = {};
    for (const u of users) {
      if (u.uid) map[u.uid] = u;
    }
    return map;
  }, [users]);

  const value = useMemo(
    () => ({ users, usersById, loading, error }),
    [users, usersById, loading, error],
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  return useContext(UsersContext);
}
