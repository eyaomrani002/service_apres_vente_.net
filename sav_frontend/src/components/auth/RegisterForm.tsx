// RegisterForm.tsx - Version modernisée
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  FormControlLabel,
  Checkbox,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  Person,
  Email,
  Lock,
  Phone,
  LocationOn,
  ArrowForward,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { authService } from '../../services/authService';
import type { RegisterData } from '../../types/auth';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(0.98); }
`;

// Styled Components
const StyledTextField = styled(TextField)(({ theme, error }) => ({
  '& .MuiFilledInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(33, 150, 243, 0.3)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid #2196F3',
      boxShadow: '0 0 20px rgba(33, 150, 243, 0.3)',
      transform: 'scale(1.01)',
    },
    '&:before, &:after': {
      display: 'none',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#64B5F6',
  },
  '& .MuiFilledInput-input': {
    color: '#fff',
  },
  '& .MuiFormHelperText-root': {
    color: error ? '#ff6b6b' : 'rgba(255, 255, 255, 0.5)',
  },
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
  color: '#fff',
  fontWeight: 700,
  padding: '12px 24px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '15px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 30px rgba(33, 150, 243, 0.4)',
    background: 'linear-gradient(135deg, #1976D2 0%, #0097A7 100%)',
  },
  '&:disabled': {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.3)',
  },
}));

const OutlineButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: '#fff',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  padding: '12px 24px',
  textTransform: 'none',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(33, 150, 243, 0.5)',
  },
  '&:disabled': {
    opacity: 0.3,
  },
}));

const StyledStepper = styled(Stepper)(({ theme }) => ({
  backgroundColor: 'transparent',
  '& .MuiStepLabel-label': {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '12px',
    fontWeight: 600,
  },
  '& .MuiStepLabel-label.Mui-active': {
    color: '#64B5F6',
  },
  '& .MuiStepLabel-label.Mui-completed': {
    color: '#00BCD4',
  },
  '& .MuiStepIcon-root': {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  '& .MuiStepIcon-root.Mui-active': {
    color: '#2196F3',
  },
  '& .MuiStepIcon-root.Mui-completed': {
    color: '#00BCD4',
  },
}));

const steps = ['Informations personnelles', 'Coordonnées', 'Validation'];

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    acceptTerms: false,
    newsletter: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    if (activeStep === 0) {
      if (!formData.firstName) newErrors.firstName = 'Prénom requis';
      if (!formData.lastName) newErrors.lastName = 'Nom requis';
      if (!formData.email) {
        newErrors.email = 'Email requis';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email invalide';
      }
      if (!formData.password) {
        newErrors.password = 'Mot de passe requis';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Minimum 6 caractères';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirmation requise';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }
    
    if (activeStep === 1) {
      if (!formData.phone) newErrors.phone = 'Téléphone requis';
      if (!formData.address) newErrors.address = 'Adresse requise';
      if (!formData.city) newErrors.city = 'Ville requise';
      if (!formData.postalCode) newErrors.postalCode = 'Code postal requis';
    }
    
    if (activeStep === 2 && !formData.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (activeStep === steps.length - 1) {
        handleSubmit();
      } else {
        setActiveStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setApiError(null);
      setApiSuccess(null);
      setSubmitting(true);

      const payload: RegisterData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        username: formData.email.trim().split('@')[0] || formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phoneNumber: formData.phone || undefined,
        acceptTerms: formData.acceptTerms,
      };

      const response = await authService.register(payload);

      setApiSuccess('Compte créé avec succès. Vous pouvez vous connecter.');

      // Stockage optionnel des infos utilisateur
      if (response?.token) {
        localStorage.setItem('accessToken', response.token);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
      }

      navigate('/login');
    } catch (error: any) {
      setApiError(error?.message || 'Échec de l’inscription.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
            <StyledTextField
              fullWidth
              variant="filled"
              label="Prénom"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.firstName}
              helperText={errors.firstName}
              InputProps={{
                startAdornment: (
                  <Person sx={{ 
                    mr: 1, 
                    color: focusedField === 'firstName' ? '#64B5F6' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.3s',
                  }} />
                ),
              }}
            />
            <StyledTextField
              fullWidth
              variant="filled"
              label="Nom"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              onFocus={() => setFocusedField('lastName')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.lastName}
              helperText={errors.lastName}
              InputProps={{
                startAdornment: (
                  <Person sx={{ 
                    mr: 1, 
                    color: focusedField === 'lastName' ? '#64B5F6' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.3s',
                  }} />
                ),
              }}
            />
            <Box sx={{ gridColumn: '1 / -1' }}>
              <StyledTextField
                fullWidth
                variant="filled"
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <Email sx={{ 
                      mr: 1, 
                      color: focusedField === 'email' ? '#00BCD4' : 'rgba(255, 255, 255, 0.4)',
                      transition: 'all 0.3s',
                    }} />
                  ),
                }}
              />
            </Box>
            <StyledTextField
              fullWidth
              variant="filled"
              label="Mot de passe"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                startAdornment: (
                  <Lock sx={{ 
                    mr: 1, 
                    color: focusedField === 'password' ? '#2196F3' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.3s',
                  }} />
                ),
              }}
            />
            <StyledTextField
              fullWidth
              variant="filled"
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                startAdornment: (
                  <Lock sx={{ 
                    mr: 1, 
                    color: focusedField === 'confirmPassword' ? '#2196F3' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.3s',
                  }} />
                ),
              }}
            />
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <StyledTextField
                fullWidth
                label="Téléphone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                error={!!errors.phone}
                helperText={errors.phone}
                InputProps={{
                  startAdornment: (
                    <Phone sx={{ 
                      mr: 1, 
                      color: focusedField === 'phone' ? '#00BCD4' : 'rgba(255, 255, 255, 0.4)',
                      transition: 'all 0.3s',
                    }} />
                  ),
                }}
              />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <StyledTextField
                fullWidth
                label="Adresse"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onFocus={() => setFocusedField('address')}
                onBlur={() => setFocusedField(null)}
                error={!!errors.address}
                helperText={errors.address}
                InputProps={{
                  startAdornment: (
                    <LocationOn sx={{ 
                      mr: 1, 
                      color: focusedField === 'address' ? '#2196F3' : 'rgba(255, 255, 255, 0.4)',
                      transition: 'all 0.3s',
                    }} />
                  ),
                }}
              />
            </Box>
            <StyledTextField
              fullWidth
              label="Ville"
              name="city"
              value={formData.city}
              onChange={handleChange}
              onFocus={() => setFocusedField('city')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.city}
              helperText={errors.city}
            />
            <StyledTextField
              fullWidth
              label="Code postal"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              onFocus={() => setFocusedField('postalCode')}
              onBlur={() => setFocusedField(null)}
              error={!!errors.postalCode}
              helperText={errors.postalCode}
            />
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Alert 
              severity="info" 
              icon={<CheckCircle />}
              sx={{ 
                mb: 3,
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                color: '#fff',
                borderRadius: '12px',
              }}
            >
              Veuillez vérifier vos informations avant de finaliser
            </Alert>
            
            <Box 
              sx={{ 
                mb: 3, 
                p: 2.5, 
                borderRadius: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="subtitle2" sx={{ color: '#64B5F6', mb: 1, fontWeight: 700 }}>
                Informations personnelles
              </Typography>
              <Typography variant="body1" sx={{ color: '#fff', mb: 0.5 }}>
                {formData.firstName} {formData.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {formData.email}
              </Typography>
            </Box>
            
            <Box 
              sx={{ 
                mb: 3, 
                p: 2.5, 
                borderRadius: '12px', 
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="subtitle2" sx={{ color: '#00BCD4', mb: 1, fontWeight: 700 }}>
                Coordonnées
              </Typography>
              <Typography variant="body1" sx={{ color: '#fff', mb: 0.5 }}>
                {formData.address}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 0.5 }}>
                {formData.postalCode} {formData.city}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {formData.phone}
              </Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Checkbox
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.3)',
                    '&.Mui-checked': {
                      color: '#2196F3',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  J'accepte les{' '}
                  <Link href="#" sx={{ color: '#64B5F6', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    conditions générales
                  </Link>{' '}
                  et la{' '}
                  <Link href="#" sx={{ color: '#64B5F6', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    politique de confidentialité
                  </Link>
                </Typography>
              }
            />
            {errors.acceptTerms && (
              <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1, ml: 4 }}>
                {errors.acceptTerms}
              </Typography>
            )}
            
            <FormControlLabel
              control={
                <Checkbox
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.3)',
                    '&.Mui-checked': {
                      color: '#00BCD4',
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Je souhaite recevoir les newsletters
                </Typography>
              }
            />
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', animation: `${fadeIn} 0.6s ease` }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #64B5F6 0%, #00BCD4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Créer un compte
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Inscrivez-vous pour gérer vos réclamations
        </Typography>
      </Box>
      
      <StyledStepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </StyledStepper>

      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiError}
        </Alert>
      )}
      {apiSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {apiSuccess}
        </Alert>
      )}
      
      <Box sx={{ width: '100%', mb: 4 }}>{renderStepContent()}</Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <OutlineButton
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBack />}
        >
          Retour
        </OutlineButton>
        
        <GradientButton
          onClick={handleNext}
          endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
          disabled={submitting}
        >
          {submitting ? 'En cours...' : activeStep === steps.length - 1 ? 'S\'inscrire' : 'Suivant'}
        </GradientButton>
      </Box>
      
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Vous avez déjà un compte ?{' '}
          <Link
            component={RouterLink}
            to="/login"
            sx={{
              color: '#64B5F6',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'color 0.3s',
              '&:hover': {
                color: '#00BCD4',
                textDecoration: 'underline',
              },
            }}
          >
            Se connecter
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterForm;