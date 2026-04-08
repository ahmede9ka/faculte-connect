import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { createEvent } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { userEmail } = useAuth();
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: '',
    lieu: '',
    dateHeure: '',
    nombrePlaces: 0,
    affiche: '',
  });

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      toast.success('Événement créé avec succès');
      navigate('/events');
    },
    onError: () => {
      toast.error('Erreur lors de la création de l\'événement');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail) {
      toast.error('Veuillez vous connecter');
      return;
    }

    if (!formData.titre || !formData.description || !formData.type || !formData.lieu || !formData.dateHeure || formData.nombrePlaces <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    createMutation.mutate({
      ...formData,
      organisateur: userEmail,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold">Créer un événement</h1>
        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border p-6">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input
              placeholder="Titre de l'événement"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Décrivez l'événement..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Workshop">Workshop</SelectItem>
                <SelectItem value="Compétition">Compétition</SelectItem>
                <SelectItem value="Conférence">Conférence</SelectItem>
                <SelectItem value="Séminaire">Séminaire</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lieu</Label>
            <Input
              placeholder="Amphithéâtre A"
              value={formData.lieu}
              onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date & Heure</Label>
              <Input
                type="datetime-local"
                value={formData.dateHeure}
                onChange={(e) => setFormData({ ...formData, dateHeure: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre de places</Label>
              <Input
                type="number"
                placeholder="100"
                value={formData.nombrePlaces || ''}
                onChange={(e) => setFormData({ ...formData, nombrePlaces: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Affiche (URL)</Label>
            <Input
              type="text"
              placeholder="https://example.com/poster.jpg"
              value={formData.affiche}
              onChange={(e) => setFormData({ ...formData, affiche: e.target.value })}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/events')}>Annuler</Button>
            <Button type="submit" className="gradient-primary border-0 text-primary-foreground" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
