import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { deleteProject, fetchProjectsByOrganisation, updateProject } from '@/lib/api';
import { Project } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OrgProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState({ titre: '', description: '', deadline: '' });
  const { userName } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', userName],
    queryFn: () => fetchProjectsByOrganisation(userName),
    enabled: Boolean(userName),
  });

  const filtered = projects.filter(p => {
    const matchSearch = p.titre.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateMutation = useMutation({
    mutationFn: ({ project, form }: { project: Project; form: typeof editForm }) =>
      updateProject(project.id, {
        titre: form.titre,
        desc: form.description,
        deadline: form.deadline,
        chefProjet: project.chefDeProjet,
        organisation: project.categorie,
        membres: project.membres.map((member) => member.email),
        ressources: project.ressources.map((r) => ({ nom: r.nom, valeur: r.lien })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet modifié');
      setEditingProject(null);
    },
    onError: () => toast.error('Erreur lors de la modification du projet'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      titre: project.titre,
      description: project.description,
      deadline: project.dateFin,
    });
  };

  const handleDelete = (project: Project) => {
    if (confirm(`Supprimer le projet "${project.titre}" ?`)) {
      deleteMutation.mutate(project.id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-display text-2xl font-bold">Mes Projets</h1>
          <Link to="/projects/create">
            <Button className="gap-1 gradient-primary border-0 text-primary-foreground">
              <Plus className="h-4 w-4" /> Nouveau Projet
            </Button>
          </Link>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un projet..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Planifié">Planifié</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Terminé">Terminé</SelectItem>
              <SelectItem value="En Retard">En Retard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement des projets...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Titre</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Chef de projet</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Progression</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Deadline</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <Link to={`/projects/${p.id}`} className="font-medium text-sm hover:text-primary">{p.titre}</Link>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{p.chefDeProjetNom}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={p.progression} className="w-20" />
                          <span className="text-xs text-muted-foreground">{p.progression}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{p.dateFin}</td>
                      <td className="px-5 py-4"><StatusBadge status={p.statut} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/projects/${p.id}`}>
                            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(p)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Dialog open={Boolean(editingProject)} onOpenChange={(open) => !open && setEditingProject(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Modifier le projet</DialogTitle>
            </DialogHeader>
            {editingProject && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={editForm.titre} onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Input type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingProject(null)}>Annuler</Button>
                  <Button
                    onClick={() => updateMutation.mutate({ project: editingProject, form: editForm })}
                    disabled={updateMutation.isPending || !editForm.titre || !editForm.description || !editForm.deadline}
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
