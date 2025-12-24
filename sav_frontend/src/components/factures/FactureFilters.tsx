import React, { useState } from 'react';
import { Box, Grid, Paper, TextField, MenuItem, Button } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Search, FilterList, ClearAll } from '@mui/icons-material';
import { FactureFilterParams } from '../../types/facture';

const floatUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const FilterPanel = styled(Paper)(({ theme }) => ({
  borderRadius: '18px',
  padding: '20px',
  border: '1px solid rgba(33, 150, 243, 0.15)',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(220,233,255,0.6))',
  boxShadow: '0 16px 32px rgba(33, 150, 243, 0.12)',
  animation: `${floatUp} 0.6s ease`,
}));

const FilterButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  padding: '12px 24px',
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: '0 8px 24px rgba(33, 150, 243, 0.25)',
}));

interface Props {
  onSearch: (filters: FactureFilterParams) => void;
}

const statuses = ['Toutes', 'En attente', 'Payée', 'Annulée'];

const FactureFilters: React.FC<Props> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [numero, setNumero] = useState('');
  const [clientNom, setClientNom] = useState('');
  const [statut, setStatut] = useState('Toutes');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [montantMin, setMontantMin] = useState('');
  const [montantMax, setMontantMax] = useState('');

  const handleSearch = () => {
    onSearch({
      searchTerm: searchTerm.trim() || undefined,
      numero: numero.trim() || undefined,
      clientNom: clientNom.trim() || undefined,
      statut: statut && statut !== 'Toutes' ? statut : undefined,
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
      montantMin: montantMin ? Number(montantMin) : undefined,
      montantMax: montantMax ? Number(montantMax) : undefined,
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    setNumero('');
    setClientNom('');
    setStatut('Toutes');
    setDateDebut('');
    setDateFin('');
    setMontantMin('');
    setMontantMax('');
    onSearch({});
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <FilterPanel elevation={0}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FilterList sx={{ color: '#2196F3' }} />
        <Box component="span" sx={{ fontWeight: 700 }}>Filtres factures</Box>
      </Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={5}>
          <TextField
            fullWidth
            label="Recherche (numéro ou client)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyPress}
            InputProps={{
              startAdornment: <Search sx={{ color: '#2196F3', mr: 1 }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="Numéro facture"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ color: '#2196F3', mr: 1 }} />,
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Client"
            value={clientNom}
            onChange={(e) => setClientNom(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            select
            label="Statut"
            fullWidth
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
          >
            {statuses.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            label="Date début"
            type="date"
            fullWidth
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            label="Date fin"
            type="date"
            fullWidth
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            label="Montant min"
            type="number"
            fullWidth
            value={montantMin}
            onChange={(e) => setMontantMin(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            label="Montant max"
            type="number"
            fullWidth
            value={montantMax}
            onChange={(e) => setMontantMax(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FilterButton variant="contained" color="primary" onClick={handleSearch} startIcon={<Search />}>
              Appliquer
            </FilterButton>
            <FilterButton variant="outlined" color="primary" onClick={handleClear} startIcon={<ClearAll />}>
              Réinitialiser
            </FilterButton>
          </Box>
        </Grid>
      </Grid>
    </FilterPanel>
  );
};

export default FactureFilters;