import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Close, ReceiptLong, CalendarToday, CheckCircle, Paid } from '@mui/icons-material';
import { Facture } from '../../types/facture';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '24px',
    animation: `${fadeIn} 0.4s ease`,
    width: '100%',
    maxWidth: '640px',
  },
}));

const HeaderChip = styled(Chip)(({ theme }) => ({
  fontWeight: 700,
  borderRadius: '16px',
}));

interface Props {
  open: boolean;
  facture: Facture | null;
  onClose: () => void;
}

const FactureDetailsDialog: React.FC<Props> = ({ open, facture, onClose }) => {
  if (!facture) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  return (
    <StyledDialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Détail facture {facture.numeroFacture}
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <HeaderChip
            icon={<ReceiptLong />}
            label={`Statut : ${facture.statut}`}
            color={facture.statut.toLowerCase() === 'payée' ? 'success' : 'warning'}
          />
          <Typography variant="body2" color="text.secondary">
            Date : {new Date(facture.dateFacture).toLocaleDateString('fr-FR')}
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Paid sx={{ color: '#4CAF50' }} />
              <Typography variant="subtitle2">Montant TTC</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {formatCurrency(facture.montantTTC)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(facture.montantHT)} + TVA ({(facture.tva * 100).toFixed(0)}%)
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday sx={{ color: '#2196F3' }} />
              <Typography variant="subtitle2">Intervention</Typography>
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              #{facture.interventionId}
            </Typography>
            {facture.datePaiement && (
              <Typography variant="caption" color="text.secondary">
                Payée le {new Date(facture.datePaiement).toLocaleDateString('fr-FR')}
              </Typography>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Informations client
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {facture.clientNom}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {facture.clientEmail}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {facture.clientAdresse}
          </Typography>
        </Box>

        {facture.descriptionServices && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Services facturés
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {facture.descriptionServices}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </StyledDialog>
  );
};

export default FactureDetailsDialog;