import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem, Box } from '@mui/material';
import { Intervention } from '../../types/intervention';
import { Client } from '../../types/client';
import { clientService } from '../../services/clientService';
import { reclamationService } from '../../services/reclamationService';

interface Props {
  open: boolean;
  intervention?: Intervention | null;
  onClose: () => void;
  onSave: (c: Partial<Intervention>) => void;
}

const InterventionForm: React.FC<Props> = ({ open, intervention, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Intervention>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>('');
  const [reclamations, setReclamations] = useState<any[]>([]);

  useEffect(() => {
    setForm(intervention ? { ...intervention } : {
      reclamationId: undefined as any,
      technicienId: undefined as any,
      technicienNom: '',
      dateIntervention: new Date().toISOString(),
      statut: 'Planifiée',
      estGratuite: false
    });
  }, [intervention, open]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (intervention?.reclamationId) {
        try {
          const rec = await reclamationService.getById(intervention.reclamationId);
          if (!ignore && rec && rec.clientId) setClientId(String(rec.clientId));
        } catch {}
      } else {
        setClientId('');
      }
    })();
    return () => { ignore = true; };
  }, [intervention, open]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await clientService.getAll();
        if (!ignore) setClients(Array.isArray(data) ? data : []);
      } catch { if (!ignore) setClients([]); }
    })();
    return () => { ignore = true; };
  }, [open]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!clientId) { setReclamations([]); return; }
      try {
        const recs = await reclamationService.getByClient(Number(clientId));
        if (!ignore) setReclamations(Array.isArray(recs) ? recs : []);
      } catch { if (!ignore) setReclamations([]); }
    })();
    return () => { ignore = true; };
  }, [clientId]);

  const handleChange = (k: keyof Intervention, v: any) => setForm(s => ({ ...s, [k]: v }));

  const disableSave = useMemo(() => {
    return !form.reclamationId || !form.technicienId || !form.technicienNom || !form.dateIntervention || !form.statut;
  }, [form]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{intervention ? 'Modifier intervention' : 'Nouvelle intervention'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 0.5, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
          <Box>
            <TextField id="interv-form-client" select label="Client" value={clientId} fullWidth onChange={e => setClientId(e.target.value)}>
              <MenuItem value="" disabled>Sélectionner un client</MenuItem>
              {clients.map(c => (<MenuItem key={c.id} value={String(c.id)}>{c.nom}{c.email ? ` — ${c.email}` : ''}</MenuItem>))}
            </TextField>
          </Box>
          <Box>
            <TextField id="interv-form-reclamation" select label="Réclamation" value={form.reclamationId ?? ''} fullWidth onChange={e => handleChange('reclamationId', Number(e.target.value))} disabled={!clientId}>
              <MenuItem value="" disabled>Sélectionner une réclamation</MenuItem>
              {reclamations.map((r: any) => {
                const rid = r.id ?? r.Id;
                const label = (r.sujet ?? r.Sujet) || `Réclamation #${rid}`;
                return (<MenuItem key={rid} value={rid}>{label}</MenuItem>);
              })}
            </TextField>
          </Box>

          <Box><TextField id="interv-form-technicien-id" label="Technicien ID" type="number" value={form.technicienId ?? ''} fullWidth onChange={e => handleChange('technicienId', Number(e.target.value))} /></Box>
          <Box><TextField id="interv-form-technicien-nom" label="Technicien Nom" value={form.technicienNom || ''} fullWidth onChange={e => handleChange('technicienNom', e.target.value)} /></Box>
          <Box><TextField id="interv-form-date" label="Date d'intervention" type="datetime-local" value={form.dateIntervention ? new Date(form.dateIntervention).toISOString().slice(0,16) : ''} fullWidth onChange={e => handleChange('dateIntervention', new Date(e.target.value).toISOString())} /></Box>
          <Box>
            <TextField id="interv-form-statut" select label="Statut" value={form.statut || 'Planifiée'} fullWidth onChange={e => handleChange('statut', e.target.value)}>
              <MenuItem value="Planifiée">Planifiée</MenuItem>
              <MenuItem value="En cours">En cours</MenuItem>
              <MenuItem value="Terminée">Terminée</MenuItem>
              <MenuItem value="Annulée">Annulée</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ gridColumn: '1 / -1' }}><TextField id="interv-form-description" label="Description" value={form.description || ''} fullWidth multiline rows={2} onChange={e => handleChange('description', e.target.value)} /></Box>
          <Box sx={{ gridColumn: '1 / -1' }}><TextField id="interv-form-observations" label="Observations" value={form.observations || ''} fullWidth multiline rows={2} onChange={e => handleChange('observations', e.target.value)} /></Box>
          <Box sx={{ gridColumn: '1 / -1' }}><TextField id="interv-form-solution" label="Solution apportée" value={form.solutionApportee || ''} fullWidth multiline rows={2} onChange={e => handleChange('solutionApportee', e.target.value)} /></Box>

          <Box><TextField id="interv-form-cout-pieces" label="Coût pièces" type="number" value={form.coutPieces ?? ''} fullWidth onChange={e => handleChange('coutPieces', e.target.value === '' ? null : Number(e.target.value))} /></Box>
          <Box><TextField id="interv-form-main-oeuvre" label="Main d'œuvre" type="number" value={form.coutMainOeuvre ?? ''} fullWidth onChange={e => handleChange('coutMainOeuvre', e.target.value === '' ? null : Number(e.target.value))} /></Box>
          <Box><TextField id="interv-form-gratuite" label="Gratuite" select value={form.estGratuite ? 'oui' : 'non'} fullWidth onChange={e => handleChange('estGratuite', e.target.value === 'oui')}>
            <MenuItem value="non">Non</MenuItem>
            <MenuItem value="oui">Oui</MenuItem>
          </TextField></Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={() => onSave(form)} disabled={disableSave}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default InterventionForm;
