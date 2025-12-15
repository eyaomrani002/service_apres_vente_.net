import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import PageTitle from '../../components/common/PageTitle';

const ReclamationsPage: React.FC = () => {
  return (
    <Box>
      <PageTitle title="Réclamations" subtitle="Liste des réclamations" />
      <Paper sx={{ p: 3 }}>
        <Typography>Aucune donnée — page de démonstration</Typography>
      </Paper>
    </Box>
  );
};

export default ReclamationsPage;
