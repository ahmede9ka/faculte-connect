import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { fetchMyProjects, fetchProjects, fetchProjectsByOrganisation } from '@/lib/api';
import { Project } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';

export default function ProjectsListPage() {
  const { userRole, userName } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', 'list', userRole, userName],
    queryFn: () => {
      if (userRole === 'organization') return fetchProjectsByOrganisation(userName);
      if (userRole === 'student') return fetchMyProjects();
      return fetchProjects();
    },
    enabled: userRole !== 'organization' || Boolean(userName),
  });

  const filtered = projects.filter(p => {
    const matchSearch = p.titre.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.statut === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-display text-2xl font-bold">Projets</h1>
          {userRole === 'organization' && (
            <Link to="/projects/create">
              <Button className="gap-1 gradient-primary border-0 text-primary-foreground"><Plus className="h-4 w-4" /> Nouveau Projet</Button>
            </Link>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
                      <td className="px-5 py-4"><Link to={`/projects/${p.id}`} className="font-medium text-sm hover:text-primary">{p.titre}</Link></td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{p.chefDeProjetNom}</td>
                      <td className="px-5 py-4"><div className="flex items-center gap-2"><ProgressBar value={p.progression} className="w-20" /><span className="text-xs text-muted-foreground">{p.progression}%</span></div></td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{p.dateFin}</td>
                      <td className="px-5 py-4"><StatusBadge status={p.statut} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/projects/${p.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link>
                          <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
