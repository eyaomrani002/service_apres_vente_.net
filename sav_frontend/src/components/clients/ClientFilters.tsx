// ClientFilters.tsx - Version modernisée
import React, { useState } from 'react';
import { 
  Box, TextField, Grid, Button, FormControlLabel, 
  Checkbox, InputAdornment, Chip, IconButton, Collapse
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Search, Email, FilterList, Clear, CheckCircle
} from '@mui/icons-material';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled Components
const FilterContainer = styled(Box)(({ theme }) => ({
  animation: `${fadeIn} 0.5s ease`,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#2196F3',
      },
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#2196F3',
        borderWidth: '2px',
      },
      transform: 'scale(1.01)',
      boxShadow: '0 4px 20px rgba(33, 150, 243, 0.15)',
    },
  },
}));

const SearchButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
  color: '#fff',
  fontWeight: 700,
  padding: '12px 28px',
  borderRadius: '12px',
  textTransform: 'none',
  height: '56px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
    background: 'linear-gradient(135deg, #1976D2 0%, #0097A7 100%)',
  },
}));

const ClearButton = styled(IconButton)(({ theme }) => ({
  color: '#666',
  border: '2px solid #e0e0e0',
  borderRadius: '12px',
  padding: '14px',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#f44336',
    color: '#f44336',
    backgroundColor: 'rgba(244, 67, 54, 0.04)',
    transform: 'rotate(90deg)',
  },
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  color: '#2196F3',
  '&.Mui-checked': {
    color: '#2196F3',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 24,
  },
}));

const ActiveFilterChip = styled(Chip)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
  color: '#fff',
  fontWeight: 600,
  height: '32px',
  '& .MuiChip-deleteIcon': {
    color: 'rgba(255, 255, 255, 0.8)',
    '&:hover': {
      color: '#fff',
    },
  },
}));

interface Props {
  onSearch: (q: { searchTerm?: string; email?: string; avecReclamations?: boolean }) => void;
}

const ClientFilters: React.FC<Props> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [email, setEmail] = useState('');
  const [avecReclamations, setAvecReclamations] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFiltersCount = [
    searchTerm,
    email,
    avecReclamations
  ].filter(Boolean).length;

  const handleSearch = () => {
    onSearch({ 
      searchTerm: searchTerm || undefined, 
      email: email || undefined, 
      avecReclamations: avecReclamations || undefined 
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    setEmail('');
    setAvecReclamations(false);
    onSearch({});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <FilterContainer>
      <Grid container spacing={2} alignItems="center">
        {/* Recherche principale */}
        <Grid item xs={12} sm={6} md={4}>
          <StyledTextField
            fullWidth
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            label="Rechercher un client"
            placeholder="Nom, email, téléphone..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#2196F3' }} />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Email */}
        <Grid item xs={12} sm={6} md={3}>
          <StyledTextField
            fullWidth
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            label="Email"
            placeholder="Filtrer par email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: '#00BCD4' }} />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Checkbox */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControlLabel
            control={
              <StyledCheckbox
                checked={avecReclamations}
                onChange={e => setAvecReclamations(e.target.checked)}
                icon={<CheckCircle />}
                checkedIcon={<CheckCircle />}
              />
            }
            label={
              <Box sx={{ fontWeight: 600, color: avecReclamations ? '#2196F3' : '#666' }}>
                Avec réclamations uniquement
              </Box>
            }
          />
        </Grid>

        {/* Buttons */}
        <Grid item xs={12} sm={6} md={2}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <SearchButton 
              fullWidth 
              onClick={handleSearch}
              startIcon={<Search />}
            >
              Rechercher
            </SearchButton>
            {activeFiltersCount > 0 && (
              <ClearButton 
                onClick={handleClear}
                title="Effacer les filtres"
              >
                <Clear />
              </ClearButton>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#666' }}>
            Filtres actifs ({activeFiltersCount}):
          </Typography>
          {searchTerm && (
            <ActiveFilterChip
              label={`Recherche: "${searchTerm}"`}
              onDelete={() => {
                setSearchTerm('');
                handleSearch();
              }}
              size="small"
            />
          )}
          {email && (
            <ActiveFilterChip
              label={`Email: "${email}"`}
              onDelete={() => {
                setEmail('');
                handleSearch();
              }}
              size="small"
            />
          )}
          {avecReclamations && (
            <ActiveFilterChip
              label="Avec réclamations"
              onDelete={() => {
                setAvecReclamations(false);
                handleSearch();
              }}
              size="small"
            />
          )}
        </Box>
      )}
    </FilterContainer>
  );
};

export default ClientFilters;