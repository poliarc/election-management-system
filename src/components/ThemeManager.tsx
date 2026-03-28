import { createContext, useContext, useState, type ReactNode } from 'react';
import { getThemeByClientId } from '../utils/clientThemes';

// 1. UPDATE THE INTERFACE: Tell TypeScript about 'setClientTheme'
interface ThemeContextType {
  theme: string;
  setClientTheme: (clientId: number) => void; // Added this
  /* userRole: string;                           // Keep if you plan to use it
   setUserRole: (role: string) => void; */       // Keep if you plan to use it
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<string>('modern-blue');
  //const [userRole, setUserRole] = useState<string>('junior'); // Default value

  // Mock function for setUserRole if you aren't using a real one yet
  /*const setUserRoleHandler = (role: string) => setUserRole(role);
*/
  const setClientTheme = (clientId: number) => {
    const newTheme = getThemeByClientId(clientId);
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        setClientTheme, 
        //userRole, 
        //setUserRole: setUserRoleHandler 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};