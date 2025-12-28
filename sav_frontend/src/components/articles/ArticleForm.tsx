// components/articles/ArticleForm.tsx
import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Grid, Box, Typography, InputAdornment,
  IconButton, Divider, MenuItem, FormControlLabel, Switch
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Inventory, Category, Description, AttachMoney, 
  Tag, Close, Save, Cancel, CheckCircle, Warning,
  CalendarToday, AccessTime, Badge
} from '@mui/icons-material';
import { Article } from '../../types/article';

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
    maxWidth: '800px',
    width: '100%',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    '&:hover': {
      backgroundColor: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#9C27B0',
      },
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#9C27B0',
        borderWidth: '2px',
      },
      transform: 'scale(1.01)',
      boxShadow: '0 4px 20px rgba(156, 39, 176, 0.15)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 600,
    color: '#666',
    '&.Mui-focused': {
      color: '#9C27B0',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(156, 39, 176, 0.2)',
    borderWidth: '1px',
  },
}));

const SaveButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
  color: '#fff',
  fontWeight: 700,
  padding: '12px 32px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(156, 39, 176, 0.4)',
    background: 'linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%)',
  },
  '&:disabled': {
    background: 'rgba(0, 0, 0, 0.12)',
    color: 'rgba(0, 0, 0, 0.26)',
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
    borderColor: '#9C27B0',
    backgroundColor: 'rgba(156, 39, 176, 0.04)',
    transform: 'translateY(-2px)',
  },
}));

const SwitchBox = styled(Box)(({ theme }) => ({
  padding: '16px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(186, 104, 200, 0.05) 100%)',
  border: '1px solid rgba(156, 39, 176, 0.1)',
  marginBottom: '16px',
}));

interface Props {
  open: boolean;
  article?: Article | null;
  onClose: () => void;
  onSave: (a: Partial<Article>, file?: File | null) => void;
}

