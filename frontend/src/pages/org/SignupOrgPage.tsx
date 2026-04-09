import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface SponsorInput { nom: string; logo: string; lien: string; }

export default function SignupOrgPage() {
  const [sponsors, setSponsors] = useState<SponsorInput[]>([]);
  const { signUpOrganization } = useAuth();
  const navigate = useNavigate();

  // All fields for registration
  const [clubName, setClubName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [responsableNom, setResponsableNom] = useState("");
  const [responsableEmail, setResponsableEmail] = useState("");
  const [responsableTelephone, setResponsableTelephone] = useState("");

  const addSponsor = () => setSponsors([...sponsors, { nom: '', logo: '', lien: '' }]);
  const removeSponsor = (i: number) => setSponsors(sponsors.filter((_, idx) => idx !== i));
  const updateSponsor = (i: number, field: keyof SponsorInput, value: string) => {
    const updated = [...sponsors];
    updated[i][field] = value;
    setSponsors(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUpOrganization({
      email,
      password,
      name: clubName,
      organizationType,
      responsableNom,
      responsableEmail,
      responsableTelephone,
      sponsors: sponsors.map(s => s.nom),
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg space-y-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold">FST Projects</span>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Inscription Organisation</h1>
          <p className="text-muted-foreground mt-1">Créez votre compte organisationnel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom du club / association / département</Label>
            <Input placeholder="Club IEEE FST" value={clubName} onChange={(e) => setClubName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={organizationType} onValueChange={setOrganizationType}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Club">Club</SelectItem>
                <SelectItem value="Association">Association</SelectItem>
                <SelectItem value="Département">Département</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Email officiel (optionnel)</Label>
            <Input
              type="email"
              placeholder="club@fst.utm.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Mot de passe</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="p-4 rounded-xl bg-muted/50 space-y-3">
            <Label className="text-sm font-semibold">Infos du responsable</Label>
            <div className="space-y-2">
              <Input placeholder="Nom du responsable" value={responsableNom} onChange={(e) => setResponsableNom(e.target.value)} />
              <Input type="email" placeholder="Email" value={responsableEmail} onChange={(e) => setResponsableEmail(e.target.value)} />
              <Input type="tel" placeholder="Téléphone" value={responsableTelephone} onChange={(e) => setResponsableTelephone(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Sponsors</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSponsor} className="gap-1">
                <Plus className="h-3 w-3" /> Ajouter
              </Button>
            </div>
            {sponsors.map((s, i) => (
              <div key={i} className="p-3 rounded-lg border bg-card space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Sponsor {i + 1}</span>
                  <button type="button" onClick={() => removeSponsor(i)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input placeholder="Nom" value={s.nom} onChange={e => updateSponsor(i, 'nom', e.target.value)} />
                <Input placeholder="Lien (optionnel)" value={s.lien} onChange={e => updateSponsor(i, 'lien', e.target.value)} />
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground">Créer le compte organisationnel</Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ? <Link to="/login" className="text-primary hover:underline">Se connecter</Link>
          {' · '}
          <Link to="/signup/student" className="text-primary hover:underline">Inscription Étudiant</Link>
        </p>
      </div>
    </div>
  );
}
