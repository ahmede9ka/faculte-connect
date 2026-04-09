import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, Trash2, Eye, FolderKanban, CalendarDays } from 'lucide-react';

interface OrgUser {
  id: string;
  name: string;
  email: string;
  organizationType?: string;
  responsableNom?: string;
  responsableEmail?: string;
  sponsors?: string[];
}

async function fetchAllOrganizations(): Promise<OrgUser[]> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch('/auth/users?role=ORGANISATION', { headers });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    return Array.isArray(data) ? data.map((u: Record<string, unknown>) => ({
      id: String(u.id ?? ''),
      name: String(u.name ?? u.email ?? ''),
      email: String(u.email ?? ''),
      organizationType: String(u.organizationType ?? ''),
      responsableNom: String(u.responsableNom ?? ''),
      responsableEmail: String(u.responsableEmail ?? ''),
      sponsors: Array.isArray(u.sponsors) ? u.sponsors.map(String) : [],
    })) : [];
  } catch {
    return [];
  }
}

export default function AdminOrganizationsPage() {
  const [search, setSearch] = useState('');

  const { data: orgs = [], isLoading } = useQuery<OrgUser[]>({
    queryKey: ['admin-organizations'],
    queryFn: fetchAllOrganizations,
  });

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase()) ||
    (o.organizationType ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const typeColor = (type?: string) => {
    if (type === 'Club') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (type === 'Association') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (type === 'Département') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    return '';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Gestion des Organisations</h1>
              <p className="text-sm text-muted-foreground">{orgs.length} organisations inscrites</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total organisations', value: orgs.length, color: 'text-secondary' },
            { label: 'Clubs', value: orgs.filter(o => o.organizationType === 'Club').length, color: 'text-blue-600' },
            { label: 'Associations', value: orgs.filter(o => o.organizationType === 'Association').length, color: 'text-emerald-600' },
            { label: 'Départements', value: orgs.filter(o => o.organizationType === 'Département').length, color: 'text-purple-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-xl border p-4 text-center">
              <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Cards grid */}
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement des organisations...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Aucune organisation trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(o => (
              <div key={o.id} className="bg-card rounded-xl border p-5 hover:shadow-elevated transition-shadow space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.email}</p>
                    </div>
                  </div>
                  {o.organizationType && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${typeColor(o.organizationType)}`}>
                      {o.organizationType}
                    </span>
                  )}
                </div>

                {o.responsableNom && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Responsable:</span> {o.responsableNom}
                    {o.responsableEmail && <span className="ml-1">({o.responsableEmail})</span>}
                  </div>
                )}

                {(o.sponsors ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {o.sponsors!.slice(0, 3).map(s => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                    {o.sponsors!.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{o.sponsors!.length - 3}</Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t">
                  <Button variant="ghost" size="sm" className="gap-1 flex-1 text-xs">
                    <FolderKanban className="h-3.5 w-3.5" /> Projets
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 flex-1 text-xs">
                    <CalendarDays className="h-3.5 w-3.5" /> Événements
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive text-xs">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
