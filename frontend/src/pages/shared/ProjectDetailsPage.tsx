import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addProjectMember,
  addTask,
  addTaskMembers,
  createNotification,
  removeProjectMember,
  fetchMyProjects,
  fetchProjects,
  fetchProjectsByOrganisation,
  fetchTasks,
} from "@/lib/api";
import { Project, Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { userRole, userName, userEmail } = useAuth();
  const queryClient = useQueryClient();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskMembers, setTaskMembers] = useState("");
  const [taskPriority, setTaskPriority] = useState<Task["priorite"]>("Medium");
  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null);
  const [assignEmails, setAssignEmails] = useState("");
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<
    Project[]
  >({
    queryKey: ["projects", "details", userRole, userName],
    queryFn: () => {
      if (userRole === "organization")
        return fetchProjectsByOrganisation(userName);
      if (userRole === "student") return fetchMyProjects();
      return fetchProjects();
    },
    enabled: userRole !== "organization" || Boolean(userName),
  });
  const { data: tasksData = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  const project = projects.find((p) => p.id === id);
  const tasks =
    userRole === "organization" || userRole === "admin"
      ? (project?.taches ?? [])
      : tasksData.filter((t) => t.projectId === project?.id);

  const addTaskMutation = useMutation({
    mutationFn: (payload: {
      projetId: string;
      titre: string;
      description: string;
      echeance?: string;
      priorite?: Task["priorite"];
      membresEmails: string[];
    }) =>
      addTask(payload.projetId, {
        titre: payload.titre,
        description: payload.description,
        echeance: payload.echeance,
        priorite: payload.priorite,
        membresEmails: payload.membresEmails,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({
        queryKey: ["projects", "details", userRole, userName],
      });
      toast.success("Tache ajoutee");
      setTaskTitle("");
      setTaskDescription("");
      setTaskDeadline("");
      setTaskMembers("");
      setTaskPriority("Medium");
      setAddOpen(false);
    },
    onError: () => toast.error("Impossible d'ajouter la tache"),
  });

  const assignMutation = useMutation({
    mutationFn: ({
      projetId,
      tacheId,
      emails,
    }: {
      projetId: string;
      tacheId: string;
      emails: string[];
    }) => addTaskMembers(projetId, tacheId, emails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Membres assignes");
      setAssignEmails("");
      setAssignTaskId(null);
      setAssignOpen(false);
    },
    onError: () => toast.error("Impossible d'assigner les membres"),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ projetId, email }: { projetId: string; email: string }) =>
      addProjectMember(projetId, email),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", "details", userRole, userName],
      });
      if (project?.id) {
        createNotification({
          userId: variables.email,
          titre: "Ajoute a un projet",
          message: `Vous avez ete ajoute au projet "${project.titre}".`,
          type: "INFO",
          relatedEntityType: "PROJECT",
          relatedEntityId: project.id,
        }).catch(() => {
          // notification failure should not block member addition
        });
      }
      toast.success("Membre ajoute");
      setMemberEmail("");
      setMemberOpen(false);
    },
    onError: () => toast.error("Impossible d'ajouter le membre"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ projetId, email }: { projetId: string; email: string }) =>
      removeProjectMember(projetId, email),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", "details", userRole, userName],
      });
      if (project?.id) {
        createNotification({
          userId: variables.email,
          titre: "Retire d'un projet",
          message: `Vous avez ete retire du projet "${project.titre}".`,
          type: "WARNING",
          relatedEntityType: "PROJECT",
          relatedEntityId: project.id,
        }).catch(() => {
          // notification failure should not block member removal
        });
      }
      toast.success("Membre supprime");
    },
    onError: () => toast.error("Impossible de supprimer le membre"),
  });

  if (isLoadingProjects)
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">
          Chargement du projet...
        </div>
      </DashboardLayout>
    );
  if (!project)
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-destructive">
          Projet non trouvé
        </div>
      </DashboardLayout>
    );

  const isLate = project.statut === "En Retard";
  const deadlineDate = new Date(project.dateFin);
  const daysLeft = Math.ceil(
    (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const handleAddTask = () => {
    if (!project?.id) return;
    if (!taskTitle.trim() || !taskDescription.trim()) {
      toast.error("Titre et description requis");
      return;
    }
    const emails = taskMembers
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (userRole === "student" && userEmail && !emails.includes(userEmail)) {
      emails.push(userEmail);
    }
    addTaskMutation.mutate({
      projetId: project.id,
      titre: taskTitle.trim(),
      description: taskDescription.trim(),
      echeance: taskDeadline || undefined,
      priorite: taskPriority,
      membresEmails: emails,
    });
  };

  const handleAssignMembers = () => {
    if (!project?.id || !assignTaskId) return;
    const emails = assignEmails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) {
      toast.error("Ajoutez au moins un email");
      return;
    }
    if (userRole === "student" && userEmail && !emails.includes(userEmail)) {
      emails.push(userEmail);
    }
    assignMutation.mutate({
      projetId: project.id,
      tacheId: assignTaskId,
      emails,
    });
  };

  const handleAddMember = () => {
    if (!project?.id) return;
    const email = memberEmail.trim();
    if (!email) {
      toast.error("Email requis");
      return;
    }
    addMemberMutation.mutate({ projetId: project.id, email });
  };

  const handleRemoveMember = (email: string) => {
    if (!project?.id) return;
    if (!email) {
      toast.error("Email requis");
      return;
    }
    removeMemberMutation.mutate({ projetId: project.id, email });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link
              to="/projects"
              className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
            >
              ← Retour aux projets
            </Link>
            <h1 className="font-display text-2xl font-bold">{project.titre}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={project.statut} />
              <span className="text-sm text-muted-foreground">
                {project.categorie}
              </span>
            </div>
          </div>
          <Button variant="outline">Modifier</Button>
        </div>

        {/* Deadline Alert */}
        {(isLate || (daysLeft <= 7 && daysLeft > 0)) && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 ${isLate ? "bg-destructive/10 border border-destructive/20" : "bg-warning/10 border border-warning/20"}`}
          >
            <AlertTriangle
              className={`h-5 w-5 ${isLate ? "text-destructive" : "text-warning"}`}
            />
            <span className="text-sm font-medium">
              {isLate
                ? "Ce projet est en retard !"
                : `Deadline dans ${daysLeft} jours`}
            </span>
          </div>
        )}

        {/* Progress */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Progression globale</span>
            <span className="text-lg font-display font-bold">
              {project.progression}%
            </span>
          </div>
          <ProgressBar value={project.progression} size="md" />
        </div>

        <Tabs defaultValue="apercu">
          <TabsList>
            <TabsTrigger value="apercu">Aperçu</TabsTrigger>
            <TabsTrigger value="taches">Tâches ({tasks.length})</TabsTrigger>
            <TabsTrigger value="membres">
              Membres ({project.membres.length})
            </TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="apercu" className="space-y-4 mt-4">
            <div className="bg-card rounded-xl border p-5 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </h3>
                <p className="text-sm">{project.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Chef: <strong>{project.chefDeProjetNom}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {project.dateDebut} → {project.dateFin}
                  </span>
                </div>
              </div>
              {project.ressources.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Ressources
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.ressources.map((r, i) => (
                      <a
                        key={i}
                        href={r.lien}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-sm hover:bg-muted/80"
                      >
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
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Ajouter une tâche
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter une tâche</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          placeholder="Titre de la tache"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          placeholder="Description de la tache"
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Deadline</Label>
                        <Input
                          type="date"
                          value={taskDeadline}
                          onChange={(e) => setTaskDeadline(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Priorite</Label>
                        <Select
                          value={taskPriority}
                          onValueChange={(value) =>
                            setTaskPriority(value as Task["priorite"])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir une priorite" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Membres (emails separes par des virgules)</Label>
                        <Input
                          value={taskMembers}
                          onChange={(e) => setTaskMembers(e.target.value)}
                          placeholder="m1@exemple.com, m2@exemple.com"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setAddOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleAddTask}
                          disabled={addTaskMutation.isPending}
                        >
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                      Titre
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                      Assigné à
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                      Deadline
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                      Priorité
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                      Progression
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">
                      Statut
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-5 py-3 text-sm font-medium">
                        {t.titre}
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {t.assigneNom}
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground">
                        {t.deadline}
                      </td>
                      <td className="px-5 py-3">
                        <PriorityBadge priority={t.priorite} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar
                            value={t.progression ?? 0}
                            className="w-24"
                          />
                          <span className="text-xs text-muted-foreground">
                            {t.progression ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={t.statut} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Dialog
                          open={assignOpen && assignTaskId === t.id}
                          onOpenChange={(open) => {
                            setAssignOpen(open);
                            if (!open) {
                              setAssignTaskId(null);
                              setAssignEmails("");
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAssignTaskId(t.id);
                                setAssignEmails("");
                              }}
                            >
                              Assigner
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assigner des membres</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Emails (separes par des virgules)</Label>
                                <Input
                                  value={assignEmails}
                                  onChange={(e) =>
                                    setAssignEmails(e.target.value)
                                  }
                                  placeholder="m1@exemple.com, m2@exemple.com"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setAssignOpen(false)}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  onClick={handleAssignMembers}
                                  disabled={assignMutation.isPending}
                                >
                                  Assigner
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
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
                <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-3.5 w-3.5" /> Ajouter un membre
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un membre</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={memberEmail}
                          onChange={(e) => setMemberEmail(e.target.value)}
                          placeholder="membre@exemple.com"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setMemberOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleAddMember}
                          disabled={addMemberMutation.isPending}
                        >
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="divide-y">
                {project.membres.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={m.role} />
                      {(userRole === "organization" ||
                        userRole === "admin") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleRemoveMember(m.email)}
                          disabled={removeMemberMutation.isPending}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="historique" className="mt-4">
            <div className="bg-card rounded-xl border p-5">
              <div className="space-y-4">
                {[
                  { date: "2025-03-15", action: 'Statut changé à "En cours"' },
                  {
                    date: "2025-03-10",
                    action: 'Tâche "Backend API" assignée à Sara',
                  },
                  {
                    date: "2025-03-05",
                    action: "Membre Ines ajoutée comme Observateur",
                  },
                  { date: "2025-02-28", action: "Projet créé" },
                ].map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-sm">{h.action}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {h.date}
                      </p>
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
