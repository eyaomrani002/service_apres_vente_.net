// ReclamationForm.tsx - Formulaire moderne pour créer/modifier une réclamation
import React, { useEffect, useMemo, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Grid, MenuItem, Box, Typography,
  IconButton, Divider, InputAdornment
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Assignment, Close, Save, Cancel, Person, 
  Description, PriorityHigh, TrendingUp
} from '@mui/icons-material';
import { Reclamation } from '../../types/reclamation';
import { Client } from '../../types/client';
import { Article } from '../../types/article';
import { clientService } from '../../services/clientService';
import { articleService } from '../../services/articleService';
import { getUsers } from '../../services/userService';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '24px',
    padding: '8px',
    animation: `${fadeIn} 0.3s ease`,
    maxWidth: '700px',
    width: '100%',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
  color: '#fff',
  padding: '24px 32px',
  borderRadius: '16px 16px 0 0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontWeight: 700,
  fontSize: '24px',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#2196F3',
      },
    },
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#2196F3',
        borderWidth: '2px',
      },
      transform: 'scale(1.01)',
      boxShadow: '0 4px 20px rgba(33, 150, 243, 0.15)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 600,
    '&.Mui-focused': {
      color: '#2196F3',
    },
  },
}));

const SaveButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
  color: '#fff',
  fontWeight: 700,
  padding: '12px 32px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(33, 150, 243, 0.4)',
    background: 'linear-gradient(135deg, #1976D2 0%, #0097A7 100%)',
  },
}));

const CancelButton = styled(Button)(({ theme }) => ({
  color: '#666',
  fontWeight: 600,
  padding: '12px 32px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '16px',
  border: '2px solid #e0e0e0',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.04)',
    transform: 'translateY(-2px)',
  },
}));

interface Props {
  open: boolean;
  reclamation?: Reclamation | null;
  onClose: () => void;
  onSave: (c: Partial<Reclamation>) => void;
  /** valeurs initiales injectées (ex: clientId connecté, articleId sélectionné) */
  initialData?: Partial<Reclamation> | null;
  /** si vrai, on verrouille le client (pas de changement possible) */
  lockClient?: boolean;
  /** utilisateur courant pour pré-remplir clientId ou limiter */
  currentUser?: { email?: string; id?: string | number; roles?: string[] } | null;
  /** flag admin pour merger les clients Auth dans la liste */
  isAdmin?: boolean;
}

