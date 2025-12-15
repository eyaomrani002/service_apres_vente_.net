import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Container,
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  // navigation not needed here yet
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation simple
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
      // Simulation d'envoi d'email
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Mot de passe oublié
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Entrez votre adresse email pour réinitialiser votre mot de passe
            </Typography>
          </Box>

          {success ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              Un email de réinitialisation a été envoyé à {email}. 
              Veuillez vérifier votre boîte de réception.
            </Alert>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Adresse email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  margin="normal"
                  InputProps={{
                    startAdornment: <Email color="action" />,
                  }}
                  autoFocus
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </Button>
              </form>
            </>
          )}

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <ArrowBack sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">
                Retour à la page de connexion
              </Typography>
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;