import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import PageTitle from '../../components/common/PageTitle';

const InterventionsPage: React.FC = () => {
  return (
    <Box>
      <PageTitle title="Interventions" subtitle="Liste des interventions" />
      <Paper sx={{ p: 3 }}>
        <Typography>Aucune donnée — page de démonstration</Typography>
      </Paper>
    </Box>
  );
};

export default InterventionsPage;
