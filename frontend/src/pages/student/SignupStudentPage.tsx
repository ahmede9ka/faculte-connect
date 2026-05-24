import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { fetchCompetences, fetchFacultes, fetchSpecialites } from '@/lib/api';

export default function SignupStudentPage() {
  const FST_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/fr/8/8d/FSTLOGO.svg';
  const [competences, setCompetences] = useState<string[]>([]);
  const { signUpStudent } = useAuth();
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [faculte, setFaculte] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [idUniversitaire, setIdUniversitaire] = useState("");

  const { data: competencesList = [] } = useQuery<string[]>({
    queryKey: ['competences'],
    queryFn: fetchCompetences,
  });
  const { data: facultesList = [] } = useQuery<string[]>({
    queryKey: ['facultes'],
    queryFn: fetchFacultes,
  });
  const { data: specialitesByFaculte = {} } = useQuery<Record<string, string[]>>({
    queryKey: ['specialites'],
    queryFn: fetchSpecialites,
  });

  const specialitesList = useMemo(
    () => (faculte ? specialitesByFaculte[faculte] ?? [] : []),
    [faculte, specialitesByFaculte]
  );

  const addCompetence = (c: string) => {
    if (!competences.includes(c)) setCompetences([...competences, c]);
  };

  const removeCompetence = (c: string) => setCompetences(competences.filter(x => x !== c));

  const handleFaculteChange = (value: string) => {
    setFaculte(value);
    setSpecialite("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUpStudent({
      email,
      password,
      name: `${prenom} ${nom}`.trim(),
      faculte,
      specialite,
      idUniversitaire,
      competences,
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg space-y-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-white border border-border flex items-center justify-center p-1">
            <img src={FST_LOGO_URL} alt="FST" className="h-full w-full object-contain" />
          </div>
          <span className="font-display font-bold">FSTEAM</span>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Inscription étudiant</h1>
          <p className="text-muted-foreground mt-1">Créez votre compte étudiant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input placeholder="Ben Ali" value={nom} onChange={(e) => setNom(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Prénom</Label>
              <Input placeholder="Ahmed" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email universitaire</Label>
            <Input
              type="email"
              placeholder="ahmed.benali@fst.utm.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Mot de passe</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Faculté</Label>
              <Select value={faculte} onValueChange={handleFaculteChange} required>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  {facultesList.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Spécialité</Label>
              <Select value={specialite} onValueChange={setSpecialite} disabled={!faculte || specialitesList.length === 0}>
                <SelectTrigger><SelectValue placeholder={faculte ? "Choisir..." : "Choisir une faculté"} /></SelectTrigger>
                <SelectContent>
                  {specialitesList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
                  <Badge key={c} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeCompetence(c)}>
                    {c} <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>ID universitaire</Label>
            <Input placeholder="FST2024001" value={idUniversitaire} onChange={(e) => setIdUniversitaire(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Photo (optionnel)</Label>
            <Input type="file" accept="image/*" />
          </div>
          <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground">Créer un compte</Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ? <Link to="/login" className="text-primary hover:underline">Se connecter</Link>
          {' · '}
          <Link to="/signup/organization" className="text-primary hover:underline">Inscription organisation</Link>
        </p>
      </div>
    </div>
  );
}
