// components/reporting/PDFGenerator.tsx
import React from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { PictureAsPdf, Download } from '@mui/icons-material';

interface PDFGeneratorProps {
  report: Report;
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ report }) => {
  const [loading, setLoading] = React.useState(false);

  const generatePDF = async () => {
    if (!report.id) return;
    
    setLoading(true);
    try {
      // Générer le PDF côté serveur
      const response = await fetch(`https://localhost:7076/apigateway/reports/${report.id}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-${report.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Erreur lors de la génération du PDF');
      }
    } catch (error) {
      console.error('Erreur PDF:', error);
      alert('Impossible de générer le PDF');
    } finally {
      setLoading(false);
    }
  };

  const viewPDF = () => {
    if (report.url) {
      window.open(report.url, '_blank');
    } else {
      generatePDF();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Tooltip title="Voir le PDF">
        <Button
          variant="outlined"
          size="small"
          startIcon={<PictureAsPdf />}
          onClick={viewPDF}
          disabled={loading}
        >
          {loading ? <CircularProgress size={16} /> : 'PDF'}
        </Button>
      </Tooltip>
      <Tooltip title="Télécharger">
        <Button
          variant="contained"
          size="small"
          color="primary"
          startIcon={<Download />}
          onClick={generatePDF}
          disabled={loading}
        >
          Télécharger
        </Button>
      </Tooltip>
    </div>
  );
};