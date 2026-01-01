// InterventionForm.tsx - Formulaire moderne pour créer/modifier une intervention
import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Grid, Box, Typography, InputAdornment,
  IconButton, Divider, MenuItem, FormControlLabel, Switch
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Build, Person, Description, CalendarToday, Paid,
  Close, Save, Cancel, CheckCircle, Warning, 
  Email, Phone, Place
} from '@mui/icons-material';
import { Intervention } from '../../types/intervention';
import { Client } from '../../types/client';
import { clientService } from '../../services/clientService';
import { reclamationService } from '../../services/reclamationService';
import { interventionService } from '../../services/interventionService';
import { technicienService } from '../../services/technicienService';
import { Technicien } from '../../types/technicien';
import { getUsers } from '../../services/userService';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '24px',
    padding: '8px',
    animation: `${fadeIn} 0.3s ease`,
    maxWidth: '800px',
    width: '100%',
    overflow: 'hidden',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
  color: '#fff',
  padding: '24px 32px',
  borderRadius: '16px 16px 0 0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontWeight: 700,
  fontSize: '24px',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    '&:hover': {
      backgroundColor: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#FF9800',
      },
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#FF9800',
        borderWidth: '2px',
      },
      transform: 'scale(1.01)',
      boxShadow: '0 4px 20px rgba(255, 152, 0, 0.15)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 600,
    color: '#666',
    '&.Mui-focused': {
      color: '#FF9800',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 152, 0, 0.2)',
    borderWidth: '1px',
  },
}));

const SaveButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
  color: '#fff',
  fontWeight: 700,
  padding: '12px 32px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(255, 152, 0, 0.4)',
    background: 'linear-gradient(135deg, #F57C00 0%, #FFA000 100%)',
  },
  '&:disabled': {
    background: 'rgba(0, 0, 0, 0.12)',
    color: 'rgba(0, 0, 0, 0.26)',
  },
}));

const CancelButton = styled(Button)(({ theme }) => ({
  color: '#666',
  fontWeight: 600,
  padding: '12px 32px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '16px',
  border: '2px solid #e0e0e0',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.04)',
    transform: 'translateY(-2px)',
  },
}));

const CostBox = styled(Box)(({ theme }) => ({
  padding: '20px',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 193, 7, 0.05) 100%)',
  border: '1px solid rgba(255, 152, 0, 0.1)',
  marginBottom: '20px',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: 'rgba(255, 152, 0, 0.3)',
    boxShadow: '0 4px 12px rgba(255, 152, 0, 0.1)',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '18px',
  fontWeight: 700,
  color: '#FF9800',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}));

interface Props {
  open: boolean;
  intervention?: Intervention | null;
  onClose: () => void;
  onSave: (c: Partial<Intervention>) => void;
  isAdmin?: boolean;
  currentUser?: { email?: string; id?: string | number; roles?: string[] } | null;
}

