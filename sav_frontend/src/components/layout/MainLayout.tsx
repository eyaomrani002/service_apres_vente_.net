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
  alpha,
  useScrollTrigger,
  Slide,
  Chip,
  useTheme,
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
  Search,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import NotificationsMenu from '../notifications/NotificationsMenu';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import AuthContext from '../../contexts/AuthContext';

const drawerWidth = 260;
const collapsedWidth = 80;

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
  { text: 'Rapports', icon: <Assessment />, path: '/reports', roles: ['technicien', 'responsablesav', 'admin', 'client'] },
  { text: 'Paramètres', icon: <Settings />, path: '/settings', roles: ['admin'] },
];

interface Props {
  children?: React.ReactElement;
}

function HideOnScroll(props: Props) {
  const trigger = useScrollTrigger();
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {props.children || <div />}
    </Slide>
  );
}

// Fonction utilitaire pour obtenir une couleur sécurisée
const getSafeColor = (color: string | undefined, fallback = '#1976d2') => {
  if (!color) return fallback;
  
  // Si c'est une variable CSS
  if (color.startsWith('var(--')) {
    // Essayez de récupérer la valeur depuis le document
    try {
      const computedColor = getComputedStyle(document.documentElement).getPropertyValue(
        color.replace('var(', '').replace(')', '')
      );
      return computedColor.trim() || fallback;
    } catch (e) {
      return fallback;
    }
  }
  
  // Vérifie si c'est une couleur hexadécimale valide
  const hexRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
  if (hexRegex.test(color)) return color;
  
  // Vérifie d'autres formats de couleur valides
  const colorRegex = /^(rgb|rgba|hsl|hsla|color)\(.+\)$/;
  if (colorRegex.test(color)) return color;
  
  return fallback;
};

