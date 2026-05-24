import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEvents, participateInEvent, cancelEventParticipation } from '@/lib/api';
import { Event } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarDays, MapPin, Users, Download } from 'lucide-react';
import { toast } from 'sonner';
import { SmartImage } from '@/components/SmartImage';
import { eventPhoto, imageCandidates } from '@/lib/images';

export default function StudentEventsPage() {
  const { userEmail } = useAuth();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });

  const participateMutation = useMutation({
    mutationFn: ({ eventId, email }: { eventId: string; email: string }) =>
      participateInEvent(eventId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Participation enregistrée');
    },
    onError: () => toast.error("Erreur lors de l'inscription"),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ eventId, email }: { eventId: string; email: string }) =>
      cancelEventParticipation(eventId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Participation annulée');
    },
    onError: () => toast.error("Erreur lors de l'annulation"),
  });

  const toggle = (eventId: string, isJoined: boolean) => {
    if (!userEmail) { toast.error('Veuillez vous connecter'); return; }
    if (isJoined) cancelMutation.mutate({ eventId, email: userEmail });
    else participateMutation.mutate({ eventId, email: userEmail });
  };

  const myEvents = events.filter(e => userEmail && e.participants.includes(userEmail));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Événements</h1>
        </div>

        {/* My participations */}
        {myEvents.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm font-medium text-primary mb-3">Mes participations ({myEvents.length})</p>
            <div className="flex flex-wrap gap-2">
              {myEvents.map(e => (
                <Badge key={e.id} variant="secondary" className="text-xs">{e.titre}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Événements disponibles', value: events.length, color: 'text-primary' },
            { label: 'Mes participations', value: myEvents.length, color: 'text-success' },
            { label: 'Places disponibles', value: events.filter(e => e.placesRestantes > 0).length, color: 'text-secondary' },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border p-4 text-center">
              <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement des événements...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(e => {
              const isJoined = userEmail ? e.participants.includes(userEmail) : false;
              const isFull = e.placesRestantes === 0;
              return (
                <Dialog key={e.id}>
                  <DialogTrigger asChild>
                    <div className={`bg-card rounded-xl border overflow-hidden shadow-card hover:shadow-elevated transition-shadow cursor-pointer ${isJoined ? 'border-primary/40' : ''}`}>
                      <div className="h-36 bg-muted relative">
                        <SmartImage sources={imageCandidates(e.affiche, eventPhoto(e.id || e.titre))} alt={e.titre} />
                        {isJoined && (
                          <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                            Inscrit
                          </span>
                        )}
                      </div>
                      <div className="p-5 space-y-3">
                        <h3 className="font-display font-semibold">{e.titre}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(e.dateHeure).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(e.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {e.lieu}
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <Badge variant={isFull ? 'destructive' : 'secondary'} className="text-xs">
                            {isFull ? 'Complet' : `${e.placesRestantes} places`}
                          </Badge>
                          <Button
                            size="sm"
                            variant={isJoined ? 'outline' : 'default'}
                            disabled={isFull && !isJoined}
                            onClick={ev => { ev.stopPropagation(); toggle(e.id, isJoined); }}
                          >
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
                      <div className="h-44 overflow-hidden rounded-lg bg-muted">
                        <SmartImage sources={imageCandidates(e.affiche, eventPhoto(e.id || e.titre))} alt={e.titre} />
                      </div>
                      <p className="text-sm text-muted-foreground">{e.description}</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /> {new Date(e.dateHeure).toLocaleDateString('fr-FR')}</div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {e.lieu}</div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {e.nombrePlaces} places</div>
                      </div>
                      {e.partenaires.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Partenaires</p>
                          <div className="flex gap-2 flex-wrap">
                            {e.partenaires.map(p => <Badge key={p} variant="outline">{p}</Badge>)}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => toggle(e.id, isJoined)} disabled={isFull && !isJoined}>
                          {isJoined ? 'Annuler participation' : 'Participer'}
                        </Button>
                        <Button variant="outline" className="gap-1"><Download className="h-4 w-4" /> Certificat</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
