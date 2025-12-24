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
  Button,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  FavoriteBorder,
  FilterList,
  CheckCircle,
  LocalMall,
  Star,
  Refresh,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Article } from '../../types/article';
import { articleService } from '../../services/articleService';
import { commandeService } from '../../services/commandeService';
import AuthContext from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

const FilterCard = styled(Paper)(({ theme }) => ({
  padding: '20px',
  borderRadius: '18px',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 12px 30px rgba(0,0,0,0.04)',
  position: 'sticky',
  top: theme.spacing(2),
  background: 'linear-gradient(140deg, #f8fbff 0%, #f3f7ff 100%)',
}));

const Card = styled(Paper)(({ theme }) => ({
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

const Cover = styled('div')({
  width: '100%',
  height: 180,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  position: 'relative',
});

const Badge = styled(Chip)({
  position: 'absolute',
  top: 12,
  left: 12,
  backgroundColor: '#0f9d58',
  color: '#fff',
  fontWeight: 700,
});

const FavoriteBtn = styled(IconButton)({
  position: 'absolute',
  top: 10,
  right: 10,
  backgroundColor: 'rgba(255,255,255,0.9)',
  '&:hover': { backgroundColor: '#fff' },
});

const Price = styled(Typography)({
  fontWeight: 800,
  fontSize: '20px',
  color: '#0f9d58',
});

const CatalogPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { addItem } = useCart();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [search, setSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<'all' | 'stock'>('all');
  const [priceRange, setPriceRange] = useState<number[]>([0, 2000]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await articleService.getAll();
      setArticles(data || []);
      const prices = (data || []).map((a) => a.prixAchat).filter((p) => typeof p === 'number');
      if (prices.length) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setPriceRange([min, max]);
      }
    } catch (e: any) {
      setMessage({ text: e?.message || 'Erreur de chargement', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const allTypes = useMemo(() => {
    const types = new Set<string>();
    articles.forEach((a) => {
      if (a.type) types.add(a.type);
    });
    return Array.from(types);
  }, [articles]);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchSearch = !search || a.nom.toLowerCase().includes(search.toLowerCase()) || a.reference.toLowerCase().includes(search.toLowerCase());
      const matchType = selectedTypes.length === 0 || selectedTypes.includes(a.type);
      const matchAvail = availability === 'all' || a.estEnStock;
      const matchPrice = a.prixAchat >= priceRange[0] && a.prixAchat <= priceRange[1];
      return matchSearch && matchType && matchAvail && matchPrice;
    });
  }, [articles, search, selectedTypes, availability, priceRange]);

  const resolveImage = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    const base = import.meta.env.VITE_FILES_BASE_URL
      || import.meta.env.VITE_ARTICLE_BASE_URL
      || import.meta.env.VITE_API_BASE_URL
      || 'https://localhost:7174';
    const normalized = url.startsWith('/') ? url : `/${url}`;
    return `${base}${normalized}`;
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(price);

  const handleToggleType = (type: string) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const handleBuy = async (article: Article) => {
    if (!user?.id) {
      setMessage({ text: 'Connectez-vous pour acheter', type: 'info' });
      return;
    }
    try {
      await commandeService.create({
        clientId: Number(user.id),
        lignes: [{ articleId: article.id, quantite: 1, prixUnitaire: article.prixAchat }],
        statut: 'Payée',
      });
      setMessage({ text: `${article.nom} acheté avec succès`, type: 'success' });
    } catch (e: any) {
      setMessage({ text: e?.message || 'Achat impossible', type: 'error' });
    }
  };

  const handleAddToCart = (article: Article) => {
    addItem(article, 1);
    setMessage({ text: `${article.nom} ajouté au panier`, type: 'success' });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, background: '#f6f8fb', minHeight: '100vh' }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <FilterCard>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Filtres</Typography>
              <Tooltip title="Réinitialiser">
                <IconButton size="small" onClick={() => { setSearch(''); setSelectedTypes([]); setAvailability('all'); load(); }}>
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <TextField
              fullWidth
              placeholder="Rechercher un article"
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
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Catégories</Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {allTypes.map((type) => (
                <Chip
                  key={type}
                  label={type}
                  onClick={() => handleToggleType(type)}
                  variant={selectedTypes.includes(type) ? 'filled' : 'outlined'}
                  color={selectedTypes.includes(type) ? 'success' : 'default'}
                  sx={{ borderRadius: '14px' }}
                />
              ))}
              {!allTypes.length && <Typography variant="body2" color="text.secondary">Aucune catégorie</Typography>}
            </Stack>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Disponibilité</Typography>
            <ToggleButtonGroup
              value={availability}
              exclusive
              size="small"
              onChange={(_, val) => val && setAvailability(val)}
              color="success"
            >
              <ToggleButton value="all">Tous</ToggleButton>
              <ToggleButton value="stock">En stock</ToggleButton>
            </ToggleButtonGroup>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Prix</Typography>
            <Slider
              value={priceRange}
              onChange={(_, v) => setPriceRange(v as number[])}
              valueLabelDisplay="auto"
              min={Math.min(priceRange[0], 0)}
              max={priceRange[1] || 5000}
              color="success"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -1 }}>
              <Typography variant="caption" color="text.secondary">{formatPrice(priceRange[0])}</Typography>
              <Typography variant="caption" color="text.secondary">{formatPrice(priceRange[1])}</Typography>
            </Box>
          </FilterCard>
        </Grid>

        <Grid item xs={12} md={9}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Catalogue</Typography>
              <Typography variant="body2" color="text.secondary">{filtered.length} articles trouvés</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip icon={<FilterList />} label="Tri par défaut" variant="outlined" />
            </Stack>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="success" />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filtered.map((article) => (
                <Grid item xs={12} sm={6} md={4} key={article.id}>
                  <Card>
                    <Cover
                      style={resolveImage(article.imageUrl)
                        ? { backgroundImage: `url(${resolveImage(article.imageUrl)})`, backgroundSize: 'cover' }
                        : { background: 'radial-gradient(circle at 20% 20%, #e8f5e9 0%, #f1f8e9 35%, #ffffff 100%)' }
                      }
                    >
                      {article.estEnStock && <Badge label="Disponible" size="small" icon={<CheckCircle />} />}
                      <FavoriteBtn size="small">
                        <FavoriteBorder fontSize="small" />
                      </FavoriteBtn>
                    </Cover>
                    <Box sx={{ p: 2.4 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: '#0f9d58' }}>{article.nom.substring(0, 2).toUpperCase()}</Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{article.nom}</Typography>
                          <Typography variant="caption" color="text.secondary">Réf {article.reference}</Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Star fontSize="small" sx={{ color: '#f6b10c' }} />
                        <Typography variant="caption" color="text.secondary">4.8 (avis)</Typography>
                      </Stack>

                      <Chip label={article.type || 'Type'} size="small" sx={{ borderRadius: '12px', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ minHeight: 42 }}>
                        {article.description || 'Article du catalogue SAV'}
                      </Typography>

                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
                        <Price>{formatPrice(article.prixAchat)}</Price>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Ajouter au panier">
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              startIcon={<ShoppingCart />}
                              onClick={() => handleAddToCart(article)}
                            >
                              Panier
                            </Button>
                          </Tooltip>
                          <Tooltip title="Acheter directement">
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<LocalMall />}
                              onClick={() => handleBuy(article)}
                            >
                              Acheter
                            </Button>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Box>
                  </Card>
                </Grid>
              ))}
              {!filtered.length && !loading && (
                <Box sx={{ p: 4, width: '100%', textAlign: 'center', color: 'text.secondary' }}>
                  Aucun article pour ces filtres.
                </Box>
              )}
            </Grid>
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={message?.type || 'info'} onClose={() => setMessage(null)} sx={{ borderRadius: '12px' }}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CatalogPage;
