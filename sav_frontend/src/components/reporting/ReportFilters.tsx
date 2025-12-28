import React, { useState } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  TextField, 
  MenuItem, 
  Button,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Search, FilterList, ClearAll } from '@mui/icons-material';
import { ReportFilterParams } from '../../types/report';

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
  onSearch: (filters: ReportFilterParams) => void;
}

const ReportFilters: React.FC<Props> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientId, setClientId] = useState('');
  const [interventionId, setInterventionId] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [isWarranty, setIsWarranty] = useState<string>('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [montantMin, setMontantMin] = useState('');
  const [montantMax, setMontantMax] = useState('');

  const handleSearch = () => {
    const filters: ReportFilterParams = {
      searchTerm: searchTerm.trim() || undefined,
      clientId: clientId.trim() || undefined,
      interventionId: interventionId.trim() || undefined,
      technicianId: technicianId.trim() || undefined,
      isWarranty: isWarranty === '' ? undefined : isWarranty === 'oui',
      dateDebut: dateDebut || undefined,
      dateFin: dateFin || undefined,
      montantMin: montantMin ? Number(montantMin) : undefined,
      montantMax: montantMax ? Number(montantMax) : undefined,
    };
    onSearch(filters);
  };

  const handleClear = () => {
    setSearchTerm('');
    setClientId('');
    setInterventionId('');
    setTechnicianId('');
    setIsWarranty('');
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
        <Box component="span" sx={{ fontWeight: 700 }}>Filtres rapports</Box>
      </Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Recherche (titre, client, intervention)"
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
            label="ID Client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="ID du client"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="ID Intervention"
            value={interventionId}
            onChange={(e) => setInterventionId(e.target.value)}
            placeholder="ID de l'intervention"
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth>
            <InputLabel>Garantie</InputLabel>
            <Select
              value={isWarranty}
              label="Garantie"
              onChange={(e) => setIsWarranty(e.target.value)}
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="oui">Oui</MenuItem>
              <MenuItem value="non">Non</MenuItem>
            </Select>
          </FormControl>
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
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        <Grid item xs={12} md={2}>
          <TextField
            label="Montant max"
            type="number"
            fullWidth
            value={montantMax}
            onChange={(e) => setMontantMax(e.target.value)}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="ID Technicien"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            placeholder="ID du technicien"
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

export default ReportFilters;