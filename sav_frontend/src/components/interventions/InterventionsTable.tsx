// InterventionsTable.tsx - Version modernisée
import React, { useState, useContext } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Tooltip, Chip, Avatar, Box, Typography,
  TablePagination, TableSortLabel
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Edit, Delete, Visibility, CalendarToday, Person, Build, Paid, Assignment, CheckCircle, ReceiptLong, Schedule } from '@mui/icons-material';
import { Intervention } from '../../types/intervention';

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
  border: '1px solid rgba(255, 152, 0, 0.1)',
  animation: `${fadeIn} 0.6s ease`,
  backgroundColor: '#fff',
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(255, 193, 7, 0.08) 100%)',
  '& th': {
    fontWeight: 700,
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#FF9800',
    padding: '16px',
    borderBottom: '2px solid rgba(255, 152, 0, 0.2)',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'all 0.3s ease',
  animation: `${slideIn} 0.5s ease`,
  '&:hover': {
    backgroundColor: 'rgba(255, 152, 0, 0.04) !important',
    transform: 'scale(1.01)',
    boxShadow: '0 4px 20px rgba(255, 152, 0, 0.08)',
    '& td': {
      borderColor: 'rgba(255, 152, 0, 0.1)',
    },
  },
  '&:nth-of-type(even)': {
    backgroundColor: 'rgba(255, 152, 0, 0.02)',
  },
  '& td': {
    padding: '16px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.15)',
  },
  '&.view': {
    color: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    '&:hover': { 
      backgroundColor: 'rgba(255, 152, 0, 0.15)',
      boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)',
    },
  },
  '&.edit': {
    color: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
    '&:hover': { 
      backgroundColor: 'rgba(33, 150, 243, 0.15)',
      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)',
    },
  },
  '&.delete': {
    color: '#f44336',
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    '&:hover': { 
      backgroundColor: 'rgba(244, 67, 54, 0.15)',
      boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)',
    },
  },
}));

const TechnicienAvatar = styled(Avatar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
  fontWeight: 700,
  width: 40,
  height: 40,
  fontSize: '16px',
  boxShadow: '0 4px 8px rgba(255, 152, 0, 0.2)',
}));

const StatusChip = styled(Chip)(({ theme, color }: any) => ({
  fontWeight: 700,
  height: '28px',
  backgroundColor: color || '#9E9E9E',
  color: '#fff',
  '& .MuiChip-label': {
    paddingLeft: '10px',
    paddingRight: '10px',
    fontSize: '12px',
  },
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}));

const CostBadge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 12px',
  borderRadius: '12px',
  fontWeight: 700,
  fontSize: '14px',
  transition: 'all 0.3s ease',
  '&.gratuit': {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#4CAF50',
    border: '1px solid rgba(76, 175, 80, 0.2)',
  },
  '&.payant': {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    color: '#FF9800',
    border: '1px solid rgba(255, 152, 0, 0.2)',
  },
}));

const SortLabel = styled(TableSortLabel)(({ theme }) => ({
  '&.MuiTableSortLabel-root:hover': {
    color: '#FF9800',
  },
  '&.MuiTableSortLabel-root.Mui-active': {
    color: '#FF9800',
  },
  '& .MuiTableSortLabel-icon': {
    color: '#FF9800 !important',
  },
}));

interface Props {
  items: Intervention[];
  onEdit: (i: Intervention) => void;
  onDelete: (id: number) => void;
  onView?: (i: Intervention) => void;
  onChangeStatus?: (id: number, statut: string) => void;
  onGenerateInvoice?: (id: number) => void;
}

import AuthContext from '../../contexts/AuthContext';

