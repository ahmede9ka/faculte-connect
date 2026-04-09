import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Eye, EyeOff, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';

const personas: Array<{ label: string; role: UserRole; icon: typeof GraduationCap; color: string; }> = [
  { label: 'Étudiant', role: 'student', icon: GraduationCap, color: 'border-blue-400 hover:bg-blue-50' },
  { label: 'Organisation', role: 'organization', icon: Building2, color: 'border-emerald-400 hover:bg-emerald-50' },
  { label: 'Admin', role: 'admin', icon: ShieldCheck, color: 'border-purple-400 hover:bg-purple-50' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const resolvedRole = await signIn(email, password, role);
      const target = resolvedRole === 'admin'
        ? '/dashboard/admin'
        : resolvedRole === 'organization'
          ? '/dashboard/organization'
          : '/dashboard/student';
      navigate(target);
    } catch {
      setError('Rôle invalide pour ce compte ou identifiants incorrects.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">FST Projects</span>
            </Link>
            <h1 className="font-display text-2xl font-bold">Connexion</h1>
            <p className="text-muted-foreground mt-1">Choisissez votre profil ou connectez-vous</p>
          </div>

          {/* Persona quick-access */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Accès rapide par profil</p>
            <div className="grid grid-cols-3 gap-3">
              {personas.map(({ label, role: roleValue, icon: Icon, color }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setRole(roleValue)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${color} ${role === roleValue ? 'ring-2 ring-primary/40' : ''} dark:hover:bg-white/10`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 border-t" />
          </div>

          {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="votre.email@fst.utm.tn" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Étudiant</SelectItem>
                  <SelectItem value="organization">Organisation</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Link to="#" className="text-xs text-primary hover:underline">Mot de passe oublié ?</Link>
            </div>
            <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground">Connexion</Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Pas de compte ? <Link to="/signup/student" className="text-primary hover:underline">Créer un compte</Link>
          </p>
        </div>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="text-center text-primary-foreground/90 max-w-md">
          <GraduationCap className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="font-display text-3xl font-bold mb-4">Faculté des Sciences de Tunis</h2>
          <p className="text-primary-foreground/60">Votre plateforme de gestion de projets et d'événements universitaires</p>
        </div>
      </div>
    </div>
  );
}
