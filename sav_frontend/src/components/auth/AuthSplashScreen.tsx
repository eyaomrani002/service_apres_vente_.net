// src/components/auth/AuthSplashScreen.tsx
import { Box, CircularProgress, Typography } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const AuthSplashScreen = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b1021 0%, #0e1a36 100%)',
      zIndex: 9999,
    }}
  >
    <Box
      sx={{
        animation: `${pulse} 2s ease-in-out infinite`,
        mb: 3,
      }}
    >
      <CircularProgress size={60} sx={{ color: '#2196F3' }} />
    </Box>
    <Typography
      variant="h6"
      sx={{
        color: '#fff',
        fontWeight: 600,
        background: 'linear-gradient(135deg, #64B5F6 0%, #00BCD4 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      Chargement...
    </Typography>
  </Box>
);