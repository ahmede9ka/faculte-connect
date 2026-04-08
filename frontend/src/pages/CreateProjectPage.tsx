import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createProject } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const categories = ['Web Development', 'Intelligence Artificielle', 'IoT', 'Développement Mobile', 'Cybersecurity', 'Data Science'];

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userEmail } = useAuth();

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [chefProjet, setChefProjet] = useState('');

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projet créé avec succès !');
      navigate('/projects');
    },
    onError: () => {
      toast.error('Erreur lors de la création du projet');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!titre.trim() || !description.trim() || !organisation || !deadline || !chefProjet.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    createMutation.mutate({
      titre,
      desc: description,
      chefProjet,
      organisation,
      deadline,
      validite: true,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold">Nouveau Projet</h1>
        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border p-6">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input
              placeholder="Titre du projet"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Décrivez le projet..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={organisation} onValueChange={setOrganisation}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Chef de projet (Email)</Label>
            <Input
              placeholder="chef@example.com"
              value={chefProjet}
              onChange={(e) => setChefProjet(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Ressources (fichiers, liens)</Label>
            <Input type="file" multiple />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/projects')} disabled={createMutation.isPending}>
              Annuler
            </Button>
            <Button type="submit" className="gradient-primary border-0 text-primary-foreground" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création...' : 'Créer projet'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
