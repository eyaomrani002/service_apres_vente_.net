import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Button,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  ShoppingCart,
  People,
  Assignment,
  Build,
  Assessment,
  ReceiptLong,
  Settings,
  Notifications,
  CalendarMonth,
  Group,
  Logout,
  Person,
  ChevronLeft,
  ChevronRight,
  DarkMode,
  LightMode,
  BlurOn,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationsMenu from '../notifications/NotificationsMenu';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import AuthContext from '../../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Tableau de bord', icon: <Dashboard />, path: '/dashboard', roles: ['admin', 'responsablesav', 'technicien'] },
  { text: 'Catalogue', icon: <Inventory />, path: '/catalog', roles: ['client', 'technicien', 'responsablesav', 'admin'] },
  { text: 'Articles', icon: <Inventory />, path: '/articles', roles: ['responsablesav', 'admin'] },
  { text: 'Clients', icon: <People />, path: '/clients', roles: ['responsablesav', 'admin'] },
  { text: 'Techniciens', icon: <Build />, path: '/techniciens', roles: ['responsablesav', 'admin'] },
  { text: 'Utilisateurs', icon: <Group />, path: '/users', roles: ['admin'] },
  { text: 'Réclamations', icon: <Assignment />, path: '/reclamations', roles: ['client', 'responsablesav', 'admin'] },
  { text: 'Interventions', icon: <Build />, path: '/interventions', roles: ['technicien', 'responsablesav', 'admin'] },
  { text: 'Factures', icon: <ReceiptLong />, path: '/factures', roles: ['client', 'responsablesav', 'admin'] },
  { text: 'Calendrier', icon: <CalendarMonth />, path: '/calendar', roles: ['technicien', 'responsablesav', 'admin'] },
  { text: 'Rapports', icon: <Assessment />, path: '/reports', roles: ['technicien', 'responsablesav', 'admin'] },
  { text: 'Paramètres', icon: <Settings />, path: '/settings', roles: ['admin'] },
];

const MainLayout: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [cartAnchorEl, setCartAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, shadow, toggleDark, toggleShadow } = useTheme();
  const { items: cartItems, total: cartTotal, count: cartCount, removeItem } = useCart();
  const auth = useContext(AuthContext);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleCartOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCartAnchorEl(event.currentTarget);
  };

  const handleCartClose = () => {
    setCartAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const formatPrice = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(value);

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

 

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'var(--panel)',
          color: 'var(--text)',
          boxShadow: 'var(--surface-shadow)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Service SAV
          </Typography>
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="large"
              color="inherit"
              onClick={handleNotificationsOpen}
              sx={{ mr: 1 }}
            >
                <Badge badgeContent={0} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
            <NotificationsMenu anchorEl={notificationsAnchorEl} open={Boolean(notificationsAnchorEl)} onClose={handleNotificationsClose} />

          {/* Cart */}
          <Tooltip title="Panier">
            <IconButton
              size="large"
              color="inherit"
              onClick={handleCartOpen}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={cartCount} color="error">
                <ShoppingCart />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={cartAnchorEl}
            open={Boolean(cartAnchorEl)}
            onClose={handleCartClose}
            PaperProps={{ sx: { width: 360, p: 1 } }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Votre Panier</Typography>
              <Typography variant="caption" color="text.secondary">{cartCount} article(s)</Typography>
            </Box>
            <Divider />
            {cartItems.length === 0 && (
              <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>Panier vide</Box>
            )}
            {cartItems.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    overflow: 'hidden',
                    mr: 1.5,
                    bgcolor: 'rgba(0,0,0,0.04)',
                  }}
                >
                  {resolveImage(item.imageUrl) ? (
                    <img src={resolveImage(item.imageUrl)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : null}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>{item.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.quantity} × {formatPrice(item.price)}</Typography>
                </Box>
                <Typography variant="body2" sx={{ mr: 1 }}>{formatPrice(item.price * item.quantity)}</Typography>
                <IconButton size="small" onClick={() => removeItem(item.id)}>
                  ✕
                </IconButton>
              </Box>
            ))}
            {cartItems.length > 0 && (
              <Box>
                <Divider />
                <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2">Total</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{formatPrice(cartTotal)}</Typography>
                </Box>
                <Box sx={{ px: 2, pb: 1.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => { handleCartClose(); navigate('/cart'); }}
                  >
                    Voir le panier
                  </Button>
                </Box>
              </Box>
            )}
          </Menu>

          {/* Theme toggles */}
          <Tooltip title={dark ? 'Passer en clair' : 'Passer en sombre'}>
            <IconButton size="large" color="inherit" onClick={toggleDark} sx={{ mr: 1 }}>
              {dark ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          <Tooltip title={shadow ? 'Désactiver ombre' : 'Activer ombre'}>
            <IconButton size="large" color={shadow ? 'primary' : 'inherit'} onClick={toggleShadow} sx={{ mr: 1 }}>
              <BlurOn />
            </IconButton>
          </Tooltip>
          
          
          
          {/* Profile Menu */}
          <Tooltip title="Paramètres du compte">
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: 2 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user ? `${(user.firstName ? user.firstName.charAt(0) : '')}${(user.lastName ? user.lastName.charAt(0) : '')}`.toUpperCase() : <Person />}
              </Avatar>
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
              <MenuItem onClick={handleProfile}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle1">
                    {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'Mon profil'}
                  </Typography>
                  {user?.email && (
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 60,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 60,
            boxSizing: 'border-box',
            transition: 'width 0.3s',
            overflowX: 'hidden',
            backgroundColor: 'var(--panel)',
            color: 'var(--text)',
            boxShadow: 'var(--surface-shadow)',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems
              .filter((item) => !item.roles || auth.hasAnyRole(item.roles))
              .map((item) => (
              <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{ opacity: open ? 1 : 0 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          
          {/* Collapse button */}
          <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={handleDrawerToggle}>
              {open ? <ChevronLeft /> : <ChevronRight />}
            </IconButton>
          </Box>
        </Box>
      </Drawer>
      
      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;