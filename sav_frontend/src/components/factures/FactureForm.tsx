import React, { useEffect, useMemo, useState } from 'react';
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
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Close, Save } from '@mui/icons-material';
import { Facture } from '../../types/facture';
import { Intervention } from '../../types/intervention';

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
`;

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '20px',
    animation: `${fadeIn} 0.3s ease`,
    width: '100%',
    maxWidth: '640px',
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
  onClose: () => void;
  onSave: (payload: Partial<Facture>) => void;
}

const statuses = ['En attente', 'Payée', 'Annulée'];

const FactureForm: React.FC<Props> = ({ open, interventions, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Facture>>({
    statut: 'En attente',
    tva: 0.19,
  });

  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        interventionId: prev.interventionId ?? interventions[0]?.id,
        tva: prev.tva ?? 0.19,
      }));
    }
  }, [open, interventions]);

  const currentIntervention = useMemo(() => {
    return interventions.find((i) => i.id === form.interventionId);
  }, [form.interventionId, interventions]);

  const handleChange = (key: keyof Facture, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSave(form);
  };

  const montantTTC = useMemo(() => {
    const ht = form.montantHT ?? 0;
    const tva = form.tva ?? 0;
    return ht * (1 + tva);
  }, [form.montantHT, form.tva]);

  return (
    <StyledDialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Créer une facture</span>
        <Close onClick={onClose} sx={{ cursor: 'pointer' }} />
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              select
              label="Intervention"
              fullWidth
              value={form.interventionId ?? ''}
              onChange={(event) => handleChange('interventionId', Number(event.target.value))}
              helperText={currentIntervention ? `${currentIntervention.technicienNom} | ${currentIntervention.statut}` : 'Sélectionnez une intervention'}
            >
              {interventions.map((intervention) => (
                <MenuItem key={intervention.id} value={intervention.id}>
                  #{intervention.id} - {intervention.technicienNom}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Numéro facture" fullWidth value={form.numeroFacture || ''} onChange={(e) => handleChange('numeroFacture', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Date facture" type="date" fullWidth value={form.dateFacture ? form.dateFacture.split('T')[0] : ''} onChange={(e) => handleChange('dateFacture', e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Client" fullWidth value={form.clientNom || ''} onChange={(e) => handleChange('clientNom', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Email client" fullWidth value={form.clientEmail || ''} onChange={(e) => handleChange('clientEmail', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Adresse client" fullWidth value={form.clientAdresse || ''} onChange={(e) => handleChange('clientAdresse', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField type="number" label="Montant HT" fullWidth value={form.montantHT ?? ''} onChange={(e) => handleChange('montantHT', Number(e.target.value))} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField type="number" label="TVA" fullWidth value={form.tva ?? 0.19} onChange={(e) => handleChange('tva', Number(e.target.value))} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField label="Montant TTC estimé" value={montantTTC ? montantTTC.toFixed(2) : '0.00'} disabled fullWidth InputProps={{ startAdornment: <Save fontSize="small" /> }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Statut" fullWidth value={form.statut || 'En attente'} onChange={(e) => handleChange('statut', e.target.value)}>
              {statuses.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Mode de paiement" fullWidth value={form.modePaiement || ''} onChange={(e) => handleChange('modePaiement', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" multiline rows={3} fullWidth value={form.descriptionServices || ''} onChange={(e) => handleChange('descriptionServices', e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <StyledButton variant="outlined" color="primary" onClick={onClose} startIcon={<Close />}>
          Annuler
        </StyledButton>
        <StyledButton variant="contained" color="primary" onClick={handleSubmit} startIcon={<Save />}>
          Enregistrer
        </StyledButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default FactureForm;