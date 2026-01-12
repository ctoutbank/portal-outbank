'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao marcar notificação:', error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      });
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao marcar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_version': return 'bg-blue-500/10 border-blue-500/30';
      case 'expiring_30d': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'expiring_7d': return 'bg-orange-500/10 border-orange-500/30';
      case 'expired': return 'bg-red-500/10 border-red-500/30';
      case 'version_applied': return 'bg-green-500/10 border-green-500/30';
      default: return 'bg-[#2a2a2a] border-[#3a3a3a]';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-[#1a1a1a] border-[#2a2a2a]" align="end">
        <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a]">
          <h4 className="font-semibold text-white">Notificações</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              disabled={loading}
              className="text-xs text-[#e0e0e0] hover:text-white hover:bg-[#2a2a2a]"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">
              Nenhuma notificação
            </div>
          ) : (
            <div className="divide-y divide-[#2a2a2a]">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 ${!notification.isRead ? 'bg-[#2a2a2a]/50' : ''}`}
                >
                  <div className={`rounded-md border p-2 ${getNotificationColor(notification.type)}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-white">{notification.title}</p>
                        <p className="text-xs text-[#808080] mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#606060] mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-[#808080] hover:text-white hover:bg-[#3a3a3a]"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
