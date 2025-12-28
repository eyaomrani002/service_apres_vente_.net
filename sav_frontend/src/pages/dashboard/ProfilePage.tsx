// pages/dashboard/ProfilePage.tsx - Version complète corrigée
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Tab,
  Tabs,
  Card,
  CardContent,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  InputAdornment,
  IconButton as MuiIconButton,
  LinearProgress,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Edit,
  Save,
  CameraAlt,
  Lock,
  Notifications,
  Person,
  Email,
  Phone,
  LocationOn,
  Settings,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
} from '@mui/icons-material';
import PageTitle from '../../components/common/PageTitle';
import authService from '../../services/authService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const PasswordField = ({ 
  label, 
  value, 
  onChange, 
  error, 
  helperText,
  showStrength = false 
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: boolean;
  helperText: string;
  showStrength?: boolean;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };
  
  const strength = calculatePasswordStrength(value);
  const strengthColor = strength < 50 ? 'error' : strength < 75 ? 'warning' : 'success';
  
  return (
    <Box>
      <TextField
        fullWidth
        type={showPassword ? 'text' : 'password'}
        label={label}
        value={value}
        onChange={onChange}
        error={error}
        helperText={helperText}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <MuiIconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </MuiIconButton>
            </InputAdornment>
          ),
        }}
        variant="outlined"
      />
      {showStrength && value && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={strength} 
            color={strengthColor as any}
            sx={{ height: 4, borderRadius: 2 }}
          />
          <Typography variant="caption" sx={{ color: `${strengthColor}.main` }}>
            Force: {strength}% {strength < 50 ? '(Faible)' : strength < 75 ? '(Moyen)' : '(Fort)'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Composant pour vérifier l'état de l'API
const ApiStatusCheck = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  
  const checkApiStatus = async () => {
    try {
      const token = authService.getToken();
      
      const response = await fetch('https://localhost:7076/apigateway/auth/validate', {
        method: 'GET',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {},
        mode: 'cors',
        credentials: 'include'
      });
      
      if (response.ok || response.status === 401) {
        // 401 est OK car cela signifie que l'API répond
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (error) {
      console.error('API status check failed:', error);
      setApiStatus('offline');
    } finally {
      setLastCheck(new Date());
    }
  };
  
  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000); // Vérifier toutes les 30 secondes
    return () => clearInterval(interval);
  }, []);
  
  if (apiStatus === 'checking') {
    return (
      <Alert 
        severity="info"
        icon={<CircularProgress size={20} />}
        sx={{ mb: 2 }}
      >
        Vérification de la connexion API...
      </Alert>
    );
  }
  
  return (
    <Alert 
      severity={apiStatus === 'online' ? 'success' : 'warning'}
      icon={apiStatus === 'online' ? <CheckCircle /> : <Warning />}
      sx={{ mb: 2 }}
    >
      {apiStatus === 'online' ? (
        <>
          ✅ API Gateway connecté
          <Typography variant="caption" display="block">
            Dernière vérification: {lastCheck.toLocaleTimeString()}
          </Typography>
        </>
      ) : (
        <>
          ⚠️ API Gateway déconnecté
          <Typography variant="caption" display="block">
            Vérifiez que les services sont en cours d'exécution
          </Typography>
        </>
      )}
    </Alert>
  );
};

