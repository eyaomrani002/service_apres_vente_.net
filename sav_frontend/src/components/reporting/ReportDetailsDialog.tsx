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
  Paper
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Close, ReceiptLong, CalendarToday, CheckCircle, Paid, Person, Build, Business, PictureAsPdf, Email, Phone } from '@mui/icons-material';
import { Report } from '../../types/report';
import PDFGenerator from './PDFGenerator';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '24px',
    animation: `${fadeIn} 0.4s ease`,
    width: '100%',
    maxWidth: '700px',
  },
}));

const HeaderChip = styled(Chip)(({ theme }) => ({
  fontWeight: 700,
  borderRadius: '16px',
  height: '32px',
}));

const DetailBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: '12px',
  backgroundColor: 'rgba(240, 240, 240, 0.3)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
}));

interface Props {
  open: boolean;
  report: Report | null;
  onClose: () => void;
}

const ReportDetailsDialog: React.FC<Props> = ({ open, report, onClose }) => {
  if (!report) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non spécifiée';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const truncateId = (id?: string) => {
    if (!id) return 'N/A';
    return id.length > 12 ? `${id.substring(0, 12)}...` : id;
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      fullWidth
      container={() => document.getElementById('root') as HTMLElement | null}
    >
      <DialogTitle component="div" sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2
      }}>
        <Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            <ReceiptLong sx={{ mr: 1, verticalAlign: 'middle' }} />
            Détail du rapport
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {truncateId(report.id)}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* En-tête avec statut et date */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <HeaderChip
            icon={<CheckCircle />}
            label={`Statut: ${report.isWarranty ? 'Sous garantie' : 'Standard'}`}
            color={report.isWarranty ? 'warning' : 'success'}
            variant="filled"
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Généré le: {formatDate(report.generatedAt)}
            </Typography>
          </Box>
        </Box>

        {/* Titre du rapport */}
        <DetailBox sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
            Titre du rapport
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {report.title || `Rapport ${truncateId(report.id)}`}
          </Typography>
        </DetailBox>

        {/* Informations principales */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <DetailBox>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Paid sx={{ color: '#4CAF50' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Montant total
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                {formatCurrency(report.total || 0)}
              </Typography>
            </DetailBox>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <DetailBox>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Build sx={{ color: '#2196F3' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Intervention
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                #{truncateId(report.interventionId)}
              </Typography>
            </DetailBox>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Informations client */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
            <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
            Informations client
          </Typography>
          <DetailBox>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Person sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Nom du client
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {report.clientNom || report.clientId || 'Non spécifié'}
                </Typography>
              </Grid>
              
              {report.clientEmail && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Email sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Email
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {report.clientEmail}
                  </Typography>
                </Grid>
              )}
              
              {report.clientTelephone && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Phone sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Téléphone
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {report.clientTelephone}
                  </Typography>
                </Grid>
              )}
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Business sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ID Client
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {truncateId(report.clientId)}
                </Typography>
              </Grid>
            </Grid>
          </DetailBox>
        </Box>

        {/* Informations technicien */}
        {report.technicianId && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'secondary.main' }}>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Technicien
            </Typography>
            <DetailBox>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                {truncateId(report.technicianId)}
              </Typography>
            </DetailBox>
          </Box>
        )}

        {/* Lien PDF */}
        {report.id && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'error.main' }}>
              <PictureAsPdf sx={{ mr: 1, verticalAlign: 'middle' }} />
              Document PDF
            </Typography>
            <PDFGenerator report={report} />
          </Box>
        )}
      </DialogContent>
    </StyledDialog>
  );
};

export default ReportDetailsDialog;