import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, updateTask } from '@/lib/api';
import { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ProgressBar } from '@/components/ProgressBar';
import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

function getDeadlineAlert(deadline?: string) {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDeadline = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.ceil((startOfDeadline.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: 'En retard', className: 'bg-destructive/10 text-destructive border border-destructive/20' };
  }
  if (diffDays === 0) {
    return { label: "Aujourd'hui", className: 'bg-warning/10 text-warning border border-warning/20' };
  }
  if (diffDays <= 3) {
    return { label: `Dans ${diffDays}j`, className: 'bg-warning/10 text-warning border border-warning/20' };
  }
  return null;
}

export default function TasksPage() {
  const { userEmail } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [updates, setUpdates] = useState<Record<string, { note: string; percent: number }>>({});
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks
  });

  const filtered = tasks.filter(t => statusFilter === 'all' || t.statut === statusFilter);

  const updateMutation = useMutation({
    mutationFn: ({ task, note, percent }: { task: Task; note: string; percent: number }) =>
      updateTask(task.projectId, task.id, {
        titre: task.titre,
        description: task.description,
        status: percent >= 100 ? 'TERMINE' : percent > 0 ? 'EN_COURS' : 'EN_ATTENTE',
        echeance: task.deadline || undefined,
        progression: percent,
        commentaire: note,
        updatedByEmail: userEmail || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'details'] });
      toast.success('Mise à jour enregistrée');
    },
    onError: () => toast.error('Impossible d\'enregistrer la mise à jour')
  });

  useEffect(() => {
    if (!tasks.length) {
      return;
    }

    setUpdates(prev => {
      const next = { ...prev };
      tasks.forEach(task => {
        if (!next[task.id]) {
          const initialPercent = Number.isFinite(task.progression)
            ? task.progression
            : task.statut === 'Terminée'
              ? 100
              : task.statut === 'En cours'
                ? 50
                : 0;
          next[task.id] = { note: task.commentaire ?? '', percent: initialPercent };
        }
      });
      return next;
    });
  }, [tasks]);

  const handleNoteChange = (taskId: string, note: string) => {
    setUpdates(prev => ({
      ...prev,
      [taskId]: {
        note,
        percent: prev[taskId]?.percent ?? 0
      }
    }));
  };

  const handlePercentChange = (taskId: string, percent: number) => {
    setUpdates(prev => ({
      ...prev,
      [taskId]: {
        note: prev[taskId]?.note ?? '',
        percent
      }
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-display text-2xl font-bold">Mes Tâches</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Non commencée">Non commencée</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Terminée">Terminée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center p-8 text-muted-foreground">Chargement des tâches...</div>
          ) : (
            filtered.map(t => (
              <div key={t.id} className="bg-card rounded-xl border p-5 shadow-card hover:shadow-elevated transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-sm">{t.titre}</h3>
                  <PriorityBadge priority={t.priorite} />
                </div>
                <p className="text-xs text-muted-foreground mb-3">{t.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Assigné à: <strong className="text-foreground">{t.assigneNom}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Deadline: {t.deadline}</span>
                    {getDeadlineAlert(t.deadline) && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${getDeadlineAlert(t.deadline)!.className}`}>
                        {getDeadlineAlert(t.deadline)!.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Ce que j'ai fait</Label>
                    <Textarea
                      value={updates[t.id]?.note ?? ''}
                      onChange={event => handleNoteChange(t.id, event.target.value)}
                      placeholder="Ex: J'ai avancé sur la maquette et corrigé les bugs de connexion..."
                      rows={3}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Label>Avancement</Label>
                      <span className="font-medium text-foreground">{updates[t.id]?.percent ?? 0}%</span>
                    </div>
                    <Slider
                      value={[updates[t.id]?.percent ?? 0]}
                      onValueChange={value => handlePercentChange(t.id, value[0] ?? 0)}
                      max={100}
                      step={5}
                    />
                    <ProgressBar value={updates[t.id]?.percent ?? 0} />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        updateMutation.mutate({
                          task: t,
                          note: updates[t.id]?.note ?? '',
                          percent: updates[t.id]?.percent ?? 0
                        })
                      }
                      disabled={updateMutation.isPending}
                    >
                      Enregistrer
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <StatusBadge status={t.statut} />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-xs">Modifier</Button>
                    <Button variant="ghost" size="sm" className="text-xs text-destructive">Supprimer</Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