const ProfilePage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Données du profil
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    jobTitle: '',
    department: '',
    hireDate: '',
  });

  // Données de changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    twoFactorAuth: false,
    marketingEmails: false,
    darkMode: false,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    event;
    setTabValue(newValue);
    // Réinitialiser les messages d'erreur quand on change d'onglet
    setPasswordChangeError(null);
    setPasswordChangeSuccess(false);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileData({
      ...profileData,
      [field]: event.target.value,
    });
  };

  const handlePasswordChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordData({
      ...passwordData,
      [field]: event.target.value,
    });
    
    // Effacer l'erreur quand l'utilisateur tape
    if (passwordErrors[field as keyof typeof passwordErrors]) {
      setPasswordErrors({
        ...passwordErrors,
        [field]: '',
      });
    }
    
    // Effacer les messages de succès/erreur
    setPasswordChangeSuccess(false);
    setPasswordChangeError(null);
  };

  const handleSettingToggle = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({
      ...settings,
      [field]: event.checked,
    });
  };

  const handleSave = async () => {
    try {
      // Ici vous ajouteriez l'appel API pour sauvegarder le profil
      await authService.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phoneNumber: profileData.phone,
      });
      
      setIsEditing(false);
      setSnackbar({
        open: true,
        message: 'Profil mis à jour avec succès',
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const validatePasswordChange = () => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    
    let isValid = true;
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Mot de passe actuel requis';
      isValid = false;
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Nouveau mot de passe requis';
      isValid = false;
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Minimum 6 caractères';
      isValid = false;
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation requise';
      isValid = false;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }
    
    setPasswordErrors(newErrors);
    return isValid;
  };

  const handlePasswordSubmit = async () => {
    if (!validatePasswordChange()) {
      return;
    }
    
    try {
      setPasswordChangeError(null);
      setIsChangingPassword(true);
      
      console.log('Attempting password change...');
      
      await authService.changePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      
      // Réinitialiser les champs
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Afficher message de succès
      setPasswordChangeSuccess(true);
      setSnackbar({
        open: true,
        message: 'Mot de passe changé avec succès',
        severity: 'success'
      });
      
      // Effacer le message après 5 secondes
      setTimeout(() => {
        setPasswordChangeSuccess(false);
      }, 5000);
      
    } catch (error: any) {
      console.error('Password change failed:', error);
      
      let errorMessage = error.message || 'Erreur lors du changement de mot de passe';
      
      // Messages d'erreur plus conviviaux
      if (errorMessage.includes('ERR_EMPTY_RESPONSE') || 
          errorMessage.includes('Le serveur n\'a pas répondu')) {
        errorMessage = 'Le serveur d\'authentification ne répond pas. ' +
                      'Veuillez vérifier que AuthAPI est en cours d\'exécution sur le port 7011.';
      } else if (errorMessage.includes('ERR_NETWORK')) {
        errorMessage = 'Erreur réseau. Vérifiez votre connexion internet.';
      } else if (errorMessage.includes('401')) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (errorMessage.includes('ancien mot de passe')) {
        errorMessage = 'L\'ancien mot de passe est incorrect.';
      }
      
      setPasswordChangeError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      
      // Effacer le message d'erreur après 10 secondes
      setTimeout(() => {
        setPasswordChangeError(null);
      }, 10000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    // Charger les données de l'utilisateur
    const loadUserData = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          setProfileData(prev => ({
            ...prev,
            firstName: user.firstName || prev.firstName,
            lastName: user.lastName || prev.lastName,
            email: user.email || prev.email,
          }));
        }
        
        // Optionnel: charger le profil complet depuis l'API
        try {
          const profile = await authService.getProfile();
          setProfileData(prev => ({
            ...prev,
            ...profile,
          }));
        } catch (profileError) {
          console.log('Could not load full profile:', profileError);
        }
      } catch (e) {
        console.error('Error loading user data:', e);
      }
    };
    
    loadUserData();
  }, []);

  return (
    <Box>
      <PageTitle
        title="Mon profil"
        subtitle="Gérez vos informations personnelles et paramètres"
      />
      
      <ApiStatusCheck />

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' } }}>
        {/* Sidebar */}
        <Box>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: 48,
                    bgcolor: 'primary.main',
                    mb: 2,
                  }}
                >
                  {profileData.firstName?.charAt(0)}{profileData.lastName?.charAt(0)}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    right: 0,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'background.paper' },
                  }}
                >
                  <CameraAlt />
                </IconButton>
              </Box>

              <Typography variant="h5" gutterBottom>
                {profileData.firstName} {profileData.lastName}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profileData.jobTitle || 'Utilisateur'}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {profileData.hireDate ? `Membre depuis ${profileData.hireDate}` : 'Membre'}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Email sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2">{profileData.email}</Typography>
                </Box>

                {profileData.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Phone sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2">{profileData.phone}</Typography>
                  </Box>
                )}

                {profileData.address && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 2, fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {profileData.address}, {profileData.city} {profileData.postalCode}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Main Content */}
        <Box>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Informations" icon={<Person />} iconPosition="start" />
                <Tab label="Sécurité" icon={<Lock />} iconPosition="start" />
                <Tab label="Notifications" icon={<Notifications />} iconPosition="start" />
                <Tab label="Préférences" icon={<Settings />} iconPosition="start" />
              </Tabs>
            </Box>

            {/* Informations Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Informations personnelles</Typography>
                <Button
                  variant={isEditing ? "contained" : "outlined"}
                  startIcon={isEditing ? <Save /> : <Edit />}
                  onClick={isEditing ? handleSave : handleEditToggle}
                >
                  {isEditing ? 'Enregistrer' : 'Modifier'}
                </Button>
              </Box>

              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Prénom"
                    value={profileData.firstName}
                    onChange={handleInputChange('firstName')}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Nom"
                    value={profileData.lastName}
                    onChange={handleInputChange('lastName')}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={handleInputChange('email')}
                    disabled
                    variant="outlined"
                    helperText="L'email ne peut pas être modifié"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    value={profileData.phone}
                    onChange={handleInputChange('phone')}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Ville"
                    value={profileData.city}
                    onChange={handleInputChange('city')}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Code postal"
                    value={profileData.postalCode}
                    onChange={handleInputChange('postalCode')}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    fullWidth
                    label="Adresse"
                    value={profileData.address}
                    onChange={handleInputChange('address')}
                    disabled={!isEditing}
                    variant="outlined"
                    multiline
                    rows={2}
                  />
                </Box>
              </Box>
            </TabPanel>
            
            {/* Sécurité Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Sécurité du compte
              </Typography>
              
              {passwordChangeSuccess && (
                <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircle />}>
                  Mot de passe changé avec succès !
                </Alert>
              )}
              
              {passwordChangeError && (
                <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
                  {passwordChangeError}
                </Alert>
              )}
              
              <Box sx={{ mb: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactorAuth}
                      onChange={handleSettingToggle('twoFactorAuth')}
                    />
                  }
                  label="Authentification à deux facteurs"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Ajoutez une couche de sécurité supplémentaire à votre compte
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Changer le mot de passe
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <PasswordField
                      label="Mot de passe actuel"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange('currentPassword')}
                      error={!!passwordErrors.currentPassword}
                      helperText={passwordErrors.currentPassword}
                    />
                  </Box>
                  <Box>
                    <PasswordField
                      label="Nouveau mot de passe"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange('newPassword')}
                      error={!!passwordErrors.newPassword}
                      helperText={passwordErrors.newPassword}
                      showStrength={true}
                    />
                  </Box>
                  <Box>
                    <PasswordField
                      label="Confirmer le nouveau mot de passe"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange('confirmPassword')}
                      error={!!passwordErrors.confirmPassword}
                      helperText={passwordErrors.confirmPassword}
                    />
                  </Box>
                </Box>
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={handlePasswordSubmit}
                  disabled={isChangingPassword}
                  startIcon={isChangingPassword ? <CircularProgress size={20} /> : null}
                >
                  {isChangingPassword ? 'Changement en cours...' : 'Changer le mot de passe'}
                </Button>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom color="error">
                  Zone de danger
                </Typography>
                <Button variant="outlined" color="error">
                  Supprimer mon compte
                </Button>
              </Box>
            </TabPanel>
            
            {/* Notifications Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Préférences de notification
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={handleSettingToggle('emailNotifications')}
                    />
                  }
                  label="Notifications par email"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Recevez des emails pour les nouvelles réclamations et interventions
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.pushNotifications}
                      onChange={handleSettingToggle('pushNotifications')}
                    />
                  }
                  label="Notifications push"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Recevez des notifications en temps réel dans votre navigateur
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.marketingEmails}
                      onChange={handleSettingToggle('marketingEmails')}
                    />
                  }
                  label="Emails marketing"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Recevez nos newsletters et offres spéciales
                </Typography>
              </Box>
            </TabPanel>
            
            {/* Préférences Tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                Préférences générales
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={handleSettingToggle('darkMode')}
                    />
                  }
                  label="Mode sombre"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Activez le thème sombre pour une meilleure expérience nocturne
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Langue
                </Typography>
                <Button variant="outlined" disabled>
                  Français
                </Button>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Fuseau horaire
                </Typography>
                <Button variant="outlined" disabled>
                  Europe/Paris (UTC+1)
                </Button>
              </Box>
            </TabPanel>
          </Paper>
        </Box>
      </Box>
      
      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;