import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import {
  fetchMyProjects,
  fetchTasks,
  fetchEvents,
  fetchRecommendations,
} from "@/lib/api";
import { Project, Task, Event, Recommendation } from "@/lib/types";
import {
  FolderKanban,
  ListTodo,
  CalendarDays,
  Lightbulb,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentDashboardPage() {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects", "mine"],
    queryFn: fetchMyProjects,
  });
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["tasks", "mine"],
    queryFn: fetchTasks,
  });
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });
  const { data: recommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
  });

  const myProjects = projects;
  const myTasks = tasks;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Dashboard Étudiant</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Mes Projets"
            value={myProjects.length}
            icon={<FolderKanban className="h-5 w-5" />}
            variant="primary"
          />
          <StatCard
            title="Tâches en cours"
            value={myTasks.filter((t) => t.statut === "En cours").length}
            icon={<ListTodo className="h-5 w-5" />}
            variant="warning"
          />
          <StatCard
            title="Événements"
            value={events.length}
            icon={<CalendarDays className="h-5 w-5" />}
            variant="success"
          />
          <StatCard
            title="Recommandations"
            value={recommendations.length}
            icon={<Lightbulb className="h-5 w-5" />}
          />
        </div>

        {/* Projects */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Mes Projets</h2>
            <Link to="/projects">
              <Button variant="ghost" size="sm" className="gap-1">
                Voir tout <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {myProjects.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.titre}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={p.statut} />
                    <span className="text-xs text-muted-foreground">
                      {p.progression}%
                    </span>
                  </div>
                </div>
                <div className="w-24 ml-4">
                  <ProgressBar value={p.progression} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks */}
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-display font-semibold text-lg mb-4">
              Tâches assignées
            </h2>
            <div className="space-y-3">
              {myTasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-sm">{t.titre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {t.deadline}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={t.statut} />
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">
                Recommandations
              </h2>
              <Link to="/recommendations">
                <Button variant="ghost" size="sm" className="gap-1">
                  Voir tout <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recommendations.map((r) => {
                const isEvent = r.recommendationType === "EVENT";
                const target = isEvent ? "/events" : `/projects/${r.projetId}`;
                const label = isEvent ? "Événement" : "Projet";

                return (
                  <Link
                    key={r.id}
                    to={target}
                    className="block p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{r.titre}</p>
                      <span className="text-sm font-semibold text-primary">
                        {r.competenceMatch}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {label} · {r.categorie}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">
              Événements à venir
            </h2>
            <Link to="/events">
              <Button variant="ghost" size="sm" className="gap-1">
                Voir tout <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.slice(0, 2).map((e) => (
              <div key={e.id} className="p-4 rounded-lg border bg-muted/20">
                <h3 className="font-medium">{e.titre}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {e.lieu} · {new Date(e.dateHeure).toLocaleDateString("fr-FR")}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {e.placesRestantes} places restantes
                  </span>
                  <Button size="sm" variant="outline">
                    Participer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
