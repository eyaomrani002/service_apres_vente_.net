import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid } from '@mui/material';
import { Client } from '../../types/client';

interface Props {
  open: boolean;
  client?: Client | null;
  onClose: () => void;
  onSave: (c: Partial<Client>) => void;
}

const ClientForm: React.FC<Props> = ({ open, client, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Client>>({});

  useEffect(() => {
    setForm(client ? { ...client } : { nom: '', email: '', telephone: '', adresse: '' });
  }, [client, open]);

  const handleChange = (k: keyof Client, v: any) => setForm(s => ({ ...s, [k]: v }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{client ? 'Modifier client' : 'Nouveau client'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}><TextField label="Nom" value={form.nom || ''} fullWidth onChange={e => handleChange('nom', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Email" value={form.email || ''} fullWidth onChange={e => handleChange('email', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Téléphone" value={form.telephone || ''} fullWidth onChange={e => handleChange('telephone', e.target.value)} /></Grid>
          <Grid item xs={12}><TextField label="Adresse" value={form.adresse || ''} fullWidth multiline rows={2} onChange={e => handleChange('adresse', e.target.value)} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={() => onSave(form)}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientForm;
