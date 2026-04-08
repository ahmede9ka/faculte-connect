import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { fetchTasks } from '@/lib/api';
import { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Clock } from 'lucide-react';

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks
  });

  const filtered = tasks.filter(t => statusFilter === 'all' || t.statut === statusFilter);

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
