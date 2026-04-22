import { useEffect, useState } from 'react';
import { subscribeToChatrooms } from '../services/chatroomService';

export function useChatrooms(userId) {
  const [chatrooms, setChatrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setChatrooms([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToChatrooms(
      userId,
      (rooms) => {
        setChatrooms(rooms);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [userId]);

  return { chatrooms, loading, error };
}
