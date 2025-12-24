// ArticlesTable.tsx - Version modernisée
import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, IconButton, Tooltip, Chip, Avatar, Box, Typography,
  TablePagination, TableSortLabel
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Edit, Delete, Visibility, Inventory, AttachMoney, Category, Store } from '@mui/icons-material';
import { Article } from '../../types/article';

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
  border: '1px solid rgba(156, 39, 176, 0.1)',
  animation: `${fadeIn} 0.6s ease`,
  backgroundColor: '#fff',
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.08) 0%, rgba(186, 104, 200, 0.08) 100%)',
  '& th': {
    fontWeight: 700,
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#9C27B0',
    padding: '16px',
    borderBottom: '2px solid rgba(156, 39, 176, 0.2)',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'all 0.3s ease',
  animation: `${slideIn} 0.5s ease`,
  '&:hover': {
    backgroundColor: 'rgba(156, 39, 176, 0.04) !important',
    transform: 'scale(1.01)',
    boxShadow: '0 4px 20px rgba(156, 39, 176, 0.08)',
    '& td': {
      borderColor: 'rgba(156, 39, 176, 0.1)',
    },
  },
  '&:nth-of-type(even)': {
    backgroundColor: 'rgba(156, 39, 176, 0.02)',
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
    color: '#9C27B0',
    backgroundColor: 'rgba(156, 39, 176, 0.08)',
    '&:hover': { 
      backgroundColor: 'rgba(156, 39, 176, 0.15)',
      boxShadow: '0 4px 12px rgba(156, 39, 176, 0.2)',
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

const ArticleAvatar = styled(Avatar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
  fontWeight: 700,
  width: 40,
  height: 40,
  fontSize: '16px',
  boxShadow: '0 4px 8px rgba(156, 39, 176, 0.2)',
}));

const StockChip = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  height: '24px',
  fontSize: '11px',
  '&.in-stock': {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#2E7D32',
    border: '1px solid rgba(76, 175, 80, 0.2)',
  },
  '&.out-of-stock': {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    color: '#C62828',
    border: '1px solid rgba(244, 67, 54, 0.2)',
  },
}));

const PriceBadge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 12px',
  borderRadius: '12px',
  fontWeight: 700,
  fontSize: '14px',
  backgroundColor: 'rgba(156, 39, 176, 0.1)',
  color: '#9C27B0',
  border: '1px solid rgba(156, 39, 176, 0.2)',
  transition: 'all 0.3s ease',
}));

const SortLabel = styled(TableSortLabel)(({ theme }) => ({
  '&.MuiTableSortLabel-root:hover': {
    color: '#9C27B0',
  },
  '&.MuiTableSortLabel-root.Mui-active': {
    color: '#9C27B0',
  },
  '& .MuiTableSortLabel-icon': {
    color: '#9C27B0 !important',
  },
}));

interface Props {
  articles: Article[];
  onEdit: (a: Article) => void;
  onDelete: (id: number) => void;
  onView?: (a: Article) => void;
}

