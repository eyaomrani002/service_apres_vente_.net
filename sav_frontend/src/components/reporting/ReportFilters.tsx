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
  SelectChangeEvent,
  Collapse,
  IconButton,
  Stack,
  Typography,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Search, 
  FilterList, 
  ClearAll, 
  ExpandMore,
  CalendarMonth,
  Euro,
  Person,
  Build,
  Business,
  DateRange,
  Tune,
  ArrowDropDown,
  ArrowDropUp
} from '@mui/icons-material';
import { ReportFilterParams } from '../../types/report';

const floatUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const FilterPanel = styled(Paper)(({ theme }) => ({
  borderRadius: '18px',
  border: '1px solid rgba(33, 150, 243, 0.15)',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(242, 248, 255, 0.9))',
  boxShadow: '0 12px 28px rgba(33, 150, 243, 0.08)',
  animation: `${floatUp} 0.5s ease`,
  overflow: 'hidden',
}));

const FilterHeader = styled(Box)(({ theme }) => ({
  padding: '20px 24px',
  background: 'linear-gradient(90deg, rgba(33, 150, 243, 0.05), rgba(33, 150, 243, 0.02))',
  borderBottom: '1px solid rgba(33, 150, 243, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const FilterContent = styled(Box)(({ theme }) => ({
  padding: '24px',
}));

const FilterSection = styled(Box)(({ theme }) => ({
  marginBottom: '24px',
  '&:last-child': {
    marginBottom: 0,
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
  color: '#1976d2',
  fontWeight: 600,
  fontSize: '0.95rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.8)',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.9)',
    },
  },
}));

const FilterButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  padding: '10px 24px',
  textTransform: 'none',
  fontWeight: 600,
  transition: 'all 0.2s',
  '&.MuiButton-contained': {
    background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
    '&:hover': {
      background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
      boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
      transform: 'translateY(-1px)',
    },
  },
  '&.MuiButton-outlined': {
    borderWidth: '1.5px',
    '&:hover': {
      borderWidth: '1.5px',
      background: 'rgba(33, 150, 243, 0.04)',
    },
  },
}));

