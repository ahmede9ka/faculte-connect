import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEvents, participateInEvent, cancelEventParticipation, deleteEvent } from '@/lib/api';
import { Event } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarDays, MapPin, Users, Plus, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function EventsPage() {
  const { userRole, userEmail } = useAuth();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: fetchEvents
  });

  const participateMutation = useMutation({
    mutationFn: ({ eventId, email }: { eventId: string; email: string }) =>
      participateInEvent(eventId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Participation enregistrée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de l\'inscription à l\'événement');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: ({ eventId, email }: { eventId: string; email: string }) =>
      cancelEventParticipation(eventId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Participation annulée');
    },
    onError: () => {
      toast.error('Erreur lors de l\'annulation');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Événement supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const toggleParticipate = (eventId: string, isParticipating: boolean) => {
    if (!userEmail) {
      toast.error('Veuillez vous connecter');
      return;
    }

    if (isParticipating) {
      cancelMutation.mutate({ eventId, email: userEmail });
    } else {
      participateMutation.mutate({ eventId, email: userEmail });
    }
  };

  const handleDelete = (eventId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      deleteMutation.mutate(eventId);
    }
  };

  if (userRole === 'organization') {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold">Événements</h1>
            <Link to="/events/create"><Button className="gap-1 gradient-primary border-0 text-primary-foreground"><Plus className="h-4 w-4" /> Créer Event</Button></Link>
          </div>
          <div className="bg-card rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Titre</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Participants</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Chargement des événements...</td></tr>
                ) : (
                  events.map(e => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-5 py-4 text-sm font-medium">{e.titre}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{new Date(e.dateHeure).toLocaleDateString('fr-FR')}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{e.nombrePlaces - e.placesRestantes}/{e.nombrePlaces}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm">Voir</Button>
                          <Link to={`/events/${e.id}/edit`}><Button variant="ghost" size="sm">Modifier</Button></Link>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(e.id)}>Supprimer</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Événements</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">Chargement des événements...</div>
          ) : (
            events.map(e => {
              const isJoined = userEmail ? e.participants.includes(userEmail) : false;
              const isFull = e.placesRestantes === 0;
              return (
                <Dialog key={e.id}>
                  <DialogTrigger asChild>
                    <div className="bg-card rounded-xl border overflow-hidden shadow-card hover:shadow-elevated transition-shadow cursor-pointer">
                      <div className="h-32 gradient-hero flex items-center justify-center">
                        <CalendarDays className="h-10 w-10 text-primary-foreground/40" />
                      </div>
                      <div className="p-5 space-y-3">
                        <h3 className="font-display font-semibold">{e.titre}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(e.dateHeure).toLocaleDateString('fr-FR')} à {new Date(e.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {e.lieu}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <Badge variant={isFull ? 'destructive' : 'secondary'} className="text-xs">
                            {isFull ? 'Complet' : `${e.placesRestantes} places`}
                          </Badge>
                          <Button size="sm" variant={isJoined ? 'outline' : 'default'} disabled={isFull && !isJoined}
                            onClick={(ev) => { ev.stopPropagation(); toggleParticipate(e.id, isJoined); }}>
                            {isJoined ? 'Annuler' : 'Participer'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-display">{e.titre}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">{e.description}</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /> {new Date(e.dateHeure).toLocaleDateString('fr-FR')}</div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {e.lieu}</div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {e.nombrePlaces} places</div>
                      </div>
                      {e.partenaires.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Partenaires</p>
                          <div className="flex gap-2">{e.partenaires.map(p => <Badge key={p} variant="outline">{p}</Badge>)}</div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => toggleParticipate(e.id, isJoined)} disabled={isFull && !isJoined}>
                          {isJoined ? 'Annuler participation' : 'Participer'}
                        </Button>
                        <Button variant="outline" className="gap-1"><Download className="h-4 w-4" /> Certificat</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
