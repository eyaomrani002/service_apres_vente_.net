import React from 'react';
import { Report } from '../../types/report';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  TablePagination,
  Box,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Visibility, Edit, Delete, PictureAsPdf, Person, Build, Business } from '@mui/icons-material';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid rgba(33, 150, 243, 0.12)',
  animation: `${fadeIn} 0.6s ease`,
  backgroundColor: '#fff',
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  fontWeight: 700,
  borderRadius: '14px',
  height: '28px',
  fontSize: '12px',
  textTransform: 'uppercase',
}));

interface Props {
  reports: Report[];
  onView: (report: Report) => void;
  onEdit?: (report: Report) => void;
  onDelete?: (report: Report) => void;
}

const ReportsTable: React.FC<Props> = ({ reports, onView, onEdit, onDelete }) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [loadingPdfId, setLoadingPdfId] = React.useState<string | null>(null);

  const API_BASE = React.useMemo(() => (
    (import.meta.env.VITE_API_GATEWAY_BASE as string | undefined) ||
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
    'https://localhost:7076/apigateway'
  ).replace(/\/$/, ''), []);

  // Gateway maps both /generate-pdf and /pdf to the same backend GET endpoint; prefer the concrete /pdf path
  const buildGatewayPdfUrl = (id: string) => `${API_BASE}/reports/${id}/pdf`;

  const isValidHttpUrl = (maybeUrl?: string) => {
    if (!maybeUrl) return false;
    try {
      const u = new URL(maybeUrl);
      return (u.protocol === 'http:' || u.protocol === 'https:') && !u.hostname.endsWith('.local');
    } catch {
      return false;
    }
  };

  const openPdf = async (report: Report) => {
    if (!report.id) return;
    setLoadingPdfId(report.id);
    try {
      if (isValidHttpUrl(report.url)) {
        window.open(report.url as string, '_blank');
        return;
      }

      const response = await fetch(buildGatewayPdfUrl(report.id), {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        // Si 404, tenter l'URL existante si elle est valide
        if (response.status === 404) {
          if (isValidHttpUrl(report.url)) {
            window.open(report.url as string, '_blank');
            return;
          }
          alert('PDF non disponible pour ce rapport (404).');
          return;
        }
        throw new Error(text || `Erreur PDF (${response.status})`);
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) throw new Error('PDF vide ou indisponible');

      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    } catch (err: any) {
      console.error('Erreur PDF tableau:', err);
      alert(err?.message || 'Impossible d\'ouvrir le PDF');
    } finally {
      setLoadingPdfId(null);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedReports = reports.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const truncateId = (id?: string) => {
    if (!id) return 'N/A';
    return id.length > 8 ? `${id.substring(0, 8)}...` : id;
  };

  return (
    <Box>
      <StyledTableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titre / ID</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Intervention</TableCell>
              <TableCell>Technicien</TableCell>
              <TableCell align="right">Montant</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    Aucun rapport à afficher
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedReports.map((report) => {
                const isWarranty = report.isWarranty;
                return (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {report.title || `Rapport ${truncateId(report.id)}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        #{truncateId(report.id)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={<Business fontSize="small" />}
                        label={truncateId(report.clientId)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={<Build fontSize="small" />}
                        label={truncateId(report.interventionId)}
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={<Person fontSize="small" />}
                        label={truncateId(report.technicianId)}
                        variant="outlined"
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {formatCurrency(report.total || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        size="small"
                        label={isWarranty ? 'Garantie' : 'Standard'}
                        sx={{
                          background: isWarranty ? 'rgba(255, 152, 0, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                          color: isWarranty ? '#FF9800' : '#4CAF50',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(report.generatedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Voir le PDF">
                        <span>
                          <IconButton 
                            size="small"
                            onClick={(e) => { e.stopPropagation(); openPdf(report); }}
                            disabled={loadingPdfId === report.id}
                          >
                            <PictureAsPdf fontSize="small" color="error" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Voir le détail">
                        <IconButton size="small" onClick={() => onView(report)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {onEdit && (
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => onEdit(report)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip title="Supprimer">
                          <IconButton size="small" onClick={() => onDelete(report)}>
                            <Delete fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>

      <TablePagination
        component="div"
        count={reports.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage="Lignes par page"
      />
    </Box>
  );
};

export default ReportsTable;