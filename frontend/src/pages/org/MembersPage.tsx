import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addProjectMember, fetchProjectsByOrganisation, removeProjectMember, updateProjectMember } from '@/lib/api';
import { ProjectMember } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, User, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SmartImage } from '@/components/SmartImage';
import { avatarPhoto, imageCandidates } from '@/lib/images';

function isTaskLate(taskDeadline?: string, status?: string, progression?: number) {
  if (!taskDeadline) return false;
  if (status === 'Terminée' || (progression ?? 0) >= 100) return false;
  const deadline = new Date(taskDeadline);
  if (Number.isNaN(deadline.getTime())) return false;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDeadline = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  return startOfDeadline.getTime() < startOfToday.getTime();
}

function clampPercent(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export default function MembersPage() {
  const { userName } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editingMemberEmail, setEditingMemberEmail] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['org-projects', userName],
    queryFn: () => fetchProjectsByOrganisation(userName),
    enabled: Boolean(userName),
  });

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const members = useMemo<ProjectMember[]>(() => {
    if (!selectedProject) return [];

    return (selectedProject.membres || []).map((m) => ({
      id: m.email,
      userId: m.email,
      nom: m.email,
      email: m.email,
      role: m.email === selectedProject.chefDeProjet ? 'Chef' : 'Membre actif',
    }));
  }, [selectedProject]);

  const memberStats = useMemo(() => {
    if (!selectedProject) return [];
    const tasks = selectedProject.taches ?? [];

    return members.map((member) => {
      const memberTasks = tasks.filter((task) => {
        const membersEmails = task.membresEmails ?? [];
        return membersEmails.includes(member.email) || task.assigneA === member.email;
      });

      const total = memberTasks.length;
      const completed = memberTasks.filter((t) => t.statut === 'Terminée' || (t.progression ?? 0) >= 100).length;
      const late = memberTasks.filter((t) => isTaskLate(t.deadline, t.statut, t.progression)).length;
      const avgProgress = total === 0
        ? 0
        : Math.round(memberTasks.reduce((sum, t) => sum + (t.progression ?? 0), 0) / total);

      return {
        email: member.email,
        name: member.nom,
        total,
        completed,
        late,
        avgProgress,
        completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
        lateRate: total === 0 ? 0 : Math.round((late / total) * 100),
      };
    });
  }, [members, selectedProject]);

  const addMutation = useMutation({
    mutationFn: (email: string) => addProjectMember(selectedProjectId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-projects', userName] });
      toast.success('Membre ajoute');
      setAddEmail('');
      setAddOpen(false);
    },
    onError: () => toast.error('Impossible d\'ajouter ce membre'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ currentEmail, newEmail }: { currentEmail: string; newEmail: string }) =>
      updateProjectMember(selectedProjectId, currentEmail, newEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-projects', userName] });
      toast.success('Membre mis a jour');
      setEditEmail('');
      setEditingMemberEmail(null);
      setEditOpen(false);
    },
    onError: () => toast.error('Impossible de modifier ce membre'),
  });

  const removeMutation = useMutation({
    mutationFn: (email: string) => removeProjectMember(selectedProjectId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-projects', userName] });
      toast.success('Membre supprime');
    },
    onError: () => toast.error('Impossible de supprimer ce membre'),
  });

  const handleAdd = () => {
    if (!selectedProjectId) {
      toast.error('Choisissez un projet');
      return;
    }
    if (!addEmail.trim()) {
      toast.error('Email requis');
      return;
    }
    addMutation.mutate(addEmail.trim());
  };

  const handleEdit = () => {
    if (!selectedProjectId || !editingMemberEmail) return;
    if (!editEmail.trim()) {
      toast.error('Nouvel email requis');
      return;
    }
    updateMutation.mutate({ currentEmail: editingMemberEmail, newEmail: editEmail.trim() });
  };

  const handleDelete = (email: string) => {
    if (!selectedProjectId) return;
    if (confirm('Supprimer ce membre du projet ?')) {
      removeMutation.mutate(email);
    }
  };

  if (isLoading) return <DashboardLayout><div className="p-8 text-center text-muted-foreground">Chargement des membres...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Membres</h1>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1 gradient-primary border-0 text-primary-foreground" disabled={!selectedProjectId}>
                <Plus className="h-4 w-4" /> Ajouter membre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un membre</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Projet</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger><SelectValue placeholder="Choisir un projet" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.titre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Email du membre</Label>
                  <Input
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="membre@exemple.com"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
                  <Button onClick={handleAdd} disabled={addMutation.isPending}>Ajouter</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="min-w-[240px]">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger><SelectValue placeholder="Choisir un projet" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.titre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedProject && (
            <Badge variant="outline">{members.length} membre(s)</Badge>
          )}
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          {!selectedProject ? (
            <div className="p-8 text-center text-muted-foreground">Aucun projet disponible</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Aucun membre</div>
          ) : (
            <div className="divide-y">
              {members.map(m => {
                const isChef = selectedProject.chefDeProjet === m.email;
                return (
                  <div key={m.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 overflow-hidden shrink-0">
                        <SmartImage sources={imageCandidates(m.avatar, avatarPhoto(m.email))} alt={m.nom || m.email} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{m.nom}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{m.role}</Badge>
                      <div className="flex gap-1">
                        <Dialog open={editOpen && editingMemberEmail === m.email} onOpenChange={(open) => {
                          setEditOpen(open);
                          if (!open) {
                            setEditingMemberEmail(null);
                            setEditEmail('');
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isChef}
                              onClick={() => {
                                setEditingMemberEmail(m.email);
                                setEditEmail(m.email);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Modifier le membre</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Email actuel</Label>
                                <Input value={editingMemberEmail || ''} readOnly />
                              </div>
                              <div className="space-y-2">
                                <Label>Nouvel email</Label>
                                <Input
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  placeholder="nouveau@exemple.com"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
                                <Button onClick={handleEdit} disabled={updateMutation.isPending}>Enregistrer</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={isChef}
                          onClick={() => handleDelete(m.email)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Bannir
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedProject && memberStats.length > 0 && (
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-medium">Performance des membres</h2>
            </div>
            <div className="divide-y">
              {memberStats.map((stat) => (
                <div key={stat.email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium">{stat.name}</p>
                    <p className="text-xs text-muted-foreground">{stat.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">Tâches: {stat.total}</Badge>
                    <Badge variant="outline">Terminées: {stat.completed}</Badge>
                    <Badge variant="outline">Retard: {stat.late}</Badge>
                    <Badge variant="outline">Progression: {stat.avgProgress}%</Badge>
                  </div>
                  <div className="w-full sm:w-[360px] space-y-2 text-xs">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Taux de completion</span>
                        <span className="font-medium">{stat.completionRate}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-success"
                          style={{ width: `${clampPercent(stat.completionRate)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Taux de retard</span>
                        <span className="font-medium">{stat.lateRate}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-destructive"
                          style={{ width: `${clampPercent(stat.lateRate)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Progression moyenne</span>
                        <span className="font-medium">{stat.avgProgress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${clampPercent(stat.avgProgress)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
