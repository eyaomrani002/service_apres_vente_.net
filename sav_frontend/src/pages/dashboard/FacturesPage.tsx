import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, CircularProgress, Snackbar, Alert, Button } from '@mui/material';
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
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [interventionsSansFacture, setInterventionsSansFacture] = useState<any[]>([]);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [filters, setFilters] = useState<FactureFilterParams>({});

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
      setInterventionsSansFacture(data);
    } catch (error) {
      console.warn('Impossible de charger les interventions sans facture', error);
    }
  };

  useEffect(() => {
    loadFactures();
    loadInterventions();
  }, []);

  const handleSearch = (payload: FactureFilterParams) => {
    setFilters(payload);
    loadFactures(payload);
  };

  const handleCreate = async (payload: Partial<Facture>) => {
    try {
      await factureService.create(payload);
      setMessage('Facture créée avec succès');
      setMessageType('success');
      setOpenForm(false);
      loadFactures(filters);
      loadInterventions();
    } catch (error: any) {
      setMessage(error.message || 'Erreur lors de la création');
      setMessageType('error');
    }
  };

  const handleMarkPaid = async (facture: Facture) => {
    try {
      await factureService.changeStatus(facture.id, 'Payée');
      setMessage('Statut mis à jour');
      setMessageType('success');
      loadFactures(filters);
    } catch (error: any) {
      setMessage(error.message || 'Impossible de mettre à jour');
      setMessageType('error');
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
          <GradientButton startIcon={<Add />} onClick={() => setOpenForm(true)}>
            Créer une facture
          </GradientButton>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={48} sx={{ color: '#2196F3' }} />
          </Box>
        ) : (
          <FacturesTable factures={factures} onView={(f) => setSelectedFacture(f)} onMarkPaid={handleMarkPaid} />
        )}
      </Panel>

      <FactureForm
        open={openForm}
        interventions={interventionsSansFacture}
        onClose={() => setOpenForm(false)}
        onSave={handleCreate}
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