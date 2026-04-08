import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { fetchMembers } from '@/lib/api';
import { ProjectMember } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, User, Pencil, Trash2 } from 'lucide-react';

export default function MembersPage() {
  const { data: members = [], isLoading } = useQuery<ProjectMember[]>({ queryKey: ['members'], queryFn: fetchMembers });

  if (isLoading) return <DashboardLayout><div className="p-8 text-center text-muted-foreground">Chargement des membres...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Membres</h1>
          <Button className="gap-1 gradient-primary border-0 text-primary-foreground"><Plus className="h-4 w-4" /> Ajouter membre</Button>
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="divide-y">
            {members.map(m => (
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
                    <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
