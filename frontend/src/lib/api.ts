import type { Event, Notification, Project, ProjectMember, Recommendation, Task, User } from "./types";

const storage = {
  token: "auth_token",
  email: "auth_email",
} as const;

type ProjetRaw = {
  id?: unknown;
  titre?: unknown;
  desc?: unknown;
  chefProjet?: unknown;
  organisation?: unknown;
  deadline?: unknown;
  status?: unknown;
  progression?: unknown;
  membres?: unknown;
  ressources?: unknown;
};

type RessourceRaw = {
  nom?: unknown;
  valeur?: unknown;
};

type TacheRaw = {
  id?: unknown;
  titre?: unknown;
  description?: unknown;
  echeance?: unknown;
  status?: unknown;
  progression?: unknown;
};

type UserRaw = {
  id?: unknown;
  email?: unknown;
  name?: unknown;
  role?: unknown;
  faculte?: unknown;
  specialite?: unknown;
  idUniversitaire?: unknown;
  competences?: unknown;
  avatar?: unknown;
};

function getAuthToken() {
  return localStorage.getItem(storage.token);
}

function getAuthEmail() {
  return localStorage.getItem(storage.email) || "";
}

function asString(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

function asNumber(v: unknown): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function apiJson<T>(input: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(input, {
    ...init,
    headers,
  });

  if (!res.ok) {
    // For some screens we prefer "empty" over failing the whole UI.
    throw new Error(`${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

function mapProjectStatus(status: string | undefined): Project["statut"] {
  switch ((status || "").toUpperCase()) {
    case "EN_ATTENTE":
      return "Planifié";
    case "EN_COURS":
      return "En cours";
    case "TERMINE":
      return "Terminé";
    case "ANNULE":
      return "Planifié";
    default:
      return "Planifié";
  }
}

function mapTaskStatus(status: string | undefined): Task["statut"] {
  switch ((status || "").toUpperCase()) {
    case "EN_ATTENTE":
      return "Non commencée";
    case "EN_COURS":
      return "En cours";
    case "TERMINE":
      return "Terminée";
    case "ANNULE":
      return "Non commencée";
    default:
      return "Non commencée";
  }
}

function mapProject(p: ProjetRaw): Project {
  const emails: string[] = Array.isArray(p.membres) ? (p.membres as unknown[]).map(asString) : [];
  const chefEmail: string = asString(p.chefProjet);

  return {
    id: asString(p.id),
    titre: asString(p.titre),
    description: asString(p.desc),
    categorie: asString(p.organisation),
    dateDebut: "", // not present in current backend entity shape
    dateFin: p.deadline ? asString(p.deadline) : "",
    chefDeProjet: chefEmail,
    chefDeProjetNom: chefEmail,
    statut: mapProjectStatus(asString(p.status)),
    progression: asNumber(p.progression),
    membres: emails.map((email) => ({
      id: email,
      userId: email,
      nom: email,
      email,
      role: email === chefEmail ? "Chef" : "Membre actif",
    })),
    ressources: (
      Array.isArray(p.ressources) ? (p.ressources as unknown[]).map((r) => r as RessourceRaw) : []
    ).map((r) => ({
      nom: asString(r.nom),
      lien: asString(r.valeur),
    })),
  };
}

function mapTask(t: TacheRaw, projectId: string, assigneeEmail: string): Task {
  return {
    id: asString(t.id),
    titre: asString(t.titre),
    description: asString(t.description),
    assigneA: assigneeEmail,
    assigneNom: assigneeEmail,
    dateDebut: "",
    deadline: t.echeance ? asString(t.echeance) : "",
    priorite: "Low",
    statut: mapTaskStatus(asString(t.status)),
    projectId,
  };
}

export const fetchCurrentUser = async (): Promise<User | null> => {
  const email = getAuthEmail();
  if (!email) return null;

  try {
    const u = await apiJson<UserRaw>(`/auth/users/${encodeURIComponent(email)}`);
    const name = asString(u.name || u.email);
    const parts = String(name).trim().split(/\s+/);
    const prenom = parts.length > 1 ? parts[0] : name;
    const nom = parts.length > 1 ? parts.slice(1).join(" ") : "";

    return {
      id: asString(u.id),
      prenom,
      nom,
      email: asString(u.email) || email,
      role: ((): User["role"] => {
        const r = asString(u.role).toUpperCase();
        if (r === "ORGANISATION") return "organization";
        if (r === "ADMIN") return "admin";
        return "student";
      })(),
      avatar: asString(u.avatar),
      faculte: asString(u.faculte),
      specialite: asString(u.specialite),
      competences: Array.isArray(u.competences) ? (u.competences as unknown[]).map(asString) : [],
      idUniversitaire: asString(u.idUniversitaire),
    };
  } catch {
    return null;
  }
};

export const updateUserProfile = async (profileData: {
  name?: string;
  faculte?: string;
  specialite?: string;
  idUniversitaire?: string;
  competences?: string[];
  avatar?: string;
}): Promise<User> => {
  const email = getAuthEmail();
  if (!email) throw new Error("Not authenticated");

  const u = await apiJson<UserRaw>(`/auth/users/${encodeURIComponent(email)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });

  const name = asString(u.name || u.email);
  const parts = String(name).trim().split(/\s+/);
  const prenom = parts.length > 1 ? parts[0] : name;
  const nom = parts.length > 1 ? parts.slice(1).join(" ") : "";

  return {
    id: asString(u.id),
    prenom,
    nom,
    email: asString(u.email) || email,
    role: ((): User["role"] => {
      const r = asString(u.role).toUpperCase();
      if (r === "ORGANISATION") return "organization";
      if (r === "ADMIN") return "admin";
      return "student";
    })(),
    avatar: asString(u.avatar),
    faculte: asString(u.faculte),
    specialite: asString(u.specialite),
    competences: Array.isArray(u.competences) ? (u.competences as unknown[]).map(asString) : [],
    idUniversitaire: asString(u.idUniversitaire),
  };
};

export const fetchMembers = async (): Promise<ProjectMember[]> => {
  // Not implemented in current Spring services.
  return [];
};

export const fetchProjects = async (): Promise<Project[]> => {
  const projectsRaw = await apiJson<ProjetRaw[]>(`/projets`);
  return projectsRaw.map(mapProject);
};

export const fetchProject = async (id: string): Promise<Project> => {
  const p = await apiJson<ProjetRaw>(`/projets/${encodeURIComponent(id)}`);
  return mapProject(p);
};

export const createProject = async (projectData: {
  titre: string;
  desc: string;
  chefProjet: string;
  organisation: string;
  deadline: string;
  validite: boolean;
}): Promise<Project> => {
  const projetRaw = await apiJson<ProjetRaw>(`/projets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(projectData),
  });
  return mapProject(projetRaw);
};

export const fetchTasks = async (): Promise<Task[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  const projectsRaw = await apiJson<ProjetRaw[]>(`/projets`);
  const projectIds = projectsRaw.map((p) => asString(p.id)).filter(Boolean);

  const tasksNested = await Promise.all(
    projectIds.map(async (projectId) => {
      try {
        const tasksRaw = await apiJson<TacheRaw[]>(
          `/projets/${encodeURIComponent(projectId)}/taches/membre/${encodeURIComponent(email)}`
        );
        return tasksRaw.map((t) => mapTask(t, projectId, email));
      } catch {
        return [];
      }
    })
  );

  return tasksNested.flat();
};

export const fetchTask = async (id: string): Promise<Task | undefined> => {
  const tasks = await fetchTasks();
  return tasks.find((t) => t.id === id);
};

// ==================== EVENT ENDPOINTS ====================

type EventRaw = {
  id?: unknown;
  titre?: unknown;
  description?: unknown;
  type?: unknown;
  organisateur?: unknown;
  dateHeure?: unknown;
  lieu?: unknown;
  nombrePlaces?: unknown;
  placesRestantes?: unknown;
  participants?: unknown;
  partenaires?: unknown;
  affiche?: unknown;
};

function mapEvent(e: EventRaw): Event {
  return {
    id: asString(e.id),
    titre: asString(e.titre),
    description: asString(e.description),
    type: asString(e.type),
    lieu: asString(e.lieu),
    dateHeure: asString(e.dateHeure),
    nombrePlaces: asNumber(e.nombrePlaces),
    placesRestantes: asNumber(e.placesRestantes),
    affiche: asString(e.affiche),
    organisateur: asString(e.organisateur),
    createurs: [asString(e.organisateur)],
    partenaires: Array.isArray(e.partenaires) ? (e.partenaires as unknown[]).map(asString) : [],
    participants: Array.isArray(e.participants) ? (e.participants as unknown[]).map(asString) : [],
  };
}

export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const eventsRaw = await apiJson<EventRaw[]>(`/events`);
    return eventsRaw.map(mapEvent);
  } catch {
    return [];
  }
};

export const fetchEvent = async (id: string): Promise<Event | null> => {
  try {
    const eventRaw = await apiJson<EventRaw>(`/events/${encodeURIComponent(id)}`);
    return mapEvent(eventRaw);
  } catch {
    return null;
  }
};

export const createEvent = async (eventData: {
  titre: string;
  description: string;
  type: string;
  organisateur: string;
  dateHeure: string;
  lieu: string;
  nombrePlaces: number;
  partenaires?: string[];
  affiche?: string;
}): Promise<Event> => {
  const eventRaw = await apiJson<EventRaw>(`/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  return mapEvent(eventRaw);
};

export const updateEvent = async (
  id: string,
  eventData: {
    titre: string;
    description: string;
    type: string;
    organisateur: string;
    dateHeure: string;
    lieu: string;
    nombrePlaces: number;
    partenaires?: string[];
    affiche?: string;
  }
): Promise<Event> => {
  const eventRaw = await apiJson<EventRaw>(`/events/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  return mapEvent(eventRaw);
};

export const deleteEvent = async (id: string): Promise<void> => {
  await apiJson<void>(`/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

export const participateInEvent = async (id: string, email: string): Promise<Event> => {
  const eventRaw = await apiJson<EventRaw>(`/events/${encodeURIComponent(id)}/participate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return mapEvent(eventRaw);
};

export const cancelEventParticipation = async (id: string, email: string): Promise<Event> => {
  const eventRaw = await apiJson<EventRaw>(
    `/events/${encodeURIComponent(id)}/participate/${encodeURIComponent(email)}`,
    {
      method: "DELETE",
    }
  );
  return mapEvent(eventRaw);
};

export const fetchMyEventParticipations = async (): Promise<Event[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  try {
    const eventsRaw = await apiJson<EventRaw[]>(`/events/participations/${encodeURIComponent(email)}`);
    return eventsRaw.map(mapEvent);
  } catch {
    return [];
  }
};

export const fetchEventsByOrganizer = async (): Promise<Event[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  try {
    const eventsRaw = await apiJson<EventRaw[]>(`/events/organisateur/${encodeURIComponent(email)}`);
    return eventsRaw.map(mapEvent);
  } catch {
    return [];
  }
};

// ==================== NOTIFICATION ENDPOINTS ====================

type NotificationRaw = {
  id?: unknown;
  userId?: unknown;
  titre?: unknown;
  message?: unknown;
  type?: unknown;
  timestamp?: unknown;
  lu?: unknown;
  relatedEntityType?: unknown;
  relatedEntityId?: unknown;
};

function mapNotification(n: NotificationRaw): Notification {
  const typeMap: Record<string, Notification["type"]> = {
    INFO: "system",
    SUCCESS: "system",
    WARNING: "system",
    ERROR: "system",
    PROJECT: "project",
    EVENT: "event",
    TASK: "task",
  };

  return {
    id: asString(n.id),
    type: typeMap[asString(n.relatedEntityType || n.type)] || "system",
    titre: asString(n.titre),
    message: asString(n.message),
    date: asString(n.timestamp),
    lu: Boolean(n.lu),
  };
}

export const fetchNotifications = async (): Promise<Notification[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  try {
    const notificationsRaw = await apiJson<NotificationRaw[]>(
      `/notifications/user/${encodeURIComponent(email)}`
    );
    return notificationsRaw.map(mapNotification);
  } catch {
    return [];
  }
};

export const fetchUnreadNotifications = async (): Promise<Notification[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  try {
    const notificationsRaw = await apiJson<NotificationRaw[]>(
      `/notifications/user/${encodeURIComponent(email)}/unread`
    );
    return notificationsRaw.map(mapNotification);
  } catch {
    return [];
  }
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const email = getAuthEmail();
  if (!email) return 0;

  try {
    const result = await apiJson<{ count: number }>(
      `/notifications/user/${encodeURIComponent(email)}/unread/count`
    );
    return result.count || 0;
  } catch {
    return 0;
  }
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await apiJson<NotificationRaw>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const email = getAuthEmail();
  if (!email) return;

  await apiJson<void>(`/notifications/user/${encodeURIComponent(email)}/read-all`, {
    method: "PATCH",
  });
};

export const deleteNotification = async (id: string): Promise<void> => {
  await apiJson<void>(`/notifications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

export const createNotification = async (notificationData: {
  userId: string;
  titre: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  relatedEntityType?: string;
  relatedEntityId?: string;
}): Promise<Notification> => {
  const notificationRaw = await apiJson<NotificationRaw>(`/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notificationData),
  });
  return mapNotification(notificationRaw);
};

// ==================== RECOMMENDATION ENDPOINTS ====================

type RecommendationRaw = {
  id?: unknown;
  userId?: unknown;
  projetId?: unknown;
  titre?: unknown;
  categorie?: unknown;
  competenceMatch?: unknown;
  dateRecommendation?: unknown;
  competencesMatched?: unknown;
};

function mapRecommendation(r: RecommendationRaw): Recommendation {
  return {
    id: asString(r.id),
    projetId: asString(r.projetId),
    titre: asString(r.titre),
    categorie: asString(r.categorie),
    competenceMatch: asNumber(r.competenceMatch),
    competences: Array.isArray(r.competencesMatched)
      ? (r.competencesMatched as unknown[]).map(asString)
      : [],
  };
}

export const fetchRecommendations = async (): Promise<Recommendation[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  try {
    const recommendationsRaw = await apiJson<RecommendationRaw[]>(
      `/recommendations/user/${encodeURIComponent(email)}`
    );
    return recommendationsRaw.map(mapRecommendation);
  } catch {
    return [];
  }
};

export const refreshRecommendations = async (): Promise<Recommendation[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  try {
    const recommendationsRaw = await apiJson<RecommendationRaw[]>(
      `/recommendations/user/${encodeURIComponent(email)}/refresh`,
      {
        method: "POST",
      }
    );
    return recommendationsRaw.map(mapRecommendation);
  } catch {
    return [];
  }
};

export const deleteRecommendation = async (id: string): Promise<void> => {
  await apiJson<void>(`/recommendations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

// ==================== LIST ENDPOINTS ====================

export const fetchCompetences = async (): Promise<string[]> => {
  try {
    return await apiJson<string[]>(`/lists/competences`);
  } catch {
    return [];
  }
};

export const fetchFacultes = async (): Promise<string[]> => {
  try {
    return await apiJson<string[]>(`/lists/facultes`);
  } catch {
    return [];
  }
};
