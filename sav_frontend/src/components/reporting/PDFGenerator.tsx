// components/reporting/PDFGenerator.tsx
import React from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { PictureAsPdf, Download } from '@mui/icons-material';
import { Report } from '../../types/report';

interface PDFGeneratorProps {
  report: Report;
}

const API_BASE = (
  (import.meta.env.VITE_API_GATEWAY_BASE as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'https://localhost:7076/apigateway'
).replace(/\/$/, '');

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ report }) => {
  const [loading, setLoading] = React.useState(false);

  // Utiliser l'endpoint GET /reports/{id}/pdf exposé par la gateway
  const buildGatewayPdfUrl = (id: string) => `${API_BASE}/reports/${id}/pdf`;

  const isValidHttpUrl = (maybeUrl?: string) => {
    if (!maybeUrl) return false;
    try {
      const u = new URL(maybeUrl);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const downloadBlob = async (targetUrl: string, filename: string, asDownload = true) => {
    const response = await fetch(targetUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token') || ''}`,
      },
    });

    if (response.status === 499) {
      throw new Error('Le téléchargement du PDF a été interrompu (499). Merci de réessayer.');
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Erreur lors du téléchargement du PDF');
    }

    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error('PDF indisponible ou vide.');
    }

    const url = window.URL.createObjectURL(blob);
    if (asDownload) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      window.open(url, '_blank');
      // Donne un peu de temps avant de libérer l'URL pour laisser le navigateur ouvrir l'onglet
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    }
  };

  const generatePDF = async () => {
    if (!report.id) return;
    
    setLoading(true);
    try {
      // Générer le PDF côté serveur puis le télécharger
      const response = await fetch(buildGatewayPdfUrl(report.id), {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token') || ''}`,
        },
      });
      
      if (response.status === 499) {
        throw new Error('La génération du PDF a été interrompue (499). Merci de réessayer.');
      }
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Erreur lors de la génération du PDF');
      }

      // Certaines implémentations retournent directement le blob, d'autres une URL
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/pdf')) {
        const blob = await response.blob();
        if (!blob || blob.size === 0) throw new Error('PDF généré mais vide.');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-${report.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Si l'API renvoie une URL, la télécharger
        const result = await response.text();
        const downloadUrl = result || report.url;
        if (!downloadUrl) throw new Error('PDF généré mais aucune URL fournie.');
        await downloadBlob(downloadUrl, `rapport-${report.id}.pdf`);
      }
    } catch (error: any) {
      console.error('Erreur PDF:', error);
      alert(error?.message || 'Impossible de générer le PDF');
    } finally {
      setLoading(false);
    }
  };

  const viewPDF = async () => {
    if (!report.id) return;
    setLoading(true);
    try {
      if (isValidHttpUrl(report.url) && !report.url?.includes('.local')) {
        await downloadBlob(report.url, `rapport-${report.id}.pdf`, false);
      } else {
        await generatePDF();
      }
    } catch (error: any) {
      console.error('Erreur ouverture PDF:', error);
      alert(error?.message || "Impossible d'ouvrir le PDF");
    } finally {
      setLoading(false);
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

export default PDFGenerator;