// ForgotPasswordPage.tsx - Version modernisée
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Email, ArrowBack, ArrowForward, CheckCircle } from '@mui/icons-material';
import { Link } from 'react-router-dom';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const successPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Styled Components
const StyledTextField = styled(TextField)(({ theme }) => ({
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
    color: '#ff6b6b',
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

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('Veuillez entrer votre adresse email');
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Adresse email invalide');
      setLoading(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', animation: `${fadeIn} 0.6s ease` }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        {/* Icône animée */}
        <Box
          sx={{
            display: 'inline-block',
            p: 2.5,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
            mb: 2,
            boxShadow: '0 8px 24px rgba(33, 150, 243, 0.4)',
            animation: success ? `${successPulse} 0.5s ease` : 'none',
          }}
        >
          {success ? (
            <CheckCircle sx={{ fontSize: 40, color: '#fff' }} />
          ) : (
            <Email sx={{ fontSize: 40, color: '#fff' }} />
          )}
        </Box>

        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #64B5F6 0%, #00BCD4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Mot de passe oublié
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Entrez votre adresse email pour réinitialiser votre mot de passe
        </Typography>
      </Box>

      {success ? (
        <Box>
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{
              mb: 3,
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              color: '#fff',
              borderRadius: '12px',
              animation: `${fadeIn} 0.5s ease`,
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Email envoyé avec succès !
            </Typography>
            <Typography variant="body2">
              Un email de réinitialisation a été envoyé à <strong>{email}</strong>.
              Veuillez vérifier votre boîte de réception.
            </Typography>
          </Alert>

          <Box
            sx={{
              p: 3,
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 3,
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
              📧 Vous n'avez pas reçu l'email ?
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              • Vérifiez votre dossier spam ou courrier indésirable
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              • Assurez-vous que l'adresse email est correcte
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              • Patientez quelques minutes avant de réessayer
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                color: '#fff',
                borderRadius: '12px',
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <StyledTextField
              fullWidth
              variant="filled"
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField(true)}
              onBlur={() => setFocusedField(false)}
              disabled={loading}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email
                      sx={{
                        color: focusedField ? '#00BCD4' : 'rgba(255, 255, 255, 0.4)',
                        transition: 'all 0.3s',
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              autoFocus
            />

            <GradientButton
              type="submit"
              fullWidth
              size="large"
              disabled={loading}
              endIcon={<ArrowForward />}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </GradientButton>
          </Box>
        </>
      )}

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: '#64B5F6',
            fontWeight: 600,
            transition: 'all 0.3s',
          }}
        >
          <ArrowBack sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="body2">
            Retour à la page de connexion
          </Typography>
        </Link>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;