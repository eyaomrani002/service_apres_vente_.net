// ReclamationsTable.tsx - Version complète avec gestion des permissions
import React, { useState, useContext } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Tooltip, Chip, Box, Typography,
  TablePagination, TableSortLabel, Avatar
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { 
  Edit, Delete, Visibility, CalendarToday, Person,
  PriorityHigh, TrendingUp, Schedule, CheckCircle
} from '@mui/icons-material';
import { Reclamation } from '../../types/reclamation';
import AuthContext from '../../contexts/AuthContext';

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
    transform: 'scale(1.005)',
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

const IDAvatar = styled(Avatar)(({ theme }) => ({
  width: 36,
  height: 36,
  fontSize: '14px',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #2196F3 0%, #00BCD4 100%)',
}));

const ClientAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  fontSize: '12px',
  fontWeight: 600,
  background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
}));

interface Props {
  items: Reclamation[];
  onEdit: (r: Reclamation) => void;
  onDelete: (id: number) => void;
  onView?: (r: Reclamation) => void;
  canEditDelete?: boolean;
  currentUserId?: number | null;
  showClientInfo?: boolean;
}

const ReclamationsTable: React.FC<Props> = ({ 
  items, 
  onEdit, 
  onDelete, 
  onView, 
  canEditDelete = true,
  currentUserId = null,
  showClientInfo = true
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Reclamation>('dateCreation');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // Utiliser AuthContext pour déterminer le rôle
  const auth = useContext(AuthContext);
  const isAdmin = auth.hasRole('admin');
  const currentUser = auth.user;

  const handleSort = (property: keyof Reclamation) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filtrer les items si nécessaire (pour les utilisateurs normaux)
  const filteredItems = items.filter(item => {
    if (isAdmin) return true; // admin voit tout

    const userId = currentUserId || (currentUser?.id ? Number(currentUser.id) : null);
    if (!userId) return false; // sans user connu, rien afficher

    return item.clientId === userId;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return order === 'asc' 
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }
    
    return order === 'asc' 
      ? (aValue as any) - (bValue as any)
      : (bValue as any) - (aValue as any);
  });

  const paginatedItems = sortedItems.slice(
    page * rowsPerPage, 
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (statut?: string): 'success' | 'warning' | 'info' | 'error' | 'default' => {
    switch(statut?.toLowerCase()) {
      case 'résolu': case 'resolue': return 'success';
      case 'en cours': case 'en_cours': return 'warning';
      case 'en attente': case 'nouvelle': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priorite?: string) => {
    switch(priorite?.toLowerCase()) {
      case 'haute': case 'urgente': return '#f44336';
      case 'moyenne': return '#FF9800';
      case 'basse': case 'faible': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const formatStatus = (statut?: string) => {
    const statusMap: Record<string, string> = {
      'resolue': 'Résolue',
      'en_cours': 'En cours',
      'nouvelle': 'Nouvelle',
      'en attente': 'En attente',
      'résolu': 'Résolu',
      'résolue': 'Résolue',
    };
    return statusMap[statut?.toLowerCase() || ''] || statut || '-';
  };

  const getPriorityIcon = (priorite?: string) => {
    switch(priorite?.toLowerCase()) {
      case 'haute': case 'urgente': return '🔴';
      case 'moyenne': return '🟡';
      case 'basse': case 'faible': return '🟢';
      default: return '⚪';
    }
  };

  const canUserEditDelete = (item: Reclamation) => {
    // Si admin, peut tout faire
    if (isAdmin) return true;
    
    // Si utilisateur normal, vérifier si c'est sa réclamation
    const userId = currentUserId || (currentUser?.id ? Number(currentUser.id) : null);
    if (userId && item.clientId === userId) {
      return true;
    }
    
    return false;
  };

  // Fonction pour obtenir les initiales du client
  const getClientInitials = (clientId?: number) => {
    if (!clientId) return '??';
    return `C${clientId}`;
  };

  // Fonction pour afficher le nom du client
  const getClientDisplay = (item: Reclamation) => {
    if (!showClientInfo) return 'Mon compte';
    
    if (isAdmin) {
      return `Client #${item.clientId ?? '-'}`;
    } else {
      // Pour l'utilisateur normal, vérifier si c'est sa réclamation
      const userId = currentUserId || (currentUser?.id ? Number(currentUser.id) : null);
      if (userId && item.clientId === userId) {
        return 'Mon compte';
      } else {
        return `Client #${item.clientId ?? '-'}`;
      }
    }
  };

  return (
    <Box>
      <StyledTableContainer component={Paper} elevation={0}>
        <Table>
          <StyledTableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'sujet'}
                  direction={orderBy === 'sujet' ? order : 'asc'}
                  onClick={() => handleSort('sujet')}
                >
                  Réclamation
                </TableSortLabel>
              </TableCell>
              {showClientInfo && <TableCell>Client</TableCell>}
              <TableCell align="center">Priorité</TableCell>
              <TableCell align="center">Statut</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'dateCreation'}
                  direction={orderBy === 'dateCreation' ? order : 'asc'}
                  onClick={() => handleSort('dateCreation')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showClientInfo ? 7 : 6} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    {isAdmin ? 'Aucune réclamation trouvée' : 'Vous n\'avez aucune réclamation'}
                  </Typography>
                  {!isAdmin && currentUser && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Cliquez sur "Nouvelle Réclamation" pour en créer une
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item, index) => (
                <StyledTableRow 
                  key={item.id}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TableCell>
                    <IDAvatar>#{item.id}</IDAvatar>
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                        {item.sujet || `Réclamation #${item.id}`}
                      </Typography>
                      {item.description && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#666',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {showClientInfo && (
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isAdmin ? (
                          <ClientAvatar>
                            {getClientInitials(item.clientId)}
                          </ClientAvatar>
                        ) : (
                          <Person sx={{ fontSize: 18, color: '#9E9E9E' }} />
                        )}
                        <Typography variant="body2" sx={{ color: '#666' }}>
                          {getClientDisplay(item)}
                        </Typography>
                      </Box>
                    </TableCell>
                  )}

                  <TableCell align="center">
                    <Chip
                      label={item.priorite ? `${getPriorityIcon(item.priorite)} ${item.priorite}` : 'N/A'}
                      sx={{
                        fontWeight: 600,
                        color: getPriorityColor(item.priorite),
                        border: `1px solid ${getPriorityColor(item.priorite)}`,
                        backgroundColor: 'transparent',
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={formatStatus(item.statut)}
                      color={getStatusColor(item.statut)}
                      variant="outlined"
                      icon={
                        getStatusColor(item.statut) === 'success' ? (
                          <CheckCircle sx={{ fontSize: '16px !important' }} />
                        ) : getStatusColor(item.statut) === 'warning' ? (
                          <TrendingUp sx={{ fontSize: '16px !important' }} />
                        ) : (
                          <Schedule sx={{ fontSize: '16px !important' }} />
                        )
                      }
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>

                  <TableCell>
                    {item.dateCreation ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday sx={{ fontSize: 16, color: '#9E9E9E' }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#666' }}>
                            {new Date(item.dateCreation).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.dateCreation).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Voir les détails">
                        <ActionButton 
                          className="view" 
                          onClick={() => onView?.(item)}
                          size="small"
                        >
                          <Visibility fontSize="small" />
                        </ActionButton>
                      </Tooltip>
                      
                      {/* Boutons d'édition et suppression conditionnels */}
                      {(canEditDelete && canUserEditDelete(item)) && (
                        <>
                          <Tooltip title="Modifier">
                            <ActionButton 
                              className="edit" 
                              onClick={() => onEdit(item)}
                              size="small"
                            >
                              <Edit fontSize="small" />
                            </ActionButton>
                          </Tooltip>
                          <Tooltip title="Supprimer">
                            <ActionButton 
                              className="delete" 
                              onClick={() => onDelete(item.id)}
                              size="small"
                            >
                              <Delete fontSize="small" />
                            </ActionButton>
                          </Tooltip>
                        </>
                      )}
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
        count={filteredItems.length}
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

export default ReclamationsTable;