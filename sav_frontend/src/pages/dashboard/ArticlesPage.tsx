// ArticlesPage.tsx - Version modernisée
import React, { useEffect, useState } from 'react';
import { 
  Box, Button, Paper, CircularProgress, Snackbar, Alert, 
  Grid, Card, CardContent, Typography, Avatar 
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Add, Inventory, AttachMoney, Category, TrendingUp } from '@mui/icons-material';
import PageTitle from '../../components/common/PageTitle';
import ArticlesTable from '../../components/articles/ArticlesTable';
import ArticleForm from '../../components/articles/ArticleForm';
import ArticleFilters from '../../components/articles/ArticleFilters';
import ArticleDetailsDialog from '../../components/articles/ArticleDetailsDialog'; // IMPORTANT
import { Article } from '../../types/article';
import { articleService } from '../../services/articleService';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const ModernCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(186, 104, 200, 0.05) 100%)',
  border: '1px solid rgba(156, 39, 176, 0.1)',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  animation: `${fadeIn} 0.6s ease`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(156, 39, 176, 0.15)',
    border: '1px solid rgba(156, 39, 176, 0.3)',
  },
}));

const StatsAvatar = styled(Avatar)(({ theme }) => ({
  width: 56,
  height: 56,
  background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
  boxShadow: '0 8px 24px rgba(156, 39, 176, 0.3)',
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
  color: '#fff',
  fontWeight: 700,
  padding: '10px 24px',
  borderRadius: '12px',
  textTransform: 'none',
  boxShadow: '0 4px 20px rgba(156, 39, 176, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(156, 39, 176, 0.4)',
    background: 'linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%)',
  },
}));

const ModernPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '20px',
  padding: '32px',
  background: 'rgba(255, 255, 255, 0.98)',
  border: '1px solid rgba(156, 39, 176, 0.1)',
  boxShadow: '0 8px 32px rgba(156, 39, 176, 0.08)',
  animation: `${fadeIn} 0.6s ease 0.2s both`,
}));

const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [stats, setStats] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await articleService.getAll();
      setArticles(Array.isArray(data) ? data : []);
      try { 
        const s = await articleService.getStats(); 
        setStats(s); 
      } catch {}
    } catch (e: any) {
      showMessage(e.message || 'Erreur chargement', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  const handleSearch = async (q: { searchTerm?: string; type?: string }) => {
    setLoading(true);
    try {
      const data = await articleService.advancedSearch(q);
      setArticles(data || []);
    } catch (e: any) { 
      showMessage(e.message || 'Erreur recherche', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleCreate = () => { 
    setEditing(null); 
    setOpenForm(true); 
  };

  const handleEdit = (article: Article) => { 
    setEditing(article); 
    setOpenForm(true); 
  };

  const handleView = (article: Article) => { 
    setSelectedArticle(article); 
  };

  const handleDelete = async (id: number) => { 
    if (!confirm('Confirmer la suppression de cet article ?')) return; 
    try { 
      await articleService.delete(id); 
      showMessage('Article supprimé avec succès', 'success'); 
      load(); 
    } catch (e: any) { 
      showMessage(e.message || 'Erreur suppression', 'error'); 
    } 
  };

  const handleSave = async (payload: Partial<Article>, file?: File | null) => {
    try {
      if (editing) {
        const updated = await articleService.update(editing.id, payload);
        if (file) {
          await articleService.uploadImage(editing.id, file);
        }
        showMessage('Article modifié avec succès', 'success');
      } else {
        const created = await articleService.create(payload);
        if (file) {
          await articleService.uploadImage(created.id, file);
        }
        showMessage('Article créé avec succès', 'success');
      }
      setOpenForm(false); 
      load();
    } catch (e: any) { 
      showMessage(e.message || 'Erreur sauvegarde', 'error'); 
    }
  };

  // Calculer les statistiques locales
  const calculateStats = () => {
    if (!articles.length) return {};
    
    const total = articles.length;
    const enStock = articles.filter(a => a.estEnStock).length;
    const sousGarantie = articles.filter(a => a.estSousGarantie).length;
    const totalValeur = articles.reduce((sum, a) => sum + (a.prixAchat * (a.quantite || 1)), 0);
    const moyennePrix = articles.reduce((sum, a) => sum + a.prixAchat, 0) / articles.length;
    
    // Compter par type
    const parType: Record<string, number> = {};
    articles.forEach(a => {
      parType[a.type] = (parType[a.type] || 0) + 1;
    });
    
    return {
      total,
      enStock,
      sousGarantie,
      totalValeur: totalValeur.toFixed(2),
      moyennePrix: moyennePrix.toFixed(2),
      parType
    };
  };

  const localStats = calculateStats();

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(value));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <PageTitle 
        title="Gestion des Articles" 
        subtitle="Gérez votre catalogue d'articles" 
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/dashboard' }, 
          { label: 'Articles' }
        ]} 
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ModernCard>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StatsAvatar>
                <Inventory sx={{ fontSize: 32 }} />
              </StatsAvatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Total Articles
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#9C27B0' }}>
                  {localStats.total || 0}
                </Typography>
              </Box>
            </CardContent>
          </ModernCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ModernCard>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StatsAvatar sx={{ background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)' }}>
                <TrendingUp sx={{ fontSize: 32 }} />
              </StatsAvatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  En Stock
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#4CAF50' }}>
                  {localStats.enStock || 0}
                </Typography>
              </Box>
            </CardContent>
          </ModernCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ModernCard>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StatsAvatar sx={{ background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)' }}>
                <Category sx={{ fontSize: 32 }} />
              </StatsAvatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Sous Garantie
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#2196F3' }}>
                  {localStats.sousGarantie || 0}
                </Typography>
              </Box>
            </CardContent>
          </ModernCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <ModernCard>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StatsAvatar sx={{ background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)' }}>
                <AttachMoney sx={{ fontSize: 32 }} />
              </StatsAvatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Valeur Totale
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#FF9800' }}>
                  {localStats.totalValeur ? formatCurrency(localStats.totalValeur) : '0 €'}
                </Typography>
              </Box>
            </CardContent>
          </ModernCard>
        </Grid>
      </Grid>

      <ModernPaper>
        {/* Header avec filtres et bouton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: '300px' }}>
            <ArticleFilters onSearch={handleSearch} />
          </Box>
          <GradientButton 
            startIcon={<Add />} 
            onClick={handleCreate}
          >
            Nouvel Article
          </GradientButton>
        </Box>

        {/* Table ou Loading */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={60} thickness={4} sx={{ color: '#9C27B0' }} />
          </Box>
        ) : (
          <ArticlesTable 
            articles={articles} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            onView={handleView} 
          />
        )}
      </ModernPaper>

      {/* Dialogs */}
      <ArticleForm 
        open={openForm} 
        article={editing} 
        onClose={() => setOpenForm(false)} 
        onSave={handleSave} 
      />
      
      <ArticleDetailsDialog 
        open={!!selectedArticle} 
        article={selectedArticle} 
        onClose={() => setSelectedArticle(null)} 
      />

      {/* Snackbar */}
      <Snackbar 
        open={!!message} 
        autoHideDuration={4000} 
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setMessage(null)} 
          severity={messageType}
          variant="filled"
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ArticlesPage;