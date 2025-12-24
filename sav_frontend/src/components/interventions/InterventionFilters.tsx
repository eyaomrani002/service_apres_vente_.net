// InterventionFilters.tsx - Version modernisée
import React, { useEffect, useState } from 'react';
import { 
  Box, TextField, Grid, Button, MenuItem, 
  InputAdornment, Chip, IconButton, Typography
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Search, Person, Build, FilterList, Clear, CheckCircle
} from '@mui/icons-material';
import { clientService } from '../../services/clientService';
import { reclamationService } from '../../services/reclamationService';
import { Client } from '../../types/client';

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
        borderColor: '#FF9800',
      },
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#FF9800',
        borderWidth: '2px',
      },
      transform: 'scale(1.01)',
      boxShadow: '0 4px 20px rgba(255, 152, 0, 0.15)',
    },
  },
}));

const SearchButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
  color: '#fff',
  fontWeight: 700,
  padding: '12px 28px',
  borderRadius: '12px',
  textTransform: 'none',
  height: '56px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(255, 152, 0, 0.3)',
    background: 'linear-gradient(135deg, #F57C00 0%, #FFA000 100%)',
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
  background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
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
  onSearch: (q: { 
    searchTerm?: string; 
    technicienId?: number; 
    statut?: string; 
    reclamationId?: number;
    clientId?: number;
    dateDebut?: string;
    dateFin?: string;
    coutMin?: number;
    coutMax?: number;
    estGratuite?: boolean;
    mode?: 'gratuite' | 'payante' | 'sans-facture';
  }) => void;
}

