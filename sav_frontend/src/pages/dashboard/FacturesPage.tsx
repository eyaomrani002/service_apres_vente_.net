import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Grid, CircularProgress, Snackbar, Alert, Button, TextField, Stack } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Add, ReceiptLong } from '@mui/icons-material';
import PageTitle from '../../components/common/PageTitle';
import StatsCard from '../../components/common/ui/StatsCard';
import FactureFilters from '../../components/factures/FactureFilters';
import FacturesTable from '../../components/factures/FacturesTable';
import FactureForm from '../../components/factures/FactureForm';
import FactureDetailsDialog from '../../components/factures/FactureDetailsDialog';
import { Facture, FactureFilterParams } from '../../types/facture';
import { factureService } from '../../services/factureService';
import { interventionService } from '../../services/interventionService';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Panel = styled(Box)(({ theme }) => ({
  borderRadius: '22px',
  padding: '26px',
  border: '1px solid rgba(33, 150, 243, 0.12)',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(224, 242, 255, 0.7))',
  boxShadow: '0 16px 40px rgba(33, 150, 243, 0.12)',
  animation: `${fadeIn} 0.6s ease`,
}));

const GradientButton = styled(Button)(({ theme }) => ({
  borderRadius: '16px',
  padding: '12px 28px',
  background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
  color: '#fff',
  fontWeight: 700,
  textTransform: 'none',
  boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
  '&:hover': {
    background: 'linear-gradient(135deg, #1976D2 0%, #0097A7 100%)',
  },
}));

const FacturesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [interventionsSansFacture, setInterventionsSansFacture] = useState<any[]>([]);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null);
  const [prefillInterventionId, setPrefillInterventionId] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [filters, setFilters] = useState<FactureFilterParams>({});
  const [quickStatut, setQuickStatut] = useState('');
  const [quickNumero, setQuickNumero] = useState('');
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [quickDateDebut, setQuickDateDebut] = useState('');
  const [quickDateFin, setQuickDateFin] = useState('');
  const [, setLoadingAction] = useState(false);

  const loadFactures = async (query: FactureFilterParams = {}) => {
    setLoading(true);
    try {
      const data = Object.keys(query).length > 0 ? await factureService.advancedSearch(query) : await factureService.getAll();
      setFactures(data);
    } catch (error: any) {
      setMessage(error.message || 'Impossible de charger les factures');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const loadInterventions = async () => {
    try {
      const data = await interventionService.sansFacture();
      if (Array.isArray(data) && data.length > 0) {
        setInterventionsSansFacture(data);
        return;
      }

      // Fallback: si aucune intervention sans facture ou API vide, on charge toutes les interventions
      try {
        const all = await interventionService.getAll();
        setInterventionsSansFacture(Array.isArray(all) ? all : []);
      } catch (errAll) {
        console.warn('Impossible de charger les interventions (fallback all)', errAll);
        setInterventionsSansFacture([]);
      }
    } catch (error) {
      console.warn('Impossible de charger les interventions sans facture', error);
      try {
        const all = await interventionService.getAll();
        setInterventionsSansFacture(Array.isArray(all) ? all : []);
      } catch (errAll) {
        console.warn('Impossible de charger les interventions (fallback all)', errAll);
        setInterventionsSansFacture([]);
      }
    }
  };

  useEffect(() => {
    loadFactures();
    loadInterventions();
  }, []);

  useEffect(() => {
    const state = (location.state || {}) as any;
    if (state && state.interventionId) {
      setPrefillInterventionId(Number(state.interventionId));
      setOpenForm(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  const handleSearch = (payload: FactureFilterParams) => {
    setFilters(payload);
    loadFactures(payload);
  };

  const handleSave = async (payload: Partial<Facture>, id?: number) => {
    try {
      setLoadingAction(true);
      if (id) {
        await factureService.update(id, payload);
        setMessage('Facture mise à jour');
      } else {
        await factureService.create(payload);
        setMessage('Facture créée avec succès');
      }
      setMessageType('success');
      setOpenForm(false);
      setEditingFacture(null);
      setPrefillInterventionId(undefined);
      loadFactures(filters);
      loadInterventions();
    } catch (error: any) {
      setMessage(error.message || 'Erreur lors de la sauvegarde');
      setMessageType('error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (facture: Facture) => {
    if (!confirm(`Supprimer la facture ${facture.numeroFacture} ?`)) return;
    try {
      setLoadingAction(true);
      await factureService.delete(facture.id);
      setMessage('Facture supprimée');
      setMessageType('success');
      loadFactures(filters);
    } catch (error: any) {
      setMessage(error.message || 'Erreur lors de la suppression');
      setMessageType('error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleView = async (facture: Facture) => {
    try {
      setLoadingAction(true);
      const fresh = await factureService.getById(facture.id);
      setSelectedFacture(fresh);
    } catch (error: any) {
      setMessage(error.message || 'Impossible de charger le détail');
      setMessageType('error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEdit = (facture: Facture) => {
    setEditingFacture(facture);
    setOpenForm(true);
  };

  const handleMarkPaid = async (facture: Facture) => {
    try {
      setLoadingAction(true);
      await factureService.changeStatus(facture.id, 'Payée');
      setMessage('Statut mis à jour');
      setMessageType('success');
      loadFactures(filters);
    } catch (error: any) {
      setMessage(error.message || 'Impossible de mettre à jour');
      setMessageType('error');
    } finally {
      setLoadingAction(false);
    }
  };

  // Quick filters
  const loadImpayees = async () => {
    try {
      setLoading(true);
      const data = await factureService.getImpayees();
      setFactures(data);
      setMessage('Filtre : impayées');
      setMessageType('info');
    } catch (error: any) {
      setMessage(error.message || 'Impossible de charger les impayées');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const loadByPeriode = async () => {
    if (!quickDateDebut || !quickDateFin) {
      setMessage('Choisissez une période');
      setMessageType('error');
      return;
    }
    try {
      setLoading(true);
      const data = await factureService.getByPeriode(quickDateDebut, quickDateFin);
      setFactures(data);
      setMessage(`Période ${quickDateDebut} → ${quickDateFin}`);
      setMessageType('info');
    } catch (error: any) {
      setMessage(error.message || 'Erreur période');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const loadByStatut = async () => {
    if (!quickStatut) {
      setMessage('Saisir un statut');
      setMessageType('error');
      return;
    }
    try {
      setLoading(true);
      const data = await factureService.getByStatut(quickStatut);
      setFactures(data);
      setMessage(`Statut ${quickStatut}`);
      setMessageType('info');
    } catch (error: any) {
      setMessage(error.message || 'Erreur filtre statut');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const quickSearch = async () => {
    if (!quickSearchTerm.trim()) {
      setMessage('Saisir un terme de recherche');
      setMessageType('error');
      return;
    }
    try {
      setLoading(true);
      const data = await factureService.search(quickSearchTerm.trim());
      setFactures(data);
      setMessage('Recherche rapide effectuée');
      setMessageType('info');
    } catch (error: any) {
      setMessage(error.message || 'Erreur de recherche');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const searchNumero = async () => {
    if (!quickNumero.trim()) {
      setMessage('Saisir un numéro de facture');
      setMessageType('error');
      return;
    }
    try {
      setLoading(true);
      const data = await factureService.getByNumero(quickNumero.trim());
      setFactures(data ? [data] : []);
      setMessage(`Facture ${quickNumero} chargée`);
      setMessageType('info');
    } catch (error: any) {
      setMessage(error.message || 'Facture introuvable');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = factures.length;
    const payees = factures.filter((f) => f.statut?.toLowerCase() === 'payée').length;
    const enAttente = factures.filter((f) => f.statut?.toLowerCase() === 'en attente').length;
    const avg = total === 0 ? 0 : factures.reduce((sum, f) => sum + (f.montantTTC ?? 0), 0) / total;
    return { total, payees, enAttente, avg };
  }, [factures]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageTitle
        title="Facturation"
        subtitle="Suivi et création des factures"
        breadcrumbs={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Factures' }]}
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatsCard title="Factures" value={stats.total} subtitle={`${stats.enAttente} en attente`} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatsCard title="Payées" value={stats.payees} color="success" subtitle="Toutes les factures réglées" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatsCard title="Montant moyen" value={`${stats.avg.toFixed(0)} €`} color="warning" subtitle="TTC" />
        </Grid>
      </Grid>

      <Panel sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <FactureFilters onSearch={handleSearch} />
          </Box>
          <GradientButton startIcon={<Add />} onClick={() => { setEditingFacture(null); setOpenForm(true); }}>
            Créer une facture
          </GradientButton>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          <Button size="small" variant="contained" color="warning" onClick={loadImpayees}>Impayées</Button>
          <TextField size="small" type="date" label="Début" InputLabelProps={{ shrink: true }} value={quickDateDebut} onChange={(e) => setQuickDateDebut(e.target.value)} />
          <TextField size="small" type="date" label="Fin" InputLabelProps={{ shrink: true }} value={quickDateFin} onChange={(e) => setQuickDateFin(e.target.value)} />
          <Button size="small" variant="outlined" onClick={loadByPeriode}>Par période</Button>
          <TextField size="small" label="Statut" value={quickStatut} onChange={(e) => setQuickStatut(e.target.value)} />
          <Button size="small" variant="outlined" onClick={loadByStatut}>Par statut</Button>
          <TextField size="small" label="N° facture" value={quickNumero} onChange={(e) => setQuickNumero(e.target.value)} />
          <Button size="small" variant="outlined" onClick={searchNumero}>Par numéro</Button>
          <TextField size="small" label="Recherche rapide" value={quickSearchTerm} onChange={(e) => setQuickSearchTerm(e.target.value)} />
          <Button size="small" variant="outlined" onClick={quickSearch}>Rechercher</Button>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={48} sx={{ color: '#2196F3' }} />
          </Box>
        ) : (
          <FacturesTable 
            factures={factures} 
            onView={handleView} 
            onMarkPaid={handleMarkPaid}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Panel>

      <FactureForm
        open={openForm}
        interventions={interventionsSansFacture}
        facture={editingFacture}
        prefillInterventionId={prefillInterventionId}
        onClose={() => { setOpenForm(false); setPrefillInterventionId(undefined); }}
        onSave={handleSave}
      />

      <FactureDetailsDialog
        open={!!selectedFacture}
        facture={selectedFacture}
        onClose={() => setSelectedFacture(null)}
      />

      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setMessage(null)} severity={messageType} variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FacturesPage;