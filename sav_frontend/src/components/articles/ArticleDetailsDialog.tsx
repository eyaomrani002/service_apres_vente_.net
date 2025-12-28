// components/articles/ArticleDetailsDialog.tsx
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Chip, Grid, Card, CardContent,
  Divider, IconButton, Avatar, Stack
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  Close, AttachMoney, Inventory, Category, Description,
  CheckCircle, Warning, CalendarToday, AccessTime,
  Badge, Store, Timer, Today
} from '@mui/icons-material';
import { Article } from '../../types/article';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '24px',
    animation: `${fadeIn} 0.3s ease`,
    maxWidth: '800px',
    width: '100%',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
  color: '#fff',
  padding: '24px 32px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const ArticleAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  fontSize: '32px',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
  border: '4px solid #fff',
  boxShadow: '0 8px 24px rgba(156, 39, 176, 0.3)',
}));

const InfoCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  border: '1px solid rgba(156, 39, 176, 0.1)',
  transition: 'all 0.3s ease',
  animation: `${fadeIn} 0.5s ease`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(156, 39, 176, 0.15)',
  },
}));

const StatBox = styled(Box)(({ theme }) => ({
  padding: '16px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(186, 104, 200, 0.05) 100%)',
  border: '1px solid rgba(156, 39, 176, 0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.15)',
  },
}));

interface Props {
  open: boolean;
  article: Article | null;
  onClose: () => void;
}

const ArticleDetailsDialog: React.FC<Props> = ({ open, article, onClose }) => {
  if (!article) return null;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non spécifiée';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateEndOfWarranty = () => {
    if (!article.dateAchat) return null;
    const startDate = new Date(article.dateAchat);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + article.dureeGarantieMois);
    return endDate;
  };

  const endOfWarranty = calculateEndOfWarranty();

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Typography component="div" variant="h5" sx={{ fontWeight: 700 }}>
          Détails de l'Article
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
          <ArticleAvatar src={article.imageUrl || undefined}>
            {getInitials(article.nom)}
          </ArticleAvatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {article.nom}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Référence: <strong>{article.reference}</strong>
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip 
                icon={article.estEnStock ? <CheckCircle /> : <Warning />}
                label={article.estEnStock ? 'En stock' : 'En rupture'} 
                size="small"
                sx={{
                  fontWeight: 600,
                  background: article.estEnStock 
                    ? 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)'
                    : 'linear-gradient(135deg, #f44336 0%, #EF5350 100%)',
                  color: '#fff',
                }}
              />
              <Chip 
                icon={article.estSousGarantie ? <CheckCircle /> : <Warning />}
                label={article.estSousGarantie ? 'Sous garantie' : 'Hors garantie'} 
                size="small"
                sx={{
                  fontWeight: 600,
                  background: article.estSousGarantie
                    ? 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)'
                    : 'linear-gradient(135deg, #9E9E9E 0%, #BDBDBD 100%)',
                  color: '#fff',
                }}
              />
              <Chip 
                label={article.type}
                size="small"
                sx={{
                  fontWeight: 600,
                  backgroundColor: 'rgba(156, 39, 176, 0.1)',
                  color: '#9C27B0',
                }}
              />
            </Stack>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatBox>
              <AttachMoney sx={{ fontSize: 32, color: '#4CAF50' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                  {formatPrice(article.prixAchat)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Prix d'achat
                </Typography>
              </Box>
            </StatBox>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatBox>
              <CalendarToday sx={{ fontSize: 32, color: '#2196F3' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#2196F3' }}>
                  {formatDate(article.dateAchat)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Date d'achat
                </Typography>
              </Box>
            </StatBox>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatBox>
              <AccessTime sx={{ fontSize: 32, color: '#FF9800' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#FF9800' }}>
                  {article.dureeGarantieMois}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Mois garantie
                </Typography>
              </Box>
            </StatBox>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatBox>
              <Timer sx={{ fontSize: 32, color: '#00BCD4' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#00BCD4' }}>
                  {endOfWarranty ? formatDate(endOfWarranty.toISOString()) : 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Fin garantie
                </Typography>
              </Box>
            </StatBox>
          </Grid>
        </Grid>

        {/* Description */}
        {article.description && (
          <InfoCard sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#9C27B0' }}>
                <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                Description
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {article.description}
              </Typography>
            </CardContent>
          </InfoCard>
        )}

        {/* Informations complémentaires */}
        <InfoCard>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#9C27B0' }}>
              Informations Complémentaires
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Category sx={{ color: '#9C27B0' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Type d'article
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {article.type}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Badge sx={{ color: '#2196F3' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Référence
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {article.reference}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              {(article.numeroSerie || article.lieuInstallation || article.typeInstallation) && (
                <>
                  {article.numeroSerie && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Badge sx={{ color: '#FF9800' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Numéro de série
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {article.numeroSerie}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  
                  {article.lieuInstallation && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Store sx={{ color: '#4CAF50' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Lieu d'installation
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {article.lieuInstallation}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  
                  {article.typeInstallation && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Inventory sx={{ color: '#00BCD4' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Type d'installation
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {article.typeInstallation}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  
                  {article.dateInstallation && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Today sx={{ color: '#9C27B0' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Date installation
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {formatDate(article.dateInstallation)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </CardContent>
        </InfoCard>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
            color: '#fff',
            fontWeight: 700,
            padding: '10px 32px',
            borderRadius: '12px',
            textTransform: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%)',
            },
          }}
        >
          Fermer
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default ArticleDetailsDialog;