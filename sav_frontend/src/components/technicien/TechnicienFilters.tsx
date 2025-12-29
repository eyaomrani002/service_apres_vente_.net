
import React from 'react';
import { Box, TextField, Button, MenuItem, Select, InputLabel, FormControl, Grid, Paper, Typography } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

interface TechnicienFiltersProps {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
  onReset: () => void;
}

const TechnicienFilters: React.FC<TechnicienFiltersProps> = ({ filters, onChange, onReset }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    onChange({ ...filters, [name]: value });
  };

  const disponibiliteOptions = [
    { value: '', label: 'Tous' },
    { value: 'Disponible', label: 'Disponible' },
    { value: 'Occupé', label: 'Occupé' },
    { value: 'Indisponible', label: 'Indisponible' },
  ];

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'text.secondary' }}>
        <FilterListIcon sx={{ mr: 1 }} />
        <Box component="span" sx={{ fontWeight: 'medium' }}>Filtres</Box>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Rechercher par nom"
            name="nom"
            value={filters.nom || ''}
            onChange={handleChange}
            variant="outlined"
            size="small"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Zone"
            name="zone"
            value={filters.zone || ''}
            onChange={handleChange}
            variant="outlined"
            size="small"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl size="small" fullWidth>
            <InputLabel>Disponibilité</InputLabel>
            <Select
              name="disponibilite"
              value={filters.disponibilite || ''}
              onChange={handleChange}
              label="Disponibilité"
            >
              {disponibiliteOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={onReset}
              fullWidth
            >
              Réinitialiser
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default TechnicienFilters;