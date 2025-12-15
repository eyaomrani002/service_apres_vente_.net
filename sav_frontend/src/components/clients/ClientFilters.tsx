import React, { useState } from 'react';
import { Box, TextField, Grid, Button, FormControlLabel, Checkbox } from '@mui/material';

interface Props {
  onSearch: (q: { searchTerm?: string; email?: string; avecReclamations?: boolean }) => void;
}

const ClientFilters: React.FC<Props> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [email, setEmail] = useState('');
  const [avecReclamations, setAvecReclamations] = useState(false);

  return (
    <Box mb={2}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={4}><TextField value={searchTerm} onChange={e => setSearchTerm(e.target.value)} label="Recherche" fullWidth /></Grid>
        <Grid item xs={12} sm={3}><TextField value={email} onChange={e => setEmail(e.target.value)} label="Email" fullWidth /></Grid>
        <Grid item xs={12} sm={3}><FormControlLabel control={<Checkbox checked={avecReclamations} onChange={e => setAvecReclamations(e.target.checked)} />} label="Avec réclamations" /></Grid>
        <Grid item xs={12} sm={2}><Button variant="contained" fullWidth onClick={() => onSearch({ searchTerm, email, avecReclamations })}>Rechercher</Button></Grid>
      </Grid>
    </Box>
  );
};

export default ClientFilters;
