import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import type { SvgIconTypeMap } from '@mui/material';
import type { OverridableComponent } from '@mui/material/OverridableComponent';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: OverridableComponent<SvgIconTypeMap<{}, "svg">>;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  subtitle,
  trend,
}) => {
  const colors = {
    primary: '#1976d2',
    secondary: '#9c27b0',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1',
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
            
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography
                  variant="body2"
                  color={trend.isPositive ? 'success.main' : 'error.main'}
                >
                  {trend.isPositive ? '+' : '-'}{trend.value}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  vs mois dernier
                </Typography>
              </Box>
            )}
          </Box>
          
          <Box
            sx={{
              backgroundColor: `${colors[color]}15`,
              borderRadius: '50%',
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 28, color: colors[color] }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;