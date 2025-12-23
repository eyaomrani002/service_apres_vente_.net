// ClientDetailsDialog.tsx - Dialog de détails complet pour un client
import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Box, Avatar, Chip, Grid, Card, CardContent,
  List, ListItem, ListItemText, Divider, IconButton, CircularProgress
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Close, Email, Phone, Place, CalendarToday, Assignment,
  TrendingUp, CheckCircle, Schedule, Warning
} from '@mui/icons-material';
import { Client } from '../../types/client';
import { clientService } from '../../services/clientService';

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
  background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
  color: '#fff',
  padding: '24px 32px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const ClientAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  fontSize: '32px',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #64B5F6 0%, #81D4FA 100%)',
  border: '4px solid #fff',
  boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
}));

const InfoCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  border: '1px solid rgba(33, 150, 243, 0.1)',
  transition: 'all 0.3s ease',
  animation: `${fadeIn} 0.5s ease`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(33, 150, 243, 0.15)',
  },
}));

const StatBox = styled(Box)(({ theme }) => ({
  padding: '16px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(0, 188, 212, 0.05) 100%)',
  border: '1px solid rgba(33, 150, 243, 0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.15)',
  },
}));

const ReclamationItem = styled(ListItem)(({ theme }) => ({
  borderRadius: '12px',
  marginBottom: '8px',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  transition: 'all 0.3s ease',
  animation: `${slideIn} 0.5s ease`,
  '&:hover': {
    backgroundColor: 'rgba(33, 150, 243, 0.04)',
    transform: 'translateX(8px)',
    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.1)',
  },
}));

interface Props {
  open: boolean;
  client: Client | null;
  onClose: () => void;
}

const ClientDetailsDialog: React.FC<Props> = ({ open, client, onClose }) => {
  const [reclamations, setReclamations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!client) return;
      setLoading(true);
      try {
        const data = await clientService.getReclamationsForClient(client.id);
        setReclamations(Array.isArray(data) ? data : []);
      } catch {
        setReclamations([]);
      } finally { 
        setLoading(false); 
      }
    };
    if (open) {
      run();
    }
  }, [client, open]);

  if (!client) return null;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (statut?: string) => {
    switch(statut?.toLowerCase()) {
      case 'résolu': case 'resolue': return '#4CAF50';
      case 'en cours': case 'en_cours': return '#FF9800';
      case 'en attente': case 'nouvelle': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Détails du Client
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
        {/* Header Section */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 4 }}>
          <ClientAvatar>
            {getInitials(client.nom)}
          </ClientAvatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {client.nom}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {client.reclamationsEnCours !== undefined && client.reclamationsEnCours > 0 ? (
                <Chip 
                  icon={<TrendingUp />}
                  label="Client Actif" 
                  size="small"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                    color: '#fff',
                  }}
                />
              ) : (
                <Chip 
                  label="Client Inactif" 
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              )}
              {client.nombreReclamations !== undefined && client.nombreReclamations > 5 && (
                <Chip 
                  label="Client VIP" 
                  size="small"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
                    color: '#fff',
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatBox>
              <Assignment sx={{ fontSize: 32, color: '#2196F3' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#2196F3' }}>
                  {client.nombreReclamations ?? 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Réclamations
                </Typography>
              </Box>
            </StatBox>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatBox>
              <Schedule sx={{ fontSize: 32, color: '#FF9800' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#FF9800' }}>
                  {client.reclamationsEnCours ?? 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  En cours
                </Typography>
              </Box>
            </StatBox>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatBox>
              <CheckCircle sx={{ fontSize: 32, color: '#4CAF50' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                  {(client.nombreReclamations ?? 0) - (client.reclamationsEnCours ?? 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Résolues
                </Typography>
              </Box>
            </StatBox>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatBox>
              <CalendarToday sx={{ fontSize: 32, color: '#00BCD4' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Inscrit le
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {client.dateInscription 
                    ? new Date(client.dateInscription).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    : '-'
                  }
                </Typography>
              </Box>
            </StatBox>
          </Grid>
        </Grid>

        {/* Contact Info */}
        <InfoCard sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2196F3' }}>
              Informations de Contact
            </Typography>
            <Grid container spacing={2}>
              {client.email && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Email sx={{ color: '#00BCD4' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {client.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {client.telephone && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Phone sx={{ color: '#2196F3' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Téléphone
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {client.telephone}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
              {client.adresse && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Place sx={{ color: '#9E9E9E' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Adresse
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {client.adresse}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </InfoCard>

        {/* Réclamations */}
        <InfoCard>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#2196F3' }}>
              Historique des Réclamations
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : reclamations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Warning sx={{ fontSize: 48, color: '#9E9E9E', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Aucune réclamation pour ce client
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {reclamations.map((r: any, index: number) => (
                  <ReclamationItem 
                    key={r.id}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {r.sujet || `Réclamation #${r.id}`}
                          </Typography>
                          {r.statut && (
                            <Chip 
                              label={r.statut}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                backgroundColor: getStatusColor(r.statut),
                                color: '#fff',
                                height: '24px',
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          {r.description && (
                            <Typography 
                              component="span" 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ display: 'block', mb: 0.5 }}
                            >
                              {r.description}
                            </Typography>
                          )}
                          <Typography 
                            component="span" 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <CalendarToday sx={{ fontSize: 14 }} />
                            {r.dateCreation 
                              ? new Date(r.dateCreation).toLocaleString('fr-FR')
                              : 'Date inconnue'
                            }
                          </Typography>
                        </>
                      }
                    />
                  </ReclamationItem>
                ))}
              </List>
            )}
          </CardContent>
        </InfoCard>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
            color: '#fff',
            fontWeight: 700,
            padding: '10px 32px',
            borderRadius: '12px',
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #1976D2 0%, #0097A7 100%)',
            },
          }}
        >
          Fermer
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default ClientDetailsDialog;