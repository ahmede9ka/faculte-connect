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
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
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
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
