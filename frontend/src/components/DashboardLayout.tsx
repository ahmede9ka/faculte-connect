import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Bell } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUnreadNotificationCount } from '@/lib/api';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { userName } = useAuth();
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['unreadCount'],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground hidden sm:block">Bienvenue, <span className="font-medium text-foreground">{userName}</span></span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
