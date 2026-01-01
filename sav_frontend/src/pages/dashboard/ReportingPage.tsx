import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  CircularProgress, 
  Snackbar, 
  Alert, 
  Button, 
  TextField, 
  Stack,
  Typography,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  TablePagination,
  Switch,
  FormControlLabel
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Add, 
  BarChart, 
  Search, 
  FilterList, 
  ClearAll, 
  Refresh,
  Download,
  Visibility,
  PictureAsPdf,
  CalendarMonth,
  AccountBalance,
  Security,
  Person,
  Build,
  Business,
  Delete,
  DateRange
} from '@mui/icons-material';

import PageTitle from '../../components/common/PageTitle';
import StatsCard from '../../components/common/ui/StatsCard';
import ReportFilters from '../../components/reporting/ReportFilters';
import ReportsTable from '../../components/reporting/ReportsTable';
import ReportForm from '../../components/reporting/ReportForm';
import ReportDetailsDialog from '../../components/reporting/ReportDetailsDialog';
import { Report, ReportFilterParams } from '../../types/report';
import { reportingService } from '../../services/reportingService';
import { clientService } from '../../services/clientService';
import { interventionService } from '../../services/interventionService';
import { technicienService } from '../../services/technicienService';
import { reclamationService } from '../../services/reclamationService';
import { getUsers } from '../../services/userService';
import AuthContext from '../../contexts/AuthContext';
import { AppUser } from '../../types/user';
import { Client } from '../../types/client';
import { Intervention } from '../../types/intervention';
import { Technicien } from '../../types/technicien';

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

// Normalise un identifiant pour comparer avec les GUID générés côté backend
const normalizeIdForCompare = (value?: string | number | null) => {
  if (!value) return undefined;
  const str = String(value);
  const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (guidRegex.test(str)) return str;

  const num = Number(str);
  if (!Number.isNaN(num)) {
    const hex = num.toString(16).padStart(32, '0');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
  }

  const hash = Math.abs(str.split('').reduce((acc, ch) => ((acc << 5) - acc) + ch.charCodeAt(0), 0));
  const hex = hash.toString(16).padStart(32, '0');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
};

const ReportingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasRole } = useContext(AuthContext);
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [filters, setFilters] = useState<ReportFilterParams>({});
  
  // États pour les données de référence
  const [clients, setClients] = useState<Client[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [usersWithClientRole, setUsersWithClientRole] = useState<AppUser[]>([]);
  const [allInterventions, setAllInterventions] = useState<Intervention[]>([]);
  const [clientInterventionMap, setClientInterventionMap] = useState<Map<number, Intervention[]>>(new Map());
  const [clientDetails, setClientDetails] = useState<Map<number, {nom: string, email?: string}>>(new Map());
  
  // États pour les filtres rapides
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const [quickDateDebut, setQuickDateDebut] = useState('');
  const [quickDateFin, setQuickDateFin] = useState('');
  const [quickIsWarranty, setQuickIsWarranty] = useState<boolean | null>(null);
  
  // États pour la pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isTechnicien = useMemo(() => hasRole('technicien'), [hasRole]);
  const isResp = useMemo(() => hasRole('responsablesav'), [hasRole]);
  const isAdmin = useMemo(() => hasRole('admin'), [hasRole]);
  const isClient = useMemo(() => hasRole('client'), [hasRole]);

  const normalizedUserId = useMemo(() => normalizeIdForCompare(user?.id), [user?.id]);

  const scopedFetchParams = useMemo(() => ({
    clientId: isClient ? normalizedUserId : undefined,
    technicianId: isTechnicien ? normalizedUserId : undefined,
  }), [isClient, isTechnicien, normalizedUserId]);

  const canAccess = isTechnicien || isResp || isAdmin || isClient;
  const canGenerate = isResp || isAdmin; // clients/techniciens ne génèrent pas
  const canDelete = isAdmin;

  // Charger les rapports
  const loadReports = async (query: ReportFilterParams = {}) => {
    setLoading(true);
    try {
      let baseData = await reportingService.getRecent(100, scopedFetchParams);
      if (!Array.isArray(baseData)) {
        baseData = Array.isArray((baseData as any)?.items) ? (baseData as any).items : [];
      }

      // Si la requête filtrée serveur ne renvoie rien pour un rôle restreint, retenter sans scope et filtrer localement
      if (baseData.length === 0 && (isClient || isTechnicien)) {
        const fallback = await reportingService.getRecent(100);
        if (!Array.isArray(fallback)) {
          baseData = Array.isArray((fallback as any)?.items) ? (fallback as any).items : [];
        } else {
          baseData = fallback;
        }
        baseData = fallback.filter((r) => {
          if (isTechnicien && normalizedUserId && String(r.technicianId || '') !== normalizedUserId) return false;
          if (isClient && normalizedUserId && String(r.clientId || '') !== normalizedUserId) return false;
          return true;
        });
      }

      const filtered = (Object.keys(query).length > 0 ? baseData.filter(report => {
        if (query.clientId && report.clientId !== query.clientId) return false;
        if (query.interventionId && report.interventionId !== query.interventionId) return false;
        if (query.technicianId && report.technicianId !== query.technicianId) return false;
        if (query.isWarranty !== undefined && report.isWarranty !== query.isWarranty) return false;
        if (query.dateDebut && report.generatedAt && new Date(report.generatedAt) < new Date(query.dateDebut)) return false;
        if (query.dateFin && report.generatedAt && new Date(report.generatedAt) > new Date(query.dateFin)) return false;
        if (query.searchTerm) {
          const searchLower = query.searchTerm.toLowerCase();
          return (
            report.title?.toLowerCase().includes(searchLower) ||
            report.clientId?.toLowerCase().includes(searchLower) ||
            report.interventionId?.toLowerCase().includes(searchLower) ||
            false
          );
        }
        return true;
      }) : baseData);

      // Filtrer par rôle côté client en ultime recours
      const scoped = filtered.filter((r) => {
        if (isTechnicien && normalizedUserId && String(r.technicianId || '') !== normalizedUserId) return false;
        if (isClient && normalizedUserId && String(r.clientId || '') !== normalizedUserId) return false;
        return true;
      });
      
      // Si après filtrage il ne reste rien mais la source contenait des données, afficher quand même la source
      if (scoped.length === 0 && baseData.length > 0) {
        setReports(baseData);
      } else {
        setReports(scoped);
      }
    } catch (error: any) {
      setMessage(error.message || 'Impossible de charger les rapports');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données de référence
  const loadReferenceData = async () => {
    try {
      let clientsData: any[] = [];
      let interventionsData: any[] = [];
      let techniciensData: any[] = [];
      let usersData: any[] = [];
      const errors: string[] = [];

      if (isAdmin || isResp) {
        // Admin et responsablesav : accès complet, mais tolérant aux erreurs
        const results = await Promise.allSettled([
          clientService.getAll(),
          interventionService.getAll(),
          technicienService.getAll(),
          getUsers()
        ]);

        const [cRes, iRes, tRes, uRes] = results;
        if (cRes.status === 'fulfilled') clientsData = cRes.value; else errors.push('clients');
        if (iRes.status === 'fulfilled') interventionsData = iRes.value; else errors.push('interventions');
        if (tRes.status === 'fulfilled') techniciensData = tRes.value; else errors.push('techniciens');
        if (uRes.status === 'fulfilled') usersData = uRes.value; else errors.push('utilisateurs');
      } else if (isTechnicien && user?.id) {
        // Technicien : charger uniquement ses interventions/rapports (tolérant)
        const results = await Promise.allSettled([
          clientService.getAll(),
          interventionService.getAll(),
          technicienService.getAll()
        ]);

        const [cRes, iRes, tRes] = results;
        if (cRes.status === 'fulfilled') clientsData = cRes.value; else errors.push('clients');
        if (iRes.status === 'fulfilled') interventionsData = iRes.value; else errors.push('interventions');
        if (tRes.status === 'fulfilled') techniciensData = tRes.value; else errors.push('techniciens');
        usersData = [];
      } else if (isClient && user?.id) {
        // Client : pas besoin de tout charger; on récupère les clients pour mapper id/email
        try {
          clientsData = await clientService.getAll();
        } catch (err: any) {
          errors.push('clients');
        }
        interventionsData = [];
        techniciensData = [];
        usersData = [];
      }

      // Fusionner clients API + utilisateurs Client (pour admin/resp)
      const apiClients: Client[] = Array.isArray(clientsData) ? clientsData : [];
      const usersArray: AppUser[] = Array.isArray(usersData) ? 
        usersData.filter(u => u.roles?.some(role => role.toLowerCase() === 'client')) : [];
      const authClients: Client[] = usersArray.map((u: any, idx: number) => ({
        id: -1000 - idx,
        nom: (u.firstName || u.lastName) ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : (u.fullName || u.userName || u.email || 'Client'),
        email: u.email,
        telephone: u.phoneNumber,
        isAuthUser: true,
        userId: u.id,
      } as Client));
      const merged: Client[] = [...apiClients];
      const seenEmails = new Set(merged.filter(m => m.email).map(m => (m.email as string).toLowerCase()));
      authClients.forEach(cItem => {
        const email = (cItem.email || '').toLowerCase();
        if (email && seenEmails.has(email)) return;
        if (email) seenEmails.add(email);
        merged.push(cItem);
      });
      setClients(merged);
      setAllInterventions(Array.isArray(interventionsData) ? interventionsData : []);
      setTechniciens(Array.isArray(techniciensData) ? techniciensData : []);
      setUsersWithClientRole(usersArray);
      // Mapper les détails des clients
      const clientMap = new Map<number, {nom: string, email?: string}>();
      merged.forEach(client => {
        if (client.id) clientMap.set(client.id, { nom: client.nom, email: client.email });
      });
      setClientDetails(clientMap);
      // Créer la carte interventions/clients
      await mapInterventionsByClient(interventionsData);

      if (errors.length > 0) {
        setMessage(`Certaines données n'ont pas été chargées (${errors.join(', ')}).`);
        setMessageType('info');
      }
    } catch (error: any) {
      console.warn('Erreur lors du chargement des données de référence:', error);
      const is499 = error?.status === 499 || /499/.test(error?.message || '');
      setMessage(is499 ? 'Chargement interrompu. Réessayez pour récupérer toutes les données.' : 'Erreur lors du chargement des données de référence');
      setMessageType(is499 ? 'info' : 'error');
    }
  };

  // Mapper les interventions par client (comme pour les factures)
  const mapInterventionsByClient = async (interventionsData: Intervention[]) => {
    const map = new Map<number, Intervention[]>();
    
    for (const intervention of interventionsData) {
      try {
        let targetClientId: number | undefined;
        
        // 1. Chercher le client via la réclamation (prioritaire)
        if (intervention.reclamationId) {
          try {
            const reclamation = await reclamationService.getById(intervention.reclamationId);
            if (reclamation?.clientId) {
              targetClientId = reclamation.clientId;
            }
          } catch (reclamationErr) {
            console.warn(`Impossible de charger la réclamation ${intervention.reclamationId}`, reclamationErr);
          }
        }
        
        // 2. Sinon utiliser le clientId direct de l'intervention
        if (!targetClientId && intervention.clientId) {
          targetClientId = intervention.clientId;
        }
        
        // Ajouter l'intervention à la carte si on a trouvé un client
        if (targetClientId) {
          const existingList = map.get(targetClientId) || [];
          // Éviter les doublons
          if (!existingList.some(i => i.id === intervention.id)) {
            existingList.push(intervention);
            map.set(targetClientId, existingList);
          }
        }
      } catch (err) {
        console.warn(`Erreur mapping intervention ${intervention.id}:`, err);
      }
    }
    
    setClientInterventionMap(map);
    console.log(`Carte interventions/clients créée: ${map.size} clients, ${Array.from(map.values()).flat().length} interventions`);
  };

  // Mettre à jour les interventions disponibles quand le client change
  const updateInterventionsForClient = (clientId: string) => {
    if (!clientId) {
      setInterventions(allInterventions);
      return;
    }
    
    const clientIdNum = Number(clientId);
    
    // Récupérer les interventions depuis la carte
    const interventionsForClient = clientInterventionMap.get(clientIdNum) || [];
    
    // Trier les interventions par date (plus récentes d'abord)
    const sortedInterventions = [...interventionsForClient].sort((a, b) => {
      const dateA = new Date(a.dateIntervention || '').getTime();
      const dateB = new Date(b.dateIntervention || '').getTime();
      return dateB - dateA;
    });
    
    setInterventions(sortedInterventions);
    
    // Si on édite un rapport existant, vérifier si l'intervention actuelle est valide
    if (editingReport && editingReport.interventionId) {
      const isValid = sortedInterventions.some(i => String(i.id) === String(editingReport.interventionId));
      if (!isValid && !openForm) {
        // Si l'intervention n'est pas valide pour ce client, la réinitialiser
        setEditingReport(prev => prev ? { ...prev, interventionId: '' } : null);
      }
    }
  };

  useEffect(() => {
    if (canAccess) {
      loadReports();
      loadReferenceData();
    }
  }, [canAccess]);

  useEffect(() => {
    const state = (location.state || {}) as any;
    if (state && state.interventionId) {
      setOpenForm(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  // Effet pour mettre à jour les interventions quand clientInterventionMap change
  useEffect(() => {
    updateInterventionsForClient('');
  }, [clientInterventionMap]);

  const handleSearch = (payload: ReportFilterParams) => {
    setFilters(payload);
    loadReports(payload);
  };

  const handleSave = async (payload: Partial<Report>, id?: string) => {
    try {
      if (id) {
        await reportingService.update(id, payload);
        setMessage('Rapport mis à jour');
      } else {
        await reportingService.create(payload as any);
        setMessage('Rapport créé avec succès');
      }
      setMessageType('success');
      setOpenForm(false);
      setEditingReport(null);
      loadReports(filters);
    } catch (error: any) {
      setMessage(error.message || 'Erreur lors de la sauvegarde');
      setMessageType('error');
    }
  };

  const handleDelete = async (report: Report) => {
    if (!report.id || !canDelete) return;
    
    if (!confirm(`Supprimer le rapport ${report.title || report.id} ?`)) return;
    
    try {
      await reportingService.delete(report.id);
      setMessage('Rapport supprimé');
      setMessageType('success');
      loadReports(filters);
    } catch (error: any) {
      setMessage(error.message || 'Erreur lors de la suppression');
      setMessageType('error');
    }
  };

  const handleView = async (report: Report) => {
    try {
      const fresh = await reportingService.getById(report.id);
      setSelectedReport(fresh);
    } catch (error: any) {
      setMessage(error.message || 'Impossible de charger le détail');
      setMessageType('error');
    }
  };

  const handleEdit = (report: Report) => {
    setEditingReport(report);
    setOpenForm(true);
    
    // Pré-remplir le client si possible
    if (report.clientId) {
      // Chercher le client dans la liste fusionnée
      const client = clients.find(c => String(c.id) === String(report.clientId) || 
        (c.isAuthUser && c.userId === report.clientId));
      
      if (client) {
        // Mettre à jour les interventions pour ce client
        updateInterventionsForClient(String(client.id));
      }
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
      const data = await reportingService.getRecent(100, scopedFetchParams);
      const filtered = data.filter(report => {
        if (!report.generatedAt) return false;
        const reportDate = new Date(report.generatedAt);
        return reportDate >= new Date(quickDateDebut) && reportDate <= new Date(quickDateFin);
      });
      setReports(filtered);
      setMessage(`Période ${quickDateDebut} → ${quickDateFin}`);
      setMessageType('info');
    } catch (error: any) {
      setMessage(error.message || 'Erreur période');
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
      const data = await reportingService.getRecent(100, scopedFetchParams);
      const filtered = data.filter(report => {
        const searchLower = quickSearchTerm.toLowerCase();
        return (
          report.title?.toLowerCase().includes(searchLower) ||
          report.clientId?.toLowerCase().includes(searchLower) ||
          report.interventionId?.toLowerCase().includes(searchLower) ||
          false
        );
      });
      setReports(filtered);
      setMessage('Recherche rapide effectuée');
      setMessageType('info');
    } catch (error: any) {
      setMessage(error.message || 'Erreur de recherche');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Filtres rapides
  const loadWarrantyReports = async () => {
    try {
      setLoading(true);
      const data = await reportingService.getRecent(100, scopedFetchParams);
      const filtered = data.filter(r => r.isWarranty);
      setReports(filtered);
      setMessage('Filtre : sous garantie');
      setMessageType('info');
    } catch (error: any) {
      setMessage(error.message || 'Impossible de charger les rapports sous garantie');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const exportAllReports = async () => {
    if (!confirm('Lancer l\'export de toutes les données ?')) return;
    
    try {
      setLoading(true);
      const res = await reportingService.exportAll();
      setMessage(res?.message || 'Export lancé avec succès');
      setMessageType('success');
    } catch (error: any) {
      setMessage(error.message || 'Erreur lors de l\'export');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const refreshReports = () => {
    loadReports(filters);
  };

  // Statistiques
  const stats = useMemo(() => {
    const total = reports.length;
    const warranty = reports.filter(r => r.isWarranty).length;
    const totalAmount = reports.reduce((sum, r) => sum + (r.total || 0), 0);
    const avg = total === 0 ? 0 : totalAmount / total;
    
    return { total, warranty, totalAmount, avg };
  }, [reports]);

  // Pagination
  const paginatedReports = useMemo(() => {
    return reports.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [reports, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Formatage de date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (!canAccess) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, mt: 4 }}>
        <Alert severity="warning" sx={{ maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6">Accès restreint</Typography>
          <Typography>
            L'accès aux rapports est réservé aux :
            <ul>
              <li>Techniciens (consultation uniquement)</li>
              <li>Responsables SAV</li>
              <li>Administrateurs</li>
            </ul>
            Veuillez contacter votre administrateur si vous avez besoin d'accéder à cette fonctionnalité.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageTitle
        title="Reporting"
        subtitle="Gestion et consultation des rapports d'intervention"
        breadcrumbs={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Reporting' }]}
      />

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item size={{ xs: 12, sm: 4 }}>
          <StatsCard 
            title="Rapports" 
            value={stats.total} 
            subtitle={`${stats.warranty} sous garantie`}
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 4 }}>
          <StatsCard 
            title="Montant total" 
            value={`${stats.totalAmount.toFixed(0)} DNT`} 
            color="success" 
            subtitle="Total des rapports"
          />
        </Grid>
        <Grid item size={{ xs: 12, sm: 4 }}>
          <StatsCard 
            title="Sous garantie" 
            value={stats.warranty} 
            color="warning" 
            subtitle="Rapports garantie"
          />
        </Grid>
      </Grid>

      <Panel sx={{ mb: 4 }}>
        {/* Barre d'outils */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <ReportFilters onSearch={handleSearch} />
          </Box>
          <Stack direction="row" spacing={1}>
            <GradientButton 
              startIcon={<Add />} 
              onClick={() => { setEditingReport(null); setOpenForm(true); }}
              disabled={!canGenerate}
            >
              Nouveau rapport
            </GradientButton>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={refreshReports}
              disabled={loading}
            >
              Rafraîchir
            </Button>
            {(isResp || isAdmin) && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Download />}
                onClick={exportAllReports}
                disabled={loading}
              >
                Exporter
              </Button>
            )}
          </Stack>
        </Box>

        {/* Filtres rapides */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
          <Button size="small" variant="contained" color="warning" onClick={loadWarrantyReports}>
            Sous garantie
          </Button>
          <TextField 
            size="small" 
            type="date" 
            label="Début" 
            InputLabelProps={{ shrink: true }} 
            value={quickDateDebut} 
            onChange={(e) => setQuickDateDebut(e.target.value)} 
          />
          <TextField 
            size="small" 
            type="date" 
            label="Fin" 
            InputLabelProps={{ shrink: true }} 
            value={quickDateFin} 
            onChange={(e) => setQuickDateFin(e.target.value)} 
          />
          <Button size="small" variant="outlined" onClick={loadByPeriode}>
            Par période
          </Button>
          <TextField 
            size="small" 
            label="Recherche rapide" 
            value={quickSearchTerm} 
            onChange={(e) => setQuickSearchTerm(e.target.value)} 
          />
          <Button size="small" variant="outlined" onClick={quickSearch}>
            Rechercher
          </Button>
        </Stack>

        {/* Tableau des rapports */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={48} sx={{ color: '#2196F3' }} />
          </Box>
        ) : (
          <>
            <ReportsTable 
              reports={paginatedReports} 
              onView={handleView} 
              onEdit={canGenerate ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
            />
            <TablePagination
              component="div"
              count={reports.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Lignes par page"
            />
          </>
        )}
      </Panel>

      {/* Formulaire de création/édition */}
      <ReportForm
        open={openForm}
        clients={clients}
        interventions={interventions}
        techniciens={techniciens}
        usersWithClientRole={usersWithClientRole}
        clientInterventionMap={clientInterventionMap}
        clientDetails={clientDetails}
        report={editingReport}
        onClose={() => { 
          setOpenForm(false); 
          setEditingReport(null);
          // Réinitialiser les interventions
          setInterventions(allInterventions);
        }}
        onSave={handleSave}
        onClientChange={updateInterventionsForClient}
      />

      {/* Dialog de détails */}
      <ReportDetailsDialog
        open={!!selectedReport}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />

      {/* Notification */}
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

export default ReportingPage;