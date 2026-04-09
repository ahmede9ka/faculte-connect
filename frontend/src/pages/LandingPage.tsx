import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, FolderKanban, CalendarDays, Users, BarChart3, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const features = [
    { icon: FolderKanban, title: 'Suivi de projet', desc: 'Gérez vos projets de A à Z avec suivi en temps réel' },
    { icon: CalendarDays, title: 'Événements', desc: 'Organisez et participez aux événements du campus' },
    { icon: Users, title: 'Membres', desc: 'Collaborez efficacement avec votre équipe' },
    { icon: BarChart3, title: 'Statistiques', desc: 'Visualisez la progression et les performances' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">FST Projects</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Se connecter</Button>
          </Link>
          <Link to="/signup/student">
            <Button size="sm">Créer un compte</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 text-sm text-primary mb-6">
          <GraduationCap className="h-4 w-4" />
          Faculté des Sciences de Tunis
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight max-w-4xl mx-auto">
          Gérez vos projets universitaires
          <span className="text-gradient"> & clubs </span>
          facilement
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
          Plateforme complète pour la gestion de projets, événements et collaboration au sein de la FST.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link to="/signup/student">
            <Button size="lg" className="gap-2 gradient-primary border-0 text-primary-foreground px-8">
              <GraduationCap className="h-5 w-5" />
              Je suis Étudiant / Individu
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/signup/organization">
            <Button size="lg" variant="outline" className="gap-2 px-8">
              <Users className="h-5 w-5" />
              Je suis Organisation / Club
            </Button>
          </Link>
        </div>
        <Link to="/login" className="inline-flex items-center gap-1 mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin Login
        </Link>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="p-6 rounded-2xl bg-card border shadow-card hover:shadow-elevated transition-shadow animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t text-center text-sm text-muted-foreground">
        © 2025 FST Projects — Faculté des Sciences de Tunis
      </footer>
    </div>
  );
}
