import React, { useEffect, useState } from 'react';
import { 
  Box, 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem, 
  Typography, 
  ListItemText, 
  ListItemSecondaryAction,
  CircularProgress 
} from '@mui/material';
import { Notifications, CheckCircle } from '@mui/icons-material';
import notificationService from '../../services/notificationService';
import { NotificationItem } from '../../types/notification';

type Props = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
};

const NotificationsMenu: React.FC<Props> = ({ anchorEl, open, onClose }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchNotifications = async () => {
      if (!open) return;
      
      setLoading(true);
      try {
        // Récupérer l'utilisateur connecté pour filtrer les notifications
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userEmail = user?.email || 'unknown';
        
        const res = await notificationService.fetchForRecipient(userEmail);
        if (mounted) setItems(Array.isArray(res) ? res : []);
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

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map(x => x.id === id ? { ...x, read: true } : x));
    } catch (e) { 
      console.error('Failed to mark as read', e); 
    }
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

  return (
    <Menu 
      anchorEl={anchorEl} 
      open={open} 
      onClose={onClose} 
      PaperProps={{ 
        sx: { 
          width: 360, 
          maxHeight: 400 
        } 
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <IconButton 
              size="small" 
              onClick={handleMarkAllRead}
              title="Marquer tout comme lu"
            >
              <CheckCircle fontSize="small" />
            </IconButton>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {unreadCount} non-lu(s) sur {items.length}
        </Typography>
      </Box>
      
      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : items.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Aucune notification
            </Typography>
          </MenuItem>
        ) : (
          items.map(item => (
            <MenuItem 
              key={item.id} 
              onClick={() => { 
                handleMarkRead(item.id); 
                onClose(); 
              }} 
              sx={{ 
                alignItems: 'flex-start',
                backgroundColor: item.read ? 'transparent' : 'action.hover'
              }}
            >
              <ListItemText 
                primary={item.subject || item.type || 'Notification'} 
                secondary={
                  <>
                    <Typography component="span" variant="body2">
                      {item.message}
                    </Typography>
                    {item.createdAt && (
                      <Typography component="div" variant="caption" color="text.secondary">
                        {new Date(item.createdAt).toLocaleString()}
                      </Typography>
                    )}
                  </>
                }
              />
              <ListItemSecondaryAction>
                {!item.read && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      mt: 1.5
                    }}
                  />
                )}
              </ListItemSecondaryAction>
            </MenuItem>
          ))
        )}
      </Box>
      
      {items.length > 0 && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
            onClick={() => {
              // Naviguer vers la page des notifications
              window.location.href = '/notifications';
              onClose();
            }}
          >
            Voir toutes les notifications
          </Typography>
        </Box>
      )}
    </Menu>
  );
};

export default NotificationsMenu;