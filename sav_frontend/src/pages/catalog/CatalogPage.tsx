import React, { useEffect, useMemo, useState, useContext } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Slider,
  IconButton,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Button,
} from '@mui/material';
import {
  Search,
  FavoriteBorder,
  FilterList,
  CheckCircle,
  Visibility,
  Edit,
  Delete,
  Info,
  ReportProblem,
  Star,
  Refresh,
  CalendarToday,
  AccessTime,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Article } from '../../types/article';
import { articleService } from '../../services/articleService';
import { reclamationService } from '../../services/reclamationService';
import ArticleForm from '../../components/articles/ArticleForm';
import ReclamationForm from '../../components/reclamations/ReclamationForm';
import { useNavigate } from 'react-router-dom';
import ArticleDetailsDialog from '../../components/articles/ArticleDetailsDialog';
import AuthContext from '../../contexts/AuthContext';

// ========== STYLED COMPONENTS CORRECTEMENT DÉFINIS ==========

const FilterCard = styled(Paper)(({ theme }) => ({
  padding: '20px',
  borderRadius: '18px',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 12px 30px rgba(0,0,0,0.04)',
  position: 'sticky',
  top: theme.spacing(2),
  background: 'linear-gradient(140deg, #f8fbff 0%, #f3f7ff 100%)',
}));

const CatalogCard = styled(Paper)(({ theme }) => ({
  borderRadius: '18px',
  overflow: 'hidden',
  border: '1px solid rgba(0,0,0,0.05)',
  boxShadow: '0 12px 36px rgba(0,0,0,0.08)',
  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 18px 44px rgba(0,0,0,0.12)',
  },
}));

const CardCover = styled('div')({
  width: '100%',
  height: 180,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  position: 'relative',
});

const AvailabilityBadge = styled(Chip)({
  position: 'absolute',
  top: 12,
  left: 12,
  backgroundColor: '#0f9d58',
  color: '#fff',
  fontWeight: 700,
});

const FavoriteButton = styled(IconButton)({
  position: 'absolute',
  top: 10,
  right: 10,
  backgroundColor: 'rgba(255,255,255,0.9)',
  '&:hover': { 
    backgroundColor: '#fff',
    transform: 'scale(1.1)',
  },
  transition: 'all 0.2s ease',
});

const PriceTypography = styled(Typography)({
  fontWeight: 800,
  fontSize: '20px',
  color: '#0f9d58',
  letterSpacing: '0.5px',
});

// ========== COMPOSANT PRINCIPAL ==========

