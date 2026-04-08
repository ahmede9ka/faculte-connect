import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentUser, updateUserProfile, fetchCompetences, fetchFacultes } from '@/lib/api';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser
  });

  const { data: competencesList = [] } = useQuery<string[]>({
    queryKey: ['competences'],
    queryFn: fetchCompetences
  });

  const { data: facultesList = [] } = useQuery<string[]>({
    queryKey: ['facultes'],
    queryFn: fetchFacultes
  });

  const [name, setName] = useState('');
  const [faculte, setFaculte] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [idUniversitaire, setIdUniversitaire] = useState('');
  const [competences, setCompetences] = useState<string[]>([]);
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(`${currentUser.prenom} ${currentUser.nom}`.trim());
      setFaculte(currentUser.faculte || '');
      setSpecialite(currentUser.specialite || '');
      setIdUniversitaire(currentUser.idUniversitaire || '');
      setCompetences(currentUser.competences || []);
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  const updateMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Profil mis à jour avec succès');
      navigate('/profile');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du profil');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      faculte,
      specialite,
      idUniversitaire,
      competences,
      avatar,
    });
  };

  const addCompetence = (c: string) => {
    if (!competences.includes(c)) {
      setCompetences([...competences, c]);
    }
  };

  const removeCompetence = (c: string) => {
    setCompetences(competences.filter(x => x !== c));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">Chargement du profil...</div>
      </DashboardLayout>
    );
  }

  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-destructive">Erreur: Utilisateur non trouvé</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Modifier mon profil</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mettez à jour vos informations personnelles
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border p-6">
          <div className="space-y-2">
            <Label>Nom complet</Label>
            <Input
              placeholder="Prénom Nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {currentUser.role === 'student' && (
            <>
              <div className="space-y-2">
                <Label>Faculté</Label>
                <Select value={faculte} onValueChange={setFaculte}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>
                    {facultesList.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Spécialité</Label>
                <Input
                  placeholder="Informatique, Mathématiques..."
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>ID universitaire</Label>
                <Input
                  placeholder="FST2024001"
                  value={idUniversitaire}
                  onChange={(e) => setIdUniversitaire(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Compétences</Label>
                <Select onValueChange={addCompetence}>
                  <SelectTrigger><SelectValue placeholder="Ajouter des compétences..." /></SelectTrigger>
                  <SelectContent>
                    {competencesList.filter(c => !competences.includes(c)).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {competences.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {competences.map(c => (
                      <Badge
                        key={c}
                        variant="secondary"
                        className="gap-1 cursor-pointer"
                        onClick={() => removeCompetence(c)}
                      >
                        {c} <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Avatar (URL)</Label>
            <Input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Entrez l'URL d'une image pour votre avatar
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/profile')}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="gradient-primary border-0 text-primary-foreground"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
