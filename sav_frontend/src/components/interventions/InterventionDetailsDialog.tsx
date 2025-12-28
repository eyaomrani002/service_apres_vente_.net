// InterventionDetailsDialog.tsx - Dialog de détails complet
import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Avatar, Chip, Grid, Card, CardContent,
  List, ListItem, ListItemText, Divider, IconButton, CircularProgress,
  LinearProgress
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Close, CalendarToday, Person, Build, CheckCircle, 
  Schedule, Warning, Paid, Description, Visibility,
  Email, Phone, Place, AccessTime, Receipt
} from '@mui/icons-material';
import { Intervention } from '../../types/intervention';
import { interventionService } from '../../services/interventionService';
import { clientService } from '../../services/clientService';
import { reclamationService } from '../../services/reclamationService';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '24px',
    animation: `${fadeIn} 0.3s ease`,
    maxWidth: '900px',
    width: '100%',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
  color: '#fff',
  padding: '24px 32px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const TechnicienAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  fontSize: '32px',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
  border: '4px solid #fff',
  boxShadow: '0 8px 24px rgba(255, 152, 0, 0.3)',
}));

const InfoCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  border: '1px solid rgba(255, 152, 0, 0.1)',
  transition: 'all 0.3s ease',
  animation: `${fadeIn} 0.5s ease`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(255, 152, 0, 0.15)',
  },
}));

const StatBox = styled(Box)(({ theme }) => ({
  padding: '16px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 193, 7, 0.05) 100%)',
  border: '1px solid rgba(255, 152, 0, 0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
  },
}));

const StatusProgress = styled(LinearProgress)(({ theme }) => ({
  height: '8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(255, 152, 0, 0.1)',
  '& .MuiLinearProgress-bar': {
    borderRadius: '4px',
  },
}));

interface Props {
  open: boolean;
  intervention: Intervention | null;
  onClose: () => void;
}

