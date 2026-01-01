import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem, 
  Typography, 
  ListItemText, 
  CircularProgress,
  Stack,
  Chip,
  Button,
  Avatar,
  Divider,
  alpha,
  Fade,
  Tooltip
} from '@mui/material';
import { 
  Notifications, 
  CheckCircle, 
  Circle,
  East,
  AccessTime,
  MarkEmailRead,
  ClearAll,
  MoreVert
} from '@mui/icons-material';
import notificationService from '../../services/notificationService';
import { NotificationItem } from '../../types/notification';
import AuthContext from '../../contexts/AuthContext';

type Props = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
};

const NotificationsMenu: React.FC<Props> = ({ anchorEl, open, onClose, onUnreadChange }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const normalizeRoles = (roles: any) => {
    if (!roles) return [] as string[];
    return (Array.isArray(roles) ? roles : [roles]).map((r: any) => String(r).toLowerCase());
  };

  const roleFlags = (() => {
    const storedStr = localStorage.getItem('user');
    const stored = storedStr ? JSON.parse(storedStr) : null;
    const roles = auth.user?.roles || stored?.roles || stored?.role || [];
    const normalized = normalizeRoles(roles);
    return {
      isAdmin: normalized.includes('admin'),
      isResponsable: normalized.includes('responsablesav'),
      isTechnicien: normalized.includes('technicien'),
      isClient: normalized.includes('client'),
      normalized,
    };
  })();

  useEffect(() => {
    let mounted = true;
    
    const fetchNotifications = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        const storedStr = localStorage.getItem('user');
        const stored = storedStr ? JSON.parse(storedStr) : null;
        const userEmail = auth.user?.email || stored?.email || null;
        const { isAdmin, isResponsable, isTechnicien, normalized } = roleFlags;
        const canSeeAll = isAdmin || isResponsable;

        let res: NotificationItem[] = [];
        if (canSeeAll) {
          res = await notificationService.fetchAll();
        } else if (userEmail) {
          res = await notificationService.fetchForRecipient(userEmail);
        }

        const filtered = Array.isArray(res) ? res.filter((item) => {
          const hay = `${item.type ?? ''} ${item.subject ?? ''} ${item.message ?? ''}`.toLowerCase();
          const isFacture = hay.includes('factur') || hay.includes('paiement') || hay.includes('payment') || hay.includes('invoice');

          // Technicien ne doit pas recevoir les notifications de facturation
          if (isTechnicien && isFacture) return false;

          // Admin/Responsable voient tout
          if (isAdmin || isResponsable) return true;

          // Client/Technicien autres cas : garder (ils reçoivent leurs propres notifs déjà filtrées par destinataire)
          return true;
        }) : [];

        if (mounted) setItems(filtered);
      } catch (e) {
        console.error('Failed to load notifications', e);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchNotifications();
    
    return () => { 
      mounted = false; 
    };
  }, [open]);

  const unreadCount = items.filter(i => !i.read).length;
  useEffect(() => {
    if (onUnreadChange) onUnreadChange(unreadCount);
  }, [unreadCount, onUnreadChange]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map(x => x.id === id ? { ...x, read: true } : x));
    } catch (e) { 
      console.error('Failed to mark as read', e); 
      setItems((prev) => prev.map(x => x.id === id ? { ...x, read: true } : x));
    }
  };

  const handleOpenTarget = (item: NotificationItem) => {
    if (item.link) {
      navigate(item.link);
      return;
    }

    const type = (item.entityType || item.type || '').toLowerCase();
    const msg = `${item.subject ?? ''} ${item.message ?? ''}`.toLowerCase();
    const idMatch = (item.entityId ? String(item.entityId) : msg.match(/\b(\d{1,6})\b/)?.[1]) ?? null;
    const idParam = idMatch ? `?id=${idMatch}` : '';

    if (type.includes('reclam') || msg.includes('réclam') || msg.includes('reclam')) {
      navigate(`/reclamations${idParam}`);
      return;
    }
    if (type.includes('intervention') || msg.includes('intervention')) {
      navigate(`/interventions${idParam}`);
      return;
    }
    if (type.includes('facture') || msg.includes('facture')) {
      navigate(`/factures${idParam}`);
      return;
    }

    navigate('/dashboard');
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all(
        items
          .filter(item => !item.read)
          .map(item => notificationService.markRead(item.id))
      );
      setItems(prev => prev.map(item => ({ ...item, read: true })));
    } catch (e) {
      console.error('Failed to mark all as read', e);
    }
  };

  const getNotificationIcon = (type: string | undefined) => {
    const t = (type || '').toLowerCase();
    if (t.includes('reclam')) return '⚠️';
    if (t.includes('intervention')) return '🔧';
    if (t.includes('facture')) return '🧾';
    return '📢';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return date.toLocaleDateString();
  };

  return (
    <Menu 
      anchorEl={anchorEl} 
      open={open} 
      onClose={onClose} 
      PaperProps={{ 
        sx: { 
          width: 420,
          maxHeight: 500,
          borderRadius: 2,
          mt: 1,
          boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        } 
      }}
      TransitionComponent={Fade}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* Header avec gradient moderne */}
      <Box sx={{ 
        p: 2.5, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Notifications
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {unreadCount} non-lu{unreadCount > 1 ? 's' : ''} • {items.length} total
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {unreadCount > 0 && (
              <Tooltip title="Tout marquer comme lu">
                <IconButton 
                  size="small" 
                  onClick={handleMarkAllRead}
                  sx={{ color: 'white', bgcolor: alpha('#fff', 0.1), '&:hover': { bgcolor: alpha('#fff', 0.2) } }}
                >
                  <ClearAll fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Voir toutes">
              <IconButton 
                size="small"
                onClick={() => {
                  navigate('/notifications');
                  onClose();
                }}
                sx={{ color: 'white', bgcolor: alpha('#fff', 0.1), '&:hover': { bgcolor: alpha('#fff', 0.2) } }}
              >
                <East fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Liste des notifications */}
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <MarkEmailRead sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Aucune notification pour le moment
            </Typography>
          </Box>
        ) : (
          items.map((item, index) => (
            <React.Fragment key={item.id}>
              <MenuItem 
                onClick={() => { 
                  handleMarkRead(item.id); 
                  handleOpenTarget(item);
                  onClose(); 
                }} 
                sx={{ 
                  p: 2.5,
                  gap: 2,
                  alignItems: 'flex-start',
                  backgroundColor: item.read ? 'transparent' : alpha('#667eea', 0.04),
                  borderLeft: item.read ? 'none' : '3px solid',
                  borderLeftColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: alpha('#667eea', 0.08),
                    transform: 'translateX(2px)',
                    transition: 'all 0.2s ease'
                  },
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Avatar avec icône */}
                <Avatar 
                  sx={{ 
                    bgcolor: item.read ? 'action.disabled' : 'primary.main',
                    width: 40,
                    height: 40,
                    fontSize: 18,
                    fontWeight: 600
                  }}
                >
                  {getNotificationIcon(item.type)}
                </Avatar>

                {/* Contenu */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ 
                      fontWeight: item.read ? 500 : 700,
                      color: item.read ? 'text.primary' : 'text.primary',
                      lineHeight: 1.3
                    }}>
                      {item.subject || item.type || 'Notification'}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <AccessTime sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">
                        {item.createdAt && formatTime(item.createdAt)}
                      </Typography>
                    </Stack>
                  </Stack>

                  {item.message && (
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      mb: 1.5,
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.message}
                    </Typography>
                  )}

                  {/* Footer avec actions et badge */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1}>
                      {item.type && (
                        <Chip 
                          size="small" 
                          label={item.type}
                          sx={{ 
                            height: 22,
                            fontSize: '0.7rem',
                            bgcolor: alpha('#667eea', 0.1),
                            color: 'primary.main'
                          }}
                        />
                      )}
                      {!item.read && (
                        <Chip 
                          size="small"
                          label="Nouveau"
                          color="primary"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>
                    
                    {!item.read && (
                      <Tooltip title="Marquer comme lu">
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(item.id);
                          }}
                          sx={{ 
                            color: 'primary.main',
                            '&:hover': { 
                              bgcolor: alpha('#667eea', 0.1)
                            }
                          }}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>

                {/* Indicateur non-lu (point coloré) */}
                {!item.read && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.4 },
                        '100%': { opacity: 1 }
                      }
                    }}
                  />
                )}
              </MenuItem>
              
              {index < items.length - 1 && (
                <Divider sx={{ mx: 2, opacity: 0.1 }} />
              )}
            </React.Fragment>
          ))
        )}
      </Box>

      {/* Footer */}
      {items.length > 0 && (
        <Box sx={{ 
          p: 2, 
          borderTop: 1, 
          borderColor: 'divider',
          background: alpha('#f5f5f5', 0.5)
        }}>
          <Button
            fullWidth
            variant="text"
            endIcon={<East />}
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            sx={{ 
              justifyContent: 'space-between',
              color: 'primary.main',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: alpha('#667eea', 0.08)
              }
            }}
          >
            Voir toutes les notifications
          </Button>
        </Box>
      )}
    </Menu>
  );
};

export default NotificationsMenu;