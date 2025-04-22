import React from 'react';
import { useMenu } from '../../context/MenuContext';
import { useTranslation } from 'react-i18next';
import './TokenManager.css';

const TokenManager = () => {
  const { isMinimized } = useMenu();
  const { t } = useTranslation();

  return (
    <div className={`token-manager-container ${isMinimized ? 'minimized' : ''}`}>
      <h2>{t('tokenManager.title')}</h2>
      {/* Add your TokenManager content here */}
    </div>
  );
};

export default TokenManager;
