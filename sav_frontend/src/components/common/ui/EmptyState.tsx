import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add, SearchOff } from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <SearchOff sx={{ fontSize: 64, color: 'text.secondary' }} />,
  actionLabel,
  onAction,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        textAlign: 'center',
      }}
    >
      {icon}
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;