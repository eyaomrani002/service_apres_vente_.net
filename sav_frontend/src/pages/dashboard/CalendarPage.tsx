import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import { 
  Box, Button, TextField, Typography, IconButton, Alert, Stack, MenuItem, 
  CircularProgress, Snackbar, FormControl, InputLabel, Select, 
  FormHelperText, Paper, Card, CardContent, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Avatar, Chip, Divider, alpha
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import BugReportIcon from '@mui/icons-material/BugReport';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import EventIcon from '@mui/icons-material/Event';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import calendarService from '../../services/calendarService';

// Helper: validate GUID strings expected by CalendarAPI
const isGuid = (value: string | null | undefined): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(trimmed);
};

import { Appointment, ScheduleRequest } from '../../types/calendar';
import { technicienService } from '../../services/technicienService';
import { reclamationService } from '../../services/reclamationService';
import { Technicien } from '../../types/technicien';
import { Client } from '../../types/client';
import { Reclamation } from '../../types/reclamation';
import { Intervention } from '../../types/intervention';
import { interventionService } from '../../services/interventionService';
import { getUsers } from '../../services/userService';
import AuthContext from '../../contexts/AuthContext';

const CalendarPage: React.FC = () => {
  const { user, hasRole } = useContext(AuthContext);
  
  // États principaux
  const [date, setDate] = useState<Date | null>(new Date());
  const [technicianId, setTechnicianId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [ticketId, setTicketId] = useState<string>('');
  const [reclamationId, setReclamationId] = useState<string>('');
  
  // États pour le formulaire de création
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [status, setStatus] = useState<string>('Planned');
  
  // États pour les données
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [clientsForTech, setClientsForTech] = useState<Client[]>([]);
  const [reclamationsForTech, setReclamationsForTech] = useState<Reclamation[]>([]);
  const [userTechniciens, setUserTechniciens] = useState<Array<{ id: string; label: string }>>([]);
  const [userClients, setUserClients] = useState<Client[]>([]);
  const [interventionsForRec, setInterventionsForRec] = useState<Intervention[]>([]);
  
  // États pour le chargement et les erreurs
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [interventionsLoading, setInterventionsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog pour confirmation de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);

  // États pour édition
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('10:00');
  const [editStatus, setEditStatus] = useState('Planned');
  
  // Rôles et permissions
  const isTechnicien = useMemo(() => hasRole('technicien'), [hasRole]);
  const isResp = useMemo(() => hasRole('responsablesav'), [hasRole]);
  const isAdmin = useMemo(() => hasRole('admin'), [hasRole]);
  const canAccess = isTechnicien || isResp || isAdmin;
  const canManageAll = isResp || isAdmin;
  
  // Charger les techniciens
  useEffect(() => {
    let ignore = false;
    
    const loadTechnicians = async () => {
      try {
        const data = await technicienService.getAll();
        if (ignore) return;
        
        setTechniciens(Array.isArray(data) ? data : []);
        
        if (isTechnicien && !canManageAll && user?.id) {
          const userTech = data.find((t: Technicien) => 
            String(t.userId) === String(user.id)
          );
          if (userTech) {
            if (isGuid(userTech.userId)) {
              setTechnicianId(String(userTech.userId));
            } else {
              setTechnicianId(String(userTech.id));
            }
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load technicians', e);
        setError('Erreur lors du chargement des techniciens');
      }
    };
    
    loadTechnicians();
    
    return () => { ignore = true; };
  }, [canManageAll, isTechnicien, user, technicianId]);
  
  // Charger les utilisateurs
  useEffect(() => {
    let ignore = false;
    
    const loadUsers = async () => {
      try {
        const users = await getUsers();
        if (ignore) return;
        
        const techUsers = users.filter(u => 
          u.roles?.some(r => r.toLowerCase() === 'technicien')
        );
        setUserTechniciens(techUsers.map(u => ({ 
          id: String(u.id), 
          label: u.userName || u.email || `Technicien ${u.id}` 
        })));
        
        const clientUsers = users.filter(u => 
          u.roles?.some(r => r.toLowerCase() === 'client')
        );
        const asClients: Client[] = clientUsers.map((u, idx) => ({
          id: -(idx + 1),
          nom: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName || u.email || `Client ${u.id}`,
          email: u.email,
          telephone: u.phoneNumber,
          isAuthUser: true,
          userId: u.id,
        }));
        setUserClients(asClients);
      } catch (e) {
        console.error('Failed to load users', e);
        setUserTechniciens([]);
        setUserClients([]);
      }
    };
    
    loadUsers();
    
    return () => { ignore = true; };
  }, []);
  
  // Options pour le select des techniciens
  const technicianOptions = useMemo(() => {
    const opts = techniciens
      .filter(tech => Number.isInteger(tech.id) && tech.id > 0)
      .map((tech) => {
        const guidValue = isGuid(tech.userId) ? tech.userId!.trim() : null;
        return {
          value: guidValue ?? String(tech.id),
          label: tech.nom || tech.email || `Technicien #${tech.id}`,
          userId: tech.userId,
          hasGuid: !!guidValue,
        };
      });

    return Array.from(new Map(opts.map(o => [o.value, o])).values());
  }, [techniciens]);
  
  // Technicien actuellement sélectionné
  const effectiveTechnician = useMemo(() => {
    if (!technicianId) return null;
    
    return techniciens.find(t => String(t.id) === technicianId || String(t.userId) === technicianId) || null;
  }, [technicianId, techniciens]);

  // GUID du technicien
  const selectedTechGuid = useMemo(() => {
    if (!technicianId) return null;
    const val = technicianId.trim();
    return isGuid(val) ? val : null;
  }, [technicianId]);
  
  // Charger les clients et réclamations
  useEffect(() => {
    if (!technicianId || !effectiveTechnician) {
      setClientsForTech([]);
      setReclamationsForTech([]);
      setClientId('');
      setReclamationId('');
      setTicketId('');
      return;
    }
    
    let ignore = false;
    
    const loadClientsAndReclamations = async () => {
      setListLoading(true);
      
      try {
        const techNumericId = effectiveTechnician.id;
        const recs = await reclamationService.getByTechnicien(techNumericId);
        if (ignore) return;
        
        const recList = Array.isArray(recs) ? recs : [];
        setReclamationsForTech(recList);
        
        const uniqueClients: Record<number, Client> = {};
        recList.forEach((r) => {
          if (r.clientId && !uniqueClients[r.clientId]) {
            uniqueClients[r.clientId] = {
              id: r.clientId,
              nom: r.client?.nom || r.client?.email || `Client #${r.clientId}`,
              email: r.client?.email,
              telephone: r.client?.telephone,
            };
          }
        });
        
        const mergedClients = [
          ...Object.values(uniqueClients),
          ...userClients
        ];
        
        setClientsForTech(mergedClients);
        setClientId('');
        setReclamationId('');
        setTicketId('');
        
      } catch (e) {
        console.error('Failed to load reclamations', e);
        if (!ignore) {
          setReclamationsForTech([]);
          setClientsForTech(userClients);
        }
      } finally {
        if (!ignore) setListLoading(false);
      }
    };
    
    loadClientsAndReclamations();
    
    return () => { ignore = true; };
  }, [technicianId, effectiveTechnician, userClients]);
  
  // Filtrer les réclamations
  const filteredReclamations = useMemo(() => {
    if (!clientId) return reclamationsForTech;
    return reclamationsForTech.filter(r => String(r.clientId) === clientId);
  }, [clientId, reclamationsForTech]);

  const technicianLabelById = useMemo(() => {
    const map = new Map<string, string>();
    techniciens.forEach(t => {
      const label = t.nom || t.email || `Technicien ${t.id}`;
      map.set(String(t.id), label);
      if (t.userId) map.set(String(t.userId), label);
    });
    return map;
  }, [techniciens]);

  const clientLabelById = useMemo(() => {
    const map = new Map<string, string>();
    [...clientsForTech, ...userClients].forEach(c => {
      const label = c.nom || c.email || `Client ${c.id}`;
      map.set(String(c.id), label);
      if (c.userId) map.set(String(c.userId), label);
    });
    return map;
  }, [clientsForTech, userClients]);
  
  // Charger les interventions
  useEffect(() => {
    if (!reclamationId) {
      setInterventionsForRec([]);
      setTicketId('');
      return;
    }
    
    let ignore = false;
    
    const loadInterventions = async () => {
      const recId = Number(reclamationId);
      if (!Number.isFinite(recId) || recId <= 0) {
        setInterventionsForRec([]);
        setTicketId('');
        return;
      }
      
      setInterventionsLoading(true);
      
      try {
        const list = await interventionService.byReclamation(recId);
        if (ignore) return;
        
        setInterventionsForRec(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error('Failed to load interventions', e);
        if (!ignore) {
          setInterventionsForRec([]);
          setTicketId('');
        }
      } finally {
        if (!ignore) setInterventionsLoading(false);
      }
    };
    
    loadInterventions();
    
    return () => { ignore = true; };
  }, [reclamationId]);
  
  // Charger les rendez-vous
  const fetchAppointments = useCallback(async () => {
    if (!date) {
      setError('Veuillez sélectionner une date');
      return;
    }

    if (technicianId && !selectedTechGuid) {
      setError('ID de technicien invalide pour le calendrier (GUID requis)');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const dateOnly = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const isoDate = dateOnly.toISOString();
      
      const techParam = technicianId ? selectedTechGuid : null;
      const appointmentsData = await calendarService.getAppointments(techParam, isoDate);
      
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      
    } catch (e: any) {
      console.error('Failed to fetch appointments', e);
      
      let errorMsg = 'Erreur lors du chargement des rendez-vous';
      if (e.message.includes('401')) {
        errorMsg = 'Non autorisé. Veuillez vous reconnecter.';
      } else if (e.message.includes('technicianId') || e.message.includes('TechnicianId')) {
        errorMsg = 'ID de technicien invalide (GUID requis pour le calendrier).';
      } else if (e.message.includes('400')) {
        errorMsg = 'Requête invalide. Veuillez vérifier les paramètres.';
      } else if (e.message.includes('500')) {
        errorMsg = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (e.message.includes('CORS')) {
        errorMsg = 'Erreur CORS. Vérifiez la configuration du serveur.';
      }
      
      setError(errorMsg);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [date, technicianId, selectedTechGuid]);
  
  useEffect(() => {
    if (date && technicianId) {
      fetchAppointments();
    }
  }, [date, technicianId, fetchAppointments]);
  
  // Créer un rendez-vous
  const handleCreate = async () => {
    if (!date || !effectiveTechnician) {
      setError('Date ou technicien manquant');
      return;
    }

    if (!selectedTechGuid) {
      setError('ID de technicien invalide pour le calendrier (GUID requis)');
      return;
    }
    
    if (!title.trim()) {
      setError('Veuillez saisir un titre');
      return;
    }
    
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
      setError('Format d\'heure invalide. Utilisez HH:MM');
      return;
    }
    
    const start = new Date(date);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(date);
    end.setHours(eh, em, 0, 0);
    
    if (end <= start) {
      setError('L\'heure de fin doit être après l\'heure de début');
      return;
    }
    
    const startUtc = start.toISOString();
    const endUtc = end.toISOString();

    const toGuidOrNull = (val: string | null) => {
      if (!val || val.trim() === '') return null;
      const trimmed = val.trim();
      return isGuid(trimmed) ? trimmed : null;
    };

    setCreating(true);
    setError(null);
    
    try {
      const payload: ScheduleRequest = {
        technicianId: selectedTechGuid,
        clientId: toGuidOrNull(clientId || null),
        ticketId: toGuidOrNull(ticketId || null),
        reclamationId: toGuidOrNull(reclamationId || null),
        title: title.trim(),
        notes: notes.trim() || null,
        status: status || 'Planned',
        startUtc: startUtc,
        endUtc: endUtc,
      };
      
      console.log('Creating appointment with payload:', payload);
      
      const created = await calendarService.create(payload);
      console.log('Appointment created:', created);
      
      setTitle('');
      setNotes('');
      setStartTime('09:00');
      setEndTime('10:00');
      setClientId('');
      setReclamationId('');
      setTicketId('');
      
      fetchAppointments();
      
      setSuccessMessage('Rendez-vous créé avec succès');
      
    } catch (e: any) {
      console.error('Failed to create appointment', e);
      
      let errorMsg = e.message || 'Erreur lors de la création du rendez-vous';
      
      if (errorMsg.includes('Title') && errorMsg.includes('required')) {
        errorMsg = 'Le titre est requis. Vérifiez que le champ n\'est pas vide.';
      } else if (errorMsg.toLowerCase().includes('guid')) {
        errorMsg = 'Format d\'ID invalide (GUID requis pour le calendrier).';
      } else if (errorMsg.includes('400')) {
        errorMsg = 'Format de requête incorrect.';
      } else if (errorMsg.includes('500')) {
        errorMsg = 'Erreur serveur interne. Contactez l\'administrateur.';
      } else if (errorMsg.includes('CORS')) {
        errorMsg = 'Erreur de sécurité CORS. Vérifiez la configuration du serveur.';
      }
      
      setError(errorMsg);
    } finally {
      setCreating(false);
    }
  };
  
  // Fonction de debug
  const handleDebugApi = async () => {
    setDebugging(true);
    setError(null);
    
    try {
      const debugInfo = await calendarService.debugEndpoint();
      console.log('API Debug Info:', debugInfo);
      
      if (debugInfo.status === 200) {
        setSuccessMessage('Debug terminé - Voir la console pour les détails');
      } else {
        setError(`Debug: ${debugInfo.status} ${debugInfo.statusText} - ${debugInfo.response}`);
      }
    } catch (e: any) {
      console.error('Debug failed:', e);
      setError(`Debug échoué: ${e.message}`);
    } finally {
      setDebugging(false);
    }
  };
  
  // Tester les formats d'API
  const handleTestApiFormat = async () => {
    try {
      const format = await calendarService.testApiFormat();
      setSuccessMessage(`Format API détecté: ${format}`);
    } catch (e: any) {
      setError(`Test de format échoué: ${e.message}`);
    }
  };
  
  // Ouvrir le dialog de suppression
  const handleDeleteClick = (id: string) => {
    setAppointmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Ouvrir le dialog d'édition
  const handleEditClick = async (id: string) => {
    try {
      setLoading(true);
      const appt = await calendarService.getById(id);
      if (!appt) {
        setError('Rendez-vous introuvable');
        return;
      }

      setAppointmentToEdit(appt);
      setEditTitle(appt.title || '');
      setEditNotes(appt.notes || '');
      setEditStatus(appt.status || 'Planned');

      const s = new Date(appt.startUtc);
      const e = new Date(appt.endUtc);
      const pad = (n: number) => String(n).padStart(2, '0');
      setEditStartTime(`${pad(s.getHours())}:${pad(s.getMinutes())}`);
      setEditEndTime(`${pad(e.getHours())}:${pad(e.getMinutes())}`);

      setEditDialogOpen(true);
    } catch (e: any) {
      console.error('Failed to load appointment for edit', e);
      setError('Impossible de charger le rendez-vous pour édition');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setAppointmentToEdit(null);
  };

  const handleEditSave = async () => {
    if (!appointmentToEdit || !date) {
      setError('Aucun rendez-vous sélectionné');
      return;
    }

    if (!editTitle.trim()) {
      setError('Le titre est requis');
      return;
    }

    const [sh, sm] = editStartTime.split(':').map(Number);
    const [eh, em] = editEndTime.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
      setError('Format d\'heure invalide. Utilisez HH:MM');
      return;
    }

    const start = new Date(date);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(date);
    end.setHours(eh, em, 0, 0);

    if (end <= start) {
      setError('L\'heure de fin doit être après l\'heure de début');
      return;
    }

    try {
      setLoading(true);
      const payload: Partial<ScheduleRequest> & { status?: string } = {
        technicianId: String(appointmentToEdit.technicianId),
        title: editTitle.trim(),
        notes: editNotes.trim() || null,
        status: editStatus,
        startUtc: start.toISOString(),
        endUtc: end.toISOString(),
      };

      const updated = await calendarService.update(appointmentToEdit.id, payload);

      setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
      setSuccessMessage('Rendez-vous mis à jour');
      setEditDialogOpen(false);
      setAppointmentToEdit(null);
    } catch (e: any) {
      console.error('Failed to update appointment', e);
      let msg = e.message || 'Erreur lors de la mise à jour';
      if (msg.includes('409') || msg.toLowerCase().includes('conflict')) {
        msg = 'Conflit de planning : le technicien n\'est pas disponible.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
  
  // Confirmer la suppression
  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return;
    
    try {
      await calendarService.delete(appointmentToDelete);
      setAppointments(prev => prev.filter(a => a.id !== appointmentToDelete));
      setSuccessMessage('Rendez-vous supprimé avec succès');
    } catch (e: any) {
      console.error('Failed to delete appointment', e);
      setError('Erreur lors de la suppression du rendez-vous');
    } finally {
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };
  
  // Fermer le dialog de suppression
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAppointmentToDelete(null);
  };
  
  // Fermer les messages
  const handleCloseError = () => setError(null);
  const handleCloseSuccess = () => setSuccessMessage(null);
  
  // Vérifier l'accès
  if (!canAccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
          Accès restreint : le calendrier est réservé aux techniciens, responsables SAV et administrateurs.
        </Alert>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Confirmed': return 'primary';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return '✓';
      case 'Confirmed': return '✓';
      case 'Cancelled': return '✗';
      default: return '○';
    }
  };
  
  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header avec titre et statistiques */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              <CalendarTodayIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Calendrier
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Gérez les rendez-vous et le planning des interventions
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: 'white', color: '#667eea', width: 56, height: 56 }}>
            <EventIcon fontSize="large" />
          </Avatar>
        </Box>
      </Paper>

      {/* Messages d'erreur/succès */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Grid container spacing={3}>
        {/* Colonne gauche - Filtres et Formulaire */}
        <Grid item xs={12} md={4}>
          {/* Carte Filtres */}
          <Card sx={{ 
            mb: 3, 
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <FilterAltIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Filtres
                </Typography>
              </Box>
              
              <Stack spacing={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date"
                    value={date}
                    onChange={(newDate) => setDate(newDate)}
                    slotProps={{ 
                      textField: { 
                        size: 'small',
                        fullWidth: true,
                        variant: 'outlined'
                      } 
                    }}
                  />
                </LocalizationProvider>
                
                <FormControl size="small" fullWidth>
                  <InputLabel>Technicien</InputLabel>
                  <Select
                    value={technicianId}
                    label="Technicien"
                    onChange={(e) => setTechnicianId(e.target.value)}
                    disabled={loading || (isTechnicien && !canManageAll)}
                  >
                    <MenuItem value="">
                      <em>Tous les techniciens</em>
                    </MenuItem>
                    {technicianOptions.length === 0 ? (
                      <MenuItem value="" disabled>
                        Aucun technicien disponible
                      </MenuItem>
                    ) : (
                      technicianOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ 
                              width: 24, 
                              height: 24, 
                              mr: 2,
                              fontSize: '0.8rem',
                              bgcolor: opt.hasGuid ? '#4caf50' : '#9e9e9e'
                            }}>
                              {opt.label.charAt(0).toUpperCase()}
                            </Avatar>
                            {opt.label}
                            {opt.hasGuid && (
                              <Chip 
                                label="GUID" 
                                size="small" 
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                color="success"
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {selectedTechGuid && (
                    <FormHelperText>
                      ID: {selectedTechGuid.substring(0, 8)}...
                    </FormHelperText>
                  )}
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={fetchAppointments}
                    disabled={loading || !date}
                    startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                    fullWidth
                    sx={{ py: 1 }}
                  >
                    Actualiser
                  </Button>
                  
                  {(isResp || isAdmin) && (
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={handleDebugApi}
                      disabled={debugging}
                      startIcon={debugging ? <CircularProgress size={20} /> : <BugReportIcon />}
                      sx={{ minWidth: 'auto', px: 2 }}
                    >
                      Debug
                    </Button>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Carte Nouveau Rendez-vous */}
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AddIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight={600}>
                  Nouveau rendez-vous
                </Typography>
              </Box>
              
              <Stack spacing={2.5}>
                <TextField
                  label="Titre *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  size="small"
                  fullWidth
                  error={!title.trim()}
                  helperText={!title.trim() ? 'Requis' : ''}
                  disabled={!technicianId}
                  variant="outlined"
                />
                
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Début"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1 }}
                    disabled={!technicianId}
                    variant="outlined"
                  />
                  
                  <TextField
                    label="Fin"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1 }}
                    disabled={!technicianId}
                    variant="outlined"
                  />
                </Stack>

                <FormControl size="small" fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={status}
                    label="Statut"
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={!technicianId}
                  >
                    <MenuItem value="Planned">Planifié</MenuItem>
                    <MenuItem value="Confirmed">Confirmé</MenuItem>
                    <MenuItem value="Completed">Terminé</MenuItem>
                    <MenuItem value="Cancelled">Annulé</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  size="small"
                  multiline
                  rows={2}
                  fullWidth
                  disabled={!technicianId}
                  variant="outlined"
                  placeholder="Ajouter des notes..."
                />

                <Divider sx={{ my: 1 }} />

                <FormControl size="small" fullWidth>
                  <InputLabel>Client</InputLabel>
                  <Select
                    value={clientId}
                    label="Client"
                    onChange={(e) => setClientId(e.target.value)}
                    disabled={!technicianId || listLoading || clientsForTech.length === 0}
                  >
                    <MenuItem value="">
                      <em>Aucun client</em>
                    </MenuItem>
                    {clientsForTech.map((client) => (
                      <MenuItem
                        key={client.userId ? `${client.id}-${client.userId}` : client.id}
                        value={isGuid(client.userId) ? client.userId! : String(client.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon sx={{ mr: 1, fontSize: '1rem', opacity: 0.7 }} />
                          {client.nom || client.email || `Client ${client.id}`}
                          {client.isAuthUser && (
                            <Chip 
                              label="Compte" 
                              size="small" 
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                              color="info"
                            />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={2}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Réclamation</InputLabel>
                    <Select
                      value={reclamationId}
                      label="Réclamation"
                      onChange={(e) => setReclamationId(e.target.value)}
                      disabled={!technicianId || listLoading || filteredReclamations.length === 0}
                    >
                      <MenuItem value="">
                        <em>Aucune</em>
                      </MenuItem>
                      {filteredReclamations.map((rec) => (
                        <MenuItem key={rec.id} value={String(rec.id)}>
                          #{rec.id} · {rec.sujet?.substring(0, 15) || 'Sans titre'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Intervention</InputLabel>
                    <Select
                      value={ticketId}
                      label="Intervention"
                      onChange={(e) => setTicketId(e.target.value)}
                      disabled={!reclamationId || interventionsLoading || interventionsForRec.length === 0}
                    >
                      <MenuItem value="">
                        <em>Aucune</em>
                      </MenuItem>
                      {interventionsForRec.map((it) => (
                        <MenuItem key={it.id} value={String(it.id)}>
                          #{it.id} · {it.statut?.substring(0, 10) || 'Sans statut'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
            </CardContent>
            
            <CardActions sx={{ justifyContent: 'space-between', px: 3, pb: 3 }}>
              <Button
                variant="outlined"
                color="info"
                onClick={handleTestApiFormat}
                disabled={creating}
                size="small"
              >
                Tester API
              </Button>
              
              <Button
                variant="contained"
                onClick={handleCreate}
                disabled={creating || !title.trim() || !technicianId}
                startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
                sx={{ 
                  px: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4090 100%)',
                  }
                }}
              >
                {creating ? 'Création...' : 'Créer'}
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Colonne droite - Liste des rendez-vous */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                pb: 2,
                borderBottom: '1px solid rgba(0,0,0,0.08)'
              }}>
                <Box>
                  <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center' }}>
                    <EventIcon sx={{ mr: 1 }} />
                    Rendez-vous du jour
                  </Typography>
                  {date && (
                    <Typography variant="body2" color="text.secondary">
                      {date.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Typography>
                  )}
                </Box>
                
                <Chip 
                  label={`${appointments.length} rendez-vous`}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>

              {loading ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  py: 8 
                }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2 }} color="text.secondary">
                    Chargement des rendez-vous...
                  </Typography>
                </Box>
              ) : appointments.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  py: 8,
                  textAlign: 'center'
                }}>
                  <EventIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Aucun rendez-vous
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aucun rendez-vous programmé pour cette date
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {appointments.map((appt) => (
                    <Paper
                      key={appt.id}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: 'white',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                          borderColor: 'primary.light'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              mr: 1.5,
                              bgcolor: getStatusColor(appt.status || 'Planned') === 'success' ? '#4caf50' :
                                      getStatusColor(appt.status || 'Planned') === 'primary' ? '#2196f3' :
                                      getStatusColor(appt.status || 'Planned') === 'error' ? '#f44336' : '#9e9e9e'
                            }} />
                            <Chip
                              label={appt.status || 'Planned'}
                              size="small"
                              sx={{
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 24,
                                bgcolor: alpha(
                                  getStatusColor(appt.status || 'Planned') === 'success' ? '#4caf50' :
                                  getStatusColor(appt.status || 'Planned') === 'primary' ? '#2196f3' :
                                  getStatusColor(appt.status || 'Planned') === 'error' ? '#f44336' : '#9e9e9e',
                                  0.1
                                ),
                                color: getStatusColor(appt.status || 'Planned')
                              }}
                            />
                          </Box>

                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {appt.title || 'Sans titre'}
                          </Typography>

                          <Stack spacing={1} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccessTimeIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {new Date(appt.startUtc).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {new Date(appt.endUtc).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PersonIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                Technicien: {technicianLabelById.get(String(appt.technicianId)) || appt.technicianId?.substring(0, 8) || 'N/A'}
                              </Typography>
                            </Box>

                            {appt.clientId && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <BusinessIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  Client: {clientLabelById.get(String(appt.clientId)) || String(appt.clientId).substring(0, 8)}
                                </Typography>
                              </Box>
                            )}

                            {appt.notes && (
                              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <DescriptionIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary', mt: 0.25 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  {appt.notes}
                                </Typography>
                              </Box>
                            )}
                          </Stack>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {appt.reclamationId && (
                              <Chip
                                label={`Réclamation: ${String(appt.reclamationId).substring(0, 8)}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {appt.ticketId && (
                              <Chip
                                label={`Intervention: ${String(appt.ticketId).substring(0, 8)}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(appt.id)}
                            sx={{ 
                              border: '1px solid',
                              borderColor: 'primary.main',
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'primary.light' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(appt.id)}
                            sx={{ 
                              border: '1px solid',
                              borderColor: 'error.main',
                              color: 'error.main',
                              '&:hover': { bgcolor: 'error.light' }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog d'édition */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Modifier le rendez-vous
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Titre *"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              size="medium"
              fullWidth
              variant="outlined"
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Heure de début"
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                size="medium"
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
                variant="outlined"
              />

              <TextField
                label="Heure de fin"
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                size="medium"
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
                variant="outlined"
              />
            </Stack>

            <TextField
              label="Notes"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              size="medium"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
            />

            <FormControl size="medium" fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={editStatus}
                label="Statut"
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <MenuItem value="Planned">Planifié</MenuItem>
                <MenuItem value="Confirmed">Confirmé</MenuItem>
                <MenuItem value="Completed">Terminé</MenuItem>
                <MenuItem value="Cancelled">Annulé</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleEditCancel} 
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleEditSave} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 600 }}>
          <DeleteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Supprimer le rendez-vous
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleDeleteCancel} 
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarPage;