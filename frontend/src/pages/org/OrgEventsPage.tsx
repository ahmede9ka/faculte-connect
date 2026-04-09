import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEventsByOrganizer, deleteEvent } from '@/lib/api';
import { Event } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function OrgEventsPage() {
  const queryClient = useQueryClient();
  const { userEmail } = useAuth();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events', userEmail],
    queryFn: () => fetchEventsByOrganizer(),
    enabled: Boolean(userEmail),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', userEmail] });
      toast.success('Événement supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cet événement ?')) deleteMutation.mutate(id);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Mes Événements</h1>
          <Link to="/events/create">
            <Button className="gap-1 gradient-primary border-0 text-primary-foreground">
              <Plus className="h-4 w-4" /> Créer un événement
            </Button>
          </Link>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: events.length, icon: CalendarDays, color: 'text-primary' },
            { label: 'Participants', value: events.reduce((s, e) => s + (e.nombrePlaces - e.placesRestantes), 0), icon: Users, color: 'text-success' },
            { label: 'Complets', value: events.filter(e => e.placesRestantes === 0).length, icon: CalendarDays, color: 'text-destructive' },
            { label: 'Disponibles', value: events.filter(e => e.placesRestantes > 0).length, icon: MapPin, color: 'text-secondary' },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border p-4 text-center">
              <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement des événements...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aucun événement créé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Titre</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Lieu</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Participants</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(e => {
                    const filled = e.nombrePlaces - e.placesRestantes;
                    const isFull = e.placesRestantes === 0;
                    return (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4 font-medium text-sm">{e.titre}</td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className="text-xs">{e.type}</Badge>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {new Date(e.dateHeure).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{e.lieu}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {filled}/{e.nombrePlaces}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={isFull ? 'destructive' : 'secondary'} className="text-xs">
                            {isFull ? 'Complet' : `${e.placesRestantes} places`}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/events/${e.id}/edit`}>
                              <Button variant="ghost" size="sm">Modifier</Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDelete(e.id)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
