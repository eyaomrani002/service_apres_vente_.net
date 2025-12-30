// InterventionsPage.tsx - Version corrigée avec "Voir les détails"
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Snackbar, Alert, CircularProgress, Grid, Card, CardContent, 
  Typography, Avatar, Button, Paper, Stack, TextField, MenuItem
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Add, Assignment, TrendingUp, AttachMoney, Schedule } from '@mui/icons-material';
import PageTitle from '../../components/common/PageTitle';
import InterventionFilters from '../../components/interventions/InterventionFilters';
import InterventionsTable from '../../components/interventions/InterventionsTable';
import InterventionForm from '../../components/interventions/InterventionForm';
import InterventionDetailsDialog from '../../components/interventions/InterventionDetailsDialog'; // IMPORTANT
import { Intervention } from '../../types/intervention';
import { interventionService } from '../../services/interventionService';
import AuthContext from '../../contexts/AuthContext';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const ModernPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '24px',
  padding: '28px',
  background: 'rgba(255, 255, 255, 0.98)',
  border: '1px solid rgba(33, 150, 243, 0.15)',
  boxShadow: '0 16px 40px rgba(33, 150, 243, 0.1)',
  animation: `${fadeIn} 0.5s ease`,
}));

const ModernCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(3, 169, 244, 0.02))',
  boxShadow: '0 8px 32px rgba(33, 150, 243, 0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(33, 150, 243, 0.15)',
  },
}));

const StatsAvatar = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
  boxShadow: '0 8px 20px rgba(33, 150, 243, 0.4)',
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
  color: '#fff',
  fontWeight: 700,
  padding: '12px 28px',
  borderRadius: '14px',
  textTransform: 'none',
  boxShadow: '0 12px 28px rgba(33, 150, 243, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 16px 32px rgba(33, 150, 243, 0.4)',
    background: 'linear-gradient(135deg, #1976D2 0%, #0097A7 100%)',
  },
}));

const InterventionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Intervention | null>(null);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null); // NOUVEAU STATE
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [stats, setStats] = useState<any>(null);
  const [, setLoadingAction] = useState(false);
  const [quickTechnicienId, setQuickTechnicienId] = useState('');
  const [quickStatut, setQuickStatut] = useState('');
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentClientId, setCurrentClientId] = useState<number | null>(null);
  const { user } = React.useContext(AuthContext);
  const [isTechnicien, setIsTechnicien] = useState(false);

  type SearchPayload = {
    searchTerm?: string;
    technicienId?: number;
    statut?: string;
    reclamationId?: number;
    clientId?: number;
    dateDebut?: string;
    dateFin?: string;
    estGratuite?: boolean;
    coutMin?: number;
    coutMax?: number;
    mode?: 'gratuite' | 'payante' | 'sans-facture';
  };

  // Charger les interventions
  const load = async () => {
    setLoading(true);
    try {
      if (isTechnicien && user?.id) {
        // Filtrer interventions du technicien connecté
        const data = await interventionService.byTechnicien(Number(user.id));
        setItems(Array.isArray(data) ? data : []);
        setStats(null);
        return;
      }
      if (!isAdmin && currentClientId) {
        try {
          const scoped = await interventionService.advancedSearch({ clientId: currentClientId } as any);
          setItems(Array.isArray(scoped) ? scoped : []);
          setStats(null);
          return;
        } catch (e) {
          console.warn('Filtrage des interventions pour le client connecté indisponible', e);
        }
      }

      const data = await interventionService.getAll();
      setItems(Array.isArray(data) ? data : []);
      try { 
        const s = isAdmin ? await interventionService.getStats() : null; 
        setStats(s); 
      } catch {}
    } catch (e: any) {
      showMessage(e.message || 'Erreur de chargement', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    if (user) {
      const roles = (user.roles || user.role || []).map((r: string) => (r.toLowerCase ? r.toLowerCase() : r));
      setIsAdmin(Array.isArray(roles) ? roles.includes('admin') : roles === 'admin');
      setIsTechnicien(Array.isArray(roles) ? roles.includes('technicien') : roles === 'technicien');
      if (user.id) {
        const id = Number(user.id);
        if (!isNaN(id) && isFinite(id)) {
          setCurrentClientId(id);
        }
      }
      return;
    }
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          const id = Number(parsed.id);
          if (!isNaN(id) && isFinite(id)) {
            setCurrentClientId(id);
          }
        }
        const roles = (parsed?.roles || parsed?.role || []).map((r: string) => (r.toLowerCase ? r.toLowerCase() : r));
        setIsAdmin(Array.isArray(roles) ? roles.includes('admin') : roles === 'admin');
        setIsTechnicien(Array.isArray(roles) ? roles.includes('technicien') : roles === 'technicien');
      }
    } catch {}
  }, [user]);

  useEffect(() => { 
    load(); 
  }, [isAdmin, isTechnicien, currentClientId]);

  // Fonction pour afficher les messages
  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  // Gestion de la recherche
  const handleSearch = async (q: SearchPayload) => {
    setLoading(true);
    try {
      const effectiveQuery = (!isAdmin && currentClientId) ? { ...q, clientId: currentClientId } : q;

      if (q.mode === 'sans-facture') {
        const data = await interventionService.sansFacture();
        setItems(Array.isArray(data) ? data : []);
      } else if (q.mode === 'gratuite') {
        const data = await interventionService.gratuites();
        setItems(Array.isArray(data) ? data : []);
      } else if (q.mode === 'payante') {
        const data = await interventionService.payantes();
        setItems(Array.isArray(data) ? data : []);
      } else if (q.reclamationId) {
        const data = await interventionService.byReclamation(q.reclamationId);
        setItems(Array.isArray(data) ? data : []);
      } else if (
        effectiveQuery.technicienId ||
        effectiveQuery.statut ||
        effectiveQuery.searchTerm ||
        effectiveQuery.dateDebut ||
        effectiveQuery.dateFin ||
        effectiveQuery.estGratuite !== undefined ||
        effectiveQuery.coutMin !== undefined ||
        effectiveQuery.coutMax !== undefined ||
        effectiveQuery.clientId !== undefined
      ) {
        const data = await interventionService.advancedSearch(effectiveQuery as any);
        setItems(Array.isArray(data) ? data : []);
      } else {
        const data = await interventionService.getAll();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (e: any) { 
      showMessage(e.message || 'Erreur de recherche', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  // Gestion des actions
  const handleCreate = () => { 
    setEditing(null); 
    setOpenForm(true); 
  };

  const handleEdit = (intervention: Intervention) => { 
    setEditing(intervention); 
    setOpenForm(true); 
  };

  // CORRECTION : Fonction pour gérer "Voir les détails"
  const handleView = async (intervention: Intervention) => { 
    try {
      setLoadingAction(true);
      const fresh = await interventionService.getById(intervention.id);
      setSelectedIntervention(fresh);
    } catch (e: any) {
      showMessage(e.message || 'Impossible de charger le détail', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id: number) => { 
    if (!confirm('Confirmer la suppression de cette intervention ?')) return; 
    try { 
      await interventionService.delete(id); 
      showMessage('Intervention supprimée avec succès', 'success'); 
      load(); 
    } catch (e: any) { 
      showMessage(e.message || 'Erreur de suppression', 'error'); 
    } 
  };

  const handleSave = async (payload: Partial<Intervention>) => {
    try {
      setLoadingAction(true);
      const body = { ...payload };
      if (!isAdmin && currentClientId) {
        body.clientId = currentClientId;
      }

      if (editing) {
        await interventionService.update(editing.id, body);
        showMessage('Intervention modifiée avec succès', 'success');
      } else {
        await interventionService.create(body);
        showMessage('Intervention créée avec succès', 'success');
      }
      setOpenForm(false); 
      load();
    } catch (e: any) { 
      showMessage(e.message || 'Erreur de sauvegarde', 'error'); 
    } finally {
      setLoadingAction(false);
    }
  };

  const handleChangeStatus = async (id: number, statut: string) => {
    try {
      setLoadingAction(true);
      await interventionService.changeStatus(id, statut);
      showMessage('Statut mis à jour', 'success');
      load();
    } catch (e: any) {
      showMessage(e.message || 'Erreur de changement de statut', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleGenerateInvoice = async (id: number) => {
    navigate('/factures', { state: { interventionId: id } });
  };

  const loadEnRetard = async () => {
    try {
      setLoading(true);
      const data = await interventionService.enRetard();
      setItems(Array.isArray(data) ? data : []);
      showMessage('Interventions en retard', 'info');
    } catch (e: any) {
      showMessage(e.message || 'Erreur filtre en retard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadByTechnicien = async () => {
    if (!quickTechnicienId) {
      showMessage('Saisir un ID technicien', 'error');
      return;
    }
    try {
      setLoading(true);
      const data = await interventionService.byTechnicien(Number(quickTechnicienId));
      setItems(Array.isArray(data) ? data : []);
      showMessage(`Technicien ${quickTechnicienId}`, 'info');
    } catch (e: any) {
      showMessage(e.message || 'Erreur filtre technicien', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadByStatut = async () => {
    if (!quickStatut) {
      showMessage('Saisir un statut', 'error');
      return;
    }
    try {
      setLoading(true);
      const data = await interventionService.byStatut(quickStatut);
      setItems(Array.isArray(data) ? data : []);
      showMessage(`Statut ${quickStatut}`, 'info');
    } catch (e: any) {
      showMessage(e.message || 'Erreur filtre statut', 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickSearch = async () => {
    if (!quickSearchTerm.trim()) {
      showMessage('Saisir un terme', 'error');
      return;
    }
    try {
      setLoading(true);
      const data = await interventionService.search(quickSearchTerm.trim());
      setItems(Array.isArray(data) ? data : []);
      showMessage('Recherche rapide effectuée', 'info');
    } catch (e: any) {
      showMessage(e.message || 'Erreur de recherche', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Formater les montants en euros
  const formatCurrency = (value?: number) => {
    if (value == null || isNaN(value)) return '-';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Calculer les statistiques locales
  const calculateLocalStats = () => {
    if (!items.length) return {};
    
    const total = items.length;
    const terminées = items.filter(i => i.statut?.toLowerCase() === 'terminée').length;
    const enCours = items.filter(i => i.statut?.toLowerCase() === 'en cours').length;
    const planifiées = items.filter(i => i.statut?.toLowerCase() === 'planifiée').length;
    const totalCout = items.reduce((sum, i) => sum + (i.coutTotal || 0), 0);
    const moyenneCout = items.length > 0 ? totalCout / items.length : 0;
    
    return {
      total,
      terminées,
      enCours,
      planifiées,
      totalCout,
      moyenneCout
    };
  };

  const localStats = calculateLocalStats();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageTitle 
        title="Gestion des Interventions" 
        subtitle="Suivi complet des interventions" 
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/dashboard' }, 
          { label: 'Interventions' }
        ]} 
      />

      {/* Cartes de statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Interventions */}
        <Grid item xs={12} sm={6} md={3}>
          <ModernCard>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StatsAvatar>
                <Assignment sx={{ fontSize: 30 }} />
              </StatsAvatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Interventions totales
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#2196F3' }}>
                  {localStats.total || 0}
                </Typography>
              </Box>
            </CardContent>
          </ModernCard>
        </Grid>

        {/* En Cours */}
        <Grid item xs={12} sm={6} md={3}>
          <ModernCard>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StatsAvatar sx={{ background: 'linear-gradient(135deg, #00ACC1 0%, #26C6DA 100%)' }}>
                <TrendingUp sx={{ fontSize: 30 }} />
              </StatsAvatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  En cours
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#00ACC1' }}>
                  {localStats.enCours || 0}
                </Typography>
              </Box>
            </CardContent>
          </ModernCard>
        </Grid>

        {/* Terminées */}
        <Grid item xs={12} sm={6} md={3}>
          <ModernCard>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StatsAvatar sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)' }}>
                <Assignment sx={{ fontSize: 30 }} />
              </StatsAvatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Terminées
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#4CAF50' }}>
                  {localStats.terminées || 0}
                </Typography>
              </Box>
            </CardContent>
          </ModernCard>
        </Grid>

        {/* Coût Total */}
        <Grid item xs={12} sm={6} md={3}>
          <ModernCard>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StatsAvatar sx={{ background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)' }}>
                <AttachMoney sx={{ fontSize: 30 }} />
              </StatsAvatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Coût total
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#F57C00' }}>
                  {formatCurrency(localStats.totalCout)}
                </Typography>
              </Box>
            </CardContent>
          </ModernCard>
        </Grid>
      </Grid>

      <ModernPaper>
        {/* Header avec filtres et bouton */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3, 
          flexWrap: 'wrap', 
          gap: 2 
        }}>
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <InterventionFilters onSearch={handleSearch} isAdmin={isAdmin} />
          </Box>
          <GradientButton 
            startIcon={<Add />} 
            onClick={handleCreate}
          >
            Nouvelle intervention
          </GradientButton>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          <Button size="small" variant="contained" color="warning" onClick={loadEnRetard}>En retard</Button>
          <TextField size="small" label="ID technicien" value={quickTechnicienId} onChange={(e) => setQuickTechnicienId(e.target.value)} />
          <Button size="small" variant="outlined" onClick={loadByTechnicien}>Par technicien</Button>
          <TextField size="small" select label="Statut" value={quickStatut} onChange={(e) => setQuickStatut(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="Planifiée">Planifiée</MenuItem>
            <MenuItem value="En cours">En cours</MenuItem>
            <MenuItem value="Terminée">Terminée</MenuItem>
            <MenuItem value="Annulée">Annulée</MenuItem>
          </TextField>
          <Button size="small" variant="outlined" onClick={loadByStatut}>Par statut</Button>
          <TextField size="small" label="Recherche rapide" value={quickSearchTerm} onChange={(e) => setQuickSearchTerm(e.target.value)} />
          <Button size="small" variant="outlined" onClick={quickSearch}>Rechercher</Button>
        </Stack>

        {/* Table ou Loading */}
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            py: 6 
          }}>
            <CircularProgress size={48} thickness={4} sx={{ color: '#2196F3' }} />
          </Box>
        ) : (
          <InterventionsTable 
            items={items} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            onView={handleView} 
            onChangeStatus={handleChangeStatus}
            onGenerateInvoice={handleGenerateInvoice}
          />
        )
        }
      </ModernPaper>

      {/* Formulaire d'intervention */}
      <InterventionForm 
        open={openForm} 
        intervention={editing} 
        onClose={() => setOpenForm(false)} 
        onSave={handleSave} 
        isAdmin={isAdmin}
        currentUser={user as any}
      />

      {/* Dialog de détails - CORRECTION : Ajouté */}
      <InterventionDetailsDialog 
        open={!!selectedIntervention} 
        intervention={selectedIntervention} 
        onClose={() => setSelectedIntervention(null)} 
      />

      {/* Snackbar pour les messages */}
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
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InterventionsPage;