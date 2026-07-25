import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert, { AlertOptions } from '@/app/components/CustomAlert';

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((alertOptions: AlertOptions) => {
    setOptions(alertOptions);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    // Clear options after animation
    setTimeout(() => setOptions(null), 300);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert visible={visible} options={options} onClose={hideAlert} />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};