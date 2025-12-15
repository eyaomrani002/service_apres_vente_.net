import React, { useEffect } from 'react';
import RegisterForm from '../../components/auth/RegisterForm';

const RegisterPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Inscription - Service SAV';
  }, []);

  return <RegisterForm />;
};

export default RegisterPage;