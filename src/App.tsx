import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Workflow from './components/Workflow';
import BangladeshBlock from './components/BangladeshBlock';
import ChatPromo from './components/ChatPromo';
import MarketplaceTeaser from './components/MarketplaceTeaser';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import Upload from './components/Upload';
import Result from './components/Result';
import Chat from './components/Chat';
import History from './components/History';
import Marketplace from './components/Marketplace';
import CareCalendar from './components/CareCalendar';
import Profile from './components/Profile';
import GrowthLog from './components/GrowthLog';
import FloatingChat from './components/FloatingChat';
import CommandPalette from './components/CommandPalette';
import BottomNav from './components/BottomNav';
import Analytics from './components/Analytics';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScanResult, generateSpeech } from './lib/gemini';
import { auth, db } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDocFromServer } from 'firebase/firestore';

type Page = 'home' | 'scan' | 'result' | 'chat' | 'history' | 'marketplace' | 'calendar' | 'profile' | 'analytics' | 'growth-log';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<ScanResult | null>(null);
  const [user, loading] = useAuthState(auth);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);

  useEffect(() => {
    if (currentPage === 'home' && !hasGreeted) {
      let audio: HTMLAudioElement | null = null;

      const playAudio = async () => {
        if (!audio) {
          try {
            const audioUrl = await generateSpeech("You are welcome to Leafy AI");
            audio = new Audio(audioUrl);
          } catch (err: any) {
            if (err.message === 'QUOTA_EXCEEDED') {
              // Silently fail for quota issues
              setHasGreeted(true);
              return true;
            }
            console.error("Failed to generate greeting speech:", err);
            return false;
          }
        }
        
        try {
          await audio.play();
          setHasGreeted(true);
          return true;
        } catch (error: any) {
          // Only log if it's NOT an autoplay block error
          if (error.name !== 'NotAllowedError') {
            console.error("Failed to play greeting:", error);
          }
          return false;
        }
      };

      const handleInteraction = async () => {
        const success = await playAudio();
        if (success) {
          cleanup();
        }
      };

      const cleanup = () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
      };
      
      const attemptGreeting = async () => {
        const success = await playAudio();
        if (!success) {
          // If autoplay is blocked, wait for user interaction
          window.addEventListener('click', handleInteraction);
          window.addEventListener('keydown', handleInteraction);
          window.addEventListener('touchstart', handleInteraction);
        }
      };

      const timer = setTimeout(attemptGreeting, 1000);
      return () => {
        clearTimeout(timer);
        cleanup();
      };
    }
  }, [currentPage, hasGreeted]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Command Palette: Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Quick Navigation Shortcuts
      if (!isCommandPaletteOpen) {
        switch (e.key.toLowerCase()) {
          case 's': navigate('scan'); break;
          case 'h': navigate('history'); break;
          case 'c': navigate('chat'); break;
          case 'p': navigate('profile'); break;
          case 'm': navigate('marketplace'); break;
          case 'l': navigate('calendar'); break;
          case 'q': navigate('home'); break; // Q for Quit to Home
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Handle navigation
  const navigate = (page: Page) => {
    if (page !== 'chat') {
      setChatContext(null);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScanResult = (result: ScanResult, imageUrl: string) => {
    setScanResult(result);
    setLastImageUrl(imageUrl);
    navigate('result');
  };

  const viewResult = (result: ScanResult, imageUrl: string) => {
    setScanResult(result);
    setLastImageUrl(imageUrl);
    navigate('result');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-green-100 selection:text-green-900">
        <Navbar 
          onNavigate={(p) => navigate(p as Page)} 
          currentPage={currentPage} 
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
        
        <main className="pt-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {currentPage === 'home' && (
                <>
                  <Hero onStart={() => navigate('scan')} />
                  <Features />
                  <Workflow />
                  <div className="relative overflow-hidden bg-green-600 py-4 border-y border-green-500/30">
                    <motion.div 
                      animate={{ x: [0, -1990] }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      className="flex whitespace-nowrap gap-12 items-center"
                      style={{ height: '65px', width: '3980px' }}
                    >
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center gap-12 text-white font-black uppercase tracking-[0.3em] text-sm">
                          <span>Smart Diagnosis</span>
                          <span className="w-2 h-2 bg-white rounded-full" />
                          <span>Expert Care</span>
                          <span className="w-2 h-2 bg-white rounded-full" />
                          <span>Bangladesh Optimized</span>
                          <span className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      ))}
                    </motion.div>
                  </div>
                  <BangladeshBlock />
                  <ChatPromo onChat={() => navigate('chat')} />
                  <MarketplaceTeaser onMarketplace={() => navigate('marketplace')} />
                  <Testimonials />
                </>
              )}
              
              {currentPage === 'scan' && (
                <Upload onResult={handleScanResult} />
              )}
              
              {currentPage === 'result' && scanResult && lastImageUrl && (
                <Result 
                  result={scanResult} 
                  imageUrl={lastImageUrl} 
                  onBack={() => navigate('scan')}
                  onChat={() => {
                    setChatContext(scanResult);
                    navigate('chat');
                  }}
                />
              )}
              
              {currentPage === 'chat' && (
                <Chat initialContext={chatContext} onClearContext={() => setChatContext(null)} />
              )}
              
              {currentPage === 'history' && user && (
                <History 
                  onViewResult={viewResult}
                  onChat={(res) => {
                    setChatContext(res);
                    navigate('chat');
                  }}
                />
              )}

              {currentPage === 'marketplace' && (
                <Marketplace />
              )}

              {currentPage === 'calendar' && (
                <CareCalendar />
              )}

              {currentPage === 'profile' && (
                <Profile onNavigate={(p) => navigate(p as Page)} />
              )}

              {currentPage === 'analytics' && (
                <Analytics onBack={() => navigate('home')} />
              )}

              {currentPage === 'growth-log' && (
                <GrowthLog />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer onNavigate={(p) => navigate(p as Page)} />
        <FloatingChat />
        <BottomNav 
          onNavigate={(p) => navigate(p as Page)} 
          currentPage={currentPage} 
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
        />
        <CommandPalette 
          isOpen={isCommandPaletteOpen} 
          onClose={() => setIsCommandPaletteOpen(false)} 
          onNavigate={(p) => navigate(p as Page)} 
          onViewResult={viewResult}
        />
      </div>
    </ErrorBoundary>
  );
}
