import React from 'react';
import { Typography, Box, Breadcrumbs, Link } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, breadcrumbs }) => {
  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 2 }}
        >
          {breadcrumbs.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              color={item.href ? 'primary' : 'text.primary'}
              sx={{ textDecoration: 'none' }}
            >
              {item.label}
            </Link>
          ))}
        </Breadcrumbs>
      )}
      
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default PageTitle;