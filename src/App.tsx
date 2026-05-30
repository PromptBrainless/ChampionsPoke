import React, { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import { Button, Card, Spinner } from './components/ui';
import { Menu, X, Sword, Users, BookOpen, Newspaper, Zap, Home, Gauge, TrendingUp, Globe } from 'lucide-react';

// Lazy load components for better performance
const DamageCalculator = lazy(() => import('./components/damage-calc').then(m => ({ default: m.DamageCalculator })));
const TeamBuilder = lazy(() => import('./components/team-builder').then(m => ({ default: m.TeamBuilder })));
const PokedexBrowser = lazy(() => import('./components/pokedex').then(m => ({ default: m.PokedexBrowser })));
const SpeedTiersCalculator = lazy(() => import('./components/speed-tiers').then(m => ({ default: m.SpeedTiersCalculator })));
const CommunityTeamsBrowser = lazy(() => import('./components/community').then(m => ({ default: m.CommunityTeamsBrowser })));
const MetaAnalysis = lazy(() => import('./components/meta').then(m => ({ default: m.MetaAnalysis })));

type TabType = 'home' | 'team-builder' | 'damage-calc' | 'pokedex' | 'speed-tiers' | 'community' | 'meta' | 'news';

const Navigation: React.FC<{
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}> = ({ activeTab, onTabChange, mobileOpen, onMobileToggle }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'team-builder', label: 'Team Builder', icon: <Users className="w-4 h-4" /> },
    { id: 'damage-calc', label: 'Damage Calc', icon: <Sword className="w-4 h-4" /> },
    { id: 'speed-tiers', label: 'Speed Tiers', icon: <Gauge className="w-4 h-4" /> },
    { id: 'pokedex', label: 'Pokedex', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'meta', label: 'Meta Stats', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'community', label: 'Community', icon: <Globe className="w-4 h-4" /> },
    { id: 'news', label: 'News', icon: <Newspaper className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {tab.icon}
            <span className="hidden xl:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile Navigation */}
      <button
        onClick={onMobileToggle}
        className="md:hidden p-2 text-slate-300 hover:text-white"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-800 border-t border-slate-700 shadow-xl z-50">
          <div className="p-4 grid grid-cols-2 gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); onMobileToggle(); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {tab.icon}
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const HomePage: React.FC<{ onNavigate: (tab: TabType) => void }> = ({ onNavigate }) => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-slate-800 p-8 md:p-12">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="success">LIVE</Badge>
            <span className="text-blue-200 text-sm">Reg M-A • VGC 2026</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Pokemon Champions Hub
          </h1>
          <p className="text-xl text-blue-100 mb-6 max-w-2xl">
            Your ultimate battle companion. Build teams, calculate damage, analyze the meta, and dominate competitive Pokemon Champions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => onNavigate('team-builder')}>
              <Users className="w-5 h-5" />
              Build Your Team
            </Button>
            <Button variant="secondary" size="lg" onClick={() => onNavigate('damage-calc')}>
              <Sword className="w-5 h-5" />
              Calculate Damage
            </Button>
            <Button variant="secondary" size="lg" onClick={() => onNavigate('speed-tiers')}>
              <Gauge className="w-5 h-5" />
              Speed Tiers
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-white">1025+</div>
          <div className="text-sm text-slate-400">Pokemon</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">18</div>
          <div className="text-sm text-slate-400">Types</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">50+</div>
          <div className="text-sm text-slate-400">Mega Evolutions</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">VGC</div>
          <div className="text-sm text-slate-400">2026 Ready</div>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hover className="p-6" onClick={() => onNavigate('team-builder')}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Team Builder</h2>
          </div>
          <p className="text-slate-400 mb-4">
            Create and analyze teams with EV/IV spreads, move sets, and AI-powered synergy analysis.
          </p>
          <div className="flex gap-2">
            <Badge variant="success">Import/Export</Badge>
            <Badge variant="info">Showdown Format</Badge>
          </div>
        </Card>

        <Card hover className="p-6" onClick={() => onNavigate('damage-calc')}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
              <Sword className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Damage Calculator</h2>
          </div>
          <p className="text-slate-400 mb-4">
            Precise damage calculations with all mechanics: EVs, IVs, natures, abilities, items, weather, and terrain.
          </p>
          <div className="flex gap-2">
            <Badge variant="danger">VGC 2026</Badge>
            <Badge variant="warning">All Modifiers</Badge>
          </div>
        </Card>

        <Card hover className="p-6" onClick={() => onNavigate('speed-tiers')}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600">
              <Gauge className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Speed Tiers</h2>
          </div>
          <p className="text-slate-400 mb-4">
            Compare speed values against the meta. Know exactly what you outspeed and what outspeeds you.
          </p>
          <div className="flex gap-2">
            <Badge variant="info">Meta Comparison</Badge>
            <Badge variant="success">Custom Speed</Badge>
          </div>
        </Card>

        <Card hover className="p-6" onClick={() => onNavigate('meta')}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Meta Analysis</h2>
          </div>
          <p className="text-slate-400 mb-4">
            Usage statistics, top Pokemon, moves, and items. Stay ahead of the competitive meta.
          </p>
          <div className="flex gap-2">
            <Badge variant="warning">Live Stats</Badge>
            <Badge variant="info">Usage %</Badge>
          </div>
        </Card>

        <Card hover className="p-6" onClick={() => onNavigate('community')}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Community Teams</h2>
          </div>
          <p className="text-slate-400 mb-4">
            Browse, share, and copy community teams. Vote on builds and discover top cores.
          </p>
          <div className="flex gap-2">
            <Badge variant="success">Public Teams</Badge>
            <Badge variant="info">Top Cores</Badge>
          </div>
        </Card>

        <Card hover className="p-6" onClick={() => onNavigate('pokedex')}>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Pokedex Browser</h2>
          </div>
          <p className="text-slate-400 mb-4">
            Search all Pokemon with detailed stats, types, abilities. Filter by type and sort by BST.
          </p>
          <div className="flex gap-2">
            <Badge variant="info">1025+ Pokemon</Badge>
            <Badge variant="success">Advanced Search</Badge>
          </div>
        </Card>
      </div>

      {/* Pokemon Champions Features */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Pokemon Champions - Key Features</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Mega Evolutions', desc: 'New Megas: Emboar, Meganium, Feraligatr', icon: <Zap className="w-5 h-5 text-yellow-400" /> },
            { title: 'VGC 2026', desc: 'Official World Championship format', icon: <Sword className="w-5 h-5 text-red-400" /> },
            { title: 'Cross-Platform', desc: 'Nintendo Switch & Mobile', icon: <Users className="w-5 h-5 text-emerald-400" /> },
            { title: 'All Mechanics', desc: 'Tera, Gigantamax, Z-Moves', icon: <TrendingUp className="w-5 h-5 text-blue-400" /> },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              {item.icon}
              <div>
                <div className="font-medium text-white">{item.title}</div>
                <div className="text-sm text-slate-400">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const NewsPage: React.FC = () => {
  const newsItems = [
    {
      title: 'Pokemon Champions Is Now Available - April 8, 2026',
      date: 'April 8, 2026',
      summary: 'Pokemon Champions is now available on Nintendo Switch and Nintendo Switch 2! Experience the future of competitive Pokemon battles.',
      url: 'https://www.pokemon.com/us/pokemon-news/pokemon-champions-is-now-available-on-nintendo-switch-and-nintendo-switch-2',
      tags: ['Release', 'Launch'],
    },
    {
      title: 'VGC Transitions to Pokemon Champions - April 2026',
      date: 'March 24, 2026',
      summary: 'Official Pokemon competitions transition to Pokemon Champions as the standard platform for all VGC matches.',
      url: 'https://www.pokemon.com/us/pokemon-news/play-pokemon-competitions-transition-to-pokemon-champions-on-april-and-may-2026',
      tags: ['VGC', 'Competitive'],
    },
    {
      title: 'New Mega Evolutions Discovered in Pokemon Champions',
      date: 'February 27, 2026',
      summary: 'Mega Meganium, Mega Emboar, and Mega Feraligatr debut in Pokemon Champions with newly discovered abilities.',
      url: 'https://www.pokemon.com/us/pokemon-news/pokemon-champions-is-coming-to-nintendo-switch-in-april-2026',
      tags: ['Mega', 'New Pokemon'],
    },
    {
      title: 'Pokemon Champions Features Trailer Released',
      date: 'February 27, 2026',
      summary: 'Watch the official features trailer showcasing gameplay, mega evolutions, and competitive features.',
      url: 'https://www.youtube.com/watch?v=pOfW-qdsvpU',
      tags: ['Trailer', 'Video'],
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Pokemon Champions News</h1>
      <div className="space-y-4">
        {newsItems.map((item, i) => (
          <Card key={i} hover className="p-5" onClick={() => window.open(item.url, '_blank')}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-blue-400">{item.date}</span>
                  {item.tags?.map(tag => <Badge key={tag} variant="info" size="sm">{tag}</Badge>)}
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">{item.title}</h2>
                <p className="text-slate-400">{item.summary}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onNavigate={setActiveTab} />;
      case 'team-builder':
        return <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}><TeamBuilder /></Suspense>;
      case 'damage-calc':
        return <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}><DamageCalculator /></Suspense>;
      case 'speed-tiers':
        return <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}><SpeedTiersCalculator /></Suspense>;
      case 'pokedex':
        return <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}><PokedexBrowser /></Suspense>;
      case 'meta':
        return <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}><MetaAnalysis /></Suspense>;
      case 'community':
        return <Suspense fallback={<div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>}><CommunityTeamsBrowser /></Suspense>;
      case 'news':
        return <NewsPage />;
      default:
        return <HomePage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-500/25">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Pokemon Champions</h1>
                <p className="text-xs text-slate-400 hidden sm:block">Battle & Team Tools</p>
              </div>
            </div>

            <Navigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              mobileOpen={mobileMenuOpen}
              onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-400">
              Pokemon Champions Hub - Powered by PokeAPI
            </div>
            <div className="flex gap-4 text-sm text-slate-500">
              <span>VGC 2026 Ready</span>
              <span>•</span>
              <span>Not affiliated with Nintendo or The Pokemon Company</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
