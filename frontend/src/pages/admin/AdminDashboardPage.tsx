import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '@/lib/api';
import { Event } from '@/lib/types';
import { Users, FolderKanban, Building2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { data: events = [] } = useQuery<Event[]>({ queryKey: ['events'], queryFn: fetchEvents });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Dashboard Admin</h1>
          <div className="flex gap-2">
            <Link to="/admin/students"><Button size="sm" variant="outline">Gérer les étudiants</Button></Link>
            <Link to="/admin/organizations"><Button size="sm" variant="outline">Gérer les organisations</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Étudiants" value={156} icon={<Users className="h-5 w-5" />} variant="primary" />
          <StatCard title="Projets réalisés" value={42} icon={<FolderKanban className="h-5 w-5" />} variant="success" />
          <StatCard title="Organisations" value={12} icon={<Building2 className="h-5 w-5" />} variant="warning" />
          <StatCard title="Événements" value={events.length} icon={<CalendarDays className="h-5 w-5" />} />
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-display font-semibold text-lg mb-4">Axe Étudiant</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-3xl font-display font-bold text-primary">42</p>
              <p className="text-sm text-muted-foreground">Projets réalisés</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-3xl font-display font-bold text-primary">156</p>
              <p className="text-sm text-muted-foreground">Étudiants actifs</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-3xl font-display font-bold text-primary">5</p>
              <p className="text-sm text-muted-foreground">Types de projets</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-display font-semibold text-lg mb-4">Axe Organisation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-3xl font-display font-bold text-secondary">12</p>
              <p className="text-sm text-muted-foreground">Organisations</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-3xl font-display font-bold text-secondary">28</p>
              <p className="text-sm text-muted-foreground">Projets créés</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-3xl font-display font-bold text-secondary">{events.length}</p>
              <p className="text-sm text-muted-foreground">Événements</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
