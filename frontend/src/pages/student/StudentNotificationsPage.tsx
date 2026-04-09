import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications, markNotificationAsRead,
  markAllNotificationsAsRead, deleteNotification,
} from '@/lib/api';
import { Notification } from '@/lib/types';
import { Bell, CheckCheck, Trash2, ListTodo, FolderKanban, CalendarDays, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const typeIcons = { task: ListTodo, project: FolderKanban, event: CalendarDays, system: Settings };
const typeColors = {
  task: 'bg-primary/10 text-primary',
  project: 'bg-warning/10 text-warning',
  event: 'bg-success/10 text-success',
  system: 'bg-muted text-muted-foreground',
};

export default function StudentNotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
      toast.success('Toutes les notifications marquées comme lues');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
      toast.success('Notification supprimée');
    },
  });

  const unread = notifications.filter(n => !n.lu).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">Notifications</h1>
            {unread > 0 && (
              <span className="h-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center">
                {unread} non lue{unread > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()} className="gap-1">
              <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => {
              const Icon = typeIcons[n.type];
              return (
                <div key={n.id} className={cn('bg-card rounded-xl border p-4 flex items-start gap-4 transition-colors', !n.lu && 'border-primary/30 bg-primary/5')}>
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', typeColors[n.type])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{n.titre}</p>
                      {!n.lu && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!n.lu && (
                      <Button variant="ghost" size="sm" onClick={() => markAsReadMutation.mutate(n.id)}>
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
