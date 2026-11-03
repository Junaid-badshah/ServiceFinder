import { useState, useEffect } from 'react';
import api from '../services/api';

export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user || user.role !== 'CUSTOMER') {
        setLoading(false);
        setNotifications([]);
        return;
    }
    try {
      const res = await api.get(`/requests/user/${user.id}`);
      const allReqs = res.data || [];
      
      const activeStatuses = ['PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'CANCELLATION_PENDING', 'AWAITING_REVIEW'];
      const activeReqs = allReqs.filter(r => activeStatuses.includes((r.status || '').toUpperCase()));
      
      const highestActiveId = Math.max(0, ...activeReqs.map(r => Number(r.id) || 0));
      
      const terminalStatuses = ['REJECTED', 'CANCELLED', 'EXPIRED'];
      const unreadTerminal = allReqs.filter(r => {
          const st = (r.status || '').toUpperCase();
          const isTerminal = terminalStatuses.includes(st);
          const isUnread = !r.isReadByCustomer;
          const isOlderThanActive = Number(r.id) < highestActiveId;
          return isTerminal && isUnread && !isOlderThanActive;
      });
      
      // Sort by newest first
      const finalList = [...activeReqs, ...unreadTerminal].sort((a,b) => b.id - a.id);
      
      setNotifications(finalList);
    } catch (err) { console.error("Fetch notifications error:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  return { notifications, loading, fetchNotifications };
}
