import React, { useState, useEffect, useMemo } from 'react';
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
  Chip,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  InputAdornment,
  Divider
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Close, Save, Person, Build, Email, LocationOn, Security, CalendarToday } from '@mui/icons-material';
import { Report } from '../../types/report';
import { Intervention } from '../../types/intervention';
import { Client } from '../../types/client';
import { Technicien } from '../../types/technicien';
import { AppUser } from '../../types/user';

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
  clients: Client[];
  interventions: Intervention[];
  techniciens: Technicien[];
  usersWithClientRole: AppUser[];
  clientInterventionMap: Map<number, Intervention[]>;
  clientDetails: Map<number, {nom: string, email?: string}>;
  report?: Report | null;
  onClose: () => void;
  onSave: (payload: Partial<Report>, id?: string) => void;
}

const ReportForm: React.FC<Props> = ({ 
  open, 
  clients, 
  interventions, 
  techniciens, 
  usersWithClientRole,
  clientInterventionMap,
  clientDetails,
  report, 
  onClose, 
  onSave
}) => {
  const [form, setForm] = useState<Partial<Report>>({
    isWarranty: false,
    total: 0,
  });
  const [loading, setLoading] = useState({
    submission: false
  });
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [availableInterventions, setAvailableInterventions] = useState<Intervention[]>(interventions);
  const [error, setError] = useState<string>('');

  // Regrouper tous les clients (API + Auth users)
  const allClients = useMemo(() => {
    const apiClients = clients.filter(c => !c.isAuthUser);
    const authClients = clients.filter(c => c.isAuthUser);
    return [...apiClients, ...authClients];
  }, [clients]);

  // Initialisation du formulaire
  useEffect(() => {
    if (!open) {
      // Réinitialiser le formulaire à la fermeture
      setForm({
        isWarranty: false,
        total: 0,
      });
      setSelectedClientId('');
      setAvailableInterventions(interventions);
      setError('');
      return;
    }

    const initializeForm = async () => {
      setError('');
      
      // Initialiser les champs de base
      const today = new Date().toISOString();
      
      const baseForm: Partial<Report> = {
        isWarranty: false,
        total: 0,
        generatedAt: today,
        title: `Rapport ${new Date().toLocaleDateString('fr-FR')}`,
      };

      // Si on édite un rapport existant
      if (report) {
        const updatedForm = {
          ...baseForm,
          ...report,
        };
        
        setForm(updatedForm);
        
        // Pré-remplir le client si possible
        if (report.clientId) {
          // Chercher le client dans la liste fusionnée
          const client = allClients.find(c => 
            String(c.id) === String(report.clientId) || 
            (c.isAuthUser && c.userId === report.clientId)
          );
          
          if (client) {
            setSelectedClientId(String(client.id));
            
            // Mettre à jour les interventions pour ce client
            updateInterventionsForClient(String(client.id));
          }
        }
      } else {
        // Nouveau rapport vierge
        setForm(baseForm);
        setSelectedClientId('');
        setAvailableInterventions(interventions);
      }
    };

    initializeForm();
  }, [open, report, allClients, interventions]);

  // Mettre à jour les interventions disponibles quand le client change
  const updateInterventionsForClient = (clientId: string) => {
    if (!clientId) {
      setAvailableInterventions(interventions);
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
    
    setAvailableInterventions(sortedInterventions);
    
    // Si l'intervention actuelle n'est pas dans la liste, la réinitialiser
    if (form.interventionId) {
      const isValid = sortedInterventions.some(i => String(i.id) === String(form.interventionId));
      if (!isValid) {
        setForm(prev => ({ ...prev, interventionId: '' }));
      }
    }
  };

  // Gérer la sélection d'un client
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    
    // Récupérer les informations du client sélectionné
    const client = allClients.find(c => String(c.id) === clientId);
    
    if (client) {
      // Remplir automatiquement les informations client
      setForm(prev => ({
        ...prev,
        clientId: client.isAuthUser ? client.userId : String(client.id),
        clientNom: client.nom,
        clientEmail: client.email,
        clientTelephone: client.telephone,
      }));
      
      // Mettre à jour les interventions disponibles pour ce client
      updateInterventionsForClient(clientId);
    }
  };

  // Gérer la sélection d'une intervention
  const handleInterventionSelect = (interventionId: string) => {
    const intervention = availableInterventions.find(i => String(i.id) === interventionId);
    if (!intervention) return;

    setForm(prev => ({
      ...prev,
      interventionId,
      total: intervention.coutTotal || 0,
    }));

    // Si pas de client sélectionné, essayer de trouver le client via la carte
    if (!selectedClientId) {
      for (const [clientId, clientInterventions] of clientInterventionMap.entries()) {
        if (clientInterventions.some(i => i.id === intervention.id)) {
          const client = allClients.find(c => c.id === clientId);
          if (client) {
            setSelectedClientId(String(clientId));
            setForm(prev => ({
              ...prev,
              clientId: client.isAuthUser ? client.userId : String(client.id),
              clientNom: client.nom,
              clientEmail: client.email,
              clientTelephone: client.telephone,
            }));
            break;
          }
        }
      }
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    // Validation
    if (!form.clientId) {
      setError('Veuillez sélectionner un client');
      return;
    }

    if (!form.interventionId) {
      setError('Veuillez sélectionner une intervention');
      return;
    }

    if (!form.title?.trim()) {
      setError('Veuillez saisir un titre');
      return;
    }

    setLoading(prev => ({ ...prev, submission: true }));
    setError('');

    try {
      const payload: Partial<Report> = {
        ...form,
        total: form.total || 0,
        isWarranty: form.isWarranty || false,
        generatedAt: form.generatedAt || new Date().toISOString(),
        title: form.title.trim(),
      };

      await onSave(payload, report?.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(prev => ({ ...prev, submission: false }));
    }
  };

  // Formater la date pour l'input datetime-local
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

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
          <span>{report ? 'Modifier le rapport' : 'Créer un nouveau rapport'}</span>
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
          {/* Titre du rapport */}
          <Grid item xs={12}>
            <TextField
              label="Titre du rapport *"
              fullWidth
              value={form.title || ''}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Rapport d'intervention #1234"
              required
              error={!form.title?.trim()}
              helperText={!form.title?.trim() ? "Le titre est obligatoire" : ""}
            />
          </Grid>

          {/* Section Client */}
          <Grid item xs={12}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Client *</InputLabel>
              <Select
                value={selectedClientId}
                label="Client *"
                onChange={(e) => handleClientSelect(e.target.value as string)}
                error={!selectedClientId}
              >
                <MenuItem value="">
                  <em>-- Sélectionner un client --</em>
                </MenuItem>
                
                {/* Clients enregistrés */}
                {allClients.filter(c => !c.isAuthUser).length > 0 && (
                  <MenuItem disabled sx={{ 
                    opacity: 1, 
                    color: 'text.secondary',
                    fontWeight: 'bold',
                    borderTop: '1px solid #e0e0e0',
                    mt: 1
                  }}>
                    Clients enregistrés
                  </MenuItem>
                )}
                {allClients
                  .filter(c => !c.isAuthUser)
                  .map((client) => (
                    <MenuItem key={`client-${client.id}`} value={String(client.id)}>
                      <Box>
                        <strong>{client.nom}</strong>
                        {client.email && (
                          <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                            ({client.email})
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                
                {/* Utilisateurs avec rôle client */}
                {allClients.filter(c => c.isAuthUser).length > 0 && (
                  <MenuItem disabled sx={{ 
                    opacity: 1, 
                    color: 'text.secondary',
                    fontWeight: 'bold',
                    borderTop: '1px solid #e0e0e0',
                    mt: 1
                  }}>
                    Utilisateurs
                  </MenuItem>
                )}
                {allClients
                  .filter(c => c.isAuthUser)
                  .map((client) => (
                    <MenuItem key={`auth-client-${client.id}`} value={String(client.id)}>
                      <Box>
                        <strong>{client.nom}</strong>
                        {client.email && (
                          <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                            ({client.email})
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Informations client (affichage seulement) */}
          {selectedClientId && (
            <Grid item xs={12}>
              <Box sx={{ 
                p: 2, 
                bgcolor: '#e8f5e8', 
                borderRadius: 1,
                border: '1px solid #c8e6c9'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#2e7d32' }}>
                  Informations client
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Nom:</strong> {form.clientNom || 'Non spécifié'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Email:</strong> {form.clientEmail || 'Non spécifié'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Téléphone:</strong> {form.clientTelephone || 'Non spécifié'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}

          {/* Section Intervention */}
          <Grid item xs={12}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Intervention *</InputLabel>
              <Select
                value={form.interventionId || ''}
                label="Intervention *"
                onChange={(e) => handleInterventionSelect(e.target.value as string)}
                disabled={!selectedClientId}
                error={!form.interventionId}
              >
                <MenuItem value="">
                  {!selectedClientId 
                    ? 'Sélectionnez d\'abord un client' 
                    : availableInterventions.length === 0 
                      ? 'Aucune intervention disponible pour ce client' 
                      : 'Sélectionnez une intervention'}
                </MenuItem>
                {availableInterventions.map((intervention) => (
                  <MenuItem key={intervention.id} value={String(intervention.id)}>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <strong>#{intervention.id}</strong> · {intervention.statut || 'Sans statut'}
                          {intervention.technicienNom && (
                            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', display: 'block' }}>
                              Technicien: {intervention.technicienNom}
                            </Typography>
                          )}
                        </Box>
                        <Chip 
                          label={intervention.coutTotal ? `${intervention.coutTotal.toFixed(2)}€` : 'Gratuit'} 
                          size="small" 
                          color={intervention.coutTotal ? "primary" : "success"}
                          variant="outlined"
                        />
                      </Box>
                      {intervention.description && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                          {intervention.description.length > 80 
                            ? `${intervention.description.substring(0, 80)}...` 
                            : intervention.description}
                        </Typography>
                      )}
                      {intervention.dateIntervention && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                          Date: {new Date(intervention.dateIntervention).toLocaleDateString('fr-FR')}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {selectedClientId && (
                <Typography variant="caption" sx={{ mt: 0.5, color: availableInterventions.length > 0 ? 'info.main' : 'warning.main', display: 'block' }}>
                  {availableInterventions.length} intervention(s) disponible(s) pour ce client
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Informations supplémentaires */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              bgcolor: '#e3f2fd', 
              borderRadius: 1,
              border: '1px solid #bbdefb'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#1565c0' }}>
                Informations supplémentaires
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Date de génération"
                    type="datetime-local"
                    fullWidth
                    value={formatDateForInput(form.generatedAt)}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      generatedAt: e.target.value ? `${e.target.value}:00` : new Date().toISOString() 
                    }))}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: <CalendarToday sx={{ mr: 1, color: '#666' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Technicien</InputLabel>
                    <Select
                      value={form.technicianId || ''}
                      label="Technicien"
                      onChange={(e) => setForm(prev => ({ ...prev, technicianId: e.target.value }))}
                    >
                      <MenuItem value="">Aucun technicien</MenuItem>
                      {techniciens.map((technicien) => (
                        <MenuItem key={technicien.id} value={String(technicien.id)}>
                          {technicien.nom || technicien.email || `Technicien ${technicien.id}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Montant */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              bgcolor: '#fff3e0', 
              borderRadius: 1,
              border: '1px solid #ffe0b2'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#e65100' }}>
                Montant
              </Typography>
              <TextField
                label="Montant total (€)"
                type="number"
                fullWidth
                value={form.total || ''}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  total: parseFloat(e.target.value) || 0 
                }))}
                InputProps={{ 
                  inputProps: { min: 0, step: 0.01 },
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                }}
              />
            </Box>
          </Grid>

          {/* Garantie */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isWarranty || false}
                  onChange={(e) => setForm(prev => ({ ...prev, isWarranty: e.target.checked }))}
                  color="warning"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Security sx={{ mr: 1, fontSize: 'small' }} />
                  <Typography>
                    Intervention sous garantie
                    {form.isWarranty && (
                      <Chip 
                        label="GARANTIE" 
                        size="small" 
                        color="warning" 
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Typography>
                </Box>
              }
            />
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
          disabled={loading.submission || !selectedClientId || !form.interventionId || !form.title?.trim()}
          startIcon={loading.submission ? <CircularProgress size={20} /> : <Save />}
          sx={{
            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
          }}
        >
          {loading.submission 
            ? 'Enregistrement...' 
            : report 
              ? 'Mettre à jour le rapport' 
              : 'Créer le rapport'
          }
        </StyledButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default ReportForm;