const CatalogPage: React.FC = () => {
  const { user, hasRole } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [reclamationOpen, setReclamationOpen] = useState(false);
  const [reclamationInitial, setReclamationInitial] = useState<any | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [search, setSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<'all' | 'stock'>('all');
  const [priceRange, setPriceRange] = useState<number[]>([0, 2000]);

  // Charger les articles
  const load = async () => {
    setLoading(true);
    try {
      const data = await articleService.getAll();
      console.log('DEBUG - Articles chargés:', {
        count: data?.length || 0,
        sample: data?.[0],
        properties: data?.[0] ? Object.keys(data[0]) : []
      });
      setArticles(data || []);
      
      // Calculer la plage de prix
      const prices = (data || []).map((a) => a.prixAchat).filter((p) => typeof p === 'number');
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setPriceRange([min, max]);
      }
    } catch (e: any) {
      console.error('Erreur lors du chargement:', e);
      setMessage({ 
        text: e?.message || 'Erreur de chargement des articles', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Extraire les types uniques
  const allTypes = useMemo(() => {
    const types = new Set<string>();
    articles.forEach((a) => {
      if (a.type && a.type.trim()) {
        types.add(a.type);
      }
    });
    return Array.from(types);
  }, [articles]);

  // Filtrer les articles
  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchSearch = !search || 
        a.nom.toLowerCase().includes(search.toLowerCase()) || 
        a.reference.toLowerCase().includes(search.toLowerCase());
      
      const matchType = selectedTypes.length === 0 || selectedTypes.includes(a.type);
      
      const matchAvail = availability === 'all' || a.estEnStock;
      
      const matchPrice = a.prixAchat >= priceRange[0] && a.prixAchat <= priceRange[1];
      
      return matchSearch && matchType && matchAvail && matchPrice;
    });
  }, [articles, search, selectedTypes, availability, priceRange]);

  // Résoudre l'URL de l'image
  const resolveImage = (url?: string) => {
    if (!url) return null;
    
    // Si c'est déjà une URL complète
    if (url.startsWith('http')) return url;
    
    // Si c'est une URL relative avec http/https
    if (url.startsWith('//')) return `https:${url}`;
    
    // Construire l'URL à partir des variables d'environnement
    const base = import.meta.env.VITE_FILES_BASE_URL ||
                 import.meta.env.VITE_ARTICLE_BASE_URL ||
                 import.meta.env.VITE_API_BASE_URL ||
                 'https://localhost:7174';
    
    // Normaliser le chemin
    const normalized = url.startsWith('/') ? url : `/${url}`;
    
    return `${base}${normalized}`;
  };

  // Formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Formater la date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non spécifiée';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  // Gérer la sélection des types
  const handleToggleType = (type: string) => {
    setSelectedTypes((prev) => 
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // ========== HANDLERS ==========

  const handleView = (article: Article) => {
    setSelectedArticle(article);
    setDetailsOpen(true);
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setEditOpen(true);
  };

  const handleReclamation = (article: Article) => {
    setReclamationInitial({ 
      articleId: article.id, 
      clientId: user?.id,
      description: `Réclamation pour l'article: ${article.nom} (${article.reference})`
    });
    setReclamationOpen(true);
  };

  const handleDelete = async (article: Article) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'article "${article.nom}" ?`)) {
      return;
    }
    
    try {
      await articleService.delete(article.id);
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
      setMessage({ 
        text: `Article "${article.nom}" supprimé avec succès`, 
        type: 'success' 
      });
    } catch (e: any) {
      setMessage({ 
        text: e?.message || 'Impossible de supprimer l\'article', 
        type: 'error' 
      });
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedArticle(null);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditingArticle(null);
  };

  const handleSaveEdit = async (payload: Partial<Article>, file?: File | null) => {
    if (!editingArticle) return;
    
    try {
      await articleService.update(editingArticle.id, payload);
      
      if (file) {
        await articleService.uploadImage(editingArticle.id, file);
      }
      
      setMessage({ 
        text: 'Article mis à jour avec succès', 
        type: 'success' 
      });
      handleCloseEdit();
      load(); // Recharger les données
    } catch (e: any) {
      setMessage({ 
        text: e?.message || 'Erreur lors de la mise à jour', 
        type: 'error' 
      });
    }
  };

  const handleCloseReclamation = () => {
    setReclamationOpen(false);
    setReclamationInitial(null);
  };

  const handleSaveReclamation = async (payload: any) => {
    try {
      await reclamationService.create(payload);
      setMessage({ 
        text: 'Réclamation créée avec succès', 
        type: 'success' 
      });
      handleCloseReclamation();
    } catch (e: any) {
      setMessage({ 
        text: e?.message || 'Erreur lors de la création de la réclamation', 
        type: 'error' 
      });
    }
  };

  // ========== RENDU ==========

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, background: '#f6f8fb', minHeight: '100vh' }}>
      <Grid container spacing={3}>
        {/* Colonne des filtres */}
        <Grid item xs={12} md={3}>
          <FilterCard>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Filtres</Typography>
              <Tooltip title="Réinitialiser les filtres">
                <IconButton 
                  size="small" 
                  onClick={() => { 
                    setSearch(''); 
                    setSelectedTypes([]); 
                    setAvailability('all'); 
                    load(); 
                  }}
                >
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Recherche */}
            <TextField
              fullWidth
              placeholder="Rechercher un article..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Divider sx={{ my: 2 }} />

            {/* Types */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Catégories
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {allTypes.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  onClick={() => handleToggleType(type)}
                  variant={selectedTypes.includes(type) ? 'filled' : 'outlined'}
                  color={selectedTypes.includes(type) ? 'primary' : 'default'}
                  sx={{ borderRadius: '14px' }}
                />
              ))}
              {allTypes.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Aucune catégorie disponible
                </Typography>
              )}
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Disponibilité */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Disponibilité
            </Typography>
            <ToggleButtonGroup
              value={availability}
              exclusive
              size="small"
              onChange={(_, val) => val && setAvailability(val)}
              color="primary"
              fullWidth
            >
              <ToggleButton value="all" sx={{ flex: 1 }}>
                Tous
              </ToggleButton>
              <ToggleButton value="stock" sx={{ flex: 1 }}>
                En stock
              </ToggleButton>
            </ToggleButtonGroup>

            <Divider sx={{ my: 2 }} />

            {/* Prix */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Prix (€)
            </Typography>
            <Slider
              value={priceRange}
              onChange={(_, v) => setPriceRange(v as number[])}
              valueLabelDisplay="auto"
              valueLabelFormat={formatPrice}
              min={0}
              max={priceRange[1] > 0 ? priceRange[1] : 5000}
              step={10}
              color="primary"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -1 }}>
              <Typography variant="caption" color="text.secondary">
                {formatPrice(priceRange[0])}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatPrice(priceRange[1])}
              </Typography>
            </Box>
          </FilterCard>
        </Grid>

        {/* Colonne des articles */}
        <Grid item xs={12} md={9}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                Catalogue SAV
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filtered.length} article{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip 
                icon={<FilterList />} 
                label="Filtres actifs" 
                variant="outlined" 
              />
            </Stack>
          </Stack>

          {/* Contenu */}
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              py: 10 
            }}>
              <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
              <Typography variant="h6" color="text.secondary">
                Chargement du catalogue...
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filtered.map((article) => {
                const imageUrl = resolveImage(article.imageUrl);
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={article.id}>
                    <CatalogCard>
                      <CardCover
                        style={imageUrl ? {
                          backgroundImage: `url(${imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        } : {
                          background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)'
                        }}
                      >
                        {/* Badge de disponibilité */}
                        {article.estEnStock ? (
                          <AvailabilityBadge 
                            label="Disponible"
                            size="small"
                            icon={<CheckCircle fontSize="small" />}
                          />
                        ) : (
                          <Chip
                            label="Rupture"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              left: 12,
                              backgroundColor: '#f44336',
                              color: '#fff',
                              fontWeight: 700,
                            }}
                            icon={<ReportProblem fontSize="small" />}
                          />
                        )}
                        
                        {/* Badge de garantie */}
                        {article.estSousGarantie && (
                          <Chip
                            label="Garantie"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              backgroundColor: 'rgba(255, 152, 0, 0.9)',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '10px',
                            }}
                          />
                        )}
                        
                        <FavoriteButton size="small">
                          <FavoriteBorder fontSize="small" />
                        </FavoriteButton>
                      </CardCover>
                      
                      <Box sx={{ p: 2.4 }}>
                        {/* En-tête de la carte */}
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                          <Avatar 
                            sx={{ 
                              width: 36, 
                              height: 36, 
                              bgcolor: article.estEnStock ? '#0f9d58' : '#f44336',
                              fontWeight: 800,
                              fontSize: '14px'
                            }}
                          >
                            {article.nom.substring(0, 2).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 800,
                                fontSize: '15px',
                                lineHeight: 1.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {article.nom}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Réf: {article.reference}
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Type et étoiles */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Star fontSize="small" sx={{ color: '#f6b10c' }} />
                            <Typography variant="caption" color="text.secondary">
                              4.8
                            </Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {article.type || 'Non spécifié'}
                          </Typography>
                        </Stack>

                        {/* Description */}
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontSize: '13px',
                            lineHeight: 1.5,
                            minHeight: 60,
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {article.description || 'Article du service après-vente'}
                        </Typography>

                        {/* Prix et actions */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <PriceTypography>
                              {formatPrice(article.prixAchat)}
                            </PriceTypography>
                            {article.dateAchat && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                Achat: {formatDate(article.dateAchat)}
                              </Typography>
                            )}
                          </Box>
                          
                          <Stack direction="row" spacing={0.5}>
                            {/* Bouton Voir */}
                            <Tooltip title="Voir détails">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleView(article)}
                                sx={{ 
                                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                  '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.2)' }
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            {/* Actions admin */}
                            {hasRole('admin') && (
                              <>
                                <Tooltip title="Modifier">
                                  <IconButton 
                                    size="small" 
                                    color="secondary"
                                    onClick={() => handleEdit(article)}
                                    sx={{ 
                                      backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                      '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.2)' }
                                    }}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Supprimer">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDelete(article)}
                                    sx={{ 
                                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                      '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.2)' }
                                    }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            
                            {/* Bouton Réclamation */}
                            <Tooltip title="Créer réclamation">
                              <IconButton 
                                size="small" 
                                color="warning"
                                onClick={() => handleReclamation(article)}
                                sx={{ 
                                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                  '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.2)' }
                                }}
                              >
                                <ReportProblem fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </Box>
                    </CatalogCard>
                  </Grid>
                );
              })}
              
              {/* Aucun résultat */}
              {filtered.length === 0 && !loading && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 6, 
                    textAlign: 'center', 
                    color: 'text.secondary',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: '16px',
                    border: '1px dashed rgba(0, 0, 0, 0.1)',
                    mt: 2
                  }}>
                    <Search sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                      Aucun article trouvé
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                      Essayez de modifier vos critères de recherche ou vérifiez le chargement des données.
                    </Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<Refresh />}
                      onClick={() => {
                        setSearch('');
                        setSelectedTypes([]);
                        setAvailability('all');
                        load();
                      }}
                      sx={{ borderRadius: '12px' }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* ========== DIALOGS ========== */}
      
      {/* Dialog détails article */}
      {selectedArticle && (
        <ArticleDetailsDialog 
          open={detailsOpen} 
          article={selectedArticle} 
          onClose={handleCloseDetails} 
        />
      )}
      
      {/* Dialog modification article */}
      {editingArticle && (
        <ArticleForm
          open={editOpen}
          article={editingArticle}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      )}
      
      {/* Dialog réclamation */}
      <ReclamationForm
        open={reclamationOpen}
        reclamation={null}
        initialData={reclamationInitial}
        lockClient={!!user?.id}
        onClose={handleCloseReclamation}
        onSave={handleSaveReclamation}
      />

      {/* Snackbar pour les messages */}
      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={message?.type || 'info'} 
          onClose={() => setMessage(null)} 
          sx={{ 
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: 300
          }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CatalogPage;