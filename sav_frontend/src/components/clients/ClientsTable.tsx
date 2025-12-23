// ClientsTable.tsx - Version modernisée
import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Tooltip, Chip, Avatar, Box, Typography,
  TablePagination, TableSortLabel
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Edit, Delete, Visibility, Email, Phone, Place, TrendingUp } from '@mui/icons-material';
import { Client } from '../../types/client';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

// Styled Components
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid rgba(33, 150, 243, 0.1)',
  animation: `${fadeIn} 0.6s ease`,
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(0, 188, 212, 0.08) 100%)',
  '& th': {
    fontWeight: 700,
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#2196F3',
    padding: '16px',
    borderBottom: '2px solid rgba(33, 150, 243, 0.2)',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'all 0.3s ease',
  animation: `${slideIn} 0.5s ease`,
  '&:hover': {
    backgroundColor: 'rgba(33, 150, 243, 0.04)',
    transform: 'scale(1.01)',
    boxShadow: '0 4px 20px rgba(33, 150, 243, 0.08)',
  },
  '& td': {
    padding: '16px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.15)',
  },
  '&.view': {
    color: '#2196F3',
    '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' },
  },
  '&.edit': {
    color: '#00BCD4',
    '&:hover': { backgroundColor: 'rgba(0, 188, 212, 0.1)' },
  },
  '&.delete': {
    color: '#f44336',
    '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' },
  },
}));

const ClientAvatar = styled(Avatar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
  fontWeight: 700,
  width: 40,
  height: 40,
  fontSize: '16px',
}));

interface Props {
  clients: Client[];
  onEdit: (c: Client) => void;
  onDelete: (id: number) => void;
  onView?: (c: Client) => void;
}

const ClientsTable: React.FC<Props> = ({ clients, onEdit, onDelete, onView }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Client>('nom');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (property: keyof Client) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedClients = [...clients].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return order === 'asc' 
      ? (aValue as any) - (bValue as any)
      : (bValue as any) - (aValue as any);
  });

  const paginatedClients = sortedClients.slice(
    page * rowsPerPage, 
    page * rowsPerPage + rowsPerPage
  );

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <Box>
      <StyledTableContainer component={Paper} elevation={0}>
        <Table>
          <StyledTableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'email'}
                  direction={orderBy === 'email' ? order : 'asc'}
                  onClick={() => handleSort('email')}
                >
                  Contact
                </TableSortLabel>
              </TableCell>
              <TableCell>Adresse</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'dateInscription'}
                  direction={orderBy === 'dateInscription' ? order : 'asc'}
                  onClick={() => handleSort('dateInscription')}
                >
                  Inscription
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">Réclamations</TableCell>
              <TableCell align="center">Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {paginatedClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    Aucun client trouvé
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedClients.map((client, index) => (
                <StyledTableRow 
                  key={client.id}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ClientAvatar>
                        {getInitials(client.nom)}
                      </ClientAvatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                          {client.nom}
                        </Typography>
                        {client.nombreReclamations !== undefined && client.nombreReclamations > 0 && (
                          <Chip 
                            size="small" 
                            label={`${client.nombreReclamations} réclamation${client.nombreReclamations > 1 ? 's' : ''}`}
                            sx={{ 
                              height: '20px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                              color: '#2196F3',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {client.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Email sx={{ fontSize: 16, color: '#00BCD4' }} />
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {client.email}
                          </Typography>
                        </Box>
                      )}
                      {client.telephone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone sx={{ fontSize: 16, color: '#2196F3' }} />
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {client.telephone}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {client.adresse ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Place sx={{ fontSize: 16, color: '#9e9e9e' }} />
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {client.adresse}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.dateInscription ? (
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {new Date(client.dateInscription).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={client.nombreReclamations ?? 0}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        background: client.nombreReclamations && client.nombreReclamations > 0
                          ? 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)'
                          : 'rgba(0, 0, 0, 0.08)',
                        color: client.nombreReclamations && client.nombreReclamations > 0 ? '#fff' : '#666',
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {client.reclamationsEnCours !== undefined && client.reclamationsEnCours > 0 ? (
                      <Chip 
                        label="Actif"
                        size="small"
                        icon={<TrendingUp sx={{ fontSize: '16px !important' }} />}
                        sx={{
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                          color: '#fff',
                        }}
                      />
                    ) : (
                      <Chip 
                        label="Inactif"
                        size="small"
                        sx={{
                          fontWeight: 600,
                          backgroundColor: 'rgba(0, 0, 0, 0.08)',
                          color: '#666',
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="Voir les détails" arrow>
                        <ActionButton 
                          size="small" 
                          className="view"
                          onClick={() => onView && onView(client)}
                        >
                          <Visibility fontSize="small" />
                        </ActionButton>
                      </Tooltip>
                      <Tooltip title="Modifier" arrow>
                        <ActionButton 
                          size="small" 
                          className="edit"
                          onClick={() => onEdit(client)}
                        >
                          <Edit fontSize="small" />
                        </ActionButton>
                      </Tooltip>
                      <Tooltip title="Supprimer" arrow>
                        <ActionButton 
                          size="small" 
                          className="delete"
                          onClick={() => onDelete(client.id)}
                        >
                          <Delete fontSize="small" />
                        </ActionButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={clients.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Lignes par page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        sx={{
          mt: 2,
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          '& .MuiTablePagination-select': {
            borderRadius: '8px',
          },
        }}
      />
    </Box>
  );
};

export default ClientsTable;