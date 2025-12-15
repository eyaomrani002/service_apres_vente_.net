import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  Add,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/common/ui/StatsCard';
import AuthContext from '../../contexts/AuthContext';
import PageTitle from '../../components/common/PageTitle';
import {
  Inventory,
  People,
  Assignment,
  Build,
  Receipt,
  Timeline,
  PieChart,
} from '@mui/icons-material';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const statsData = [
    {
      title: 'Articles',
      value: '156',
      icon: Inventory,
      color: 'primary' as const,
      subtitle: '24 en stock',
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Clients',
      value: '89',
      icon: People,
      color: 'secondary' as const,
      subtitle: '5 nouveaux ce mois',
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Réclamations',
      value: '42',
      icon: Assignment,
      color: 'warning' as const,
      subtitle: '12 en cours',
      trend: { value: 5, isPositive: false },
    },
    {
      title: 'Interventions',
      value: '28',
      icon: Build,
      color: 'success' as const,
      subtitle: '8 en attente',
      trend: { value: 15, isPositive: true },
    },
  ];

  const recentActions = [
    { id: 1, text: 'Nouvelle réclamation #1234 créée', time: 'Il y a 5 min', type: 'reclamation' },
    { id: 2, text: 'Intervention #5678 terminée', time: 'Il y a 1 heure', type: 'intervention' },
    { id: 3, text: 'Client Jean Dupont ajouté', time: 'Il y a 2 heures', type: 'client' },
    { id: 4, text: 'Article SAN-123 réapprovisionné', time: 'Il y a 3 heures', type: 'article' },
  ];

  const quickActions = [
    { label: 'Nouvelle réclamation', path: '/reclamations/new', icon: <Add /> },
    { label: 'Ajouter un client', path: '/clients/new', icon: <Add /> },
    { label: 'Créer une intervention', path: '/interventions/new', icon: <Add /> },
    { label: 'Ajouter un article', path: '/articles/new', icon: <Add /> },
  ];

  return (
    <Box>
      {/* show user name if authenticated (use fallbacks if `name` missing) */}
      <AuthContext.Consumer>
        {({ user }) => {
          if (!user) return null;
          const displayName =
            user.name ||
            [user.firstName, user.lastName].filter(Boolean).join(' ') ||
            user.given_name && user.family_name ? `${user.given_name} ${user.family_name}` :
            user.email ||
            user.uid ||
            user.sub ||
            undefined;
          return displayName ? (
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Connecté en tant que {displayName}
            </Typography>
          ) : null;
        }}
      </AuthContext.Consumer>
      <PageTitle
        title="Tableau de bord"
        subtitle="Aperçu global de votre activité"
        breadcrumbs={[{ label: 'Tableau de bord' }]}
      />
      
      {/* Stats Cards (responsive CSS grid to avoid MUI Grid v2 migration warnings) */}
      <Box sx={{
        display: 'grid',
        gap: 3,
        mb: 4,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)'
        }
      }}>
        {statsData.map((stat, index) => (
          <Box key={index}>
            <StatsCard {...stat} />
          </Box>
        ))}
      </Box>
      
      {/* Quick Actions */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Actions rapides
        </Typography>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' } }}>
          {quickActions.map((action, index) => (
            <Button
              key={index}
              fullWidth
              variant="outlined"
              startIcon={action.icon}
              onClick={() => navigate(action.path)}
              sx={{ height: 80, flexDirection: 'column', gap: 1 }}
            >
              <Typography variant="body2">{action.label}</Typography>
            </Button>
          ))}
        </Box>
      </Paper>
      
      {/* Recent Activity and Charts */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {/* Recent Activity */}
        <Box>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Activité récente</Typography>
              <Button size="small" onClick={() => navigate('/activity')}>
                Voir tout
              </Button>
            </Box>
            <Box>
              {recentActions.map((action) => (
                <Box
                  key={action.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: action.type === 'reclamation' ? 'warning.main' :
                               action.type === 'intervention' ? 'success.main' :
                               action.type === 'client' ? 'secondary.main' : 'primary.main',
                      mr: 2,
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2">{action.text}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {action.time}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
        
        {/* Performance Chart */}
        <Box>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Performance du mois
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100% - 48px)' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Timeline sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" color="primary.main">
                  94%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Taux de résolution
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                  <Typography variant="caption" color="success.main">
                    +2.5% vs mois dernier
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
      
      {/* Additional Info */}
      <Box sx={{ display: 'grid', gap: 3, mt: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Box>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PieChart sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h6">Réclamations par statut</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {[
                { label: 'En attente', value: 12, color: 'warning.main' },
                { label: 'En cours', value: 18, color: 'info.main' },
                { label: 'Résolues', value: 28, color: 'success.main' },
                { label: 'Fermées', value: 5, color: 'error.main' },
              ].map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 2,
                    minWidth: 100,
                  }}
                >
                  <Typography variant="h5" sx={{ color: item.color }}>
                    {item.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
        
        <Box>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Receipt sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">Facturation du mois</Typography>
            </Box>
            <Box>
              <Typography variant="h4" gutterBottom>
                12 850 €
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="body2" color="success.main">
                  +1 250 € vs mois dernier
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                28 factures générées ce mois
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage;