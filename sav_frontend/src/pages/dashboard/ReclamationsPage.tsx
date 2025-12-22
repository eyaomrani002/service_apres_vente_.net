import React, { useEffect, useState } from 'react';
import { Box, Paper, CircularProgress, Snackbar, Alert, Button, Grid } from '@mui/material';
import { Add } from '@mui/icons-material';
import PageTitle from '../../components/common/PageTitle';
import StatsCard from '../../components/common/ui/StatsCard';
import ReclamationFilters from '../../components/reclamations/ReclamationFilters';
import ReclamationsTable from '../../components/reclamations/ReclamationsTable';
import ReclamationForm from '../../components/reclamations/ReclamationForm';
import { Reclamation } from '../../types/reclamation';
import { reclamationService } from '../../services/reclamationService';

const ReclamationsPage: React.FC = () => {
  const [items, setItems] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Reclamation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [selected, setSelected] = useState<Reclamation | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await reclamationService.getAll();
      setItems(Array.isArray(data) ? data : []);
      try { const s = await reclamationService.getStats(); setStats(s); } catch {}
    } catch (e: any) {
      setMessage(e.message || 'Erreur chargement');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = async (q: { searchTerm?: string; clientId?: number; statut?: string }) => {
    setLoading(true);
    try {
      if (q.clientId) {
        const data = await reclamationService.getByClient(q.clientId);
        setItems(Array.isArray(data) ? data : []);
      } else {
        const data = await reclamationService.getAll();
        let list: Reclamation[] = Array.isArray(data) ? data : [];
        if (q.searchTerm) {
          const term = q.searchTerm.toLowerCase();
          list = list.filter(r => (r.sujet || '').toLowerCase().includes(term) || (r.description || '').toLowerCase().includes(term));
        }
        if (q.statut) list = list.filter(r => (r.statut || '').toLowerCase() === q.statut!.toLowerCase());
        setItems(list);
      }
    } catch (e: any) { setMessage(e.message || 'Erreur recherche'); }
    finally { setLoading(false); }
  };

  const handleCreate = () => { setEditing(null); setOpenForm(true); };
  const handleEdit = (r: Reclamation) => { setEditing(r); setOpenForm(true); };
  const handleDelete = async (id: number) => { if (!confirm('Confirmer suppression ?')) return; try { await reclamationService.delete(id); setMessage('Réclamation supprimée'); load(); } catch (e: any) { setMessage(e.message || 'Erreur suppression'); } };
  const handleSave = async (payload: Partial<Reclamation>) => {
    try {
      if (editing) await reclamationService.update(editing.id, payload);
      else await reclamationService.create(payload);
      setOpenForm(false); setMessage('Enregistré'); load();
    } catch (e: any) { setMessage(e.message || 'Erreur sauvegarde'); }
  };

  return (
    <Box>
      <PageTitle title="Réclamations" subtitle="Liste des réclamations" />

      <Paper sx={{ p: 3 }}>
        {stats && (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {'Total' in stats && <Grid item xs={12} sm={6}><StatsCard title="Total réclamations" value={String(stats.Total)} /></Grid>}
            {'Resolues' in stats && <Grid item xs={12} sm={6}><StatsCard title="Résolues" value={String(stats.Resolues)} /></Grid>}
          </Grid>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <ReclamationFilters onSearch={handleSearch} />
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate} sx={{ height: 40 }}>Ajouter</Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
        ) : (
          <ReclamationsTable items={items} onEdit={handleEdit} onDelete={handleDelete} onView={(r) => setSelected(r)} />
        )}
      </Paper>

      <ReclamationForm open={openForm} reclamation={editing} onClose={() => setOpenForm(false)} onSave={handleSave} />

      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}><Alert onClose={() => setMessage(null)} severity="info" sx={{ width: '100%' }}>{message}</Alert></Snackbar>
    </Box>
  );
};

export default ReclamationsPage;