const InterventionsTable: React.FC<Props> = ({ items, onEdit, onDelete, onView, onChangeStatus, onGenerateInvoice }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Intervention>('dateIntervention');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (property: keyof Intervention) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedItems = [...items].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    if (orderBy === 'dateIntervention') {
      const aDate = new Date(aValue as string).getTime();
      const bDate = new Date(bValue as string).getTime();
      return order === 'asc' ? aDate - bDate : bDate - aDate;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const paginatedItems = sortedItems.slice(
    page * rowsPerPage, 
    page * rowsPerPage + rowsPerPage
  );

  // Auth and roles
  const auth = useContext(AuthContext as any);
  const currentUser = auth?.user;
  const isAdmin = auth?.hasRole?.('admin');
  const isResponsable = auth?.hasRole?.('responsablesav') || auth?.hasRole?.('responsable');
  const isTechnicien = auth?.hasRole?.('technicien');

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (statut: string) => {
    switch(statut.toLowerCase()) {
      case 'terminée': return '#4CAF50';
      case 'en cours': return '#2196F3';
      case 'planifiée': return '#FF9800';
      case 'annulée': return '#f44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch(statut.toLowerCase()) {
      case 'terminée': return '✅';
      case 'en cours': return '⚙️';
      case 'planifiée': return '📅';
      case 'annulée': return '❌';
      default: return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCost = (cost: number | null | undefined) => {
    if (cost === null || cost === undefined || cost === 0) return '0 €';
    return `${cost.toFixed(2)} €`;
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? `${mins}m` : ''}`;
  };

  const getDescriptionPreview = (description?: string) => {
    if (!description) return '';
    return description.length > 50 
      ? `${description.substring(0, 50)}...`
      : description;
  };

  return (
    <Box>
      <StyledTableContainer component={Paper} elevation={0}>
        <Table>
          <StyledTableHead>
            <TableRow>
              <TableCell width="250px">
                <SortLabel
                  active={orderBy === 'technicienNom'}
                  direction={orderBy === 'technicienNom' ? order : 'asc'}
                  onClick={() => handleSort('technicienNom')}
                >
                  Technicien
                </SortLabel>
              </TableCell>
              <TableCell>
                <SortLabel
                  active={orderBy === 'dateIntervention'}
                  direction={orderBy === 'dateIntervention' ? order : 'asc'}
                  onClick={() => handleSort('dateIntervention')}
                >
                  Date & Description
                </SortLabel>
              </TableCell>
              <TableCell align="center" width="120px">
                <SortLabel
                  active={orderBy === 'statut'}
                  direction={orderBy === 'statut' ? order : 'asc'}
                  onClick={() => handleSort('statut')}
                >
                  Statut
                </SortLabel>
              </TableCell>
              <TableCell align="right" width="140px">
                <SortLabel
                  active={orderBy === 'coutTotal'}
                  direction={orderBy === 'coutTotal' ? order : 'asc'}
                  onClick={() => handleSort('coutTotal')}
                >
                  Coût
                </SortLabel>
              </TableCell>
              <TableCell align="right" width="160px">
                Actions
              </TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <StyledTableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Build sx={{ fontSize: 48, color: 'rgba(0, 0, 0, 0.12)', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Aucune intervention trouvée
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Créez votre première intervention en cliquant sur "Nouvelle intervention"
                    </Typography>
                  </Box>
                </TableCell>
              </StyledTableRow>
            ) : (
              paginatedItems.map((intervention, index) => (
                <StyledTableRow 
                  key={intervention.id}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <TechnicienAvatar>
                        {getInitials(intervention.technicienNom)}
                      </TechnicienAvatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
                          {intervention.technicienNom}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person sx={{ fontSize: 14, color: '#2196F3' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            ID: {intervention.technicienId}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <Assignment sx={{ fontSize: 12, color: '#9e9e9e' }} />
                          <Typography variant="caption" color="text.secondary">
                            Réclamation #{intervention.reclamationId}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarToday sx={{ fontSize: 16, color: '#FF9800' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#666' }}>
                          {formatDate(intervention.dateIntervention)}
                        </Typography>
                      </Box>
                      
                      {intervention.description && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666', 
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.4,
                          }}
                        >
                          {getDescriptionPreview(intervention.description)}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {intervention.dureeMinutes && intervention.dureeMinutes > 0 && (
                          <Chip 
                            label={formatDuration(intervention.dureeMinutes)}
                            size="small"
                            sx={{
                              height: '22px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: 'rgba(156, 39, 176, 0.1)',
                              color: '#9C27B0',
                            }}
                          />
                        )}
                        
                        {intervention.solutionApportee && (
                          <Chip 
                            label="Solution"
                            size="small"
                            sx={{
                              height: '22px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: 'rgba(76, 175, 80, 0.1)',
                              color: '#4CAF50',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <StatusChip 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{getStatusIcon(intervention.statut)}</span>
                            <span>{intervention.statut}</span>
                          </Box>
                        }
                        color={getStatusColor(intervention.statut)}
                        size="small"
                      />
                      
                      {intervention.estGratuite && (
                        <Chip 
                          label="GRATUIT"
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '10px',
                            fontWeight: 800,
                            backgroundColor: '#4CAF50',
                            color: '#fff',
                            letterSpacing: '0.5px',
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ textAlign: 'right' }}>
                      <CostBadge className={intervention.estGratuite ? 'gratuit' : 'payant'}>
                        <Paid sx={{ 
                          fontSize: 16, 
                          mr: 0.5,
                          color: intervention.estGratuite ? '#4CAF50' : '#FF9800'
                        }} />
                        <Typography variant="body1" sx={{ fontWeight: 800 }}>
                          {formatCost(intervention.coutTotal)}
                        </Typography>
                      </CostBadge>
                      
                      {!intervention.estGratuite && intervention.coutTotal && intervention.coutTotal > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Pièces: {formatCost(intervention.coutPieces)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Main d'œuvre: {formatCost(intervention.coutMainOeuvre)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Voir les détails" arrow>
                        <ActionButton 
                          size="small" 
                          className="view"
                          onClick={() => onView && onView(intervention)}
                        >
                          <Visibility fontSize="small" />
                        </ActionButton>
                      </Tooltip>
                      {/* Change status: allowed for admin/responsable or assigned technicien */}
                      {onChangeStatus && (isAdmin || isResponsable || (isTechnicien && Number(currentUser?.id) === intervention.technicienId)) && (
                        <> 
                          {intervention.statut !== 'En cours' && (
                            <Tooltip title="Passer en cours" arrow>
                              <ActionButton size="small" className="edit" onClick={() => onChangeStatus(intervention.id, 'En cours')}>
                                <Schedule fontSize="small" />
                              </ActionButton>
                            </Tooltip>
                          )}
                          {intervention.statut !== 'Terminée' && (
                            <Tooltip title="Marquer terminée" arrow>
                              <ActionButton size="small" className="edit" onClick={() => onChangeStatus(intervention.id, 'Terminée')}>
                                <CheckCircle fontSize="small" color="success" />
                              </ActionButton>
                            </Tooltip>
                          )}
                        </>
                      )}

                      {/* Generate invoice: only responsable or admin */}
                      {onGenerateInvoice && (isAdmin || isResponsable) && (
                        <Tooltip title="Générer facture" arrow>
                          <ActionButton size="small" className="view" onClick={() => onGenerateInvoice(intervention.id)}>
                            <ReceiptLong fontSize="small" />
                          </ActionButton>
                        </Tooltip>
                      )}

                      {/* Edit: admin/responsable or assigned technicien can edit */}
                      {(isAdmin || isResponsable || (isTechnicien && Number(currentUser?.id) === intervention.technicienId)) && (
                        <Tooltip title="Modifier" arrow>
                          <ActionButton 
                            size="small" 
                            className="edit"
                            onClick={() => onEdit(intervention)}
                          >
                            <Edit fontSize="small" />
                          </ActionButton>
                        </Tooltip>
                      )}

                      {/* Delete: only admin or responsable */}
                      {(isAdmin || isResponsable) && (
                        <Tooltip title="Supprimer" arrow>
                          <ActionButton 
                            size="small" 
                            className="delete"
                            onClick={() => onDelete(intervention.id)}
                          >
                            <Delete fontSize="small" />
                          </ActionButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
      
      {items.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={items.length}
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
            borderTop: '1px solid rgba(255, 152, 0, 0.1)',
            '& .MuiTablePagination-select': {
              borderRadius: '8px',
              padding: '4px 12px',
            },
            '& .MuiTablePagination-actions button': {
              borderRadius: '8px',
            },
          }}
        />
      )}
    </Box>
  );
};

export default InterventionsTable;