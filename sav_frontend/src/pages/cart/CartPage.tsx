import React, { useContext, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Divider,
  IconButton,
  Button,
  Snackbar,
  Alert,
  TextField,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Delete, ShoppingBag, LocalShipping, CheckCircle } from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';
import AuthContext from '../../contexts/AuthContext';
import { commandeService } from '../../services/commandeService';

const CartPage: React.FC = () => {
  const { items, removeItem, clear, total } = useCart();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'paypal' | 'card'>('cod');

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

  const handleCheckout = async () => {
    if (!user?.id) {
      setMessage({ text: 'Connectez-vous pour commander', type: 'info' });
      return;
    }
    if (items.length === 0) {
      setMessage({ text: 'Panier vide', type: 'info' });
      return;
    }
    setLoading(true);
    try {
      await commandeService.create({
        clientId: Number(user.id),
        lignes: items.map((i) => ({ articleId: i.id, quantite: i.quantity, prixUnitaire: i.price })),
        statut: 'Payée',
      });
      clear();
      setMessage({ text: 'Commande passée avec succès', type: 'success' });
    } catch (e: any) {
      setMessage({ text: e?.message || 'Erreur lors de la commande', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto', background: '#f7f9fc', minHeight: '100vh' }}>
      <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <Chip label="Votre Panier" color="primary" variant="outlined" sx={{ borderRadius: 999 }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Votre Sélection</Typography>
        <Typography variant="body2" color="text.secondary">Les modifications sont sauvegardées automatiquement</Typography>
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems="flex-start">
        {/* Liste d'articles */}
        <Paper sx={{ flex: 2, borderRadius: 3, p: 2.5, boxShadow: '0 14px 36px rgba(0,0,0,0.06)' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Article</Typography>
            <Stack direction="row" spacing={3} sx={{ color: 'text.secondary', fontSize: 13 }}>
              <Typography>Prix</Typography>
              <Typography>Quantité</Typography>
              <Typography>Total</Typography>
            </Stack>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {items.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>Aucun article dans le panier.</Box>
          ) : (
            <Stack spacing={1.5}>
              {items.map((item) => (
                <Paper key={item.id} sx={{ p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5, background: '#fafbfd' }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: 2, overflow: 'hidden', bgcolor: 'rgba(0,0,0,0.04)' }}>
                    {resolveImage(item.imageUrl) && (
                      <img src={resolveImage(item.imageUrl)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Par {user?.email || 'client'}</Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ minWidth: 90, textAlign: 'right', fontWeight: 700 }}>{formatPrice(item.price)}</Typography>
                  <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center' }}>{item.quantity}</Typography>
                  <Typography variant="subtitle2" sx={{ minWidth: 110, textAlign: 'right', fontWeight: 800, color: 'primary.main' }}>{formatPrice(item.price * item.quantity)}</Typography>
                  <IconButton onClick={() => removeItem(item.id)} size="small">
                    <Delete />
                  </IconButton>
                </Paper>
              ))}
            </Stack>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Button variant="text">Continuer mes achats</Button>
            <Button variant="contained" color="error" disabled={items.length === 0} onClick={clear}>Vider le panier</Button>
          </Stack>
        </Paper>

        {/* Récap / paiement */}
        <Stack spacing={2} flex={{ xs: 1, lg: 1 }} sx={{ minWidth: { xs: '100%', lg: 380 } }}>
          <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 14px 36px rgba(0,0,0,0.06)' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <LocalShipping color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Récapitulatif</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">Délais de votre commande</Typography>
            <Divider sx={{ my: 2 }} />

            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2">Sous-total</Typography>
              <Typography variant="subtitle2">{formatPrice(total)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2">Livraison</Typography>
              <Typography variant="subtitle2" color="success.main">Gratuite</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2">Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatPrice(total)}</Typography>
            </Stack>

            <Chip
              icon={<CheckCircle />}
              label="Livraison gratuite à partir de 50 DT"
              size="small"
              color="success"
              variant="outlined"
              sx={{ my: 1, borderRadius: 2 }}
            />
          </Paper>

          <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 14px 36px rgba(0,0,0,0.06)' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Méthode de paiement</Typography>
            <ToggleButtonGroup
              value={paymentMethod}
              exclusive
              onChange={(_, v) => v && setPaymentMethod(v)}
              color="primary"
              fullWidth
              orientation="vertical"
              sx={{ gap: 1, '& .MuiToggleButton-root': { justifyContent: 'flex-start', borderRadius: 2, py: 1.5 } }}
            >
              <ToggleButton value="cod">Paiement à la livraison</ToggleButton>
              <ToggleButton value="paypal">PayPal</ToggleButton>
              <ToggleButton value="card">Carte de crédit / débit</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Code promo (optionnel)</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <TextField size="small" fullWidth placeholder="Entrez votre code" />
                <Button variant="outlined">Appliquer</Button>
              </Stack>
            </Box>

            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={<ShoppingBag />}
              sx={{ mt: 2, py: 1.2, borderRadius: 2, fontWeight: 800 }}
              onClick={handleCheckout}
              disabled={loading || items.length === 0}
            >
              Procéder au paiement
            </Button>
          </Paper>
        </Stack>
      </Stack>

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

export default CartPage;
