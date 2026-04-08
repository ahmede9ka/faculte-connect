import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBadge } from '@/components/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { fetchProjects, fetchEvents } from '@/lib/api';
import { Project, Event } from '@/lib/types';
import { FolderKanban, ListTodo, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrgDashboardPage() {
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ['projects'], queryFn: fetchProjects });
  const { data: events = [] } = useQuery<Event[]>({ queryKey: ['events'], queryFn: fetchEvents });

  const planned = projects.filter(p => p.statut === 'Planifié').length;
  const inProgress = projects.filter(p => p.statut === 'En cours').length;
  const late = projects.filter(p => p.statut === 'En Retard').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Dashboard Organisation</h1>
          <div className="flex gap-2">
            <Link to="/projects/create"><Button size="sm" className="gap-1 gradient-primary border-0 text-primary-foreground">Créer un projet</Button></Link>
            <Link to="/events/create"><Button size="sm" variant="outline">Créer un événement</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Projets" value={projects.length} icon={<FolderKanban className="h-5 w-5" />} variant="primary" />
          <StatCard title="Planifiés" value={planned} icon={<Clock className="h-5 w-5" />} variant="default" />
          <StatCard title="En cours" value={inProgress} subtitle="projets actifs" icon={<ListTodo className="h-5 w-5" />} variant="success" />
          <StatCard title="En retard" value={late} icon={<Clock className="h-5 w-5" />} variant="destructive" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-display font-semibold text-lg mb-4">Projets créés</h2>
            <div className="space-y-3">
              {projects.map(p => (
                <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.titre}</p>
                    <p className="text-xs text-muted-foreground">{p.chefDeProjetNom}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.statut} />
                    <div className="w-20"><ProgressBar value={p.progression} /></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-display font-semibold text-lg mb-4">Événements créés</h2>
            <div className="space-y-3">
              {events.map(e => (
                <div key={e.id} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{e.titre}</p>
                    <span className="text-xs text-muted-foreground">{new Date(e.dateHeure).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{e.nombrePlaces - e.placesRestantes} participants</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
