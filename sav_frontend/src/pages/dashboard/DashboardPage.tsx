// DashboardPage.tsx - Version corrigée
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress // IMPORT MANQUANT AJOUTÉ
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  Add,
  TrendingUp,
  TrendingDown,
  ArrowForward,
  MoreVert,
  Refresh,
  CalendarToday,
  Assignment,
  Build,
  People,
  Inventory,
  Receipt,
  PieChart,
  Notifications,
  Warning,
  Schedule
} from '@mui/icons-material';
import AuthContext from '../../contexts/AuthContext';
import { articleService } from '../../services/articleService';
import { clientService } from '../../services/clientService';
import { reclamationService } from '../../services/reclamationService';
import { interventionService } from '../../services/interventionService';
import PageTitle from '../../components/common/PageTitle';

const QuickActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '16px',
  padding: '20px 16px',
  height: '100px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  border: '2px solid rgba(33, 150, 243, 0.1)',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(0, 188, 212, 0.05))',
    borderColor: '#2196F3',
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 28px rgba(33, 150, 243, 0.2)',
  },
}));

const ActivityItem = styled(Box)(({ theme }) => ({
  padding: '16px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 250, 252, 0.8))',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.04), rgba(0, 188, 212, 0.04))',
    transform: 'translateX(4px)',
    boxShadow: '0 8px 24px rgba(33, 150, 243, 0.1)',
  },
}));

const ProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: '8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(33, 150, 243, 0.1)',
  '& .MuiLinearProgress-bar': {
    borderRadius: '4px',
    background: 'linear-gradient(90deg, #2196F3 0%, #00BCD4 100%)',
  },
}));

const StatChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'chipcolor',
})(({ chipcolor }: any) => ({
  fontWeight: 700,
  height: '32px',
  borderRadius: '16px',
  background: chipcolor?.background || 'rgba(33, 150, 243, 0.1)',
  color: chipcolor?.text || '#2196F3',
  border: `1px solid ${chipcolor?.border || 'rgba(33, 150, 243, 0.2)'}`,
  '& .MuiChip-label': {
    paddingLeft: '12px',
    paddingRight: '12px',
    fontSize: '13px',
  },
}));

const ModernCard = styled(Card)(({ theme }) => ({
  borderRadius: '24px',
  boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))',
  backdropFilter: 'blur(6px)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 30px 60px rgba(15, 23, 42, 0.12)'
  }
}));

const ModernPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '20px',
  padding: '28px',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
  backdropFilter: 'blur(6px)',
}));

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    articles: { total: 0, enStock: 0 },
    clients: { total: 0, nouveaux: 0 },
    reclamations: { total: 0, enCours: 0 },
    interventions: { total: 0, enAttente: 0 }
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [performance, setPerformance] = useState(94);
  const { user, hasAnyRole } = useContext(AuthContext);

  type RoleKey = 'client' | 'technicien' | 'responsablesav' | 'admin';

  const roleLabels: Record<RoleKey, string> = {
    client: 'Client',
    technicien: 'Technicien',
    responsablesav: 'Responsable SAV',
    admin: 'Admin',
  };

  const activeRole = useMemo<RoleKey>(() => {
    const firstRole = user?.roles?.[0]?.toLowerCase();
    if (firstRole === 'technicien' || firstRole === 'responsablesav' || firstRole === 'admin') {
      return firstRole as RoleKey;
    }
    return 'client';
  }, [user]);

  type QuickAction = { label: string; path: string; icon: React.ReactNode; color: string };
  type RoleConfig = { headline: string; accent: string; quickActions: QuickAction[]; highlights: string[] };

  const roleConfigs: Record<RoleKey, RoleConfig> = useMemo(() => ({
    client: {
      headline: 'Vue client : suivi de vos réclamations, rendez-vous et factures',
      accent: '#2196F3',
      quickActions: [
        { label: 'Nouvelle réclamation', path: '/reclamations', icon: <Assignment sx={{ fontSize: 32, color: '#FF9800' }} />, color: '#FF9800' },
        { label: 'Planifier un RDV', path: '/calendar', icon: <CalendarToday sx={{ fontSize: 32, color: '#2196F3' }} />, color: '#2196F3' },
        { label: 'Suivre mes interventions', path: '/interventions', icon: <Build sx={{ fontSize: 32, color: '#4CAF50' }} />, color: '#4CAF50' },
        { label: 'Consulter mes factures', path: '/factures', icon: <Receipt sx={{ fontSize: 32, color: '#00BCD4' }} />, color: '#00BCD4' },
      ],
      highlights: [
        'Créez et suivez vos réclamations avec photos et statuts',
        'Planifiez vos rendez-vous et recevez des rappels',
        'Suivez la progression des interventions et la garantie',
        'Payez vos factures et exportez vos données client',
      ],
    },
    technicien: {
      headline: 'Vue technicien : interventions assignées, pièces et planification',
      accent: '#4CAF50',
      quickActions: [
        { label: 'Interventions assignées', path: '/interventions', icon: <Build sx={{ fontSize: 32, color: '#4CAF50' }} />, color: '#4CAF50' },
        { label: 'Agenda du jour', path: '/calendar', icon: <Schedule sx={{ fontSize: 32, color: '#2196F3' }} />, color: '#2196F3' },
        { label: 'Réclamations en cours', path: '/reclamations', icon: <Assignment sx={{ fontSize: 32, color: '#FF9800' }} />, color: '#FF9800' },
        { label: 'Catalogue articles', path: '/articles', icon: <Inventory sx={{ fontSize: 32, color: '#9C27B0' }} />, color: '#9C27B0' },
      ],
      highlights: [
        'Consultez vos interventions et mettez à jour les statuts',
        'Vérifiez les garanties articles avant réparation',
        'Ajoutez les pièces nécessaires et documentez la solution',
        'Rédigez vos rapports techniques et suivez vos performances',
      ],
    },
    responsablesav: {
      headline: 'Vue responsable SAV : pilotage des réclamations, techniciens et planning',
      accent: '#9C27B0',
      quickActions: [
        { label: 'Gérer les réclamations', path: '/reclamations', icon: <Assignment sx={{ fontSize: 32, color: '#FF9800' }} />, color: '#FF9800' },
        { label: 'Assigner un technicien', path: '/interventions', icon: <People sx={{ fontSize: 32, color: '#2196F3' }} />, color: '#2196F3' },
        { label: 'Planifier les interventions', path: '/calendar', icon: <Schedule sx={{ fontSize: 32, color: '#00BCD4' }} />, color: '#00BCD4' },
        { label: 'Rapports et analytics', path: '/reports', icon: <PieChart sx={{ fontSize: 32, color: '#9C27B0' }} />, color: '#9C27B0' },
      ],
      highlights: [
        'Vue complète des réclamations et des affectations',
        'Validation des estimations et des factures SAV',
        'Gestion des techniciens, disponibilités et conflits agenda',
        'Tableaux de bord SAV et performance d’équipe',
      ],
    },
    admin: {
      headline: 'Vue administrateur : supervision globale et gouvernance des services',
      accent: '#0D47A1',
      quickActions: [
        { label: 'Gérer les utilisateurs', path: '/users', icon: <People sx={{ fontSize: 32, color: '#0D47A1' }} />, color: '#0D47A1' },
        { label: 'Catalogue articles', path: '/articles', icon: <Inventory sx={{ fontSize: 32, color: '#9C27B0' }} />, color: '#9C27B0' },
        { label: 'Clients et réclamations', path: '/clients', icon: <Assignment sx={{ fontSize: 32, color: '#FF9800' }} />, color: '#FF9800' },
        { label: 'Reporting global', path: '/reports', icon: <PieChart sx={{ fontSize: 32, color: '#00BCD4' }} />, color: '#00BCD4' },
      ],
      highlights: [
        'Attribution des rôles, activation/désactivation des comptes',
        'Supervision de tous les microservices et des logs',
        'Pilotage des stocks, garanties et facturation',
        'Analytics globaux et export complet des données',
      ],
    },
  }), []);

  const roleStatKeys: Record<RoleKey, string[]> = {
    client: ['Réclamations', 'Interventions', 'Articles'],
    technicien: ['Interventions', 'Réclamations', 'Articles'],
    responsablesav: ['Réclamations', 'Interventions', 'Clients', 'Articles'],
    admin: ['Articles', 'Clients', 'Réclamations', 'Interventions'],
  };


  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const canFetchArticles = hasAnyRole(['admin', 'responsablesav', 'technicien', 'client']);
      const canFetchClients = hasAnyRole(['admin', 'responsablesav']);
      const canFetchReclamations = hasAnyRole(['admin', 'responsablesav', 'technicien', 'client']);
      const canFetchInterventions = hasAnyRole(['admin', 'responsablesav', 'technicien', 'client']);

      const [
        articles,
        clients,
        reclamations,
        interventions
      ] = await Promise.all([
        canFetchArticles ? articleService.getAll().catch(() => []) : [],
        canFetchClients ? clientService.getAll().catch(() => []) : [],
        canFetchReclamations ? reclamationService.getAll().catch(() => []) : [],
        canFetchInterventions ? interventionService.getAll().catch(() => []) : [],
      ]);

      // Calculer les statistiques
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      setStats({
        articles: {
          total: articles.length,
          enStock: articles.filter(a => a.estEnStock).length
        },
        clients: {
          total: clients.length,
          nouveaux: clients.filter(c => {
            if (c.dateInscription) {
              const date = new Date(c.dateInscription);
              return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            }
            return false;
          }).length
        },
        reclamations: {
          total: reclamations.length,
          enCours: reclamations.filter(r => 
            r.statut?.toLowerCase() === 'en cours' || 
            r.statut?.toLowerCase() === 'nouvelle'
          ).length
        },
        interventions: {
          total: interventions.length,
          enAttente: interventions.filter(i => 
            i.statut?.toLowerCase() === 'planifiée'
          ).length
        }
      });

      // Simuler l'activité récente
      setRecentActivity([
        { 
          id: 1, 
          text: 'Nouvelle réclamation #1234 créée', 
          time: 'Il y a 5 min', 
          type: 'reclamation',
          color: '#FF9800'
        },
        { 
          id: 2, 
          text: 'Intervention #5678 terminée', 
          time: 'Il y a 1 heure', 
          type: 'intervention',
          color: '#4CAF50'
        },
        { 
          id: 3, 
          text: 'Client Jean Dupont ajouté', 
          time: 'Il y a 2 heures', 
          type: 'client',
          color: '#2196F3'
        },
        { 
          id: 4, 
          text: 'Article SAN-123 réapprovisionné', 
          time: 'Il y a 3 heures', 
          type: 'article',
          color: '#9C27B0'
        },
        { 
          id: 5, 
          text: 'Facture #7890 générée', 
          time: 'Il y a 4 heures', 
          type: 'facture',
          color: '#00BCD4'
        },
      ]);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const baseStatsData = [
    {
      title: 'Articles',
      value: stats.articles.total.toString(),
      icon: Inventory,
      color: 'primary' as const,
      subtitle: `${stats.articles.enStock} en stock`,
      trend: { value: 12, isPositive: true },
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)'
    },
    {
      title: 'Clients',
      value: stats.clients.total.toString(),
      icon: People,
      color: 'secondary' as const,
      subtitle: `${stats.clients.nouveaux} nouveaux ce mois`,
      trend: { value: 8, isPositive: true },
      gradient: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)'
    },
    {
      title: 'Réclamations',
      value: stats.reclamations.total.toString(),
      icon: Assignment,
      color: 'warning' as const,
      subtitle: `${stats.reclamations.enCours} en cours`,
      trend: { value: 5, isPositive: false },
      gradient: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)'
    },
    {
      title: 'Interventions',
      value: stats.interventions.total.toString(),
      icon: Build,
      color: 'success' as const,
      subtitle: `${stats.interventions.enAttente} en attente`,
      trend: { value: 15, isPositive: true },
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)'
    },
  ];

  const statsData = baseStatsData.filter((stat) => roleStatKeys[activeRole].includes(stat.title));

  const quickActions = roleConfigs[activeRole].quickActions;

  const statusStats = [
    { label: 'En attente', value: 12, color: { background: 'rgba(255, 152, 0, 0.1)', text: '#FF9800', border: 'rgba(255, 152, 0, 0.2)' } },
    { label: 'En cours', value: 18, color: { background: 'rgba(33, 150, 243, 0.1)', text: '#2196F3', border: 'rgba(33, 150, 243, 0.2)' } },
    { label: 'Résolues', value: 28, color: { background: 'rgba(76, 175, 80, 0.1)', text: '#4CAF50', border: 'rgba(76, 175, 80, 0.2)' } },
    { label: 'Fermées', value: 5, color: { background: 'rgba(244, 67, 54, 0.1)', text: '#f44336', border: 'rgba(244, 67, 54, 0.2)' } },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const displayName = useMemo(() => {
    if (!user) return undefined;
    return (
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      (user.given_name && user.family_name ? `${user.given_name} ${user.family_name}` : '') ||
      user.email ||
      user.uid ||
      user.sub
    );
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ color: '#2196F3', mb: 3 }} />
          <Typography variant="h6" color="text.secondary">
            Chargement du tableau de bord...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {displayName && (
        <Box sx={{ 
          mb: 3, 
          p: 2, 
          borderRadius: '16px', 
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(0, 188, 212, 0.05))',
          border: '1px solid rgba(33, 150, 243, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: roleConfigs[activeRole].accent }}>
              Bonjour, {displayName} 👋
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bienvenue sur votre tableau de bord {roleLabels[activeRole]}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
            <CalendarToday sx={{ color: '#00BCD4' }} />
            <Chip 
              label={`Rôle : ${roleLabels[activeRole]}`}
              size="small"
              sx={{
                fontWeight: 700,
                backgroundColor: `${roleConfigs[activeRole].accent}12`,
                color: roleConfigs[activeRole].accent,
                border: `1px solid ${roleConfigs[activeRole].accent}40`
              }}
            />
          </Box>
        </Box>
      )}

      {/* Titre principal */}
      <PageTitle
        title="Tableau de bord"
        subtitle="Aperçu global de votre activité"
        breadcrumbs={[{ label: 'Tableau de bord' }]}
      />

      {/* Bouton de rafraîchissement */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Tooltip title="Rafraîchir les données">
          <IconButton 
            onClick={loadDashboardData}
            sx={{ 
              color: '#2196F3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                transform: 'rotate(180deg)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Cartes de statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <ModernCard>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  mb: 2 
                }}>
                  <Box>
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary', 
                      fontWeight: 600,
                      mb: 0.5 
                    }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800, 
                      background: stat.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.subtitle}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: '12px',
                    background: `${stat.gradient}20`,
                  }}>
                    <stat.icon sx={{ 
                      fontSize: 30, 
                      background: stat.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  {stat.trend.isPositive ? (
                    <TrendingUp sx={{ fontSize: 18, color: '#4CAF50', mr: 0.5 }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 18, color: '#f44336', mr: 0.5 }} />
                  )}
                  <Typography variant="caption" sx={{ 
                    color: stat.trend.isPositive ? '#4CAF50' : '#f44336',
                    fontWeight: 600 
                  }}>
                    {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    vs mois dernier
                  </Typography>
                </Box>
              </CardContent>
            </ModernCard>
          </Grid>
        ))}
      </Grid>

      {/* Actions rapides */}
      <ModernPaper sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
            Actions rapides
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accédez rapidement aux fonctions principales
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <QuickActionButton 
                fullWidth
                onClick={() => navigate(action.path)}
              >
                {action.icon}
                <Typography variant="body2" sx={{ 
                  fontWeight: 600, 
                  color: action.color,
                  textAlign: 'center'
                }}>
                  {action.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cliquez pour accéder
                </Typography>
              </QuickActionButton>
            </Grid>
          ))}
        </Grid>
      </ModernPaper>

      {/* Activité récente et Performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Activité récente */}
        <Grid item xs={12} md={6}>
          <ModernPaper sx={{ height: '100%' }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3 
            }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Activité récente
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dernières actions dans le système
                </Typography>
              </Box>
              <Button 
                size="small" 
                onClick={() => navigate('/activity')}
                endIcon={<ArrowForward />}
                sx={{ 
                  fontWeight: 600,
                  color: '#2196F3',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  }
                }}
              >
                Voir tout
              </Button>
            </Box>
            <Box>
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${activity.color}20`,
                      flexShrink: 0
                    }}>
                      <Box sx={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%',
                        background: activity.color 
                      }} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {activity.text}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.time}
                      </Typography>
                    </Box>
                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                      <MoreVert />
                    </IconButton>
                  </Box>
                </ActivityItem>
              ))}
            </Box>
          </ModernPaper>
        </Grid>

        {/* Performance */}
        <Grid item xs={12} md={6}>
          <ModernPaper sx={{ height: '100%' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
              Performance du mois
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              height: 'calc(100% - 60px)'
            }}>
              <Box sx={{ 
                position: 'relative',
                width: '180px',
                height: '180px',
                mb: 3
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'conic-gradient(#4CAF50 0% 94%, #e0e0e0 94% 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)'
                }}>
                  <Box sx={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <Typography variant="h2" sx={{ 
                      fontWeight: 800, 
                      background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {performance}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Taux de résolution
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <TrendingUp sx={{ color: '#4CAF50', mr: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                    +2.5% vs mois dernier
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  94 réclamations résolues sur 100
                </Typography>
              </Box>
            </Box>
          </ModernPaper>
        </Grid>
      </Grid>

      {/* Statuts et Facturation */}
      <Grid container spacing={3}>
        {/* Réclamations par statut */}
        <Grid item xs={12} md={6}>
          <ModernPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PieChart sx={{ mr: 2, color: '#9C27B0', fontSize: 32 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Réclamations par statut
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Distribution des réclamations
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2}>
              {statusStats.map((item, index) => (
                <Grid item xs={6} key={index}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: '16px',
                    background: item.color.background,
                    border: `1px solid ${item.color.border}`,
                    textAlign: 'center'
                  }}>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 800, 
                      color: item.color.text,
                      mb: 1
                    }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Progression mensuelle
              </Typography>
              <ProgressBar variant="determinate" value={75} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  75% des objectifs atteints
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Objectif: 100 réclamations
                </Typography>
              </Box>
            </Box>
          </ModernPaper>
        </Grid>

        {/* Facturation */}
        <Grid item xs={12} md={6}>
          <ModernPaper>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Receipt sx={{ mr: 2, color: '#00BCD4', fontSize: 32 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Facturation du mois
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aperçu financier
                </Typography>
              </Box>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h2" sx={{ 
                fontWeight: 800, 
                background: 'linear-gradient(135deg, #00BCD4 0%, #26C6DA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {formatCurrency(12850)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp sx={{ color: '#4CAF50', mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                  +1 250 DNT vs mois dernier
                </Typography>
              </Box>
            </Box>
            <Box sx={{ 
              p: 2, 
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(0, 188, 212, 0.05), rgba(38, 198, 218, 0.05))',
              border: '1px solid rgba(0, 188, 212, 0.1)'
            }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Détails de la facturation
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Factures générées:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    28
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Moyenne par facture:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(459)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    En attente de paiement:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#FF9800' }}>
                    5
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Taux de recouvrement:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                    92%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </ModernPaper>
        </Grid>
      </Grid>

      {/* Section notifications importantes */}
      <ModernPaper sx={{ mt: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 3 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Notifications sx={{ mr: 2, color: '#FF9800', fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Notifications importantes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Éléments nécessitant votre attention
              </Typography>
            </Box>
          </Box>
          <StatChip 
            label="3 nouvelles" 
            chipcolor={{ background: 'rgba(255, 152, 0, 0.1)', text: '#FF9800', border: 'rgba(255, 152, 0, 0.2)' }}
          />
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              p: 2, 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05), rgba(255, 193, 7, 0.05))',
              border: '1px solid rgba(255, 152, 0, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning sx={{ fontSize: 20, color: '#FF9800', mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Réclamations en retard
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                2 réclamations dépassent le délai de traitement
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              p: 2, 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.05), rgba(239, 83, 80, 0.05))',
              border: '1px solid rgba(244, 67, 54, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning sx={{ fontSize: 20, color: '#f44336', mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Articles en rupture
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                5 articles nécessitent un réapprovisionnement
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              p: 2, 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(0, 188, 212, 0.05))',
              border: '1px solid rgba(33, 150, 243, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Schedule sx={{ fontSize: 20, color: '#2196F3', mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Interventions à planifier
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                3 interventions nécessitent une date d'intervention
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </ModernPaper>
    </Box>
  );
};

export default DashboardPage;