import { useEffect } from 'react';
import { AppStateProvider } from './context/AppStateContext';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import AIBar from './components/AIBar';
import MainLayout from './components/MainLayout';
import Footer from './components/Footer';
import './styles.css';

function App() {
  // Handle selection errors silently
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('Selection.getRangeAt')) {
        event.preventDefault();
        return false;
      }
      return true;
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <AppStateProvider>
      <Header />
      <Toolbar />
      <AIBar />
      <MainLayout />
      <Footer />
    </AppStateProvider>
  );
}

export default App;