const ArticleForm: React.FC<Props> = ({ open, article, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Article>>({
    reference: '',
    nom: '',
    type: '',
    description: '',
    prixAchat: 0,
    dateAchat: new Date().toISOString().split('T')[0],
    dureeGarantieMois: 24,
    estEnStock: true,
    estSousGarantie: false,
    imageUrl: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (article) {
        // Formater la date pour l'input date
        const formattedArticle = {
          ...article,
          dateAchat: article.dateAchat ? article.dateAchat.split('T')[0] : new Date().toISOString().split('T')[0]
        };
        setForm(formattedArticle);
        setPreview(article.imageUrl || null);
      } else {
        setForm({
          reference: '',
          nom: '',
          type: '',
          description: '',
          prixAchat: 0,
          dateAchat: new Date().toISOString().split('T')[0],
          dureeGarantieMois: 24,
          estEnStock: true,
          estSousGarantie: false,
          imageUrl: ''
        });
        setPreview(null);
      }
      setErrors({});
      setImageFile(null);
    }
  }, [article, open]);

  const handleChange = (field: keyof Article, value: any) => {
    if (field === 'prixAchat' || field === 'dureeGarantieMois') {
      const numValue = value === '' ? 0 : Number(value);
      setForm(prev => ({ ...prev, [field]: numValue }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.reference?.trim()) {
      newErrors.reference = 'La référence est requise';
    }
    
    if (!form.nom?.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    
    if (!form.type?.trim()) {
      newErrors.type = 'Le type est requis';
    }
    
    if (form.prixAchat === undefined || form.prixAchat < 0) {
      newErrors.prixAchat = 'Le prix d\'achat doit être positif';
    }
    
    if (!form.dateAchat) {
      newErrors.dateAchat = 'La date d\'achat est requise';
    }
    
    if (form.dureeGarantieMois === undefined || form.dureeGarantieMois < 0) {
      newErrors.dureeGarantieMois = 'La durée de garantie doit être positive';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // Convertir la date au format ISO pour le backend
      const formData = {
        ...form,
        dateAchat: new Date(form.dateAchat!).toISOString()
      };
      onSave(formData, imageFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Créer une preview locale
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const articleTypes = [
    'Sanitaire',
    'Chauffage',
    'Électricité',
    'Plomberie',
    'Outillage',
    'Peinture',
    'Menuiserie',
    'Autre'
  ];

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Inventory sx={{ fontSize: 32 }} />
          <span>{article ? 'Modifier l\'article' : 'Nouvel article'}</span>
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
          {article 
            ? 'Modifiez les informations de l\'article'
            : 'Remplissez les informations du nouvel article'
          }
        </Typography>

        <Grid container spacing={3}>
          {/* Image Upload */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button variant="outlined" component="label" sx={{ borderRadius: '10px' }}>
                {preview || form.imageUrl ? 'Changer l\'image' : 'Ajouter une image'}
                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
              </Button>
              {(preview || form.imageUrl) && (
                <Box sx={{ width: 80, height: 80, borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
                  <img 
                    src={preview || form.imageUrl} 
                    alt="aperçu" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </Box>
              )}
            </Box>
          </Grid>

          {/* Référence et Nom */}
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Référence *"
              value={form.reference || ''}
              onChange={e => handleChange('reference', e.target.value)}
              onFocus={() => setFocusedField('reference')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.reference}
              helperText={errors.reference}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Tag sx={{ 
                      color: focusedField === 'reference' ? '#9C27B0' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Nom *"
              value={form.nom || ''}
              onChange={e => handleChange('nom', e.target.value)}
              onFocus={() => setFocusedField('nom')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.nom}
              helperText={errors.nom}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Inventory sx={{ 
                      color: focusedField === 'nom' ? '#2196F3' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Type et Prix */}
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              select
              label="Type *"
              value={form.type || ''}
              onChange={e => handleChange('type', e.target.value)}
              onFocus={() => setFocusedField('type')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.type}
              helperText={errors.type}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Category sx={{ 
                      color: focusedField === 'type' ? '#FF9800' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="" disabled>Sélectionner un type</MenuItem>
              {articleTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </StyledTextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Prix d'achat (€) *"
              type="number"
              value={form.prixAchat ?? ''}
              onChange={e => handleChange('prixAchat', e.target.value)}
              onFocus={() => setFocusedField('prixAchat')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.prixAchat}
              helperText={errors.prixAchat}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney sx={{ 
                      color: focusedField === 'prixAchat' ? '#4CAF50' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
                inputProps: { 
                  min: 0,
                  step: 0.01
                }
              }}
            />
          </Grid>

          {/* Date d'achat et Durée garantie */}
          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Date d'achat *"
              type="date"
              value={form.dateAchat || ''}
              onChange={e => handleChange('dateAchat', e.target.value)}
              onFocus={() => setFocusedField('dateAchat')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.dateAchat}
              helperText={errors.dateAchat}
              required
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday sx={{ 
                      color: focusedField === 'dateAchat' ? '#00BCD4' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledTextField
              fullWidth
              label="Durée garantie (mois) *"
              type="number"
              value={form.dureeGarantieMois ?? ''}
              onChange={e => handleChange('dureeGarantieMois', e.target.value)}
              onFocus={() => setFocusedField('dureeGarantieMois')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.dureeGarantieMois}
              helperText={errors.dureeGarantieMois}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccessTime sx={{ 
                      color: focusedField === 'dureeGarantieMois' ? '#FF9800' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
                inputProps: { 
                  min: 0,
                  max: 120,
                  step: 1
                }
              }}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <StyledTextField
              fullWidth
              label="Description"
              value={form.description || ''}
              onChange={e => handleChange('description', e.target.value)}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              multiline
              rows={3}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                    <Description sx={{ 
                      color: focusedField === 'description' ? '#00BCD4' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Switches */}
          <Grid item xs={12}>
            <SwitchBox>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.estEnStock || false}
                        onChange={e => handleChange('estEnStock', e.target.checked)}
                        color="primary"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#4CAF50',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#4CAF50',
                          },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {form.estEnStock ? (
                          <CheckCircle sx={{ color: '#4CAF50' }} />
                        ) : (
                          <Warning sx={{ color: '#f44336' }} />
                        )}
                        <Typography sx={{ fontWeight: 700, color: form.estEnStock ? '#4CAF50' : '#666' }}>
                          {form.estEnStock ? 'En stock' : 'En rupture'}
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.estSousGarantie || false}
                        onChange={e => handleChange('estSousGarantie', e.target.checked)}
                        color="warning"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#FF9800',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#FF9800',
                          },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ color: form.estSousGarantie ? '#FF9800' : '#9e9e9e' }} />
                        <Typography sx={{ fontWeight: 700, color: form.estSousGarantie ? '#FF9800' : '#666' }}>
                          Sous garantie
                        </Typography>
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
            </SwitchBox>
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
          {article ? 'Mettre à jour' : 'Créer'}
        </SaveButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default ArticleForm;