const InterventionFilters: React.FC<Props> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [technicienId, setTechnicienId] = useState('');
  const [statut, setStatut] = useState('');
  const [clientId, setClientId] = useState('');
  const [reclamationId, setReclamationId] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [coutMin, setCoutMin] = useState('');
  const [coutMax, setCoutMax] = useState('');
  const [mode, setMode] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [reclamations, setReclamations] = useState<any[]>([]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await clientService.getAll();
        setClients(Array.isArray(data) ? data : []);
      } catch {
        setClients([]);
      }
    };
    loadClients();
  }, []);

  useEffect(() => {
    const loadReclamations = async () => {
      if (!clientId) {
        setReclamations([]);
        setReclamationId('');
        return;
      }
      try {
        const recs = await reclamationService.getByClient(Number(clientId));
        setReclamations(Array.isArray(recs) ? recs : []);
      } catch {
        setReclamations([]);
      }
    };
    loadReclamations();
  }, [clientId]);

  const activeFiltersCount = [
    searchTerm,
    technicienId,
    statut,
    clientId,
    reclamationId,
    dateDebut,
    dateFin,
    coutMin,
    coutMax,
    mode
  ].filter(Boolean).length;

  const handleSearch = () => {
    const estGratuite = mode === 'gratuite' ? true : mode === 'payante' ? false : undefined;
    onSearch({ 
      searchTerm: searchTerm || undefined, 
      technicienId: technicienId ? Number(technicienId) : undefined,
      statut: statut || undefined,
      clientId: clientId ? Number(clientId) : undefined,
      reclamationId: reclamationId ? Number(reclamationId) : undefined,
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
      coutMin: coutMin ? Number(coutMin) : undefined,
      coutMax: coutMax ? Number(coutMax) : undefined,
      estGratuite,
      mode: mode ? (mode as any) : undefined
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    setTechnicienId('');
    setStatut('');
    setClientId('');
    setReclamationId('');
    setDateDebut('');
    setDateFin('');
    setCoutMin('');
    setCoutMax('');
    setMode('');
    onSearch({});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const statutOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'Planifiée', label: 'Planifiée' },
    { value: 'En cours', label: 'En cours' },
    { value: 'Terminée', label: 'Terminée' },
    { value: 'Annulée', label: 'Annulée' }
  ];

  return (
    <FilterContainer>
      <Grid container spacing={2} alignItems="center">
        {/* Recherche principale */}
        <Grid item xs={12} sm={6} md={3}>
          <StyledTextField
            fullWidth
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            label="Rechercher"
            placeholder="Technicien, description..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#FF9800' }} />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Technicien */}
        <Grid item xs={12} sm={6} md={2}>
          <StyledTextField
            fullWidth
            value={technicienId}
            onChange={e => setTechnicienId(e.target.value)}
            onKeyPress={handleKeyPress}
            label="ID Technicien"
            type="number"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: '#2196F3' }} />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Statut */}
        <Grid item xs={12} sm={6} md={2}>
          <StyledTextField
            fullWidth
            select
            value={statut}
            onChange={e => setStatut(e.target.value)}
            label="Statut"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Build sx={{ color: '#00BCD4' }} />
                </InputAdornment>
              ),
            }}
          >
            {statutOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </StyledTextField>
        </Grid>

        {/* Client */}
        <Grid item xs={12} sm={6} md={2}>
          <StyledTextField
            fullWidth
            select
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            label="Client"
          >
            <MenuItem value="">Tous les clients</MenuItem>
            {clients.map(client => (
              <MenuItem key={client.id} value={String(client.id)}>
                {client.nom}
              </MenuItem>
            ))}
          </StyledTextField>
        </Grid>

        {/* Réclamation */}
        <Grid item xs={12} sm={6} md={2}>
          <StyledTextField
            fullWidth
            select
            value={reclamationId}
            onChange={e => setReclamationId(e.target.value)}
            label="Réclamation"
            disabled={!clientId}
          >
            <MenuItem value="">Toutes les réclamations</MenuItem>
            {reclamations.map(reclamation => {
              const id = reclamation.id ?? reclamation.Id;
              const sujet = reclamation.sujet ?? reclamation.Sujet;
              return (
                <MenuItem key={id} value={String(id)}>
                  {sujet || `Réclamation #${id}`}
                </MenuItem>
              );
            })}
          </StyledTextField>
        </Grid>

        {/* Dates */}
        <Grid item xs={12} sm={6} md={2}>
          <StyledTextField
            fullWidth
            label="Date début"
            type="date"
            value={dateDebut}
            onChange={e => setDateDebut(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StyledTextField
            fullWidth
            label="Date fin"
            type="date"
            value={dateFin}
            onChange={e => setDateFin(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Coûts */}
        <Grid item xs={12} sm={6} md={2}>
          <StyledTextField
            fullWidth
            label="Coût min"
            type="number"
            value={coutMin}
            onChange={e => setCoutMin(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StyledTextField
            fullWidth
            label="Coût max"
            type="number"
            value={coutMax}
            onChange={e => setCoutMax(e.target.value)}
          />
        </Grid>

        {/* Mode (gratuit/payant/sans facture) */}
        <Grid item xs={12} sm={6} md={2}>
          <StyledTextField
            fullWidth
            select
            label="Type"
            value={mode}
            onChange={e => setMode(e.target.value)}
          >
            <MenuItem value="">Tous</MenuItem>
            <MenuItem value="gratuite">Gratuites</MenuItem>
            <MenuItem value="payante">Payantes</MenuItem>
            <MenuItem value="sans-facture">Sans facture</MenuItem>
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
              Filtrer
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
          {technicienId && (
            <ActiveFilterChip
              label={`Technicien ID: ${technicienId}`}
              onDelete={() => {
                setTechnicienId('');
                handleSearch();
              }}
              size="small"
            />
          )}
          {statut && (
            <ActiveFilterChip
              label={`Statut: ${statut}`}
              onDelete={() => {
                setStatut('');
                handleSearch();
              }}
              size="small"
            />
          )}
          {clientId && (
            <ActiveFilterChip
              label={`Client: ${clients.find(c => String(c.id) === clientId)?.nom || clientId}`}
              onDelete={() => {
                setClientId('');
                setReclamationId('');
                handleSearch();
              }}
              size="small"
            />
          )}
          {reclamationId && (
            <ActiveFilterChip
              label={`Réclamation: ${reclamationId}`}
              onDelete={() => {
                setReclamationId('');
                handleSearch();
              }}
              size="small"
            />
          )}
          {dateDebut && (
            <ActiveFilterChip
              label={`Du ${dateDebut}`}
              onDelete={() => {
                setDateDebut('');
                handleSearch();
              }}
              size="small"
            />
          )}
          {dateFin && (
            <ActiveFilterChip
              label={`Au ${dateFin}`}
              onDelete={() => {
                setDateFin('');
                handleSearch();
              }}
              size="small"
            />
          )}
          {coutMin && (
            <ActiveFilterChip
              label={`Coût min: ${coutMin}`}
              onDelete={() => {
                setCoutMin('');
                handleSearch();
              }}
              size="small"
            />
          )}
          {coutMax && (
            <ActiveFilterChip
              label={`Coût max: ${coutMax}`}
              onDelete={() => {
                setCoutMax('');
                handleSearch();
              }}
              size="small"
            />
          )}
          {mode && (
            <ActiveFilterChip
              label={`Type: ${mode}`}
              onDelete={() => {
                setMode('');
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

export default InterventionFilters;