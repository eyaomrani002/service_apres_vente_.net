// ReclamationsPage.tsx - Version modernisée
import React, { useContext, useEffect, useState } from 'react';
import { Box, Paper, CircularProgress, Snackbar, Alert, Button, Grid, Card, CardContent, Typography, Avatar } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Add, Assignment, Schedule, CheckCircle, Warning, TrendingUp } from '@mui/icons-material';
import PageTitle from '../../components/common/PageTitle';
import ReclamationFilters from '../../components/reclamations/ReclamationFilters';
import ReclamationsTable from '../../components/reclamations/ReclamationsTable';
import ReclamationForm from '../../components/reclamations/ReclamationForm';
import { Reclamation } from '../../types/reclamation';
import { reclamationService } from '../../services/reclamationService';
import { clientService } from '../../services/clientService';
import AuthContext from '../../contexts/AuthContext';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
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

const ReclamationsPage: React.FC = () => {
  const [items, setItems] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Reclamation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [stats, setStats] = useState<any>(null);
  const [selected, setSelected] = useState<Reclamation | null>(null);
  const [currentClientId, setCurrentClientId] = useState<string | number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isTechnicien, setIsTechnicien] = useState<boolean>(false);
  const { user } = useContext(AuthContext);

  const load = async () => {
    console.log('load called', { isAdmin, isTechnicien, currentClientId, user });
    setLoading(true);
    try {
      if (isTechnicien && user?.id) {
        console.log('Loading as technician');
        // Technicien voit les réclamations qui lui sont assignées
        const data = await reclamationService.getByTechnicien(Number(user.id));
        console.log('Technician data:', data);
        setItems(Array.isArray(data) ? data : []);
        setStats(null); // stats réservées admin
      } else if (!isAdmin) {
        console.log('Loading as client - temporarily showing all reclamations');
        // TEMPORAIRE : Les clients voient toutes les réclamations jusqu'à ce que la liaison Auth0/Client soit établie
        const allData = await reclamationService.getAll();
        setItems(Array.isArray(allData) ? allData : []);
        setStats(null); // stats réservées admin
      } else {
        console.log('Loading as admin');
        const data = await reclamationService.getAll();
        console.log('Admin data:', data);
        setItems(Array.isArray(data) ? data : []);
        try {
          const s = await reclamationService.getStats();
          console.log('Admin stats:', s);
          setStats(s);
        } catch (statsError) {
          console.log('Stats error:', statsError);
        }
      }
    } catch (e: any) {
      console.log('Load error:', e);
      showMessage(e.message || 'Erreur chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          const roles = (parsed?.roles || parsed?.role || []).map((r: string) => (r.toLowerCase ? r.toLowerCase() : r));
          const isTechnicien = Array.isArray(roles) ? roles.includes('technicien') : roles === 'technicien';
          const isAdmin = Array.isArray(roles) ? roles.includes('admin') : roles === 'admin';
          
          // Pour les techniciens, convertir en number, pour les clients garder comme string
          if (isTechnicien) {
            const id = Number(parsed.id);
            if (!isNaN(id) && isFinite(id)) {
              setCurrentClientId(id);
            }
          } else if (!isAdmin) {
            // Pour les clients, garder l'ID comme string (peut être UUID Auth0)
            setCurrentClientId(parsed.id);
          }
        }
        const roles = (parsed?.roles || parsed?.role || []).map((r: string) => (r.toLowerCase ? r.toLowerCase() : r));
        setIsAdmin(Array.isArray(roles) ? roles.includes('admin') : roles === 'admin');
        setIsTechnicien(Array.isArray(roles) ? roles.includes('technicien') : roles === 'technicien');
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      const roles = (user.roles || user.role || []).map((r: string) => (r.toLowerCase ? r.toLowerCase() : r));
      console.log('User roles:', roles, 'user:', user);
      setIsAdmin(Array.isArray(roles) ? roles.includes('admin') : roles === 'admin');
      setIsTechnicien(Array.isArray(roles) ? roles.includes('technicien') : roles === 'technicien');
      if (user.id) {
        const isTechnicien = Array.isArray(roles) ? roles.includes('technicien') : roles === 'technicien';
        const isAdmin = Array.isArray(roles) ? roles.includes('admin') : roles === 'admin';
        
        // Pour les techniciens, convertir en number, pour les clients garder comme string
        if (isTechnicien) {
          const id = Number(user.id);
          if (!isNaN(id) && isFinite(id)) {
            setCurrentClientId(id);
          }
        } else if (!isAdmin) {
          // Pour les clients, garder l'ID comme string
          console.log('Setting currentClientId for client:', user.id);
          setCurrentClientId(user.id);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if ((!isAdmin && !isTechnicien && currentClientId === null) || (isTechnicien && !user?.id)) return;
    load();
  }, [isAdmin, isTechnicien, currentClientId, user?.id]);

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  const handleSearch = async (q: { searchTerm?: string; clientId?: number; statut?: string }) => {
    setLoading(true);
    try {
      if (isTechnicien && user?.id) {
        // Technicien ne peut rechercher que dans ses réclamations assignées
        const data = await reclamationService.getByTechnicien(Number(user.id));
        let list: Reclamation[] = Array.isArray(data) ? data : [];
        if (q.searchTerm) {
          const term = q.searchTerm.toLowerCase();
          list = list.filter(r => (r.sujet || '').toLowerCase().includes(term) || (r.description || '').toLowerCase().includes(term));
        }
        if (q.statut) {
          list = list.filter(r => (r.statut || '').toLowerCase() === q.statut!.toLowerCase());
        }
        setItems(list);
        return;
      }

      const effectiveClientId = isAdmin ? q.clientId : currentClientId ?? undefined;

      if (!isAdmin) {
        // TEMPORAIRE : Les clients voient toutes les réclamations jusqu'à ce que la liaison Auth0/Client soit établie
        const data = await reclamationService.getAll();
        let list: Reclamation[] = Array.isArray(data) ? data : [];
        if (q.searchTerm) {
          const term = q.searchTerm.toLowerCase();
          list = list.filter(r => (r.sujet || '').toLowerCase().includes(term) || (r.description || '').toLowerCase().includes(term));
        }
        if (q.statut) {
          list = list.filter(r => (r.statut || '').toLowerCase() === q.statut!.toLowerCase());
        }
        setItems(list);
        return;
      }

      if (effectiveClientId) {
        const data = await reclamationService.getByClient(effectiveClientId);
        setItems(Array.isArray(data) ? data : []);
        return;
      }

      const data = await reclamationService.getAll();
      let list: Reclamation[] = Array.isArray(data) ? data : [];
      if (q.searchTerm) {
        const term = q.searchTerm.toLowerCase();
        list = list.filter(r => (r.sujet || '').toLowerCase().includes(term) || (r.description || '').toLowerCase().includes(term));
      }
      if (q.statut) {
        list = list.filter(r => (r.statut || '').toLowerCase() === q.statut!.toLowerCase());
      }
      setItems(list);
    } catch (e: any) {
      showMessage(e.message || 'Erreur recherche', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    console.log('handleCreate called', { isAdmin, isTechnicien, currentClientId, user });
    setEditing(null);
    setOpenForm(true);
  };

  const handleEdit = (r: Reclamation) => { 
    setEditing(r); 
    setOpenForm(true); 
  };

  const handleDelete = async (id: number) => { 
    if (!confirm('Confirmer la suppression de cette réclamation ?')) return; 
    try { 
      await reclamationService.delete(id); 
      showMessage('Réclamation supprimée avec succès', 'success'); 
      load(); 
    } catch (e: any) { 
      showMessage(e.message || 'Erreur suppression', 'error'); 
    } 
  };

  const handleSave = async (payload: Partial<Reclamation>) => {
    console.log('handleSave called', { payload, isAdmin, currentClientId, user });
    try {
      const body: Partial<Reclamation> = { ...payload };
      if (!isAdmin && (currentClientId || user?.id)) {
        body.clientId = currentClientId || user?.id;
        console.log('Forcing clientId to:', body.clientId);
      }

      if (editing) {
        await reclamationService.update(editing.id, body);
        showMessage('Réclamation modifiée avec succès', 'success');
      } else {
        await reclamationService.create(body);
        showMessage('Réclamation créée avec succès', 'success');
      }
      setOpenForm(false);
      load();
    } catch (e: any) {
      showMessage(e.message || 'Erreur sauvegarde', 'error');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageTitle 
        title="Gestion des Réclamations" 
        subtitle="Gérez et suivez toutes les réclamations clients" 
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/dashboard' }, 
          { label: 'Réclamations' }
        ]} 
      />

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {'Total' in stats && (
            <Grid item xs={12} sm={6} md={3}>
              <ModernCard>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <StatsAvatar>
                    <Assignment sx={{ fontSize: 32 }} />
                  </StatsAvatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Total Réclamations
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#2196F3' }}>
                      {stats.Total}
                    </Typography>
                  </Box>
                </CardContent>
              </ModernCard>
            </Grid>
          )}

          {'EnAttente' in stats && (
            <Grid item xs={12} sm={6} md={3}>
              <ModernCard>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <StatsAvatar sx={{ background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)' }}>
                    <Schedule sx={{ fontSize: 32 }} />
                  </StatsAvatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      En Attente
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#FF9800' }}>
                      {stats.EnAttente}
                    </Typography>
                  </Box>
                </CardContent>
              </ModernCard>
            </Grid>
          )}

          {'EnCours' in stats && (
            <Grid item xs={12} sm={6} md={3}>
              <ModernCard>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <StatsAvatar sx={{ background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)' }}>
                    <TrendingUp sx={{ fontSize: 32 }} />
                  </StatsAvatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      En Cours
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#2196F3' }}>
                      {stats.EnCours}
                    </Typography>
                  </Box>
                </CardContent>
              </ModernCard>
            </Grid>
          )}

          {'Resolues' in stats && (
            <Grid item xs={12} sm={6} md={3}>
              <ModernCard>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <StatsAvatar sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)' }}>
                    <CheckCircle sx={{ fontSize: 32 }} />
                  </StatsAvatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Résolues
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#4CAF50' }}>
                      {stats.Resolues}
                    </Typography>
                  </Box>
                </CardContent>
              </ModernCard>
            </Grid>
          )}

          {'EnRetard' in stats && stats.EnRetard > 0 && (
            <Grid item xs={12} sm={6} md={3}>
              <ModernCard>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <StatsAvatar sx={{ background: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)' }}>
                    <Warning sx={{ fontSize: 32 }} />
                  </StatsAvatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      En Retard
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#f44336' }}>
                      {stats.EnRetard}
                    </Typography>
                  </Box>
                </CardContent>
              </ModernCard>
            </Grid>
          )}
        </Grid>
      )}

      <ModernPaper>
        {/* Header avec filtres et bouton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: '300px' }}>
            <ReclamationFilters onSearch={handleSearch} disableClientFilter={!isAdmin || isTechnicien} isAdmin={isAdmin} />
          </Box>
          {!isTechnicien && (
            <GradientButton 
              startIcon={<Add />} 
              onClick={() => {
                console.log('Create button clicked', { isAdmin, isTechnicien, currentClientId, user });
                handleCreate();
              }}
            >
              Nouvelle Réclamation
            </GradientButton>
          )}
        </Box>

        {/* Table ou Loading */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={60} thickness={4} sx={{ color: '#2196F3' }} />
          </Box>
        ) : (
          <ReclamationsTable 
            items={items} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            onView={(r) => setSelected(r)} 
            canEditDelete={isAdmin}
          />
        )}
      </ModernPaper>

      {/* Form Dialog */}
      <ReclamationForm 
        open={openForm} 
        reclamation={editing} 
        onClose={() => {
          console.log('Form closed');
          setOpenForm(false);
        }} 
        onSave={handleSave} 
        initialData={!isAdmin && !editing ? { clientId: currentClientId || user?.id || undefined } : undefined}
        lockClient={!isAdmin && !editing && !!(currentClientId || user?.id)}
        currentUser={user as any}
        isAdmin={isAdmin}
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

export default ReclamationsPage;