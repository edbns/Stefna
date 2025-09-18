import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '../hooks/useResponsive';

interface MobileRouteGuardProps {
  children: React.ReactNode;
}

const MobileRouteGuard: React.FC<MobileRouteGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Allowed mobile routes
  const allowedMobileRoutes = ['/', '/auth', '/gallery'];

  useEffect(() => {
    if (isMobile) {
      const currentPath = location.pathname;
      
      // If mobile user tries to access a desktop-only route, redirect them
      if (!allowedMobileRoutes.includes(currentPath)) {
        console.log('🚫 Mobile user blocked from desktop route:', currentPath);
        
        // Redirect based on the blocked route
        if (currentPath === '/profile') {
          // Redirect profile to mobile gallery
          navigate('/gallery', { replace: true });
        } else if (currentPath.startsWith('/dashboard')) {
          // Redirect admin routes to home
          navigate('/', { replace: true });
        } else {
          // Redirect all other desktop routes to home
          navigate('/', { replace: true });
        }
      }
    }
  }, [isMobile, location.pathname, navigate]);

  return <>{children}</>;
};

export default MobileRouteGuard;
