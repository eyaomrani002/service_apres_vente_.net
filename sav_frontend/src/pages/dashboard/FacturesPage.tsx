import React, { useEffect, useMemo, useState, useContext } from 'react';
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
import AuthContext from '../../contexts/AuthContext';
import { clientService } from '../../services/clientService';
import { Client } from '../../types/client';
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
  const [loadingAction, setLoadingAction] = useState(false);

  // Use AuthContext
  const { user } = useContext(AuthContext) as any;
  const [clients, setClients] = useState<Client[]>([]);
  const [currentClientId, setCurrentClientId] = useState<string | number | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isResponsable, setIsResponsable] = useState<boolean>(false);
  const canViewAll = isAdmin || isResponsable;

  // Load all clients for mapping
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const c = await clientService.getAll();
        if (!ignore) setClients(Array.isArray(c) ? c : []);
      } catch {
        if (!ignore) setClients([]);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // Resolve current clientId and roles - FIXED LOGIC
  useEffect(() => {
    if (user) {
      const roles = Array.isArray(user.roles) 
        ? user.roles 
        : typeof user.role === 'string' 
          ? [user.role] 
          : [];
      const rolesLower = roles.map((r: string) => r.toLowerCase());
      
      // Determine roles
      const isAdminLocal = rolesLower.includes('admin');
      const isResponsableLocal = rolesLower.includes('responsablesav');
      setIsAdmin(isAdminLocal);
      setIsResponsable(isResponsableLocal);

      const canViewAllLocal = isAdminLocal || isResponsableLocal;

      if (!canViewAllLocal && user.email) {
        // For non-admin users, we need to find their client record
        console.log('Recherche du client pour l\'utilisateur:', user.email);
        
        // Method 1: Try to find by email in clients list
        const matchingClient = clients.find(c => 
          c.email?.toLowerCase() === user.email?.toLowerCase()
        );
        
        if (matchingClient) {
          console.log('Client trouvé par email:', matchingClient);
          setCurrentClientId(matchingClient.id);
        } else {
          // Method 2: Try to get client by email from API
          (async () => {
            try {
              const clientByEmail = await clientService.getByEmail(user.email);
              if (clientByEmail && clientByEmail.id) {
                console.log('Client trouvé via API getByEmail:', clientByEmail);
                setCurrentClientId(clientByEmail.id);
              } else {
                console.warn('Aucun client trouvé pour l\'email:', user.email);
                setCurrentClientId(null);
              }
            } catch (error) {
              console.warn('Erreur lors de la recherche du client par email:', error);
              setCurrentClientId(null);
            }
          })();
        }
      } else if (canViewAllLocal) {
        // Admin users can see all factures
        setCurrentClientId(null);
      }
    }
  }, [user, clients]);

  const loadFactures = async (query: FactureFilterParams = {}) => {
    setLoading(true);
    try {
      const data = Object.keys(query).length > 0 
        ? await factureService.advancedSearch(query) 
        : await factureService.getAll();
      
      console.log('FacturesPage: factures brutes', data);
      console.log('FacturesPage: user roles', user?.roles || user?.role);
      console.log('FacturesPage: isAdmin', isAdmin);
      console.log('FacturesPage: isResponsable', isResponsable);
      console.log('FacturesPage: currentClientId', currentClientId);
      console.log('FacturesPage: user email', user?.email);

      let final = Array.isArray(data) ? data : [];
      
      // Filter for non-admin/responsable users
      if (!canViewAll && currentClientId) {
        console.log('Filtrage des factures pour le client ID:', currentClientId);
        
        // First, try to find factures by clientId
        final = final.filter(f => f.clientId === currentClientId);
        
        // If no results, try to filter by email
        if (final.length === 0 && user?.email) {
          console.log('Aucune facture trouvée par clientId, tentative par email:', user.email);
          final = (Array.isArray(data) ? data : []).filter(f => 
            f.clientEmail?.toLowerCase() === user.email?.toLowerCase()
          );
        }
        
        console.log('FacturesPage: factures filtrées', final);
      } else if (!canViewAll && !currentClientId && user?.email) {
        // Fallback: if no clientId but we have user email, filter by email
        console.log('Filtrage des factures par email (fallback):', user.email);
        final = (Array.isArray(data) ? data : []).filter(f => 
          f.clientEmail?.toLowerCase() === user.email?.toLowerCase()
        );
      }
      
      // For admin users, show all factures
      console.log('FacturesPage: factures finales à afficher', final);
      setFactures(final);
    } catch (error: any) {
      console.error('Erreur lors du chargement des factures:', error);
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

  // Load factures when user, clients, or currentClientId changes
  useEffect(() => {
    if (user) {
      loadFactures();
    }
  }, [user, clients, currentClientId, canViewAll]);

  // Load interventions once on mount
  useEffect(() => {
    loadInterventions();
  }, []);

  useEffect(() => {
    const state = (location.state || {}) as any;
    if (state && state.interventionId) {
      setPrefillInterventionId(Number(state.interventionId));
      setOpenForm(true);
      navigate(location.pathname, { replace: true });
    }

    // Si on arrive depuis la génération automatique d'une facture, afficher le détail
    if (state && state.createdFacture) {
      const created: Facture = state.createdFacture;
      // Préfixer la liste pour affichage immédiat
      setFactures(prev => [created, ...(prev || [])]);
      setSelectedFacture(created);
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
    // Only allow admin to edit
    if (!isAdmin) {
      setMessage('Seuls les administrateurs peuvent modifier les factures');
      setMessageType('error');
      return;
    }
    setEditingFacture(facture);
    setOpenForm(true);
  };

  const handleMarkPaid = async (facture: Facture) => {
    // Only allow admin to mark as paid
    if (!isAdmin) {
      setMessage('Seuls les administrateurs peuvent modifier le statut des factures');
      setMessageType('error');
      return;
    }
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
        subtitle={canViewAll ? "Gestion complète des factures" : "Vos factures"}
        breadcrumbs={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Factures' }]}
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatsCard title="Factures" value={stats.total} subtitle={`${stats.enAttente} en attente`} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatsCard title="Payées" value={stats.payees} color="success" subtitle="Factures réglées" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatsCard title="Montant moyen" value={`${stats.avg.toFixed(0)} DNT`} color="warning" subtitle="TTC" />
        </Grid>
      </Grid>

      <Panel sx={{ mb: 4 }}>
        {/* Section Filtres - Toujours visible */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <FactureFilters onSearch={handleSearch} />
          </Box>
          
          {/* Bouton Ajouter - Admin et responsablesav */}
          {canViewAll && (
            <GradientButton startIcon={<Add />} onClick={() => { setEditingFacture(null); setOpenForm(true); }}>
              Créer une facture
            </GradientButton>
          )}
        </Box>

        {/* Filtres rapides - Toujours visible */}
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

        {/* Tableau des factures */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={48} sx={{ color: '#2196F3' }} />
          </Box>
        ) : factures.length === 0 ? (
          <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 6, fontSize: 18 }}>
            {isAdmin 
              ? 'Aucune facture trouvée.' 
              : 'Aucune facture trouvée pour votre compte.'}
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

      {/* Formulaire de facture - Admin et responsablesav */}
      {canViewAll && (
        <FactureForm
          open={openForm}
          interventions={interventionsSansFacture}
          facture={editingFacture}
          prefillInterventionId={prefillInterventionId}
          onClose={() => { setOpenForm(false); setPrefillInterventionId(undefined); }}
          onSave={handleSave}
        />
      )}

      {/* Dialogue de détails - Visible pour tous */}
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