const ArticlesTable: React.FC<Props> = ({ articles, onEdit, onDelete, onView }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Article>('nom');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const thumbStyle = { width: 56, height: 56, borderRadius: '14px', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' } as const;

  const resolveImage = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    const base = import.meta.env.VITE_FILES_BASE_URL
      || import.meta.env.VITE_ARTICLE_BASE_URL
      || import.meta.env.VITE_API_BASE_URL
      || 'https://localhost:7174';
    const normalized = url.startsWith('/') ? url : `/${url}`;
    return `${base}${normalized}`;
  };

  const handleSort = (property: keyof Article) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedArticles = [...articles].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    
    if (orderBy === 'prixAchat') {
      return order === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  const paginatedArticles = sortedArticles.slice(
    page * rowsPerPage, 
    page * rowsPerPage + rowsPerPage
  );

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <Box>
      <StyledTableContainer component={Paper} elevation={0}>
        <Table>
          <StyledTableHead>
            <TableRow>
              <TableCell width="90px">Image</TableCell>
              <TableCell width="200px">
                <SortLabel
                  active={orderBy === 'nom'}
                  direction={orderBy === 'nom' ? order : 'asc'}
                  onClick={() => handleSort('nom')}
                >
                  Article
                </SortLabel>
              </TableCell>
              <TableCell>
                <SortLabel
                  active={orderBy === 'type'}
                  direction={orderBy === 'type' ? order : 'asc'}
                  onClick={() => handleSort('type')}
                >
                  Type & Description
                </SortLabel>
              </TableCell>
              <TableCell align="center" width="120px">
                <SortLabel
                  active={orderBy === 'prixAchat'}
                  direction={orderBy === 'prixAchat' ? order : 'asc'}
                  onClick={() => handleSort('prixAchat')}
                >
                  Prix
                </SortLabel>
              </TableCell>
              <TableCell align="center" width="100px">
                Statut
              </TableCell>
              <TableCell align="right" width="160px">
                Actions
              </TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {paginatedArticles.length === 0 ? (
              <StyledTableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Inventory sx={{ fontSize: 48, color: 'rgba(0, 0, 0, 0.12)', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Aucun article trouvé
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Créez votre premier article en cliquant sur "Nouvel article"
                    </Typography>
                  </Box>
                </TableCell>
              </StyledTableRow>
            ) : (
              paginatedArticles.map((article, index) => (
                <StyledTableRow 
                  key={article.id}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TableCell>
                    {resolveImage(article.imageUrl) ? (
                      <img src={resolveImage(article.imageUrl)} alt={article.nom} style={thumbStyle} />
                    ) : (
                      <ArticleAvatar>
                        {getInitials(article.nom)}
                      </ArticleAvatar>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ArticleAvatar>
                        {getInitials(article.nom)}
                      </ArticleAvatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.5 }}>
                          {article.nom}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {article.reference}
                        </Typography>
                        {article.fournisseur && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <Store sx={{ fontSize: 12, color: '#9e9e9e' }} />
                            <Typography variant="caption" color="text.secondary">
                              {article.fournisseur}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Category sx={{ fontSize: 16, color: '#9C27B0' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#666' }}>
                          {article.type}
                        </Typography>
                      </Box>
                      
                      {article.description && (
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
                          {article.description}
                        </Typography>
                      )}
                      
                      {article.quantite !== undefined && (
                        <Chip 
                          label={`Quantité: ${article.quantite}`}
                          size="small"
                          sx={{
                            height: '22px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            color: '#2196F3',
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <PriceBadge>
                      <AttachMoney sx={{ 
                        fontSize: 16, 
                        mr: 0.5,
                        color: '#9C27B0'
                      }} />
                      <Typography variant="body1" sx={{ fontWeight: 800 }}>
                        {formatPrice(article.prixAchat)}
                      </Typography>
                    </PriceBadge>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <StockChip 
                        label={article.estEnStock ? 'En stock' : 'Rupture'}
                        className={article.estEnStock ? 'in-stock' : 'out-of-stock'}
                        size="small"
                      />
                      
                      {article.estSousGarantie && (
                        <Chip 
                          label="Garantie"
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '10px',
                            fontWeight: 800,
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            color: '#FF9800',
                            letterSpacing: '0.5px',
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {onView && (
                        <Tooltip title="Voir les détails" arrow>
                          <ActionButton 
                            size="small" 
                            className="view"
                            onClick={() => onView(article)}
                          >
                            <Visibility fontSize="small" />
                          </ActionButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Modifier" arrow>
                        <ActionButton 
                          size="small" 
                          className="edit"
                          onClick={() => onEdit(article)}
                        >
                          <Edit fontSize="small" />
                        </ActionButton>
                      </Tooltip>
                      <Tooltip title="Supprimer" arrow>
                        <ActionButton 
                          size="small" 
                          className="delete"
                          onClick={() => onDelete(article.id)}
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
      
      {articles.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={articles.length}
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
            borderTop: '1px solid rgba(156, 39, 176, 0.1)',
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

export default ArticlesTable;