export type UserRole = 'student' | 'organization' | 'admin';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  avatar?: string;
  faculte?: string;
  specialite?: string;
  competences?: string[];
  idUniversitaire?: string;
  organizationType?: string;
  responsableNom?: string;
  responsableEmail?: string;
  responsableTelephone?: string;
  sponsors?: string[];
  logo?: string;
}

export interface Organization {
  id: string;
  nom: string;
  type: 'Club' | 'Association' | 'Département';
  email?: string;
  responsable: { nom: string; email: string; telephone: string };
  sponsors: Sponsor[];
  logo?: string;
}

export interface Sponsor {
  id: string;
  nom: string;
  logo?: string;
  lien?: string;
}

export interface Project {
  id: string;
  titre: string;
  description: string;
  categorie: string;
  dateDebut: string;
  dateFin: string;
  chefDeProjet: string;
  chefDeProjetNom: string;
  statut: 'Planifié' | 'En cours' | 'Terminé' | 'En Retard';
  visibilite: 'PUBLIC' | 'PRIVE';
  progression: number;
  membres: ProjectMember[];
  ressources: { nom: string; lien: string }[];
  taches?: Task[];
}

export interface ProjectMember {
  id: string;
  userId: string;
  nom: string;
  email: string;
  role: 'Chef' | 'Membre actif' | 'Observateur';
  avatar?: string;
}

export interface Task {
  id: string;
  titre: string;
  description: string;
  assigneA: string;
  assigneNom: string;
  membresEmails?: string[];
  dateDebut: string;
  deadline: string;
  priorite: 'Low' | 'Medium' | 'High';
  statut: 'Non commencée' | 'En cours' | 'Terminée' | 'En retard';
  progression: number;
  commentaire?: string;
  projectId: string;
}

export interface Event {
  id: string;
  titre: string;
  description: string;
  type: string;
  lieu: string;
  dateHeure: string;
  nombrePlaces: number;
  placesRestantes: number;
  affiche?: string;
  createurs: string[];
  partenaires: string[];
  participants: string[];
  organisateur?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  type: 'task' | 'project' | 'event' | 'system';
  titre: string;
  message: string;
  date: string;
  lu: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface Recommendation {
  id: string;
  projetId: string;
  eventId?: string;
  recommendationType: 'PROJECT' | 'EVENT';
  titre: string;
  categorie: string;
  competenceMatch: number;
  explication: string;
  competences: string[];
}
