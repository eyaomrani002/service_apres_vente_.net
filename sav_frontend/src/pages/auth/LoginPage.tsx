import React, { useEffect } from 'react';
import LoginForm from '../../components/auth/LoginForm';

const LoginPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Connexion - Service SAV';
  }, []);

  return <LoginForm />;
};

export default LoginPage;