const ReclamationForm: React.FC<Props> = ({ open, reclamation, onClose, onSave, initialData, lockClient, currentUser, isAdmin }) => {
  const [form, setForm] = useState<Partial<Reclamation>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(reclamation ? { ...reclamation } : { 
        clientId: initialData?.clientId ?? undefined, 
        articleId: initialData?.articleId ?? undefined,
        sujet: '', 
        description: '', 
        priorite: 'moyenne', 
        statut: 'nouvelle' 
      });
      setErrors({});
    }
  }, [reclamation, open, initialData]);

  useEffect(() => {
    let ignore = false;
    // Ne charger les clients que si le champ est déverrouillé (admin)
    if (!lockClient) {
      (async () => {
        try {
          const baseClients = await clientService.getAll();
          let merged: Client[] = Array.isArray(baseClients) ? baseClients : [];

          if (isAdmin) {
            try {
              const users = await getUsers();
              const clientUsers = users.filter((u) => u.roles?.some((r) => r.toLowerCase() === 'client'));
              const existingEmails = new Set((merged || []).map((c) => (c.email || '').toLowerCase()));
              let syntheticIndex = 1;
              clientUsers.forEach((u) => {
                if (u.email && !existingEmails.has(u.email.toLowerCase())) {
                  merged.push({
                    id: -syntheticIndex++,
                    nom: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName || u.email,
                    email: u.email,
                    telephone: u.phoneNumber || undefined,
                    dateInscription: u.lastLoginAt ?? undefined,
                    nombreReclamations: 0,
                    reclamationsEnCours: 0,
                    isAuthUser: true,
                    userId: u.id,
                  });
                }
              });
            } catch (e) {
              console.warn('Impossible de fusionner les users côté formulaire réclamation', e);
            }
          }

          if (!ignore) setClients(merged);
        } catch {
          if (!ignore) setClients([]);
        }
      })();
    }

    (async () => {
      try {
        const data = await articleService.getAll();
        if (!ignore) setArticles(Array.isArray(data) ? data : []);
      } catch {
        if (!ignore) setArticles([]);
      }
    })();

    return () => { ignore = true; };
  }, [open]);

  const handleChange = (k: keyof Reclamation, v: any) => {
    setForm(s => ({ ...s, [k]: v }));
    if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.clientId) {
      newErrors.clientId = 'Le client est requis';
    }

    if (!form.articleId) {
      newErrors.articleId = 'L\'article est requis';
    }
    
    if (!form.sujet || form.sujet.trim() === '') {
      newErrors.sujet = 'Le sujet est requis';
    }
    
    if (!form.description || form.description.trim() === '') {
      newErrors.description = 'La description est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = { ...form };

    if (!lockClient && form.clientId) {
      const selected = clients.find(c => c.id === form.clientId);
      if (selected?.isAuthUser) {
        try {
          const email = selected.email || `client-${selected.userId || 'auth'}@placeholder.local`;
          let ensured = null as any;

          // Tenter de créer directement le client; si déjà existant, fallback sur la recherche par email
          try {
            ensured = await clientService.create({
              nom: selected.nom || email,
              email,
              telephone: selected.telephone,
              adresse: selected.adresse,
            } as any);
          } catch (createErr) {
            // Si la création échoue (ex: existe déjà), essayer de le récupérer par email
            ensured = await clientService.getByEmail(email).catch(() => null as any);
          }

          payload.clientId = ensured?.id ?? payload.clientId;
        } catch (e) {
          setErrors(prev => ({ ...prev, clientId: 'Impossible de lier ce client (création/recherche échouée)' }));
          return;
        }
      }
    }

    onSave(payload);
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Assignment sx={{ fontSize: 32 }} />
          <span>{reclamation ? 'Modifier la réclamation' : 'Nouvelle réclamation'}</span>
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{ 
            color: '#fff',
            '&:hover': { 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'rotate(90deg)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <Close />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 3, 
            color: 'text.secondary',
            fontSize: '14px',
          }}
        >
          {reclamation 
            ? 'Modifiez les informations de la réclamation ci-dessous'
            : 'Remplissez les informations de la nouvelle réclamation'
          }
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <StyledTextField
              select={!lockClient}
              fullWidth
              label="Client"
              value={lockClient ? 'Client connecté' : form.clientId ?? ''}
              onChange={lockClient ? undefined : (e => handleChange('clientId', Number(e.target.value)))}
              onFocus={() => setFocusedField('clientId')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.clientId && !lockClient}
              helperText={lockClient ? 'Le client est votre compte connecté' : errors.clientId}
              required
              disabled={lockClient}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ 
                      color: focusedField === 'clientId' ? '#2196F3' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
                readOnly: lockClient,
              }}
            >
              {!lockClient && <MenuItem value="" disabled>Sélectionner un client</MenuItem>}
              {!lockClient && clients.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nom}{c.email ? ` — ${c.email}` : ''}{c.isAuthUser ? ' (utilisateur)' : ''}
                </MenuItem>
              ))}
            </StyledTextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              select
              fullWidth
              label="Article"
              value={form.articleId ?? ''}
              onChange={(e) => handleChange('articleId', Number(e.target.value))}
              onFocus={() => setFocusedField('articleId')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.articleId}
              helperText={errors.articleId}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Description sx={{ 
                      color: focusedField === 'articleId' ? '#2196F3' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            >
              {articles.map(article => (
                <MenuItem key={article.id} value={article.id}>
                  {article.nom || article.reference || `Article #${article.id}`}
                </MenuItem>
              ))}
            </StyledTextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Sujet"
              value={form.sujet || ''}
              onChange={e => handleChange('sujet', e.target.value)}
              onFocus={() => setFocusedField('sujet')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.sujet}
              helperText={errors.sujet}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Description sx={{ 
                      color: focusedField === 'sujet' ? '#00BCD4' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <StyledTextField
              fullWidth
              label="Description détaillée"
              value={form.description || ''}
              onChange={e => handleChange('description', e.target.value)}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.description}
              helperText={errors.description || 'Décrivez le problème en détail'}
              required
              multiline
              rows={4}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              select
              fullWidth
              label="Priorité"
              value={form.priorite || 'moyenne'}
              onChange={e => handleChange('priorite', e.target.value)}
              onFocus={() => setFocusedField('priorite')}
              onBlur={() => setFocusedField(null)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PriorityHigh sx={{ 
                      color: focusedField === 'priorite' ? '#FF9800' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="faible">🟢 Faible</MenuItem>
              <MenuItem value="moyenne">🟡 Moyenne</MenuItem>
              <MenuItem value="haute">🟠 Haute</MenuItem>
              <MenuItem value="urgente">🔴 Urgente</MenuItem>
            </StyledTextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              select
              fullWidth
              label="Statut"
              value={form.statut || 'nouvelle'}
              onChange={e => handleChange('statut', e.target.value)}
              onFocus={() => setFocusedField('statut')}
              onBlur={() => setFocusedField(null)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TrendingUp sx={{ 
                      color: focusedField === 'statut' ? '#2196F3' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="nouvelle">📋 Nouvelle</MenuItem>
              <MenuItem value="en_cours">⚙️ En cours</MenuItem>
              <MenuItem value="resolue">✅ Résolue</MenuItem>
              <MenuItem value="en attente">⏳ En attente</MenuItem>
            </StyledTextField>
          </Grid>

          <Grid item xs={12}>
            <Box 
              sx={{ 
                p: 2, 
                borderRadius: '12px', 
                backgroundColor: 'rgba(33, 150, 243, 0.05)',
                border: '1px solid rgba(33, 150, 243, 0.1)',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                💡 <strong>Astuce:</strong> Une description détaillée aide nos techniciens à résoudre le problème plus rapidement.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <CancelButton 
          onClick={onClose}
          startIcon={<Cancel />}
        >
          Annuler
        </CancelButton>
        <SaveButton 
          onClick={handleSubmit}
          startIcon={<Save />}
        >
          {reclamation ? 'Mettre à jour' : 'Créer'}
        </SaveButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default ReclamationForm;