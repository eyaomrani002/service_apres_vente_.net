import React, { useState } from 'react';
import { Box, TextField, Grid, Button } from '@mui/material';

interface Props {
  onSearch: (q: { searchTerm?: string; type?: string }) => void;
}

const ArticleFilters: React.FC<Props> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [type, setType] = useState('');

  return (
    <Box mb={2}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={5}>
          <TextField value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} label="Recherche (réf/nom)" fullWidth />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField value={type} onChange={(e) => setType(e.target.value)} label="Type" fullWidth />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Button variant="contained" onClick={() => onSearch({ searchTerm, type })} fullWidth>Rechercher</Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ArticleFilters;
