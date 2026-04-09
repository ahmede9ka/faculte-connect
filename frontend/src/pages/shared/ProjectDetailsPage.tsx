import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { useQuery } from '@tanstack/react-query';
import { fetchProjects, fetchTasks, fetchMembers } from '@/lib/api';
import { Project, Task, ProjectMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, User, Calendar, FileText, AlertTriangle, Clock } from 'lucide-react';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({ queryKey: ['projects'], queryFn: fetchProjects });
  const { data: tasksData = [], isLoading: isLoadingTasks } = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: fetchTasks });

  const project = projects.find(p => p.id === id);
  const tasks = tasksData.filter(t => t.projectId === project?.id);

  if (isLoadingProjects) return <DashboardLayout><div className="p-8 text-center text-muted-foreground">Chargement du projet...</div></DashboardLayout>;
  if (!project) return <DashboardLayout><div className="p-8 text-center text-destructive">Projet non trouvé</div></DashboardLayout>;

  const isLate = project.statut === 'En Retard';
  const deadlineDate = new Date(project.dateFin);
  const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">← Retour aux projets</Link>
            <h1 className="font-display text-2xl font-bold">{project.titre}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={project.statut} />
              <span className="text-sm text-muted-foreground">{project.categorie}</span>
            </div>
          </div>
          <Button variant="outline">Modifier</Button>
        </div>

        {/* Deadline Alert */}
        {(isLate || (daysLeft <= 7 && daysLeft > 0)) && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${isLate ? 'bg-destructive/10 border border-destructive/20' : 'bg-warning/10 border border-warning/20'}`}>
            <AlertTriangle className={`h-5 w-5 ${isLate ? 'text-destructive' : 'text-warning'}`} />
            <span className="text-sm font-medium">
              {isLate ? 'Ce projet est en retard !' : `Deadline dans ${daysLeft} jours`}
            </span>
          </div>
        )}

        {/* Progress */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Progression globale</span>
            <span className="text-lg font-display font-bold">{project.progression}%</span>
          </div>
          <ProgressBar value={project.progression} size="md" />
        </div>

        <Tabs defaultValue="apercu">
          <TabsList>
            <TabsTrigger value="apercu">Aperçu</TabsTrigger>
            <TabsTrigger value="taches">Tâches ({tasks.length})</TabsTrigger>
            <TabsTrigger value="membres">Membres ({project.membres.length})</TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="apercu" className="space-y-4 mt-4">
            <div className="bg-card rounded-xl border p-5 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                <p className="text-sm">{project.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Chef: <strong>{project.chefDeProjetNom}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{project.dateDebut} → {project.dateFin}</span>
                </div>
              </div>
              {project.ressources.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Ressources</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.ressources.map((r, i) => (
                      <a key={i} href={r.lien} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-sm hover:bg-muted/80">
                        <FileText className="h-3.5 w-3.5" /> {r.nom}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="taches" className="mt-4">
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-medium">Tâches</h3>
                <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Ajouter une tâche</Button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Titre</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Assigné à</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Deadline</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Priorité</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-5 py-3 text-sm font-medium">{t.titre}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{t.assigneNom}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">{t.deadline}</td>
                      <td className="px-5 py-3"><PriorityBadge priority={t.priorite} /></td>
                      <td className="px-5 py-3"><StatusBadge status={t.statut} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="membres" className="mt-4">
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-medium">Membres</h3>
                <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Ajouter un membre</Button>
              </div>
              <div className="divide-y">
                {project.membres.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.nom}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                    <StatusBadge status={m.role} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="historique" className="mt-4">
            <div className="bg-card rounded-xl border p-5">
              <div className="space-y-4">
                {[
                  { date: '2025-03-15', action: 'Statut changé à "En cours"' },
                  { date: '2025-03-10', action: 'Tâche "Backend API" assignée à Sara' },
                  { date: '2025-03-05', action: 'Membre Ines ajoutée comme Observateur' },
                  { date: '2025-02-28', action: 'Projet créé' },
                ].map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-sm">{h.action}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {h.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
