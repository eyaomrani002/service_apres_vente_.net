import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Stack,
  CircularProgress,
  Box,
  Alert,
  Typography,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Close, Save, Person, Build, Email, LocationOn } from '@mui/icons-material';
import { Facture } from '../../types/facture';
import { Intervention } from '../../types/intervention';
import { Client } from '../../types/client';
import { clientService } from '../../services/clientService';
import { reclamationService } from '../../services/reclamationService';
import { interventionService } from '../../services/interventionService';
import AuthContext from '../../contexts/AuthContext';

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
`;

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '20px',
    animation: `${fadeIn} 0.3s ease`,
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: '12px',
  padding: '10px 24px',
  fontWeight: 700,
}));

interface Props {
  open: boolean;
  interventions: Intervention[];
  facture?: Facture | null;
  prefillInterventionId?: number | null;
  onClose: () => void;
  onSave: (payload: Partial<Facture>, id?: number) => void;
}

const statuses = ['En attente', 'Payée', 'Annulée'];

const FactureForm: React.FC<Props> = ({ open, interventions, facture, prefillInterventionId, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Facture>>({
    statut: 'En attente',
    tva: 0.19,
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState({
    clients: false,
    interventions: false,
    submission: false
  });
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [availableInterventions, setAvailableInterventions] = useState<Intervention[]>([]);
  const [clientInterventionMap, setClientInterventionMap] = useState<Map<number, Intervention[]>>(new Map());
  const [error, setError] = useState<string>('');

  // Use AuthContext for current user and roles
  const { user: authUser } = useContext(AuthContext) as any;
  const rolesArr = Array.isArray(authUser?.roles) ? authUser.roles.map((r: string) => r.toLowerCase()) : typeof authUser?.role === 'string' ? [String(authUser.role).toLowerCase()] : [];
  const isClient = rolesArr.includes('client');
  const isAdmin = rolesArr.includes('admin');

  // Récupérer tous les utilisateurs avec rôle Client
  const fetchAuthClients = async (): Promise<Client[]> => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) return [];

      const res = await fetch('https://localhost:7076/apigateway/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (!res.ok) return [];
      const data = await res.json();
      
      const users = Array.isArray(data) 
        ? data 
        : data?.users || data?.data || data?.items || [];

      return users
        .filter((u: any) => {
          const roles = Array.isArray(u.roles) ? u.roles : [];
          const hasClient = roles.some((r: string) => r?.toLowerCase() === 'client');
          const hasAdmin = roles.some((r: string) => r?.toLowerCase() === 'admin');
          return hasClient && !hasAdmin; // exclude users that are admin
        })
        .map((u: any, idx: number) => ({
          id: -(idx + 1000),
          nom: u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userName || u.email || 'Client',
          email: u.email,
          telephone: u.phoneNumber,
          isAuthUser: true,
          userId: u.id,
        } as Client));
    } catch (err) {
      console.warn('Erreur lors de la récupération des clients auth:', err);
      return [];
    }
  };

  // Charger tous les clients (API + Auth)
  const loadAllClients = async () => {
    setLoading(prev => ({ ...prev, clients: true }));
    setError('');
    try {
      if (isClient && authUser) {
        // Pour le rôle client, charger uniquement ses propres infos
        const clientApi = await clientService.getByEmail(authUser.email).catch(() => null);
        if (clientApi) {
          setClients([clientApi]);
          setSelectedClientId(String(clientApi.id));
          setForm(prev => ({
            ...prev,
            clientNom: clientApi.nom,
            clientEmail: clientApi.email,
            clientAdresse: clientApi.adresse,
          }));
        }
        return;
      }
      // Sinon, charger tous les clients (admin/responsable)
      const apiClients = await clientService.getAll().catch(() => []);
      const validApiClients = Array.isArray(apiClients) ? apiClients : [];

      if (isAdmin) {
        // For admins: fetch auth users that have the 'client' role and show them
        const authClients = await fetchAuthClients().catch(() => []);
        const authEmails = new Set((authClients || []).map((a: any) => (a.email || '').toLowerCase()));
        const apiByEmail = new Map((validApiClients || []).map((c: any) => [String(c.email || '').toLowerCase(), c]));

        // Prefer API client records when an auth user has a matching API client (to keep numeric ids)
        const merged: Client[] = [];
        for (const ac of (authClients || [])) {
          const email = (ac.email || '').toLowerCase();
          if (apiByEmail.has(email)) {
            merged.push(apiByEmail.get(email)!);
          } else {
            merged.push(ac);
          }
        }

        setClients(merged);
      } else {
        // Non-admins see API clients only
        setClients(validApiClients);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err);
      setError('Impossible de charger la liste des clients');
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
    }
  };

  // Mapper les interventions par client
  const mapInterventionsByClient = async () => {
    setLoading(prev => ({ ...prev, interventions: true }));
    
    try {
      const map = new Map<number, Intervention[]>();
      
      for (const intervention of interventions) {
        try {
          let clientId: number | undefined;

          // Essayer d'obtenir le clientId depuis la réclamation
          const reclamation = await reclamationService.getById(intervention.reclamationId)
            .catch(() => null);
          
          if (reclamation?.clientId) {
            clientId = reclamation.clientId;
          }
          // Sinon utiliser le clientId direct de l'intervention
          else if (intervention.clientId) {
            clientId = intervention.clientId;
          }

          if (clientId) {
            if (!map.has(clientId)) {
              map.set(clientId, []);
            }
            // Éviter les doublons
            if (!map.get(clientId)!.some(i => i.id === intervention.id)) {
              map.get(clientId)!.push(intervention);
            }
          }
        } catch (err) {
          console.warn(`Erreur pour l'intervention ${intervention.id}:`, err);
        }
      }
      
      setClientInterventionMap(map);
      
      // Mettre à jour les interventions disponibles
      if (selectedClientId) {
        const clientIdNum = Number(selectedClientId);
        const interventionsForClient = map.get(clientIdNum) || [];
        setAvailableInterventions(interventionsForClient);
      } else {
        setAvailableInterventions(interventions);
      }
    } catch (err) {
      console.error('Erreur lors du mappage des interventions:', err);
    } finally {
      setLoading(prev => ({ ...prev, interventions: false }));
    }
  };

  // Récupérer les informations détaillées d'un client
  const getClientDetails = (clientId: number | string): Client | undefined => {
    const id = typeof clientId === 'string' ? Number(clientId) : clientId;
    return clients.find(c => c.id === id);
  };

  // Gérer la sélection d'un client
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    
    // Récupérer les informations du client sélectionné
    const client = getClientDetails(clientId);
    
    if (client) {
      // Remplir automatiquement les champs client dans le formulaire
      setForm(prev => ({
        ...prev,
        clientNom: client.nom,
        clientEmail: client.email,
        clientAdresse: client.adresse || '',
      }));
      
      // Mettre à jour les interventions disponibles pour ce client
      const clientIdNum = Number(clientId);
      const interventionsForClient = clientInterventionMap.get(clientIdNum) || [];
      setAvailableInterventions(interventionsForClient);
      
      // Si l'intervention actuelle n'est pas dans la liste, la réinitialiser
      if (form.interventionId) {
        const isValid = interventionsForClient.some(i => i.id === form.interventionId);
        if (!isValid) {
          setForm(prev => ({ ...prev, interventionId: undefined }));
        }
      }
    }
  };

  // Gérer la sélection d'une intervention
  const handleInterventionSelect = async (interventionId: number) => {
    const intervention = interventions.find(i => i.id === interventionId);
    if (!intervention) return;

    setForm(prev => ({
      ...prev,
      interventionId,
      montantHT: intervention.coutTotal || 
                ((intervention.coutPieces || 0) + (intervention.coutMainOeuvre || 0)) ||
                0,
    }));

    // Récupérer le client lié à cette intervention
    try {
      const reclamation = await reclamationService.getById(intervention.reclamationId)
        .catch(() => null);
      
      let clientId: number | undefined;
      if (reclamation?.clientId) {
        clientId = reclamation.clientId;
      } else if (intervention.clientId) {
        clientId = intervention.clientId;
      }

      if (clientId) {
        setSelectedClientId(String(clientId));
        
        // Récupérer les informations du client
        const client = clients.find(c => c.id === clientId);
        if (client) {
          setForm(prev => ({
            ...prev,
            clientNom: client.nom,
            clientEmail: client.email,
            clientAdresse: client.adresse || prev.clientAdresse,
          }));
        } else {
          // Si le client n'est pas dans la liste chargée, essayer de le récupérer
          try {
            const clientDetails = await clientService.getById(clientId);
            setForm(prev => ({
              ...prev,
              clientNom: clientDetails.nom,
              clientEmail: clientDetails.email,
              clientAdresse: clientDetails.adresse || prev.clientAdresse,
            }));
          } catch (err) {
            console.warn('Impossible de récupérer les détails du client:', err);
          }
        }
      }
    } catch (err) {
      console.warn('Erreur lors de la récupération des infos client:', err);
    }
  };

  // Générer un numéro de facture
  const generateNumeroFacture = useCallback(() => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const sequence = `${now.getDate()}${String(now.getSeconds()).padStart(2, '0')}${String(Math.floor(Math.random() * 90 + 10))}`;
    return `FACT-${yearMonth}-${sequence}`;
  }, []);

  // Initialisation du formulaire
  useEffect(() => {
    if (!open) return;

    const initializeForm = async () => {
      setError('');
      
      // Initialiser les champs de base
      const today = new Date().toISOString().split('T')[0];
      
      const baseForm: Partial<Facture> = {
        statut: 'En attente',
        tva: 0.19,
        dateFacture: today,
        numeroFacture: generateNumeroFacture(),
      };

      // Si on édite une facture existante
      if (facture) {
        const updatedForm = {
          ...baseForm,
          ...facture,
          dateFacture: facture.dateFacture?.split('T')[0] || today,
        };
        
        setForm(updatedForm);
        // If editing an existing facture, set selected client if available
        if ((facture as any).clientId) {
          setSelectedClientId(String((facture as any).clientId));
        }
      } 
      // Si nouvelle facture avec intervention pré-remplie
      else if (prefillInterventionId) {
        const intervention = interventions.find(i => i.id === prefillInterventionId);
        if (intervention) {
          baseForm.interventionId = intervention.id;
          baseForm.montantHT = intervention.coutTotal || 
                               ((intervention.coutPieces || 0) + (intervention.coutMainOeuvre || 0)) ||
                               0;
        }
        setForm(baseForm);
        // If an intervention is prefilled, try to resolve and select the related client
        if (intervention) {
          (async () => {
            try {
              const recl = await reclamationService.getById(intervention.reclamationId).catch(() => null);
              let clientId: number | undefined;
              if (recl?.clientId) clientId = recl.clientId;
              else if (intervention.clientId) clientId = intervention.clientId;
              if (clientId) {
                setSelectedClientId(String(clientId));
                const clientDetails = await clientService.getById(clientId).catch(() => null);
                if (clientDetails) {
                  setForm(prev => ({ ...prev, clientNom: clientDetails.nom, clientEmail: clientDetails.email, clientAdresse: clientDetails.adresse || prev.clientAdresse }));
                }
              }
            } catch (e) {}
          })();
        }
      }
      // Nouvelle facture vierge
      else {
        setForm(baseForm);
      }
    };

    initializeForm();
    loadAllClients();
    mapInterventionsByClient();
  }, [open, facture, prefillInterventionId, interventions, generateNumeroFacture]);

  // Mettre à jour les interventions disponibles quand le client change
  useEffect(() => {
    if (!selectedClientId) {
      setAvailableInterventions(interventions);
      return;
    }

    const clientIdNum = Number(selectedClientId);
    const interventionsForClient = clientInterventionMap.get(clientIdNum) || [];
    setAvailableInterventions(interventionsForClient);
    
    // Si l'intervention actuelle n'est pas dans la liste, la réinitialiser
    if (form.interventionId) {
      const isValid = interventionsForClient.some(i => i.id === form.interventionId);
      if (!isValid) {
        setForm(prev => ({ ...prev, interventionId: undefined }));
      }
    }
  }, [selectedClientId, clientInterventionMap, interventions, form.interventionId]);

  // Gérer les changements manuels des champs client
  const handleClientFieldChange = (field: 'clientNom' | 'clientEmail' | 'clientAdresse', value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    // Validation minimale
    if (!form.interventionId) {
      setError('Veuillez sélectionner une intervention');
      return;
    }

    if (!form.clientNom || !form.clientEmail) {
      setError('Les informations client (nom et email) sont obligatoires');
      return;
    }

    // Si l'adresse manque, tenter une dernière récupération automatique avant de bloquer
    if (!form.clientAdresse || String(form.clientAdresse).trim() === '') {
      try {
        // Priorité : client résolu via clientService.getAll
        const clients = await clientService.getAll();
        const authRaw = localStorage.getItem('user');
        let authUser: any = null;
        if (authRaw) authUser = JSON.parse(authRaw);
        const resolved = (clients || []).find((c: any) => String(c.userId) === String(authUser?.id) || c.email === authUser?.email);
        if (resolved && resolved.adresse) {
          setForm(prev => ({ ...prev, clientAdresse: resolved.adresse }));
        }

        // Si toujours vide, tenter par email
        if ((!form.clientAdresse || String(form.clientAdresse).trim() === '') && form.clientEmail) {
          const byEmail = await clientService.getByEmail(String(form.clientEmail)).catch(() => null);
          if (byEmail && byEmail.adresse) setForm(prev => ({ ...prev, clientAdresse: byEmail.adresse }));
        }

        // Si toujours vide, tenter via l'intervention -> réclamation -> client
        if ((!form.clientAdresse || String(form.clientAdresse).trim() === '') && form.interventionId) {
          const intr = interventions.find(i => i.id === Number(form.interventionId));
          if (intr) {
            const recl = await reclamationService.getById(intr.reclamationId).catch(() => null);
            if (recl?.clientId) {
              const clientFull = await clientService.getById(recl.clientId).catch(() => null);
              if (clientFull && clientFull.adresse) setForm(prev => ({ ...prev, clientAdresse: clientFull.adresse }));
            }
          }
        }
      } catch (e) {
        console.warn('Erreur lors de la récupération automatique de l\'adresse client', e);
      }
    }

    // Après tentatives, si adresse manquante -> bloquer et demander saisie
    if (!form.clientAdresse || String(form.clientAdresse).trim() === '') {
      setError('Adresse client requise — veuillez la saisir');
      return;
    }

    setLoading(prev => ({ ...prev, submission: true }));
    setError('');

    try {
      // Résoudre l'id numérique du client comme pour la réclamation
      let clientIdNum: number | undefined;
      try {
        const clients = await clientService.getAll();
        const authRaw = localStorage.getItem('user');
        let authUser: any = null;
        if (authRaw) authUser = JSON.parse(authRaw);
        const resolved = (clients || []).find((c: any) => String(c.userId) === String(authUser?.id) || c.email === authUser?.email);
        if (resolved && resolved.id) clientIdNum = resolved.id;
      } catch {}

      const payload: Partial<Facture> = {
        interventionId: Number(form.interventionId),
        numeroFacture: form.numeroFacture,
        dateFacture: form.dateFacture ? `${form.dateFacture}T00:00:00` : new Date().toISOString(),
        clientNom: form.clientNom || '',
        clientEmail: form.clientEmail || '',
        clientAdresse: form.clientAdresse || '',
        montantHT: Number(form.montantHT) || 0,
        tva: Number(form.tva) || 0.19,
        statut: form.statut || 'En attente',
        descriptionServices: form.descriptionServices,
        modePaiement: form.modePaiement,
        clientId: clientIdNum,
      };

      console.debug('FactureForm: creating payload', payload);

      await onSave(payload, facture?.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(prev => ({ ...prev, submission: false }));
    }
  };

  // Calculer le montant TTC
  const montantTTC = useMemo(() => {
    const ht = form.montantHT || 0;
    const tva = form.tva || 0.19;
    return ht * (1 + tva);
  }, [form.montantHT, form.tva]);

  return (
    <StyledDialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ 
        fontWeight: 700, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person />
          <span>{facture ? 'Modifier la facture' : 'Créer une nouvelle facture'}</span>
        </Box>
        <Close 
          onClick={onClose} 
          sx={{ 
            cursor: 'pointer', 
            '&:hover': { color: '#f44336' }
          }} 
        />
      </DialogTitle>
      
      <DialogContent dividers sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Section Client */}
          <Grid item size={{ xs: 12 }}>
            {isClient ? (
              <TextField
                label="Client"
                fullWidth
                value={form.clientNom || ''}
                disabled
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: '#1976d2' }} />,
                }}
              />
            ) : (
              <TextField
                select
                label="Client"
                fullWidth
                value={selectedClientId || ''}
                onChange={(e) => handleClientSelect(String(e.target.value))}
                disabled={loading.clients}
                helperText="Sélectionnez un client"
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: '#1976d2' }} />,
                }}
              >
                <MenuItem value="">
                  <em>-- Sélectionner un client --</em>
                </MenuItem>
                {clients.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.nom} {c.email ? `(${c.email})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Grid>

          {/* Informations client (automatiquement remplies) */}
          <Grid item size={{ xs: 12 }}>
            <Box sx={{ 
              p: 2, 
              bgcolor: '#e8f5e8', 
              borderRadius: 1,
              border: '1px solid #c8e6c9'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#2e7d32' }}>
                Informations client (pré-remplies automatiquement)
              </Typography>
              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Nom du client"
                    fullWidth
                    value={form.clientNom || ''}
                    onChange={(e) => handleClientFieldChange('clientNom', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: '#666' }} />,
                    }}
                  />
                </Grid>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Email du client"
                    fullWidth
                    type="email"
                    value={form.clientEmail || ''}
                    onChange={(e) => handleClientFieldChange('clientEmail', e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: '#666' }} />,
                    }}
                  />
                </Grid>
                <Grid item size={{ xs: 12 }}>
                  <TextField
                    label="Adresse du client"
                    fullWidth
                    multiline
                    rows={2}
                    value={form.clientAdresse || ''}
                    onChange={(e) => handleClientFieldChange('clientAdresse', e.target.value)}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: '#666', alignSelf: 'flex-start', mt: 1 }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Section Intervention */}
          <Grid item size={{ xs: 12 }}>
            <TextField
              select
              label="Sélectionner une intervention"
              fullWidth
              value={form.interventionId || ''}
              onChange={(e) => handleInterventionSelect(Number(e.target.value))}
              disabled={loading.interventions}
              helperText={
                selectedClientId 
                  ? `Interventions disponibles pour ce client: ${availableInterventions.length}`
                  : 'Veuillez d\'abord sélectionner un client'
              }
              InputProps={{
                startAdornment: loading.interventions ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : (
                  <Build sx={{ mr: 1, color: '#1976d2' }} />
                ),
              }}
            >
              <MenuItem value="">
                <em>-- Sélectionner une intervention --</em>
              </MenuItem>
              {availableInterventions.map((intervention) => (
                <MenuItem key={intervention.id} value={intervention.id}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>Intervention #{intervention.id}</strong>
                      <Box sx={{ fontSize: '0.9em', color: '#1976d2', fontWeight: 600 }}>
                        {intervention.coutTotal ? `${intervention.coutTotal.toFixed(2)} €` : 'Gratuit'}
                      </Box>
                    </Box>
                    <Box sx={{ fontSize: '0.85em', color: '#666', mt: 0.5 }}>
                      <div>📅 {new Date(intervention.dateIntervention).toLocaleDateString('fr-FR')}</div>
                      <div>👨‍🔧 Technicien: {intervention.technicienNom}</div>
                      <div>📋 Statut: {intervention.statut}</div>
                      {intervention.description && (
                        <div style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          maxWidth: '500px',
                          fontStyle: 'italic'
                        }}>
                          {intervention.description}
                        </div>
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Informations de la facture */}
          <Grid item size={{ xs: 12 }}>
            <Box sx={{ 
              p: 2, 
              bgcolor: '#e3f2fd', 
              borderRadius: 1,
              border: '1px solid #bbdefb'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#1565c0' }}>
                Informations de la facture
              </Typography>
              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Numéro de facture"
                    fullWidth
                    value={form.numeroFacture || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, numeroFacture: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Date de facture"
                    type="date"
                    fullWidth
                    value={form.dateFacture || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, dateFacture: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Montants */}
          <Grid item size={{ xs: 12 }}>
            <Box sx={{ 
              p: 2, 
              bgcolor: '#fff3e0', 
              borderRadius: 1,
              border: '1px solid #ffe0b2'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#e65100' }}>
                Montants de la facture
              </Typography>
              <Grid container spacing={2}>
                <Grid item size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Montant HT (€)"
                    type="number"
                    fullWidth
                    value={form.montantHT || ''}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      montantHT: parseFloat(e.target.value) || 0 
                    }))}
                    InputProps={{ 
                      inputProps: { min: 0, step: 0.01 },
                      startAdornment: <span style={{ marginRight: '8px' }}>€</span>,
                    }}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="TVA (%)"
                    type="number"
                    fullWidth
                    value={form.tva ? (form.tva * 100) : 19}
                    onChange={(e) => {
                      const percent = parseFloat(e.target.value) || 19;
                      setForm(prev => ({ ...prev, tva: percent / 100 }));
                    }}
                    InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                  />
                </Grid>
                <Grid item size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Montant TTC (€)"
                    fullWidth
                    value={montantTTC.toFixed(2)}
                    disabled
                    InputProps={{
                      startAdornment: <span style={{ marginRight: '8px', fontWeight: 600 }}>€</span>,
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontWeight: 700,
                        color: '#e65100',
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Statut et informations complémentaires */}
          <Grid item size={{ xs: 12 }}>
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Statut de la facture"
                  fullWidth
                  value={form.statut || 'En attente'}
                  onChange={(e) => setForm(prev => ({ ...prev, statut: e.target.value }))}
                >
                  {statuses.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Mode de paiement"
                  fullWidth
                  value={form.modePaiement || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, modePaiement: e.target.value }))}
                  placeholder="Carte bancaire, Virement, Chèque..."
                />
              </Grid>
              <Grid item size={{ xs: 12 }}>
                <TextField
                  label="Description des services"
                  fullWidth
                  multiline
                  rows={3}
                  value={form.descriptionServices || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, descriptionServices: e.target.value }))}
                  placeholder="Détail des prestations facturées..."
                  helperText="Décrivez les services rendus pour cette intervention"
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
        <StyledButton
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={loading.submission}
          startIcon={<Close />}
        >
          Annuler
        </StyledButton>
        <StyledButton
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading.submission || !form.interventionId || !form.clientNom || !form.clientEmail}
          startIcon={loading.submission ? <CircularProgress size={20} /> : <Save />}
          sx={{
            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
          }}
        >
          {loading.submission 
            ? 'Enregistrement...' 
            : facture 
              ? 'Mettre à jour la facture' 
              : 'Créer la facture'
          }
        </StyledButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default FactureForm;