// LoginForm.tsx - Version modernisée
import React, { useState, useContext } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Google,
  Facebook,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';

// Animations
const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(33, 150, 243, 0.4); }
  50% { box-shadow: 0 0 30px rgba(33, 150, 243, 0.6); }
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
      transform: 'scale(1.02)',
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
  padding: '14px 28px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '16px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 30px rgba(33, 150, 243, 0.4)',
    background: 'linear-gradient(135deg, #1976D2 0%, #0097A7 100%)',
  },
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    transition: 'left 0.5s',
  },
  '&:hover:before': {
    left: '100%',
  },
}));

const SocialButton = styled(Button)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: '#fff',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  padding: '10px 20px',
  textTransform: 'none',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(33, 150, 243, 0.5)',
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 20px rgba(33, 150, 243, 0.2)',
  },
}));

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      (async () => {
        setAlert(null);
        const res = await login(formData.email, formData.password);
        if (res.ok) {
          navigate('/dashboard');
        } else {
          setAlert({ type: 'error', message: res.message || 'Erreur connexion' });
        }
      })();
    }
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      noValidate 
      sx={{ 
        width: '100%',
        animation: `${fadeIn} 0.6s ease`,
      }}
    >
      {alert && (
        <Alert 
          severity={alert.type} 
          sx={{ 
            mb: 2,
            backgroundColor: alert.type === 'error' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
            border: `1px solid ${alert.type === 'error' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`,
            color: '#fff',
            borderRadius: '12px',
          }}
        >
          {alert.message}
        </Alert>
      )}

      <Box sx={{ textAlign: 'center', mb: 4 }}>
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
          Connexion
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Entrez vos identifiants pour accéder à votre compte
        </Typography>
      </Box>

      <Box sx={{ position: 'relative' }}>
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
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email 
                  sx={{ 
                    color: focusedField === 'email' ? '#00BCD4' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.3s',
                  }} 
                />
              </InputAdornment>
            ),
          }}
          autoComplete="email"
          autoFocus
        />

        <StyledTextField
          fullWidth
          variant="filled"
          label="Mot de passe"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
          error={!!errors.password}
          helperText={errors.password}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock 
                  sx={{ 
                    color: focusedField === 'password' ? '#2196F3' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.3s',
                  }} 
                />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.6)',
                    '&:hover': { color: '#64B5F6' },
                  }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          autoComplete="current-password"
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Link
          component={RouterLink}
          to="/forgot-password"
          sx={{
            color: '#64B5F6',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'color 0.3s',
            '&:hover': {
              color: '#00BCD4',
              textDecoration: 'underline',
            },
          }}
        >
          Mot de passe oublié ?
        </Link>
      </Box>

      <GradientButton
        type="submit"
        fullWidth
        size="large"
        endIcon={<ArrowForward />}
      >
        Se connecter
      </GradientButton>

      <Divider sx={{ my: 3, '&::before, &::after': { borderColor: 'rgba(255, 255, 255, 0.1)' } }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', px: 2 }}>
          OU
        </Typography>
      </Divider>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <SocialButton
          fullWidth
          startIcon={<Google />}
          onClick={() => console.log('Google login')}
        >
          Google
        </SocialButton>
        <SocialButton
          fullWidth
          startIcon={<Facebook />}
          onClick={() => console.log('Facebook login')}
        >
          Facebook
        </SocialButton>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Pas encore de compte ?{' '}
          <Link
            component={RouterLink}
            to="/register"
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
            S'inscrire
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginForm;