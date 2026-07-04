import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const isAuth = localStorage.getItem('neoview_auth');
    if (isAuth) {
      navigate('/home');
    } else {
      navigate('/landing');
    }
  }, [navigate]);

  return null;
};

export default Index;
