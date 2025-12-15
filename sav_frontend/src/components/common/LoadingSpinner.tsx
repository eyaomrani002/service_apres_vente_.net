import React from 'react';
import { CircularProgress, Box } from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 40, fullScreen = false }) => {
  const spinner = (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: fullScreen ? '100vh' : '100%',
      }}
    >
      <CircularProgress size={size} />
    </Box>
  );

  return spinner;
};

export default LoadingSpinner;