import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Grid, MenuItem } from '@mui/material';
import { Reclamation } from '../../types/reclamation';
import { Client } from '../../types/client';
import { clientService } from '../../services/clientService';

interface Props {
  open: boolean;
  reclamation?: Reclamation | null;
  onClose: () => void;
  onSave: (c: Partial<Reclamation>) => void;
}

const ReclamationForm: React.FC<Props> = ({ open, reclamation, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Reclamation>>({});
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    setForm(reclamation ? { ...reclamation } : { clientId: undefined, sujet: '', description: '', priorite: 'moyenne', statut: 'nouvelle' });
  }, [reclamation, open]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await clientService.getAll();
        if (!ignore) setClients(Array.isArray(data) ? data : []);
      } catch {
        if (!ignore) setClients([]);
      }
    })();
    return () => { ignore = true; };
  }, [open]);

  const handleChange = (k: keyof Reclamation, v: any) => setForm(s => ({ ...s, [k]: v }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{reclamation ? 'Modifier réclamation' : 'Nouvelle réclamation'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Client"
              value={form.clientId ?? ''}
              fullWidth
              onChange={e => handleChange('clientId', Number(e.target.value))}
              SelectProps={{ native: false }}
            >
              <MenuItem value="" disabled>Sélectionner un client</MenuItem>
              {clients.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.nom}{c.email ? ` — ${c.email}` : ''}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}><TextField label="Sujet" value={form.sujet || ''} fullWidth onChange={e => handleChange('sujet', e.target.value)} /></Grid>
          <Grid item xs={12}><TextField label="Description" value={form.description || ''} fullWidth multiline rows={3} onChange={e => handleChange('description', e.target.value)} /></Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Priorité" value={form.priorite || 'moyenne'} fullWidth onChange={e => handleChange('priorite', e.target.value)}>
              <MenuItem value="faible">Faible</MenuItem>
              <MenuItem value="moyenne">Moyenne</MenuItem>
              <MenuItem value="haute">Haute</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Statut" value={form.statut || 'nouvelle'} fullWidth onChange={e => handleChange('statut', e.target.value)}>
              <MenuItem value="nouvelle">Nouvelle</MenuItem>
              <MenuItem value="en_cours">En cours</MenuItem>
              <MenuItem value="resolue">Résolue</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={() => onSave(form)}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReclamationForm;