const QuickFilterChip = styled(Chip)(({ theme }) => ({
  borderRadius: '10px',
  fontWeight: 500,
  transition: 'all 0.2s',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  '&.MuiChip-filled': {
    background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
    color: 'white',
  },
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
  
  const [expanded, setExpanded] = useState(false);
  const [quickFilters, setQuickFilters] = useState({
    warranty: false,
    thisMonth: false,
    lastMonth: false,
    highValue: false,
    noClient: false,
  });

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
    setQuickFilters({
      warranty: false,
      thisMonth: false,
      lastMonth: false,
      highValue: false,
      noClient: false,
    });
    onSearch({});
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleQuickFilter = (type: keyof typeof quickFilters) => {
    const newFilters = { ...quickFilters };
    
    // Toggle the selected filter
    newFilters[type] = !newFilters[type];
    
    // Ensure only one date filter is active at a time
    if (type === 'thisMonth' && newFilters[type]) {
      newFilters.lastMonth = false;
    }
    if (type === 'lastMonth' && newFilters[type]) {
      newFilters.thisMonth = false;
    }
    
    setQuickFilters(newFilters);
    
    // Apply the quick filter
    const filters: ReportFilterParams = {};
    
    if (newFilters.warranty) {
      filters.isWarranty = true;
    }
    
    if (newFilters.thisMonth) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filters.dateDebut = firstDay.toISOString().split('T')[0];
      filters.dateFin = lastDay.toISOString().split('T')[0];
    }
    
    if (newFilters.lastMonth) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      filters.dateDebut = firstDay.toISOString().split('T')[0];
      filters.dateFin = lastDay.toISOString().split('T')[0];
    }
    
    if (newFilters.highValue) {
      filters.montantMin = 1000; // Define your threshold
    }
    
    if (newFilters.noClient) {
      filters.clientId = ''; // Empty means no client filter
    }
    
    onSearch(filters);
  };

  const getLastMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      debut: firstDay.toISOString().split('T')[0],
      fin: lastDay.toISOString().split('T')[0],
    };
  };

  const getThisMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      debut: firstDay.toISOString().split('T')[0],
      fin: lastDay.toISOString().split('T')[0],
    };
  };

  return (
    <FilterPanel elevation={0}>
      <FilterHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
            color: 'white',
          }}>
            <Tune fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2' }}>
              Filtres avancés
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Affinez votre recherche de rapports
            </Typography>
          </Box>
        </Box>
        <IconButton 
          onClick={() => setExpanded(!expanded)}
          sx={{ 
            color: '#1976d2',
            transition: 'transform 0.3s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <ExpandMore />
        </IconButton>
      </FilterHeader>

      <Collapse in={expanded}>
        <FilterContent>
          {/* Filtres rapides */}
          <FilterSection>
            <SectionTitle>
              <FilterList fontSize="small" />
              Filtres rapides
            </SectionTitle>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              <QuickFilterChip
                label="Sous garantie"
                color={quickFilters.warranty ? 'primary' : 'default'}
                variant={quickFilters.warranty ? 'filled' : 'outlined'}
                onClick={() => handleQuickFilter('warranty')}
                size="small"
              />
              <QuickFilterChip
                label="Ce mois-ci"
                color={quickFilters.thisMonth ? 'primary' : 'default'}
                variant={quickFilters.thisMonth ? 'filled' : 'outlined'}
                onClick={() => handleQuickFilter('thisMonth')}
                size="small"
              />
              <QuickFilterChip
                label="Mois dernier"
                color={quickFilters.lastMonth ? 'primary' : 'default'}
                variant={quickFilters.lastMonth ? 'filled' : 'outlined'}
                onClick={() => handleQuickFilter('lastMonth')}
                size="small"
              />
              <QuickFilterChip
                label="Montant élevé"
                color={quickFilters.highValue ? 'primary' : 'default'}
                variant={quickFilters.highValue ? 'filled' : 'outlined'}
                onClick={() => handleQuickFilter('highValue')}
                size="small"
              />
              <QuickFilterChip
                label="Sans client"
                color={quickFilters.noClient ? 'primary' : 'default'}
                variant={quickFilters.noClient ? 'filled' : 'outlined'}
                onClick={() => handleQuickFilter('noClient')}
                size="small"
              />
            </Stack>
          </FilterSection>

          <Divider sx={{ my: 3 }} />

          {/* Recherche principale */}
          <FilterSection>
            <SectionTitle>
              <Search fontSize="small" />
              Recherche générale
            </SectionTitle>
            <StyledTextField
              fullWidth
              label="Rechercher dans les rapports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Titre, client, intervention, etc."
              variant="outlined"
              InputProps={{
                startAdornment: <Search sx={{ color: 'rgba(0, 0, 0, 0.54)', mr: 1 }} />,
              }}
            />
          </FilterSection>

          {/* Filtres par entités */}
          <FilterSection>
            <SectionTitle>
              <Business fontSize="small" />
              Par entités
            </SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <StyledTextField
                  fullWidth
                  label="ID Client"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="ex: CLIENT-001"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Business sx={{ color: 'rgba(0, 0, 0, 0.54)', mr: 1, fontSize: 'small' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <StyledTextField
                  fullWidth
                  label="ID Intervention"
                  value={interventionId}
                  onChange={(e) => setInterventionId(e.target.value)}
                  placeholder="ex: INT-001"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Build sx={{ color: 'rgba(0, 0, 0, 0.54)', mr: 1, fontSize: 'small' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <StyledTextField
                  fullWidth
                  label="ID Technicien"
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  placeholder="ex: TECH-001"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Person sx={{ color: 'rgba(0, 0, 0, 0.54)', mr: 1, fontSize: 'small' }} />,
                  }}
                />
              </Grid>
            </Grid>
          </FilterSection>

          {/* Filtres par date et montant */}
          <FilterSection>
            <SectionTitle>
              <CalendarMonth fontSize="small" />
              Par période & montant
            </SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <StyledTextField
                  fullWidth
                  label="Date début"
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarMonth sx={{ color: 'rgba(0, 0, 0, 0.54)', mr: 1, fontSize: 'small' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StyledTextField
                  fullWidth
                  label="Date fin"
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarMonth sx={{ color: 'rgba(0, 0, 0, 0.54)', mr: 1, fontSize: 'small' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StyledTextField
                  fullWidth
                  label="Montant minimum"
                  type="number"
                  value={montantMin}
                  onChange={(e) => setMontantMin(e.target.value)}
                  placeholder="0"
                  variant="outlined"
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                    startAdornment: <Euro sx={{ color: 'rgba(0, 0, 0, 0.54)', mr: 1, fontSize: 'small' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StyledTextField
                  fullWidth
                  label="Montant maximum"
                  type="number"
                  value={montantMax}
                  onChange={(e) => setMontantMax(e.target.value)}
                  placeholder="10000"
                  variant="outlined"
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                    startAdornment: <Euro sx={{ color: 'rgba(0, 0, 0, 0.54)', mr: 1, fontSize: 'small' }} />,
                  }}
                />
              </Grid>
            </Grid>
          </FilterSection>

          {/* Filtres avancés */}
          <FilterSection>
            <SectionTitle>
              <Tune fontSize="small" />
              Options avancées
            </SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Garantie</InputLabel>
                  <Select
                    value={isWarranty}
                    label="Garantie"
                    onChange={(e) => setIsWarranty(e.target.value as string)}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="">Tous les rapports</MenuItem>
                    <MenuItem value="oui">Sous garantie</MenuItem>
                    <MenuItem value="non">Hors garantie</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                  <FilterButton
                    variant="outlined"
                    color="primary"
                    onClick={handleClear}
                    startIcon={<ClearAll />}
                    sx={{ minWidth: '140px' }}
                  >
                    Réinitialiser
                  </FilterButton>
                  <FilterButton
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                    startIcon={<Search />}
                    sx={{ minWidth: '140px' }}
                  >
                    Appliquer filtres
                  </FilterButton>
                </Box>
              </Grid>
            </Grid>
          </FilterSection>

          {/* Barre d'état des filtres actifs */}
          {(searchTerm || clientId || interventionId || technicianId || isWarranty || dateDebut || dateFin || montantMin || montantMax) && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Filtres actifs:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                {searchTerm && (
                  <Chip
                    label={`Recherche: "${searchTerm}"`}
                    size="small"
                    onDelete={() => setSearchTerm('')}
                  />
                )}
                {clientId && (
                  <Chip
                    label={`Client: ${clientId}`}
                    size="small"
                    onDelete={() => setClientId('')}
                  />
                )}
                {interventionId && (
                  <Chip
                    label={`Intervention: ${interventionId}`}
                    size="small"
                    onDelete={() => setInterventionId('')}
                  />
                )}
                {technicianId && (
                  <Chip
                    label={`Technicien: ${technicianId}`}
                    size="small"
                    onDelete={() => setTechnicianId('')}
                  />
                )}
                {isWarranty && (
                  <Chip
                    label={`Garantie: ${isWarranty === 'oui' ? 'Oui' : 'Non'}`}
                    size="small"
                    onDelete={() => setIsWarranty('')}
                  />
                )}
                {dateDebut && dateFin && (
                  <Chip
                    label={`Période: ${dateDebut} → ${dateFin}`}
                    size="small"
                    onDelete={() => { setDateDebut(''); setDateFin(''); }}
                  />
                )}
                {montantMin && (
                  <Chip
                    label={`Min: ${montantMin}€`}
                    size="small"
                    onDelete={() => setMontantMin('')}
                  />
                )}
                {montantMax && (
                  <Chip
                    label={`Max: ${montantMax}€`}
                    size="small"
                    onDelete={() => setMontantMax('')}
                  />
                )}
              </Stack>
            </Box>
          )}
        </FilterContent>
      </Collapse>

      {/* Version compacte (quand non expandé) */}
      {!expanded && (
        <FilterContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <StyledTextField
                fullWidth
                size="small"
                label="Recherche rapide..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Tapez pour filtrer..."
                variant="outlined"
                InputProps={{
                  startAdornment: <Search sx={{ color: 'rgba(0, 0, 0, 0.54)', mr: 1, fontSize: 'small' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Garantie</InputLabel>
                <Select
                  value={isWarranty}
                  label="Garantie"
                  onChange={(e) => setIsWarranty(e.target.value as string)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="oui">Oui</MenuItem>
                  <MenuItem value="non">Non</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FilterButton
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  size="small"
                  sx={{ flex: 1 }}
                >
                  <Search fontSize="small" sx={{ mr: 0.5 }} />
                  Filtrer
                </FilterButton>
                <FilterButton
                  variant="outlined"
                  color="primary"
                  onClick={handleClear}
                  size="small"
                >
                  <ClearAll fontSize="small" />
                </FilterButton>
              </Box>
            </Grid>
          </Grid>
        </FilterContent>
      )}
    </FilterPanel>
  );
};

export default ReportFilters;