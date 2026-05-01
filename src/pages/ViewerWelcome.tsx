import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, Star, ArrowLeft, Bell, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const sportsBgs = [
  '/images/sport-football.jpg',
  '/images/sport-basketball.jpg',
  '/images/sport-volleyball.jpg',
  '/images/sport-hero.jpg',
];

export default function ViewerWelcome() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [currentBg, setCurrentBg] = useState(0);
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const features = [
    { title: t('welcome.feature1Title'), description: t('welcome.feature1Desc'), image: '/images/sport-football.jpg', icon: Trophy },
    { title: t('welcome.feature2Title'), description: t('welcome.feature2Desc'), image: '/images/sport-basketball.jpg', icon: Star },
    { title: t('welcome.feature3Title'), description: t('welcome.feature3Desc'), image: '/images/sport-volleyball.jpg', icon: Users },
    { title: t('welcome.feature4Title'), description: t('welcome.feature4Desc'), image: '/images/sport-stadium.jpg', icon: Bell },
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentBg((p) => (p + 1) % sportsBgs.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" dir={dir}>
      {sportsBgs.map((bg, i) => (
        <div key={bg}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url(${bg})`, opacity: i === currentBg ? 0.10 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/75 to-background" />

      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-3">
          <img src="/icon-512.png" alt="Bottola" className="w-12 h-12 rounded-2xl shadow-lg" />
          <span className="font-display text-2xl font-bold text-foreground">Bottola</span>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-12">
        <div className="max-w-3xl mx-auto text-center mt-8 md:mt-12 mb-12">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            {t('welcome.viewerHi')}
            <br />
            <span className="text-gradient">{t('welcome.viewerLabel')}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            {t('welcome.viewerDesc')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Button size="lg" className="btn-primary text-lg px-12 w-full sm:w-auto"
              onClick={() => navigate('/auth?role=viewer')}>
              {t('welcome.createFreeAccount')}
            </Button>
            <Button size="lg" variant="outline"
              className="text-lg px-12 w-full sm:w-auto rounded-2xl"
              onClick={() => navigate('/auth?role=viewer&tab=login')}>
              {t('nav.login')}
              <ArrowLeft className="w-5 h-5 ms-2 rtl:rotate-180" />
            </Button>
          </div>

          {/* Guest browse — tournaments + news only */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="ghost" size="lg" className="gap-2"
              onClick={() => navigate('/tournaments-feed')}>
              <Eye className="w-5 h-5" /> {t('tournament.browseAll')}
            </Button>
            <Button variant="ghost" size="lg" className="gap-2"
              onClick={() => navigate('/news-feed')}>
              <Star className="w-5 h-5" /> {t('nav.newsFeed')}
            </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="feature-card group">
                <div className="feature-card-image">
                  <img src={feature.image} alt={feature.title} />
                  <div className="feature-card-overlay" />
                  <div className="feature-card-icon">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <div className="feature-card-content">
                  <h3 className="feature-card-title">{feature.title}</h3>
                  <p className="feature-card-description">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {sportsBgs.map((_, i) => (
            <button key={i} onClick={() => setCurrentBg(i)}
              className={`transition-all duration-300 rounded-full ${i === currentBg ? 'bg-primary w-8 h-2' : 'bg-muted-foreground/30 w-2 h-2'}`}
            />
          ))}
        </div>
      </main>

      <footer className="relative z-10 py-8 text-center text-sm text-muted-foreground">
        {t('welcome.rights')}
      </footer>
    </div>
  );
}
