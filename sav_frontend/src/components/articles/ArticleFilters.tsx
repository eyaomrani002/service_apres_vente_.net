// ArticleFilters.tsx - Version modernisée
import React, { useState } from 'react';
import { 
  Box, TextField, Grid, Button, InputAdornment,
  Chip, IconButton, Typography
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Search, Category, Clear, FilterList
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
        borderColor: '#9C27B0',
      },
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#9C27B0',
        borderWidth: '2px',
      },
      transform: 'scale(1.01)',
      boxShadow: '0 4px 20px rgba(156, 39, 176, 0.15)',
    },
  },
}));

const SearchButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
  color: '#fff',
  fontWeight: 700,
  padding: '12px 28px',
  borderRadius: '12px',
  textTransform: 'none',
  height: '56px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(156, 39, 176, 0.3)',
    background: 'linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%)',
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

const ActiveFilterChip = styled(Chip)(({ theme }) => ({
  background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
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
  onSearch: (q: { searchTerm?: string; type?: string }) => void;
}

const ArticleFilters: React.FC<Props> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState('');

  const activeFiltersCount = [
    searchTerm,
    type
  ].filter(Boolean).length;

  const handleSearch = () => {
    onSearch({ 
      searchTerm: searchTerm || undefined, 
      type: type || undefined 
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    setType('');
    onSearch({});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Types d'articles courants
  const articleTypes = [
    'Sanitaire',
    'Chauffage',
    'Électricité',
    'Plomberie',
    'Outillage',
    'Peinture',
    'Menuiserie',
    'Autre'
  ];

  return (
    <FilterContainer>
      <Grid container spacing={2} alignItems="center">
        {/* Recherche par nom/référence */}
        <Grid item xs={12} sm={6} md={4}>
          <StyledTextField
            fullWidth
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            label="Rechercher un article"
            placeholder="Nom, référence..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#9C27B0' }} />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Filtre par type */}
        <Grid item xs={12} sm={6} md={4}>
          <StyledTextField
            fullWidth
            select
            value={type}
            onChange={e => setType(e.target.value)}
            onKeyPress={handleKeyPress}
            label="Type d'article"
            SelectProps={{
              native: false,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Category sx={{ color: '#00BCD4' }} />
                </InputAdornment>
              ),
            }}
          >
            <option value="">Tous les types</option>
            {articleTypes.map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {typeOption}
              </option>
            ))}
          </StyledTextField>
        </Grid>

        {/* Buttons */}
        <Grid item xs={12} sm={6} md={4}>
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
          {type && (
            <ActiveFilterChip
              label={`Type: ${type}`}
              onDelete={() => {
                setType('');
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

export default ArticleFilters;