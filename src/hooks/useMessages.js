import { useEffect, useState } from 'react';
import { subscribeToMessages } from '../services/messageService';

export function useMessages(chatroomId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatroomId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToMessages(chatroomId, (list) => {
      setMessages(list);
      setLoading(false);
    });
    return () => unsub();
  }, [chatroomId]);

  return { messages, loading };
}
