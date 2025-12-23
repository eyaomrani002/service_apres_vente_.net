import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography, List, ListItem, ListItemText, IconButton, Switch, FormControlLabel } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import reportingService from '../../services/reportingService';
import { Report, ReportRequest } from '../../types/report';

const ReportingPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [interventionId, setInterventionId] = useState('');
  const [total, setTotal] = useState<number | ''>('');
  const [isWarranty, setIsWarranty] = useState(false);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await reportingService.getRecent(100);
      setReports(Array.isArray(res) ? res : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCreate = async () => {
    try {
      const payload: ReportRequest = {
        clientId: clientId || undefined,
        interventionId: interventionId || undefined,
        total: total === '' ? undefined : Number(total),
        isWarranty,
      };
      const created = await reportingService.create(payload);
      setReports((p) => [created, ...p]);
      setClientId(''); setInterventionId(''); setTotal(''); setIsWarranty(false);
    } catch (e: any) { console.error(e); alert(e?.message || 'Erreur'); }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Supprimer ce rapport ?')) return;
    try {
      await reportingService.delete(id);
      setReports((p) => p.filter(r => r.id !== id));
    } catch (e) { console.error(e); }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Rapports</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField label="ClientId" value={clientId} onChange={(e) => setClientId(e.target.value)} />
        <TextField label="InterventionId" value={interventionId} onChange={(e) => setInterventionId(e.target.value)} />
        <TextField label="Total" value={total} onChange={(e) => setTotal(e.target.value === '' ? '' : Number(e.target.value))} />
        <FormControlLabel control={<Switch checked={isWarranty} onChange={(e) => setIsWarranty(e.target.checked)} />} label="Garantie" />
        <Button variant="contained" onClick={handleCreate}>Générer</Button>
        <Button variant="outlined" onClick={fetchReports} disabled={loading}>Rafraîchir</Button>
      </Box>

      <List>
        {reports.map(r => (
          <ListItem key={r.id} secondaryAction={(
            <IconButton edge="end" onClick={() => handleDelete(r.id)}>
              <DeleteIcon />
            </IconButton>
          )}>
            <ListItemText primary={`Rapport ${r.id}`} secondary={`${r.clientId ?? '—'} · ${r.interventionId ?? '—'} · ${r.total ?? 0}€ · ${r.generatedAt ? new Date(r.generatedAt).toLocaleString() : ''}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ReportingPage;
