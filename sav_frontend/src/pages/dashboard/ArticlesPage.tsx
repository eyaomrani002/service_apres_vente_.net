import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Snackbar, Alert, CircularProgress } from '@mui/material';
import { Add } from '@mui/icons-material';
import PageTitle from '../../components/common/PageTitle';
import ArticlesTable from '../../components/articles/ArticlesTable';
import ArticleForm from '../../components/articles/ArticleForm';
import ArticleFilters from '../../components/articles/ArticleFilters';
import { Article } from '../../types/article';
import { articleService } from '../../services/articleService';

const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await articleService.getAll();
      setArticles(data || []);
    } catch (e: any) {
      setMessage(e.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = async (q: { searchTerm?: string; type?: string }) => {
    setLoading(true);
    try {
      const data = await articleService.advancedSearch({ searchTerm: q.searchTerm, type: q.type });
      setArticles(data || []);
    } catch (e: any) {
      setMessage(e.message || 'Erreur recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setOpenForm(true);
  };

  const handleEdit = (a: Article) => {
    setEditing(a);
    setOpenForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    try {
      await articleService.delete(id);
      setMessage('Article supprimé');
      load();
    } catch (e: any) {
      setMessage(e.message || 'Erreur suppression');
    }
  };

  const handleSave = async (payload: Partial<Article>) => {
    try {
      if (editing) {
        await articleService.update(editing.id, payload);
        setMessage('Article mis à jour');
      } else {
        await articleService.create(payload);
        setMessage('Article créé');
      }
      setOpenForm(false);
      load();
    } catch (e: any) {
      setMessage(e.message || 'Erreur sauvegarde');
    }
  };

  return (
    <Box>
      <PageTitle
        title="Articles"
        subtitle="Gérez votre catalogue d'articles"
        breadcrumbs={[{ label: 'Tableau de bord', href: '/dashboard' }, { label: 'Articles' }]}
      />

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <ArticleFilters onSearch={handleSearch} />
          <Button variant="contained" startIcon={<Add />} onClick={handleCreate} sx={{ height: 40 }}>Ajouter un article</Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ArticlesTable articles={articles} onEdit={handleEdit} onDelete={handleDelete} onView={() => {}} />
        )}
      </Paper>

      <ArticleForm open={openForm} article={editing} onClose={() => setOpenForm(false)} onSave={handleSave} />

      <Snackbar open={!!message} autoHideDuration={4000} onClose={() => setMessage(null)}>
        <Alert onClose={() => setMessage(null)} severity="info" sx={{ width: '100%' }}>{message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ArticlesPage;