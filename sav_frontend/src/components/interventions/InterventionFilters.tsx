import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, MenuItem } from '@mui/material';
import { clientService } from '../../services/clientService';
import { Client } from '../../types/client';
import { reclamationService } from '../../services/reclamationService';

interface Props {
  onSearch: (q: { searchTerm?: string; technicienId?: number; statut?: string; reclamationId?: number }) => void;
}

const InterventionFilters: React.FC<Props> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [technicienId, setTechnicienId] = useState<string>('');
  const [statut, setStatut] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [reclamationId, setReclamationId] = useState<string>('');
  const [clients, setClients] = useState<Client[]>([]);
  const [reclamations, setReclamations] = useState<any[]>([]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await clientService.getAll();
        if (!ignore) setClients(Array.isArray(data) ? data : []);
      } catch { if (!ignore) setClients([]); }
    })();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!clientId) { setReclamations([]); setReclamationId(''); return; }
      try {
        const recs = await reclamationService.getByClient(Number(clientId));
        if (!ignore) setReclamations(Array.isArray(recs) ? recs : []);
      } catch { if (!ignore) setReclamations([]); }
    })();
    return () => { ignore = true; };
  }, [clientId]);

  return (
    <Box mb={2}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
        <Box><TextField id="interv-search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} label="Recherche" fullWidth /></Box>
        <Box><TextField id="interv-technicien" value={technicienId} onChange={e => setTechnicienId(e.target.value)} type="number" label="Technicien ID" fullWidth /></Box>
        <Box><TextField id="interv-statut" value={statut} onChange={e => setStatut(e.target.value)} label="Statut" fullWidth /></Box>
        <Box><TextField id="interv-client" select label="Client" value={clientId} onChange={e => setClientId(e.target.value)} fullWidth>
          <MenuItem value="">Tous les clients</MenuItem>
          {clients.map(c => (<MenuItem key={c.id} value={String(c.id)}>{c.nom}{c.email ? ` — ${c.email}` : ''}</MenuItem>))}
        </TextField></Box>
        <Box><TextField id="interv-reclamation" select label="Réclamation" value={reclamationId} onChange={e => setReclamationId(e.target.value)} fullWidth disabled={!clientId}>
          <MenuItem value="">Toutes</MenuItem>
          {reclamations.map((r: any) => {
            const rid = r.id ?? r.Id;
            const label = (r.sujet ?? r.Sujet) || `Réclamation #${rid}`;
            return (<MenuItem key={rid} value={String(rid)}>{label}</MenuItem>);
          })}
        </TextField></Box>
        <Box><Button variant="contained" fullWidth onClick={() => onSearch({ searchTerm, technicienId: technicienId ? Number(technicienId) : undefined, statut: statut || undefined, reclamationId: reclamationId ? Number(reclamationId) : undefined })}>Rechercher</Button></Box>
      </Box>
    </Box>
  );
};

export default InterventionFilters;
