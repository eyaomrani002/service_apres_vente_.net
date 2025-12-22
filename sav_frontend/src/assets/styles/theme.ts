import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1e40af',  
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#047857',
      contrastText: '#ffffff',
    },
    success: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#166534',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#b45309',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#b91c1c',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#334155',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          paddingLeft: 18,
          paddingRight: 18,
        },
        sizeLarge: {
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 12,
          paddingLeft: 12,
        },
        input: {
          paddingTop: '10px',
          paddingBottom: '10px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
        },
      },
    },
  },
});