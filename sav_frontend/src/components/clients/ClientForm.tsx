// ClientForm.tsx - Formulaire moderne pour créer/modifier un client
import React, { useEffect, useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Grid, Box, Typography, InputAdornment,
  IconButton, Divider
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Person, Email, Phone, Place, Close, Save, Cancel
} from '@mui/icons-material';
import { Client } from '../../types/client';

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
    maxWidth: '600px',
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
  client?: Client | null;
  onClose: () => void;
  onSave: (c: Partial<Client>) => void;
}

const ClientForm: React.FC<Props> = ({ open, client, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Client>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(client ? { ...client } : { 
        nom: '', 
        email: '', 
        telephone: '', 
        adresse: '' 
      });
      setErrors({});
    }
  }, [client, open]);

  const handleChange = (k: keyof Client, v: any) => {
    setForm(s => ({ ...s, [k]: v }));
    // Clear error when user starts typing
    if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.nom || form.nom.trim() === '') {
      newErrors.nom = 'Le nom est requis';
    }
    
    if (!form.email || form.email.trim() === '') {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (form.telephone && !/^[\d\s\-\+\(\)]+$/.test(form.telephone)) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(form);
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Person sx={{ fontSize: 32 }} />
          <span>{client ? 'Modifier le client' : 'Nouveau client'}</span>
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
          {client 
            ? 'Modifiez les informations du client ci-dessous'
            : 'Remplissez les informations du nouveau client'
          }
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StyledTextField
              fullWidth
              label="Nom complet"
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
                    <Person sx={{ 
                      color: focusedField === 'nom' ? '#2196F3' : '#9e9e9e',
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
              label="Email"
              type="email"
              value={form.email || ''}
              onChange={e => handleChange('email', e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.email}
              helperText={errors.email}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ 
                      color: focusedField === 'email' ? '#00BCD4' : '#9e9e9e',
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
              label="Téléphone"
              value={form.telephone || ''}
              onChange={e => handleChange('telephone', e.target.value)}
              onFocus={() => setFocusedField('telephone')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.telephone}
              helperText={errors.telephone || 'Format: +33 6 12 34 56 78'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone sx={{ 
                      color: focusedField === 'telephone' ? '#2196F3' : '#9e9e9e',
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
              label="Adresse complète"
              value={form.adresse || ''}
              onChange={e => handleChange('adresse', e.target.value)}
              onFocus={() => setFocusedField('adresse')}
              onBlur={() => setFocusedField(null)}
              multiline
              rows={3}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                    <Place sx={{ 
                      color: focusedField === 'adresse' ? '#00BCD4' : '#9e9e9e',
                      transition: 'color 0.3s',
                    }} />
                  </InputAdornment>
                ),
              }}
            />
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
          {client ? 'Mettre à jour' : 'Créer'}
        </SaveButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default ClientForm;