const MainLayout: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [cartAnchorEl, setCartAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Utiliser useTheme de MUI pour accéder aux couleurs du thème
  const muiTheme = useTheme();
  const { dark, shadow, toggleDark, toggleShadow } = useThemeContext();
  
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  // Charger le compteur de notifications (poll léger)
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const loadCount = async () => {
      try {
        const storedStr = localStorage.getItem('user');
        const stored = storedStr ? JSON.parse(storedStr) : null;
        const email = stored?.email;
        const roles = stored?.roles || stored?.role || [];
        const normRoles = Array.isArray(roles) ? roles.map((r: any) => String(r).toLowerCase()) : [String(roles || '').toLowerCase()].filter(Boolean);
        const canSeeAll = normRoles.includes('admin') || normRoles.includes('responsablesav');

        const service = (await import('../../services/notificationService')).notificationService;
        let data: any[] = [];
        if (canSeeAll) {
          data = await service.fetchAll();
        } else if (email) {
          data = await service.fetchForRecipient(email);
        }
        if (active) {
          const unread = Array.isArray(data) ? data.filter((n: any) => !n.read).length : 0;
          setUnreadNotifications(unread);
        }
      } catch {
        if (active) setUnreadNotifications(0);
      }
    };

    loadCount();
    timer = setInterval(loadCount, 30000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, []);

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

  // Obtenir la couleur primaire sécurisée
  const primaryColor = getSafeColor(muiTheme.palette.primary?.main);
  const secondaryColor = getSafeColor(muiTheme.palette.secondary?.main, '#dc004e');
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Modern AppBar */}
      <HideOnScroll>
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: scrolled ? alpha(muiTheme.palette.background.paper, 0.95) : muiTheme.palette.background.paper,
            backdropFilter: 'blur(10px)',
            color: muiTheme.palette.text.primary,
            boxShadow: scrolled ? muiTheme.shadows[4] : 'none',
            borderBottom: '1px solid',
            borderColor: muiTheme.palette.divider,
            transition: 'all 0.3s ease',
          }}
        >
          <Toolbar sx={{ minHeight: 70, px: { xs: 2, sm: 3 } }}>
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ 
                mr: 2,
                backgroundColor: muiTheme.palette.action.hover,
                '&:hover': {
                  backgroundColor: muiTheme.palette.action.selected,
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            
            {/* Logo/Brand */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                flexGrow: 1,
                cursor: 'pointer'
              }}
              onClick={() => navigate('/dashboard')}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  backgroundColor: primaryColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                }}
              >
                <Build sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 700,
                background: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Service SAV
              </Typography>
            </Box>

            {/* Search Bar (Optional) */}
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              backgroundColor: muiTheme.palette.action.hover,
              borderRadius: 3,
              px: 2,
              py: 0.5,
              mr: 2,
              width: 280,
            }}>
              <Search sx={{ fontSize: 20, color: muiTheme.palette.text.secondary, mr: 1 }} />
              <input
                type="text"
                placeholder="Rechercher..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  color: muiTheme.palette.text.primary,
                  fontSize: '0.875rem',
                }}
              />
            </Box>

            {/* Action Icons */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 0.5,
              mr: 2
            }}>
              {/* Theme Toggles */}
              <Tooltip title={dark ? 'Mode clair' : 'Mode sombre'}>
                <IconButton
                  size="medium"
                  onClick={toggleDark}
                  sx={{
                    color: muiTheme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: muiTheme.palette.action.hover,
                      color: muiTheme.palette.text.primary,
                    }
                  }}
                >
                  {dark ? <LightMode /> : <DarkMode />}
                </IconButton>
              </Tooltip>

              <Tooltip title={shadow ? 'Désactiver ombres' : 'Activer ombres'}>
                <IconButton
                  size="medium"
                  onClick={toggleShadow}
                  sx={{
                    color: shadow ? primaryColor : muiTheme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: muiTheme.palette.action.hover,
                    }
                  }}
                >
                  <BlurOn />
                </IconButton>
              </Tooltip>

              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  size="medium"
                  onClick={handleNotificationsOpen}
                  sx={{
                    color: muiTheme.palette.text.secondary,
                    '&:hover': {
                      backgroundColor: muiTheme.palette.action.hover,
                      color: muiTheme.palette.text.primary,
                    }
                  }}
                >
                  <Badge 
                    badgeContent={unreadNotifications} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.65rem',
                        height: 18,
                        minWidth: 18,
                      }
                    }}
                  >
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>
              <NotificationsMenu 
                anchorEl={notificationsAnchorEl} 
                open={Boolean(notificationsAnchorEl)} 
                onClose={handleNotificationsClose} 
                onUnreadChange={setUnreadNotifications}
              />

              {/* Cart */}
              <Tooltip title="Panier">
                <IconButton
                  size="medium"
                  onClick={handleCartOpen}
                  sx={{
                    color: muiTheme.palette.text.secondary,
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: muiTheme.palette.action.hover,
                      color: muiTheme.palette.text.primary,
                    }
                  }}
                >
                  <Badge 
                    badgeContent={cartCount} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.65rem',
                        height: 18,
                        minWidth: 18,
                      }
                    }}
                  >
                    <ShoppingCart />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>

            {/* Profile Section */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 0.75,
                borderRadius: 3,
                backgroundColor: muiTheme.palette.action.hover,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: muiTheme.palette.action.selected,
                }
              }}
              onClick={handleMenuOpen}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: primaryColor,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user ? `${(user.firstName ? user.firstName.charAt(0) : '')}${(user.lastName ? user.lastName.charAt(0) : '')}`.toUpperCase() : <Person />}
              </Avatar>
              
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Utilisateur' : 'Invité'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Client'}
                </Typography>
              </Box>
              
              <KeyboardArrowDown sx={{ 
                fontSize: 20, 
                color: muiTheme.palette.text.secondary,
                transition: 'transform 0.2s',
                transform: Boolean(anchorEl) ? 'rotate(180deg)' : 'none'
              }} />
            </Box>
          </Toolbar>
        </AppBar>
      </HideOnScroll>

      {/* Modern Sidebar */}
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            boxSizing: 'border-box',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflowX: 'hidden',
            backgroundColor: muiTheme.palette.background.paper,
            color: muiTheme.palette.text.primary,
            borderRight: '1px solid',
            borderColor: muiTheme.palette.divider,
            boxShadow: muiTheme.shadows[1],
          },
        }}
      >
        <Toolbar />
        <Box sx={{ 
          overflow: 'auto',
          height: 'calc(100vh - 64px)',
          '&::-webkit-scrollbar': {
            width: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: muiTheme.palette.divider,
            borderRadius: 2,
          }
        }}>
          {/* User Info in Sidebar */}
          {open && (
            <Box sx={{ 
              p: 3, 
              mb: 2,
              borderBottom: '1px solid',
              borderColor: muiTheme.palette.divider
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: primaryColor,
                    fontSize: '1rem',
                    fontWeight: 600,
                    mr: 2,
                  }}
                >
                  {user ? `${(user.firstName ? user.firstName.charAt(0) : '')}${(user.lastName ? user.lastName.charAt(0) : '')}`.toUpperCase() : <Person />}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Utilisateur' : 'Invité'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email || 'email@example.com'}
                  </Typography>
                </Box>
              </Box>
              <Chip 
                label={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Client'} 
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          )}

          <List sx={{ px: open ? 2 : 1 }}>
            {menuItems
              .filter((item) => !item.roles || auth.hasAnyRole(item.roles))
              .map((item) => {
                const isActive = location.pathname === item.path;
                const activeColor = alpha(primaryColor, 0.1);
                const hoverColor = alpha(primaryColor, 0.15);
                
                return (
                  <ListItem 
                    key={item.text} 
                    disablePadding 
                    sx={{ 
                      display: 'block',
                      mb: 0.5
                    }}
                  >
                    <ListItemButton
                      selected={isActive}
                      onClick={() => navigate(item.path)}
                      sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: open ? 2.5 : 1.5,
                        borderRadius: 2,
                        my: 0.5,
                        backgroundColor: isActive ? activeColor : 'transparent',
                        color: isActive ? primaryColor : muiTheme.palette.text.primary,
                        '&:hover': {
                          backgroundColor: isActive ? hoverColor : muiTheme.palette.action.hover,
                        },
                        '&.Mui-selected': {
                          backgroundColor: activeColor,
                          '&:hover': {
                            backgroundColor: hoverColor,
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: open ? 2.5 : 'auto',
                          justifyContent: 'center',
                          color: isActive ? primaryColor : muiTheme.palette.text.secondary,
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isActive ? 600 : 500,
                        }}
                        sx={{ 
                          opacity: open ? 1 : 0,
                          whiteSpace: 'nowrap'
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
          </List>
          
          {/* Collapse button */}
          <Box sx={{ 
            p: 2, 
            position: 'sticky',
            bottom: 0,
            backgroundColor: muiTheme.palette.background.paper,
            borderTop: '1px solid',
            borderColor: muiTheme.palette.divider
          }}>
            <Tooltip title={open ? "Réduire le menu" : "Étendre le menu"} placement="right">
              <IconButton 
                onClick={handleDrawerToggle}
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  backgroundColor: muiTheme.palette.action.hover,
                  '&:hover': {
                    backgroundColor: muiTheme.palette.action.selected,
                  }
                }}
              >
                {open ? <ChevronLeft /> : <ChevronRight />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Drawer>
      
      {/* Main content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          p: 0,
          minHeight: '100vh',
          backgroundColor: muiTheme.palette.background.default,
        }}
      >
        <Toolbar sx={{ minHeight: 70 }} />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>

      {/* Enhanced Cart Menu */}
      <Menu
        anchorEl={cartAnchorEl}
        open={Boolean(cartAnchorEl)}
        onClose={handleCartClose}
        PaperProps={{ 
          sx: { 
            width: 380, 
            maxHeight: 500,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: muiTheme.shadows[8],
          } 
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: muiTheme.palette.divider }}>
          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCart fontSize="small" />
            Votre Panier
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {cartCount} article(s) • {formatPrice(cartTotal)}
          </Typography>
        </Box>
        
        <Box sx={{ maxHeight: 300, overflow: 'auto', p: 1 }}>
          {cartItems.length === 0 ? (
            <Box sx={{ 
              p: 4, 
              textAlign: 'center', 
              color: muiTheme.palette.text.secondary,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1
            }}>
              <ShoppingCart sx={{ fontSize: 48, opacity: 0.3 }} />
              <Typography>Panier vide</Typography>
              <Typography variant="caption">Ajoutez des articles pour commencer</Typography>
            </Box>
          ) : (
            cartItems.map((item) => (
              <Box 
                key={item.id} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 1.5,
                  borderRadius: 2,
                  mb: 1,
                  backgroundColor: muiTheme.palette.action.hover,
                  '&:hover': {
                    backgroundColor: muiTheme.palette.action.selected,
                  }
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    overflow: 'hidden',
                    mr: 2,
                    flexShrink: 0,
                    backgroundColor: muiTheme.palette.background.default,
                  }}
                >
                  {resolveImage(item.imageUrl) ? (
                    <img 
                      src={resolveImage(item.imageUrl)} 
                      alt={item.name} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }} 
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Inventory sx={{ color: muiTheme.palette.text.disabled }} />
                    </Box>
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
                    {item.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.quantity} × {formatPrice(item.price)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, mr: 2 }}>
                  {formatPrice(item.price * item.quantity)}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => removeItem(item.id)}
                  sx={{
                    color: muiTheme.palette.text.secondary,
                    '&:hover': {
                      color: muiTheme.palette.error.main,
                      backgroundColor: muiTheme.palette.error.lighter,
                    }
                  }}
                >
                  ✕
                </IconButton>
              </Box>
            ))
          )}
        </Box>
        
        {cartItems.length > 0 && (
          <Box sx={{ p: 2.5, borderTop: '1px solid', borderColor: muiTheme.palette.divider }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Total
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {formatPrice(cartTotal)}
              </Typography>
            </Box>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => { handleCartClose(); navigate('/cart'); }}
              sx={{
                borderRadius: 2,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Voir le panier et commander
            </Button>
          </Box>
        )}
      </Menu>

      {/* Enhanced Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            width: 280,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: muiTheme.shadows[8],
            mt: 1,
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: muiTheme.palette.divider }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            {user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Mon profil' : 'Profil'}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user?.email || 'email@example.com'}
          </Typography>
        </Box>
        
        <MenuItem 
          onClick={handleProfile}
          sx={{ 
            py: 1.5,
            borderRadius: 1,
            mx: 1,
            my: 0.5,
            '&:hover': {
              backgroundColor: muiTheme.palette.action.hover,
            }
          }}
        >
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            Mon profil
          </ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            py: 1.5,
            borderRadius: 1,
            mx: 1,
            my: 0.5,
            color: muiTheme.palette.error.main,
            '&:hover': {
              backgroundColor: muiTheme.palette.error.lighter,
            }
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            Déconnexion
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MainLayout;