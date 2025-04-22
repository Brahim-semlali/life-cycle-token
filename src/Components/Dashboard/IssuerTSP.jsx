import React from 'react';
import { useMenu } from '../../context/MenuContext';
import { useTranslation } from 'react-i18next';
import './IssuerTSP.css';

const IssuerTSP = () => {
  const { isMinimized } = useMenu();
  const { t } = useTranslation();

  return (
    <div className={`issuer-tsp-container ${isMinimized ? 'minimized' : ''}`}>
      <h2>{t('issuerTsp.title')}</h2>
      {/* Add your IssuerTSP content here */}
    </div>
  );
};

export default IssuerTSP;