const InterventionForm: React.FC<Props> = ({ open, intervention, onClose, onSave, isAdmin, currentUser }) => {
  const [form, setForm] = useState<Partial<Intervention>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>('');
  const [reclamations, setReclamations] = useState<any[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedReclamation, setSelectedReclamation] = useState<any>(null);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [selectedTechnicienId, setSelectedTechnicienId] = useState<string>('');
  const [isClientReadOnly, setIsClientReadOnly] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      if (intervention) {
        setForm({
          ...intervention,
          dateIntervention: intervention.dateIntervention 
            ? new Date(intervention.dateIntervention).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16)
        });
        setSelectedTechnicienId(String(intervention.technicienId ?? ''));
      } else {
        setForm({
          technicienId: undefined as any,
          technicienNom: '',
          dateIntervention: new Date().toISOString().slice(0, 16),
          statut: 'Planifiée',
          estGratuite: false,
          coutPieces: 0,
          coutMainOeuvre: 0,
          coutTotal: 0
        });
        setSelectedTechnicienId('');
      }
      setErrors({});
      const defaultClientId = !intervention && !isAdmin && currentUser?.id ? String(currentUser.id) : '';
      setClientId(defaultClientId);
      setIsClientReadOnly(!!intervention || !isAdmin);
      setSelectedClient(null);
      setSelectedReclamation(null);
      loadClients();
      loadTechniciens();
      
      // Si on édite, charger les données associées
      if (intervention?.reclamationId) {
        loadReclamationDetails(intervention.reclamationId);
      }
    }
  }, [intervention, open, isAdmin, currentUser]);

  const loadClients = async () => {
    try {
      const baseClients = await clientService.getAll();
      let merged: Client[] = Array.isArray(baseClients) ? baseClients : [];

      if (isAdmin) {
        try {
          const users = await getUsers();
          const clientUsers = users.filter((u) => u.roles?.some((r) => r.toLowerCase() === 'client'));
          const existingEmails = new Set((merged || []).map((c) => (c.email || '').toLowerCase()));
          let syntheticIndex = 1;
          clientUsers.forEach((u) => {
            if (u.email && !existingEmails.has(u.email.toLowerCase())) {
              merged.push({
                id: -syntheticIndex++,
                nom: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName || u.email,
                email: u.email,
                telephone: u.phoneNumber || undefined,
                dateInscription: u.lastLoginAt ?? undefined,
                nombreReclamations: 0,
                reclamationsEnCours: 0,
                isAuthUser: true,
                userId: u.id,
              });
            }
          });
        } catch (e) {
          console.warn('Impossible de fusionner les users côté formulaire intervention', e);
        }
      }

      if (!isAdmin && currentUser) {
        const lowerEmail = currentUser.email?.toLowerCase();
        const matchesCurrentUser = (c: Client) => {
          const emailMatch = lowerEmail && (c.email || '').toLowerCase() === lowerEmail;
          const idMatch = currentUser.id !== undefined && String(c.id) === String(currentUser.id);
          return emailMatch || idMatch;
        };

        const hasClient = merged.some(matchesCurrentUser);
        if (!hasClient && lowerEmail) {
          merged.push({
            id: currentUser.id ? Number(currentUser.id) : -9999,
            nom: currentUser.email || 'Client',
            email: currentUser.email,
            telephone: undefined,
            dateInscription: undefined,
            nombreReclamations: 0,
            reclamationsEnCours: 0,
            isAuthUser: true,
            userId: currentUser.id,
          });
        }

        merged = merged.filter(matchesCurrentUser);
      }

      setClients(merged);
    } catch {
      setClients([]);
    }
  };

  const loadTechniciens = async () => {
    try {
      const data = await technicienService.getDisponibles();
      let list: Technicien[] = Array.isArray(data) ? data : [];

      try {
        const users = await getUsers();
        const techUsers = users.filter((u) => u.roles?.some((r) => r.toLowerCase() === 'technicien' || r === '7' || r.toLowerCase() === 'technician'));
        const existingEmails = new Set((list || []).map((t) => (t.email || '').toLowerCase()));
        let syntheticIndex = 1;
        techUsers.forEach((u) => {
          if (u.email && !existingEmails.has(u.email.toLowerCase())) {
            list.push({
              id: -syntheticIndex++,
              nom: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName || u.email,
              email: u.email,
              telephone: u.phoneNumber || undefined,
              disponibilite: 'Disponible',
              isActif: true,
              userId: u.id,
            } as Technicien);
          }
        });
      } catch (e) {
        console.warn('Fusion des techniciens utilisateurs impossible', e);
      }

      setTechniciens(list);
    } catch {
      try {
        const data = await technicienService.getAll();
        let list: Technicien[] = Array.isArray(data) ? data : [];

        try {
          const users = await getUsers();
          const techUsers = users.filter((u) => u.roles?.some((r) => r.toLowerCase() === 'technicien' || r === '7' || r.toLowerCase() === 'technician'));
          const existingEmails = new Set((list || []).map((t) => (t.email || '').toLowerCase()));
          let syntheticIndex = 1;
          techUsers.forEach((u) => {
            if (u.email && !existingEmails.has(u.email.toLowerCase())) {
              list.push({
                id: -syntheticIndex++,
                nom: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName || u.email,
                email: u.email,
                telephone: u.phoneNumber || undefined,
                disponibilite: 'Disponible',
                isActif: true,
                userId: u.id,
              } as Technicien);
            }
          });
        } catch (e) {
          console.warn('Fusion des techniciens utilisateurs impossible', e);
        }

        setTechniciens(list);
      } catch {
        setTechniciens([]);
      }
    }
  };

  const loadReclamationDetails = async (reclamationId: number) => {
    setLoading(true);
    try {
      const rec = await reclamationService.getById(reclamationId);
      if (rec && rec.clientId) {
        setClientId(String(rec.clientId));
        const client = await clientService.getById(rec.clientId);
        setSelectedClient(client || null);
        setSelectedReclamation(rec);
        
        const recs = await reclamationService.getByClient(rec.clientId);
        setReclamations(Array.isArray(recs) ? recs : []);
      }
    } catch (error) {
      console.error('Error loading reclamation details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadReclamations = async () => {
      if (!clientId) {
        setReclamations([]);
        setSelectedReclamation(null);
        if (!intervention) {
          setForm(prev => ({ ...prev, reclamationId: undefined }));
        }
        return;
      }
      setLoading(true);
      try {
        const recs = await reclamationService.getByClient(Number(clientId));
        setReclamations(Array.isArray(recs) ? recs : []);
      } catch {
        setReclamations([]);
      } finally {
        setLoading(false);
      }
    };
    loadReclamations();
  }, [clientId, intervention]);

  useEffect(() => {
    if (!clientId) {
      setSelectedClient(null);
      setIsClientReadOnly(!isAdmin || !!intervention);
      return;
    }
    const client = clients.find((c) => String(c.id) === String(clientId)) || null;
    setSelectedClient(client);
    setIsClientReadOnly(!isAdmin || !!intervention);
  }, [clients, clientId, isAdmin, intervention]);

  const handleChange = (k: keyof Intervention, v: any) => {
    if (k === 'reclamationId') {
      const numValue = v === '' ? undefined : Number(v);
      setForm(s => ({ ...s, [k]: numValue }));
      
      // Mettre à jour la réclamation sélectionnée
      const rec = reclamations.find(r => {
        const id = r.id ?? r.Id;
        return String(id) === String(v);
      });
      setSelectedReclamation(rec || null);
    } else if (k === 'technicienId' || k === 'coutPieces' || k === 'coutMainOeuvre') {
      const numValue = v === '' ? undefined : Number(v);
      setForm(s => ({ ...s, [k]: numValue }));
      if (k === 'technicienId') {
        setSelectedTechnicienId(v === '' ? '' : String(numValue));
      }
    } else if (k === 'dateIntervention') {
      setForm(s => ({ ...s, [k]: new Date(v).toISOString() }));
    } else if (k === 'estGratuite') {
      setForm(s => ({ 
        ...s, 
        [k]: v,
        ...(v ? { coutPieces: 0, coutMainOeuvre: 0, coutTotal: 0 } : {})
      }));
    } else {
      setForm(s => ({ ...s, [k]: v }));
    }
    
    // Clear error when user starts typing
    if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: '' }));
    }
  };

  const handleTechnicienSelect = (value: string) => {
    setSelectedTechnicienId(value);
    if (!value || value === 'custom') {
      setForm((prev) => ({ ...prev, technicienId: undefined as any, technicienNom: '' }));
      return;
    }
    const tech = techniciens.find((t) => String(t.id) === value);
    setForm((prev) => ({
      ...prev,
      technicienId: tech?.id ?? Number(value),
      technicienNom: tech?.nom ?? prev.technicienNom,
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.reclamationId) {
      newErrors.reclamationId = 'La réclamation est requise';
    }

    if (!clientId) {
      newErrors.clientId = 'Le client est requis';
    }
    
    if (!form.technicienId) {
      newErrors.technicienId = "L'ID du technicien est requis";
    }
    
    if (!form.technicienNom || form.technicienNom.trim() === '') {
      newErrors.technicienNom = "Le nom du technicien est requis";
    }
    
    if (!form.dateIntervention) {
      newErrors.dateIntervention = 'La date est requise';
    }
    
    if (!form.statut || form.statut.trim() === '') {
      newErrors.statut = 'Le statut est requis';
    }
    
    if (!form.estGratuite) {
      if (form.coutPieces === undefined || form.coutPieces < 0) {
        newErrors.coutPieces = 'Coût des pièces invalide';
      }
      if (form.coutMainOeuvre === undefined || form.coutMainOeuvre < 0) {
        newErrors.coutMainOeuvre = 'Coût main d\'œuvre invalide';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // S'assurer qu'un technicien synthétique (depuis Auth) est créé côté API
    let ensuredTechnicienId = form.technicienId;
    if (ensuredTechnicienId && ensuredTechnicienId < 0) {
      const selectedTech = techniciens.find((t) => Number(t.id) === Number(ensuredTechnicienId));
      if (selectedTech) {
        try {
          const created = await technicienService.create({
            nom: selectedTech.nom,
            email: selectedTech.email,
            telephone: selectedTech.telephone,
            userId: selectedTech.userId,
            disponibilite: selectedTech.disponibilite || 'Disponible',
            isActif: true,
          });
          ensuredTechnicienId = created?.id ?? ensuredTechnicienId;
        } catch (e) {
          setErrors((prev) => ({ ...prev, technicienId: 'Impossible de créer ce technicien' }));
          return;
        }
      }
    }

    // S'assurer qu'un client synthétique (utilisateur Auth) existe côté API
    let ensuredClientId = clientId ? Number(clientId) : undefined;
    if (ensuredClientId && ensuredClientId < 0) {
      const selectedCli = clients.find((c) => Number(c.id) === Number(ensuredClientId));
      if (selectedCli?.isAuthUser) {
        try {
          const email = selectedCli.email || `client-${selectedCli.userId || 'auth'}@placeholder.local`;
          let ensured = null as any;
          try {
            ensured = await clientService.create({
              nom: selectedCli.nom || email,
              email,
              telephone: selectedCli.telephone,
              adresse: selectedCli.adresse,
            } as any);
          } catch (createErr) {
            ensured = await clientService.getByEmail(email).catch(() => null as any);
          }
          ensuredClientId = ensured?.id ?? ensuredClientId;
        } catch (e) {
          setErrors((prev) => ({ ...prev, clientId: 'Impossible de créer ce client' }));
          return;
        }
      }
    }

    // Calculer le coût total et préparer un payload conforme à l'API
    const coutTotal = form.estGratuite 
      ? 0 
      : (form.coutPieces || 0) + (form.coutMainOeuvre || 0);

    const payload: Partial<Intervention> = {
      reclamationId: form.reclamationId ? Number(form.reclamationId) : undefined,
      technicienId: ensuredTechnicienId,
      technicienNom: (form.technicienNom || '').trim(),
      dateIntervention: form.dateIntervention || new Date().toISOString(),
      statut: form.statut || 'Planifiée',
      description: form.description || '',
      observations: form.observations || '',
      solutionApportee: form.solutionApportee || '',
      coutPieces: form.coutPieces ?? 0,
      coutMainOeuvre: form.coutMainOeuvre ?? 0,
      coutTotal,
      estGratuite: !!form.estGratuite,
      dateFin: form.dateFin || null,
    };

    onSave(payload);
  };

  const statutOptions = [
    { value: 'Planifiée', label: 'Planifiée', color: '#FF9800', icon: '📅' },
    { value: 'En cours', label: 'En cours', color: '#2196F3', icon: '⚙️' },
    { value: 'Terminée', label: 'Terminée', color: '#4CAF50', icon: '✅' },
    { value: 'Annulée', label: 'Annulée', color: '#f44336', icon: '❌' }
  ];

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Build sx={{ fontSize: 32 }} />
          <span>{intervention ? 'Modifier l\'intervention' : 'Nouvelle intervention'}</span>
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{ 
            color: '#fff',
            '&:hover': { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'rotate(90deg)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <Close />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 3, 
            color: 'text.secondary',
            fontSize: '14px',
          }}
        >
          {intervention 
            ? 'Modifiez les informations de l\'intervention'
            : 'Remplissez les informations de la nouvelle intervention'
          }
        </Typography>

        {/* Informations Client */}
        {selectedClient && (
          <Box sx={{ mb: 3, p: 2, borderRadius: '12px', backgroundColor: 'rgba(33, 150, 243, 0.05)', border: '1px solid rgba(33, 150, 243, 0.1)' }}>
            <SectionTitle>
              <Person sx={{ fontSize: 20 }} />
              Informations du Client
            </SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2196F3' }}>
                    Nom:
                  </Typography>
                  <Typography variant="body2">
                    {selectedClient.nom}
                  </Typography>
                </Box>
              </Grid>
              {selectedClient.email && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email sx={{ fontSize: 16, color: '#00BCD4' }} />
                    <Typography variant="body2">
                      {selectedClient.email}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {selectedClient.telephone && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ fontSize: 16, color: '#2196F3' }} />
                    <Typography variant="body2">
                      {selectedClient.telephone}
                    </Typography>
                  </Box>
                </Grid>
              )}
              {selectedClient.adresse && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Place sx={{ fontSize: 16, color: '#9e9e9e' }} />
                    <Typography variant="body2">
                      {selectedClient.adresse}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Informations Réclamation */}
        {selectedReclamation && (
          <Box sx={{ mb: 3, p: 2, borderRadius: '12px', backgroundColor: 'rgba(255, 152, 0, 0.05)', border: '1px solid rgba(255, 152, 0, 0.1)' }}>
            <SectionTitle>
              <Warning sx={{ fontSize: 20 }} />
              Informations de la Réclamation
            </SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#FF9800' }}>
                    Sujet:
                  </Typography>
                  <Typography variant="body2">
                    {selectedReclamation.sujet || selectedReclamation.Sujet || `Réclamation #${selectedReclamation.id || selectedReclamation.Id}`}
                  </Typography>
                </Box>
              </Grid>
              {selectedReclamation.description && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    "{selectedReclamation.description.substring(0, 100)}..."
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Sélection Client et Réclamation */}
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              select
              label="Client"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              onFocus={() => setFocusedField('clientId')}
              onBlur={() => setFocusedField(null)}
              disabled={!!intervention || isClientReadOnly}
              error={!!errors.clientId}
              helperText={errors.clientId}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ 
                      color: focusedField === 'clientId' ? '#2196F3' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="" disabled>
                <Typography color="text.secondary">Sélectionner un client</Typography>
              </MenuItem>
              {clients.map(client => (
                <MenuItem key={client.id} value={String(client.id)}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {client.nom}
                    </Typography>
                    {client.email && (
                      <Typography variant="caption" color="text.secondary">
                        {client.email}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </StyledTextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              select
              label="Réclamation"
              value={form.reclamationId ?? ''}
              onChange={e => handleChange('reclamationId', e.target.value)}
              onFocus={() => setFocusedField('reclamationId')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.reclamationId}
              helperText={errors.reclamationId}
              disabled={!clientId || !!intervention}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Warning sx={{ 
                      color: focusedField === 'reclamationId' ? '#FF9800' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="" disabled>
                <Typography color="text.secondary">Sélectionner une réclamation</Typography>
              </MenuItem>
              {reclamations.map(reclamation => {
                const id = reclamation.id ?? reclamation.Id;
                const sujet = reclamation.sujet ?? reclamation.Sujet;
                const desc = reclamation.description || '';
                return (
                  <MenuItem key={id} value={id}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {sujet || `Réclamation #${id}`}
                      </Typography>
                      {desc && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {desc.substring(0, 50)}...
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                );
              })}
            </StyledTextField>
          </Grid>

          {/* Informations Technicien */}
          <SectionTitle sx={{ gridColumn: '1 / -1', mt: 2 }}>
            <Person sx={{ fontSize: 20 }} />
            Informations du Technicien
          </SectionTitle>

          <Grid item xs={12}>
            <StyledTextField
              fullWidth
              select
              label="Technicien"
              value={selectedTechnicienId}
              onChange={(e) => handleTechnicienSelect(e.target.value)}
              helperText={techniciens.length === 0 ? 'Aucun technicien trouvé, saisissez manuellement' : 'Sélectionnez un technicien pour préremplir'}
            >
              <MenuItem value="">
                <Typography color="text.secondary">Choisir un technicien</Typography>
              </MenuItem>
              {techniciens.map((tech) => (
                <MenuItem key={tech.id} value={String(tech.id)}>
                  #{tech.id} - {tech.nom}
                </MenuItem>
              ))}
              <MenuItem value="custom">Autre (saisie libre)</MenuItem>
            </StyledTextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="ID Technicien"
              type="number"
              value={form.technicienId ?? ''}
              onChange={e => handleChange('technicienId', e.target.value)}
              onFocus={() => setFocusedField('technicienId')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.technicienId}
              helperText={errors.technicienId}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ 
                      color: focusedField === 'technicienId' ? '#2196F3' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
                inputProps: { min: 1 }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Nom du Technicien"
              value={form.technicienNom || ''}
              onChange={e => handleChange('technicienNom', e.target.value)}
              onFocus={() => setFocusedField('technicienNom')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.technicienNom}
              helperText={errors.technicienNom}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ 
                      color: focusedField === 'technicienNom' ? '#2196F3' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Date et Statut */}
          <SectionTitle sx={{ gridColumn: '1 / -1', mt: 2 }}>
            <CalendarToday sx={{ fontSize: 20 }} />
            Planification
          </SectionTitle>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Date d'intervention"
              type="datetime-local"
              value={form.dateIntervention ? new Date(form.dateIntervention).toISOString().slice(0,16) : ''}
              onChange={e => handleChange('dateIntervention', e.target.value)}
              onFocus={() => setFocusedField('dateIntervention')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.dateIntervention}
              helperText={errors.dateIntervention}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday sx={{ 
                      color: focusedField === 'dateIntervention' ? '#FF9800' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              select
              label="Statut"
              value={form.statut || 'Planifiée'}
              onChange={e => handleChange('statut', e.target.value)}
              onFocus={() => setFocusedField('statut')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.statut}
              helperText={errors.statut}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CheckCircle sx={{ 
                      color: focusedField === 'statut' ? '#4CAF50' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            >
              {statutOptions.map(option => (
                <MenuItem 
                  key={option.value} 
                  value={option.value}
                  sx={{ 
                    color: option.color, 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </MenuItem>
              ))}
            </StyledTextField>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <StyledTextField
              fullWidth
              label="Description de l'intervention"
              value={form.description || ''}
              onChange={e => handleChange('description', e.target.value)}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              multiline
              rows={3}
              placeholder="Décrivez l'intervention à réaliser..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                    <Description sx={{ 
                      color: focusedField === 'description' ? '#00BCD4' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Coûts */}
          <Grid item xs={12}>
            <CostBox>
              <SectionTitle>
                <Paid sx={{ fontSize: 20 }} />
                Informations Financières
              </SectionTitle>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={form.estGratuite || false}
                    onChange={e => handleChange('estGratuite', e.target.checked)}
                    color="warning"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#FF9800',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        },
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#FF9800',
                      },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontWeight: 700, color: form.estGratuite ? '#FF9800' : '#666' }}>
                    Intervention gratuite
                  </Typography>
                }
              />

              {!form.estGratuite && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Coût des pièces (DNT)"
                      type="number"
                      value={form.coutPieces ?? ''}
                      onChange={e => handleChange('coutPieces', e.target.value)}
                      onFocus={() => setFocusedField('coutPieces')}
                      onBlur={() => setFocusedField(null)}
                      error={!!errors.coutPieces}
                      helperText={errors.coutPieces}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Paid sx={{ 
                              color: focusedField === 'coutPieces' ? '#2196F3' : '#9e9e9e',
                              transition: 'color 0.3s',
                            }} />
                          </InputAdornment>
                        ),
                        inputProps: { 
                          min: 0,
                          step: 0.01
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Main d'œuvre (DNT)"
                      type="number"
                      value={form.coutMainOeuvre ?? ''}
                      onChange={e => handleChange('coutMainOeuvre', e.target.value)}
                      onFocus={() => setFocusedField('coutMainOeuvre')}
                      onBlur={() => setFocusedField(null)}
                      error={!!errors.coutMainOeuvre}
                      helperText={errors.coutMainOeuvre}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Paid sx={{ 
                              color: focusedField === 'coutMainOeuvre' ? '#4CAF50' : '#9e9e9e',
                              transition: 'color 0.3s',
                            }} />
                          </InputAdornment>
                        ),
                        inputProps: { 
                          min: 0,
                          step: 0.01
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              )}
              
              <Box sx={{ 
                mt: 2, 
                pt: 2, 
                borderTop: '1px solid rgba(255, 152, 0, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Coût total estimé:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FF9800' }}>
                  {form.estGratuite 
                    ? 'GRATUIT' 
                    : `${((form.coutPieces || 0) + (form.coutMainOeuvre || 0)).toFixed(2)} DNT`
                  }
                </Typography>
              </Box>
            </CostBox>
          </Grid>

          {/* Solution et Observations */}
          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              label="Solution apportée"
              value={form.solutionApportee || ''}
              onChange={e => handleChange('solutionApportee', e.target.value)}
              onFocus={() => setFocusedField('solutionApportee')}
              onBlur={() => setFocusedField(null)}
              multiline
              rows={3}
              placeholder="Décrivez la solution apportée..."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <StyledTextField
              fullWidth
              label="Observations"
              value={form.observations || ''}
              onChange={e => handleChange('observations', e.target.value)}
              onFocus={() => setFocusedField('observations')}
              onBlur={() => setFocusedField(null)}
              multiline
              rows={3}
              placeholder="Ajoutez des observations complémentaires..."
            />
          </Grid>

          {/* Durée */}
          <Grid item xs={12}>
            <StyledTextField
              fullWidth
              label="Durée estimée (minutes)"
              type="number"
              value={form.dureeMinutes ?? ''}
              onChange={e => handleChange('dureeMinutes', e.target.value)}
              onFocus={() => setFocusedField('dureeMinutes')}
              onBlur={() => setFocusedField(null)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday sx={{ 
                      color: focusedField === 'dureeMinutes' ? '#9C27B0' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
                inputProps: { min: 0 }
              }}
              helperText={form.dureeMinutes ? `≈ ${Math.floor(form.dureeMinutes / 60)}h${form.dureeMinutes % 60}m` : ''}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <Divider sx={{ borderColor: 'rgba(255, 152, 0, 0.1)' }} />

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <CancelButton 
          onClick={onClose}
          startIcon={<Cancel />}
        >
          Annuler
        </CancelButton>
        <SaveButton 
          onClick={handleSubmit}
          startIcon={<Save />}
          disabled={loading || !form.reclamationId || !form.technicienId || !form.technicienNom}
        >
          {loading ? 'Chargement...' : intervention ? 'Mettre à jour' : 'Créer'}
        </SaveButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default InterventionForm;