const InterventionDetailsDialog: React.FC<Props> = ({ open, intervention, onClose }) => {
  const [client, setClient] = useState<any>(null);
  const [reclamation, setReclamation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      if (!intervention) return;
      
      setLoading(true);
      try {
        // Charger la réclamation associée
        const rec = await reclamationService.getById(intervention.reclamationId);
        setReclamation(rec);
        
        // Charger le client associé
        if (rec && rec.clientId) {
          const cli = await clientService.getById(rec.clientId);
          setClient(cli);
        }
      } catch (error) {
        console.error('Error loading details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open && intervention) {
      loadDetails();
    }
  }, [intervention, open]);

  if (!intervention) {
    return (
      <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Aucune intervention sélectionnée
          </Typography>
        </DialogContent>
      </StyledDialog>
    );
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (statut: string) => {
    switch(statut.toLowerCase()) {
      case 'terminée': return '#4CAF50';
      case 'en cours': return '#2196F3';
      case 'planifiée': return '#FF9800';
      case 'annulée': return '#f44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusProgress = (statut: string) => {
    switch(statut.toLowerCase()) {
      case 'planifiée': return 25;
      case 'en cours': return 60;
      case 'terminée': return 100;
      case 'annulée': return 0;
      default: return 0;
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCost = (cost: number | null | undefined) => {
    if (cost === null || cost === undefined) return '0.00 €';
    return `${cost.toFixed(2)} €`;
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disablePortal
      container={() => document.getElementById('root') as HTMLElement | null || undefined}
    >
      <StyledDialogTitle component="div">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Détails de l'Intervention #{intervention.id}
        </Typography>
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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} sx={{ color: '#FF9800' }} />
          </Box>
        ) : (
          <>
            {/* Header Section */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 4 }}>
              <TechnicienAvatar>
                {getInitials(intervention.technicienNom)}
              </TechnicienAvatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Intervention #{intervention.id}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip 
                    label={intervention.statut}
                    sx={{
                      fontWeight: 700,
                      backgroundColor: getStatusColor(intervention.statut),
                      color: '#fff',
                      fontSize: '14px',
                      height: '32px',
                    }}
                  />
                  {intervention.estGratuite && (
                    <Chip 
                      label="Gratuite"
                      size="small"
                      sx={{
                        fontWeight: 600,
                        backgroundColor: '#4CAF50',
                        color: '#fff',
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Status Progress */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Progression
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getStatusProgress(intervention.statut)}%
                </Typography>
              </Box>
              <StatusProgress 
                variant="determinate" 
                value={getStatusProgress(intervention.statut)}
                sx={{
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getStatusColor(intervention.statut),
                  },
                }}
              />
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatBox>
                  <CalendarToday sx={{ fontSize: 32, color: '#FF9800' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Date d'intervention
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatDate(intervention.dateIntervention)}
                    </Typography>
                  </Box>
                </StatBox>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatBox>
                  <Person sx={{ fontSize: 32, color: '#2196F3' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Technicien
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {intervention.technicienNom}
                    </Typography>
                  </Box>
                </StatBox>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatBox>
                  <AccessTime sx={{ fontSize: 32, color: '#00BCD4' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Durée
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatDuration(intervention.dureeMinutes)}
                    </Typography>
                  </Box>
                </StatBox>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatBox>
                  <Paid sx={{ fontSize: 32, color: '#4CAF50' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Coût total
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {formatCost(intervention.coutTotal)}
                    </Typography>
                  </Box>
                </StatBox>
              </Grid>
            </Grid>

            {/* Client & Reclamation Info */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {client && (
                <Grid item xs={12} md={6}>
                  <InfoCard>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2196F3' }}>
                        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Informations Client
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ 
                          width: 48, 
                          height: 48,
                          background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
                          fontWeight: 700 
                        }}>
                          {getInitials(client.nom)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {client.nom}
                          </Typography>
                          {client.email && (
                            <Typography variant="caption" color="text.secondary">
                              {client.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      {client.telephone && (
                        <Typography variant="body2" sx={{ color: '#666', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Phone sx={{ fontSize: 16 }} />
                          {client.telephone}
                        </Typography>
                      )}
                      {client.adresse && (
                        <Typography variant="body2" sx={{ color: '#666', display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Place sx={{ fontSize: 16 }} />
                          {client.adresse}
                        </Typography>
                      )}
                    </CardContent>
                  </InfoCard>
                </Grid>
              )}

              {reclamation && (
                <Grid item xs={12} md={6}>
                  <InfoCard>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#FF9800' }}>
                        <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Réclamation Associée
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                        {reclamation.sujet || `Réclamation #${reclamation.id}`}
                      </Typography>
                      {reclamation.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                          "{reclamation.description.substring(0, 100)}..."
                        </Typography>
                      )}
                      {reclamation.dateCreation && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarToday sx={{ fontSize: 14 }} />
                          Créée le {new Date(reclamation.dateCreation).toLocaleDateString('fr-FR')}
                        </Typography>
                      )}
                    </CardContent>
                  </InfoCard>
                </Grid>
              )}
            </Grid>

            {/* Details Sections */}
            <Grid container spacing={3}>
              {intervention.description && (
                <Grid item xs={12} md={6}>
                  <InfoCard>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#00BCD4' }}>
                        <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Description
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {intervention.description}
                      </Typography>
                    </CardContent>
                  </InfoCard>
                </Grid>
              )}

              {intervention.solutionApportee && (
                <Grid item xs={12} md={6}>
                  <InfoCard>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#4CAF50' }}>
                        <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Solution Apportée
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {intervention.solutionApportee}
                      </Typography>
                    </CardContent>
                  </InfoCard>
                </Grid>
              )}

              {intervention.observations && (
                <Grid item xs={12}>
                  <InfoCard>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#9C27B0' }}>
                        <Visibility sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Observations
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {intervention.observations}
                      </Typography>
                    </CardContent>
                  </InfoCard>
                </Grid>
              )}

              {/* Coût Details */}
              <Grid item xs={12}>
                <InfoCard>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#FF9800' }}>
                      <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Détails Financiers
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(33, 150, 243, 0.05)', borderRadius: '12px' }}>
                          <Typography variant="caption" color="text.secondary">
                            Pièces
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#2196F3' }}>
                            {formatCost(intervention.coutPieces)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(76, 175, 80, 0.05)', borderRadius: '12px' }}>
                          <Typography variant="caption" color="text.secondary">
                            Main d'œuvre
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                            {formatCost(intervention.coutMainOeuvre)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(255, 152, 0, 0.05)', borderRadius: '12px' }}>
                          <Typography variant="caption" color="text.secondary">
                            Total
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 800, color: '#FF9800' }}>
                            {formatCost(intervention.coutTotal)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </InfoCard>
              </Grid>
            </Grid>
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
            color: '#fff',
            fontWeight: 700,
            padding: '10px 32px',
            borderRadius: '12px',
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #F57C00 0%, #FFA000 100%)',
            },
          }}
        >
          Fermer
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default InterventionDetailsDialog;