// ClientsPage.tsx - Version modernisée
import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, CircularProgress, Snackbar, Alert, Grid, Card, CardContent, Typography, Chip, Avatar } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Add, People, TrendingUp, Assignment, CheckCircle } from '@mui/icons-material';
import PageTitle from '../../components/common/PageTitle';
import ClientsTable from '../../components/clients/ClientsTable';
import ClientForm from '../../components/clients/ClientForm';
import ClientFilters from '../../components/clients/ClientFilters';
import { Client } from '../../types/client';
import { clientService } from '../../services/clientService';
import ClientDetailsDialog from '../../components/clients/ClientDetailsDialog';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

// Styled Components
const ModernCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(0, 188, 212, 0.05) 100%)',
  border: '1px solid rgba(33, 150, 243, 0.1)',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  animation: `${fadeIn} 0.6s ease`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(33, 150, 243, 0.15)',
    border: '1px solid rgba(33, 150, 243, 0.3)',
  },
}));

const StatsAvatar = styled(Avatar)(({ theme }) => ({
  width: 56,
  height: 56,
  background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
  boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
  color: '#fff',
  fontWeight: 700,
  padding: '10px 24px',
  borderRadius: '12px',
  textTransform: 'none',
  boxShadow: '0 4px 20px rgba(33, 150, 243, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(33, 150, 243, 0.4)',
    background: 'linear-gradient(135deg, #1976D2 0%, #0097A7 100%)',
  },
}));

const ModernPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '20px',
  padding: '32px',
  background: 'rgba(255, 255, 255, 0.98)',
  border: '1px solid rgba(33, 150, 243, 0.1)',
  boxShadow: '0 8px 32px rgba(33, 150, 243, 0.08)',
  animation: `${fadeIn} 0.6s ease 0.2s both`,
}));

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [stats, setStats] = useState<{ total?: number; withReclamations?: number } | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await clientService.getAll();
      setClients(data || []);
      const s = await clientService.getStats();
      setStats({ total: s?.TotalClients, withReclamations: s?.ClientsAvecReclamations });
    } catch (e: any) {
      showMessage(e.message || 'Erreur chargement', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  const handleSearch = async (q: any) => {
    setLoading(true);
    try {
      const data = await clientService.advancedSearch(q);
      setClients(data || []);
    } catch (e: any) { 
      showMessage(e.message || 'Erreur recherche', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleCreate = () => { 
    setEditing(null); 
    setOpenForm(true); 
  };

  const handleEdit = (c: Client) => { 
    setEditing(c); 
    setOpenForm(true); 
  };

  const handleDelete = async (id: number) => { 
    if (!confirm('Confirmer la suppression de ce client ?')) return; 
    try { 
      await clientService.delete(id); 
      showMessage('Client supprimé avec succès', 'success'); 
      load(); 
    } catch (e: any) { 
      showMessage(e.message || 'Erreur suppression', 'error'); 
    } 
  };

  const handleSave = async (payload: Partial<Client>) => {
    try {
      if (editing) {
        await clientService.update(editing.id, payload);
        showMessage('Client modifié avec succès', 'success');
      } else {
        await clientService.create(payload);
        showMessage('Client créé avec succès', 'success');
      }
      setOpenForm(false); 
      load();
    } catch (e: any) { 
      showMessage(e.message || 'Erreur sauvegarde', 'error'); 
    }
  };

  const handleView = (c: Client) => { 
    setSelected(c); 
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageTitle 
        title="Gestion des Clients" 
        subtitle="Gérez et suivez tous vos clients" 
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/dashboard' }, 
          { label: 'Clients' }
        ]} 
      />

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <ModernCard>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StatsAvatar>
                  <People sx={{ fontSize: 32 }} />
                </StatsAvatar>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Total Clients
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#2196F3' }}>
                    {stats.total ?? '-'}
                  </Typography>
                </Box>
              </CardContent>
            </ModernCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <ModernCard>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StatsAvatar sx={{ background: 'linear-gradient(135deg, #00BCD4 0%, #26C6DA 100%)' }}>
                  <Assignment sx={{ fontSize: 32 }} />
                </StatsAvatar>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Avec Réclamations
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#00BCD4' }}>
                    {stats.withReclamations ?? '-'}
                  </Typography>
                </Box>
              </CardContent>
            </ModernCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <ModernCard>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StatsAvatar sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)' }}>
                  <CheckCircle sx={{ fontSize: 32 }} />
                </StatsAvatar>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Taux de Satisfaction
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#4CAF50' }}>
                    95%
                  </Typography>
                </Box>
              </CardContent>
            </ModernCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <ModernCard>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StatsAvatar sx={{ background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)' }}>
                  <TrendingUp sx={{ fontSize: 32 }} />
                </StatsAvatar>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Nouveaux ce mois
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#FF9800' }}>
                    +12
                  </Typography>
                </Box>
              </CardContent>
            </ModernCard>
          </Grid>
        </Grid>
      )}

      <ModernPaper>
        {/* Header avec filtres et bouton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: '300px' }}>
            <ClientFilters onSearch={handleSearch} />
          </Box>
          <GradientButton 
            startIcon={<Add />} 
            onClick={handleCreate}
          >
            Nouveau Client
          </GradientButton>
        </Box>

        {/* Table ou Loading */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={60} thickness={4} sx={{ color: '#2196F3' }} />
          </Box>
        ) : (
          <ClientsTable 
            clients={clients} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            onView={handleView} 
          />
        )}
      </ModernPaper>

      {/* Dialogs */}
      <ClientForm 
        open={openForm} 
        client={editing} 
        onClose={() => setOpenForm(false)} 
        onSave={handleSave} 
      />
      
      <ClientDetailsDialog 
        open={!!selected} 
        client={selected} 
        onClose={() => setSelected(null)} 
      />

      {/* Snackbar */}
      <Snackbar 
        open={!!message} 
        autoHideDuration={4000} 
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setMessage(null)} 
          severity={messageType}
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientsPage;