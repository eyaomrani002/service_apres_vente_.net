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
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Google,
  Facebook,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
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
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}
      <Typography variant="h6" component="h2" gutterBottom align="center">
        Connexion
      </Typography>

      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
        Entrez vos identifiants pour accéder à votre compte
      </Typography>

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
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Email color="action" />
            </InputAdornment>
          ),
        }}
        autoComplete="email"
        autoFocus
      />

      <TextField
        fullWidth
        variant="filled"
        label="Mot de passe"
        name="password"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleChange}
        error={!!errors.password}
        helperText={errors.password}
        margin="normal"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        autoComplete="current-password"
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Link
          component={RouterLink}
          to="/forgot-password"
          variant="body2"
          sx={{ textDecoration: 'none' }}
        >
          Mot de passe oublié ?
        </Link>
      </Box>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        sx={{ mt: 3, mb: 2, py: 1.25, borderRadius: 3 }}
      >
        Se connecter
      </Button>

      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          OU
        </Typography>
      </Divider>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Google />}
          onClick={() => console.log('Google login')}
          sx={{ borderRadius: 2 }}
        >
          Google
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Facebook />}
          onClick={() => console.log('Facebook login')}
          sx={{ borderRadius: 2 }}
        >
          Facebook
        </Button>
      </Box>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Pas encore de compte ?{' '}
          <Link
            component={RouterLink}
            to="/register"
            sx={{ fontWeight: 600, textDecoration: 'none' }}
          >
            S'inscrire
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginForm;