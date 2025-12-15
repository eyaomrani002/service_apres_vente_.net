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
import {
  Person,
  Email,
  Lock,
  Phone,
  LocationOn,
  ArrowForward,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

// Use MUI Grid (stable) and include component prop on items to satisfy typings

const steps = ['Informations personnelles', 'Coordonnées', 'Validation'];

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Étape 1
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Étape 2
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    
    // Étape 3
    acceptTerms: false,
    newsletter: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSubmit = () => {
    console.log('Registration data:', formData);
    
    // Simulation d'inscription réussie
    setTimeout(() => {
      localStorage.setItem('token', 'simulated_token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        role: 'client',
      }));
      navigate('/dashboard');
    }, 1000);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
            <Box>
              <TextField
                fullWidth
                variant="filled"
                label="Prénom"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                InputProps={{ startAdornment: <Person color="action" /> }}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                variant="filled"
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                InputProps={{ startAdornment: <Person color="action" /> }}
              />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                variant="filled"
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{ startAdornment: <Email color="action" /> }}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                variant="filled"
                label="Mot de passe"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{ startAdornment: <Lock color="action" /> }}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                variant="filled"
                label="Confirmer le mot de passe"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{ startAdornment: <Lock color="action" /> }}
              />
            </Box>
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Téléphone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                InputProps={{
                  startAdornment: <Phone color="action" />,
                }}
              />
            </Box>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Adresse"
                name="address"
                value={formData.address}
                onChange={handleChange}
                error={!!errors.address}
                helperText={errors.address}
                InputProps={{
                  startAdornment: <LocationOn color="action" />,
                }}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Ville"
                name="city"
                value={formData.city}
                onChange={handleChange}
                error={!!errors.city}
                helperText={errors.city}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Code postal"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                error={!!errors.postalCode}
                helperText={errors.postalCode}
              />
            </Box>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Veuillez vérifier vos informations avant de finaliser l'inscription
            </Alert>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Informations personnelles
              </Typography>
              <Typography variant="body1">
                {formData.firstName} {formData.lastName}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {formData.email}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Coordonnées
              </Typography>
              <Typography variant="body1">
                {formData.address}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {formData.postalCode} {formData.city}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {formData.phone}
              </Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Checkbox
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                />
              }
              label={
                <Typography variant="body2">
                  J'accepte les{' '}
                  <Link href="#" sx={{ textDecoration: 'none' }}>
                    conditions générales
                  </Link>{' '}
                  et la{' '}
                  <Link href="#" sx={{ textDecoration: 'none' }}>
                    politique de confidentialité
                  </Link>
                </Typography>
              }
            />
            {errors.acceptTerms && (
              <Typography color="error" variant="caption">
                {errors.acceptTerms}
              </Typography>
            )}
            
            <FormControlLabel
              control={
                <Checkbox
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                />
              }
              label="Je souhaite recevoir les newsletters"
            />
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" component="h2" gutterBottom align="center">
        Créer un compte
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
        Inscrivez-vous pour gérer vos réclamations
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Box sx={{ width: '100%' }}>{renderStepContent()}</Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBack />}
        >
          Retour
        </Button>
        
        <Button
          variant="contained"
          onClick={handleNext}
          endIcon={activeStep === steps.length - 1 ? undefined : <ArrowForward />}
          sx={{ borderRadius: 3 }}
        >
          {activeStep === steps.length - 1 ? 'S\'inscrire' : 'Suivant'}
        </Button>
      </Box>
      
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Vous avez déjà un compte ?{' '}
          <Link
            component={RouterLink}
            to="/login"
            sx={{ fontWeight: 600, textDecoration: 'none' }}
          >
            Se connecter
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterForm;