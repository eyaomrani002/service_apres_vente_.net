import React, { useEffect, useState } from 'react';
import { Box, Paper, Snackbar, Alert, Button, CircularProgress } from '@mui/material';
import { Add } from '@mui/icons-material';
import PageTitle from '../../components/common/PageTitle';
import StatsCard from '../../components/common/ui/StatsCard';
import InterventionFilters from '../../components/interventions/InterventionFilters';
import InterventionsTable from '../../components/interventions/InterventionsTable';
import InterventionForm from '../../components/interventions/InterventionForm';
import { Intervention } from '../../types/intervention';
import { interventionService } from '../../services/interventionService';

const InterventionsPage: React.FC = () => {
  const [items, setItems] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Intervention | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await interventionService.getAll();
      setItems(Array.isArray(data) ? data : []);
      try { const s = await interventionService.getStats(); setStats(s); } catch {}
    } catch (e: any) {
      setMessage(e.message || 'Erreur chargement');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = async (q: { searchTerm?: string; technicienId?: number; statut?: string; reclamationId?: number }) => {
    setLoading(true);
    try {
      if (q.reclamationId) {
        const data = await interventionService.byReclamation(q.reclamationId);
        setItems(Array.isArray(data) ? data : []);
      } else if (q.technicienId || q.statut || q.searchTerm) {
        const data = await interventionService.advancedSearch(q);
        setItems(Array.isArray(data) ? data : []);
      } else {
        const data = await interventionService.getAll();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (e: any) { setMessage(e.message || 'Erreur recherche'); }
    finally { setLoading(false); }
  };

  const handleCreate = () => { setEditing(null); setOpenForm(true); };
  const handleEdit = (r: Intervention) => { setEditing(r); setOpenForm(true); };
  const handleDelete = async (id: number) => { if (!confirm('Confirmer suppression ?')) return; try { await interventionService.delete(id); setMessage('Intervention supprimée'); load(); } catch (e: any) { setMessage(e.message || 'Erreur suppression'); } };
  const handleSave = async (payload: Partial<Intervention>) => {
    try {
      if (editing) await interventionService.update(editing.id, payload);
      else await interventionService.create(payload);
      setOpenForm(false); setMessage('Enregistré'); load();
    } catch (e: any) { setMessage(e.message || 'Erreur sauvegarde'); }
  };

  return (
    <Box>
      <PageTitle title="Interventions" subtitle="Liste des interventions" />

      <Paper sx={{ p: 3 }}>
        {stats && (
          <Box sx={{ mb: 2, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
            {'Interventions' in stats && stats.Interventions?.Total && <Box><StatsCard title="Total interventions" value={String(stats.Interventions.Total)} /></Box>}
            {'Financier' in stats && stats.Financier?.TotalCout && <Box><StatsCard title="Total coûts" value={String(stats.Financier.TotalCout)} /></Box>}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <InterventionFilters onSearch={handleSearch} />
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate} sx={{ height: 40 }}>Ajouter</Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
        ) : (
          <InterventionsTable items={items} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </Paper>

      <InterventionForm open={openForm} intervention={editing} onClose={() => setOpenForm(false)} onSave={handleSave} />

      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}><Alert onClose={() => setMessage(null)} severity="info" sx={{ width: '100%' }}>{message}</Alert></Snackbar>
    </Box>
  );
};

export default InterventionsPage;
