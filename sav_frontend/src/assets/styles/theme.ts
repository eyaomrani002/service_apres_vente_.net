import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#a6d4fa',
      dark: '#648dae',
      contrastText: '#0b1b2b',
    },
    secondary: {
      main: '#ce93d8',
      light: '#e1bee7',
      dark: '#9c64a6',
    },
    success: {
      main: '#66bb6a',
      light: '#81c784',
    },
    warning: {
      main: '#ffa726',
      light: '#ffb74d',
    },
    error: {
      main: '#ef5350',
      light: '#e57373',
    },
    background: {
      default: '#0b1220',
      paper: '#0f1724',
    },
    text: {
      primary: '#e6eef8',
      secondary: '#b9c6d8',
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
          // subtle elevated surface per Material 3
          boxShadow: '0 6px 18px rgba(2,6,23,0.6)',
        },
      },
    },
  },
});