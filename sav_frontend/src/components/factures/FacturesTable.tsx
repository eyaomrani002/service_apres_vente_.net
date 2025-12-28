import React, { useState } from 'react';
import { Facture } from '../../types/facture';
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
import { Visibility, CheckCircle, Edit, Delete } from '@mui/icons-material';

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
  factures: Facture[];
  onView: (facture: Facture) => void;
  onMarkPaid: (facture: Facture) => void;
  onEdit?: (facture: Facture) => void;
  onDelete?: (facture: Facture) => void;
}

const FacturesTable: React.FC<Props> = ({ factures, onView, onMarkPaid, onEdit, onDelete }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const paginated = factures.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <StyledTableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Facture</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Intervention</TableCell>
              <TableCell align="right">Montant TTC</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    Aucune facture à afficher
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((facture) => {
                const isPaid = facture.statut?.toLowerCase() === 'payée';
                return (
                  <TableRow key={facture.id}>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {facture.numeroFacture}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        #{facture.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {facture.clientNom}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {facture.clientEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">Intervention #{facture.interventionId}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(facture.montantTTC)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(facture.dateFacture).toLocaleDateString('fr-FR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        size="small"
                        label={facture.statut}
                        sx={{
                          background: isPaid ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 152, 0, 0.15)',
                          color: isPaid ? '#4CAF50' : '#FF9800',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Voir le détail">
                        <IconButton size="small" onClick={() => onView(facture)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {onEdit && (
                        <Tooltip title="Modifier">
                          <IconButton size="small" onClick={() => onEdit(facture)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!isPaid && (
                        <Tooltip title="Marquer comme payée">
                          <IconButton size="small" onClick={() => onMarkPaid(facture)}>
                            <CheckCircle fontSize="small" color="success" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip title="Supprimer">
                          <IconButton size="small" onClick={() => onDelete(facture)}>
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
        count={factures.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
        labelRowsPerPage="Lignes par page"
      />
    </Box>
  );
};

export default FacturesTable;