import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f7f9fc',
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={1}
          sx={{
            p: { xs: 0, md: 0 },
            borderRadius: 2,
            bgcolor: 'transparent',
            boxShadow: 'none',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'stretch',
              bgcolor: 'transparent',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {/* Left: Illustration */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                width: '50%',
                bgcolor: 'linear-gradient(180deg, rgba(144,202,249,0.06), rgba(206,147,216,0.04))',
                p: 6,
              }}
            >
              <Box sx={{ width: '100%', maxWidth: 480 }}>
                <Box component="img" src="/src/assets/images/auth-illustration.svg" alt="illustration" sx={{ width: '100%', height: 'auto', display: 'block' }} />
                <Typography variant="h6" sx={{ mt: 3, color: 'text.primary', fontWeight: 600 }}>
                  Bienvenue chez Service SAV
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  Gérez vos réclamations et interventions rapidement et simplement.
                </Typography>
              </Box>
            </Box>

            {/* Right: Form area */}
            <Box sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 4, md: 6 }, bgcolor: 'background.paper', boxShadow: 1, borderRadius: { xs: 0, md: '0 0 0 16px' } }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}
                >
                  Service SAV
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gestion des réclamations & interventions
                </Typography>
              </Box>

              <Outlet />
            </Box>
          </Box>
        </Paper>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            © 2024 Service SAV. Tous droits réservés.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthLayout;