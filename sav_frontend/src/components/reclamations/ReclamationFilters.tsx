import React, { useEffect, useState } from 'react';
import { Box, TextField, Grid, Button, MenuItem } from '@mui/material';
import { clientService } from '../../services/clientService';
import { Client } from '../../types/client';

interface Props {
  onSearch: (q: { searchTerm?: string; clientId?: number; statut?: string }) => void;
}

const ReclamationFilters: React.FC<Props> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [statut, setStatut] = useState('');
  const [clients, setClients] = useState<Client[]>([]);

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
  }, []);

  return (
    <Box mb={2}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}><TextField value={searchTerm} onChange={e => setSearchTerm(e.target.value)} label="Recherche" fullWidth /></Grid>
        <Grid item xs={12} sm={3}>
          <TextField select label="Client" value={clientId} onChange={e => setClientId(e.target.value)} fullWidth>
            <MenuItem value="">Tous les clients</MenuItem>
            {clients.map(c => (
              <MenuItem key={c.id} value={String(c.id)}>{c.nom}{c.email ? ` — ${c.email}` : ''}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}><TextField value={statut} onChange={e => setStatut(e.target.value)} label="Statut" fullWidth /></Grid>
        <Grid item xs={12} sm={2}><Button variant="contained" fullWidth onClick={() => onSearch({ searchTerm, statut, clientId: clientId ? Number(clientId) : undefined })}>Rechercher</Button></Grid>
      </Grid>
    </Box>
  );
};

export default ReclamationFilters;
