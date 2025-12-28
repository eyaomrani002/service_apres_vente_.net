// ReclamationFilters.tsx - Version modernisée
import React, { useEffect, useState } from 'react';
import { 
  Box, TextField, Grid, Button, MenuItem, 
  InputAdornment, Chip, IconButton
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Search, Person, TrendingUp, FilterList, Clear
} from '@mui/icons-material';
import { clientService } from '../../services/clientService';
import { Client } from '../../types/client';
import { getUsers } from '../../services/userService';

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
  onSearch: (q: { searchTerm?: string; clientId?: number; statut?: string }) => void;
  disableClientFilter?: boolean;
  isAdmin?: boolean;
}

const ReclamationFilters: React.FC<Props> = ({ onSearch, disableClientFilter, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [statut, setStatut] = useState('');
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (disableClientFilter) return;
    let ignore = false;
    (async () => {
      try {
        const baseClients = await clientService.getAll();
        let merged: Client[] = Array.isArray(baseClients) ? baseClients : [];

        if (isAdmin) {
          try {
            const users = await getUsers();
            const clientUsers = users.filter((u) => u.roles?.some((r) => r.toLowerCase() === 'client'));
            const existingEmails = new Set((merged || []).map((c) => (c.email || '').toLowerCase()));
            let syntheticIndex = 1;
            clientUsers.forEach((u) => {
              if (u.email && !existingEmails.has(u.email.toLowerCase())) {
                merged.push({
                  id: -syntheticIndex++,
                  nom: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.userName || u.email,
                  email: u.email,
                  telephone: u.phoneNumber || undefined,
                  dateInscription: u.lastLoginAt ?? undefined,
                  nombreReclamations: 0,
                  reclamationsEnCours: 0,
                  isAuthUser: true,
                  userId: u.id,
                });
              }
            });
          } catch (e) {
            console.warn('Impossible de charger les users pour fusion (filtres réclamations)', e);
          }
        }

        if (!ignore) setClients(merged);
      } catch {
        if (!ignore) setClients([]);
      }
    })();
    return () => { ignore = true; };
  }, [disableClientFilter, isAdmin]);

  const activeFiltersCount = [
    searchTerm,
    clientId,
    statut
  ].filter(Boolean).length;

  const handleSearch = () => {
    onSearch({ 
      searchTerm: searchTerm || undefined, 
      statut: statut || undefined, 
      clientId: clientId ? Number(clientId) : undefined 
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    setClientId('');
    setStatut('');
    onSearch({});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatStatutDisplay = (val: string) => {
    const statusMap: Record<string, string> = {
      'nouvelle': '📋 Nouvelle',
      'en_cours': '⚙️ En cours',
      'resolue': '✅ Résolue',
      'en attente': '⏳ En attente',
    };
    return statusMap[val] || val;
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
            label="Rechercher une réclamation"
            placeholder="Sujet, description..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#2196F3' }} />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Filtre Client (admin uniquement) */}
        {!disableClientFilter && (
          <Grid item xs={12} sm={6} md={3}>
            <StyledTextField
              select
              fullWidth
              label="Client"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#00BCD4' }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="">Tous les clients</MenuItem>
              {clients.map(c => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.nom}{c.email ? ` — ${c.email}` : ''}
                </MenuItem>
              ))}
            </StyledTextField>
          </Grid>
        )}

        {/* Filtre Statut */}
        <Grid item xs={12} sm={6} md={3}>
          <StyledTextField
            select
            fullWidth
            value={statut}
            onChange={e => setStatut(e.target.value)}
            label="Statut"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TrendingUp sx={{ color: '#2196F3' }} />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">Tous les statuts</MenuItem>
            <MenuItem value="nouvelle">📋 Nouvelle</MenuItem>
            <MenuItem value="en_cours">⚙️ En cours</MenuItem>
            <MenuItem value="resolue">✅ Résolue</MenuItem>
            <MenuItem value="en attente">⏳ En attente</MenuItem>
          </StyledTextField>
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
          <Box component="span" sx={{ fontWeight: 600, color: '#666', fontSize: '14px' }}>
            Filtres actifs ({activeFiltersCount}):
          </Box>
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
          {clientId && (
            <ActiveFilterChip
              label={`Client: ${clients.find(c => c.id === Number(clientId))?.nom || clientId}`}
              onDelete={() => {
                setClientId('');
                handleSearch();
              }}
              size="small"
            />
          )}
          {statut && (
            <ActiveFilterChip
              label={`Statut: ${formatStatutDisplay(statut)}`}
              onDelete={() => {
                setStatut('');
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

export default ReclamationFilters;