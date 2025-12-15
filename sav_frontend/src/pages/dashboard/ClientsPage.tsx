import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Add } from '@mui/icons-material';
import PageTitle from '../../components/common/PageTitle';
import ClientsTable from '../../components/clients/ClientsTable';
import ClientForm from '../../components/clients/ClientForm';
import ClientFilters from '../../components/clients/ClientFilters';
import { Client } from '../../types/client';
import { clientService } from '../../services/clientService';

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await clientService.getAll();
      setClients(data || []);
    } catch (e: any) {
      setMessage(e.message || 'Erreur chargement');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = async (q: any) => {
    setLoading(true);
    try {
      const data = await clientService.advancedSearch(q);
      setClients(data || []);
    } catch (e: any) { setMessage(e.message || 'Erreur recherche'); }
    finally { setLoading(false); }
  };

  const handleCreate = () => { setEditing(null); setOpenForm(true); };
  const handleEdit = (c: Client) => { setEditing(c); setOpenForm(true); };
  const handleDelete = async (id: number) => { if (!confirm('Confirmer suppression ?')) return; try { await clientService.delete(id); setMessage('Client supprimé'); load(); } catch (e: any) { setMessage(e.message || 'Erreur suppression'); } };
  const handleSave = async (payload: Partial<Client>) => {
    try {
      if (editing) await clientService.update(editing.id, payload);
      else await clientService.create(payload);
      setOpenForm(false); setMessage('Enregistré'); load();
    } catch (e: any) { setMessage(e.message || 'Erreur sauvegarde'); }
  };

  return (
    <Box>
      <PageTitle title="Clients" subtitle="Liste des clients" breadcrumbs={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Clients' }]} />

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <ClientFilters onSearch={handleSearch} />
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate} sx={{ height: 40 }}>Ajouter un client</Button>
        </Box>

        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box> : <ClientsTable clients={clients} onEdit={handleEdit} onDelete={handleDelete} onView={() => {}} />}
      </Paper>

      <ClientForm open={openForm} client={editing} onClose={() => setOpenForm(false)} onSave={handleSave} />

      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}><Alert onClose={() => setMessage(null)} severity="info" sx={{ width: '100%' }}>{message}</Alert></Snackbar>
    </Box>
  );
};

export default ClientsPage;
