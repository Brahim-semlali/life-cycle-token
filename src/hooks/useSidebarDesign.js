import { useState, useEffect } from 'react';

const useSidebarDesign = () => {
  const [sidebarDesign, setSidebarDesign] = useState(
    localStorage.getItem('sidebarDesign') || 'default'
  );

  useEffect(() => {
    const handleDesignChange = (event) => {
      setSidebarDesign(event.detail);
    };

    window.addEventListener('sidebarDesignChange', handleDesignChange);

    return () => {
      window.removeEventListener('sidebarDesignChange', handleDesignChange);
    };
  }, []);

  return sidebarDesign;
};

export default useSidebarDesign; 