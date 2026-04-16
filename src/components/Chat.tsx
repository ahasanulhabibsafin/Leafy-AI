import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2, Sparkles, Languages, Brain, Zap, MessageSquare, MapPin, ExternalLink, X, Leaf } from 'lucide-react';
import { getChatResponse, findNearbyNurseries, ChatMode, ScanResult } from '../lib/gemini';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';

interface Message {
  id?: string;
  role: 'user' | 'model';
  content: string;
  links?: { uri: string; title: string }[];
}

interface ChatProps {
  initialContext?: ScanResult | null;
  onClearContext?: () => void;
}

export default function Chat({ initialContext, onClearContext }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [mode, setMode] = useState<ChatMode>('general');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialContext) {
      const plantName = initialContext.name;
      const isBangla = language === 'bn';
      const msg = isBangla 
        ? `আমি আমার ${plantName} স্ক্যান করেছি। এটি সম্পর্কে আমাকে আরও বলুন এবং কীভাবে যত্ন নেব?`
        : `I just scanned my ${plantName}. Can you tell me more about it and how to care for it?`;
      setInput(msg);
    }
  }, [initialContext, language]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/chats`;
    const q = query(collection(db, path), orderBy('createdAt', 'asc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Optimistic update if not logged in
    if (!auth.currentUser) {
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    } else {
      try {
        const path = `users/${auth.currentUser.uid}/chats`;
        await addDoc(collection(db, path), {
          userId: auth.currentUser.uid,
          role: 'user',
          content: userMessage,
          language,
          mode,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'chats');
      }
    }

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await getChatResponse(userMessage, history, language, mode, initialContext || undefined);
      
      if (!auth.currentUser) {
        setMessages(prev => [...prev, { role: 'model', content: response.text, links: response.links }]);
      } else {
        const path = `users/${auth.currentUser.uid}/chats`;
        await addDoc(collection(db, path), {
          userId: auth.currentUser.uid,
          role: 'model',
          content: response.text,
          links: response.links,
          language,
          mode,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Chat failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindNurseries = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      // Use geolocation if available, else default to Dhaka
      let lat = 23.8103;
      let lng = 90.4125;
      
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      const response = await findNearbyNurseries(lat, lng, language);
      
      if (!auth.currentUser) {
        setMessages(prev => [...prev, { role: 'model', content: response.text, links: response.links }]);
      } else {
        const path = `users/${auth.currentUser.uid}/chats`;
        await addDoc(collection(db, path), {
          userId: auth.currentUser.uid,
          role: 'model',
          content: response.text,
          links: response.links,
          language,
          type: 'nurseries_search',
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Failed to find nurseries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = language === 'bn' ? [
    "গাছ পরিচর্যা শেখান 🧑🏫",
    "আমার গাছটি মরে যাচ্ছে 😢 (জরুরি)",
    "পাতা হলুদ হয়ে যাচ্ছে 🍂",
    "কতবার জল দেওয়া উচিত? 💧",
    "ইনডোর নাকি আউটডোর যত্ন? 🏠",
    "বিডিতে বর্ষাকালের যত্ন 🌧️"
  ] : [
    "Teach me plant care 🧑🏫",
    "My plant is dying 😢 (Emergency)",
    "Leaves turning yellow 🍂",
    "How often should I water? 💧",
    "Indoor or outdoor care? 🏠",
    "Monsoon care in BD 🌧️"
  ];

  const handleQuickAction = (q: string) => {
    if (q.includes("Emergency") || q.includes("জরুরি")) {
      setInput(language === 'bn' 
        ? "প্ল্যান্ট ইমারজেন্সি: আমার গাছটি মরে যাচ্ছে! দয়া করে আমাকে জরুরি প্রাথমিক চিকিৎসা পদক্ষেপ দিন।"
        : "PLANT EMERGENCY: My plant is dying! Please give me urgent first-aid steps.");
      setMode('complex');
    } else if (q.includes("Teach") || q.includes("শেখান")) {
      setInput(language === 'bn'
        ? "আমাকে গাছ পরিচর্যা সম্পর্কে কিছু শেখান। একটি ছোট পাঠ এবং সম্ভবত একটি কুইজ দিন!"
        : "Teach me something about plant care. Give me a short lesson and maybe a fun quiz!");
      setMode('complex');
    } else {
      setInput(q);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {language === 'bn' ? 'লিফি এআই অ্যাসিস্ট্যান্ট 🌿' : 'Leafy AI Assistant 🌿'}
          </h2>
          <div className="flex gap-2 mt-2">
            {[
              { id: 'general', icon: MessageSquare, label: language === 'bn' ? 'সাধারণ' : 'General' },
              { id: 'complex', icon: Brain, label: language === 'bn' ? 'চিন্তাশীল' : 'Thinking' },
              { id: 'fast', icon: Zap, label: language === 'bn' ? 'দ্রুত' : 'Fast' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as ChatMode)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${mode === m.id ? 'bg-green-600 border-green-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-green-200'}`}
              >
                <m.icon className="w-3 h-3" />
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleFindNurseries}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-100 text-xs font-bold text-green-700 uppercase tracking-wider transition-colors hover:bg-green-100"
          >
            <MapPin className="w-4 h-4" />
            {language === 'bn' ? 'নার্সারি খুঁজুন' : 'Find Nurseries'}
          </button>
          <button 
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 text-xs font-bold text-blue-700 uppercase tracking-wider transition-colors hover:bg-blue-100"
          >
            <Languages className="w-4 h-4" />
            {language === 'en' ? 'English' : 'বাংলা'}
          </button>
        </div>
      </div>

      {initialContext && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Analyzing Scan</p>
              <h3 className="text-sm font-bold text-gray-900">{initialContext.name}</h3>
            </div>
          </div>
          <button 
            onClick={onClearContext}
            className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto space-y-6 pr-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {language === 'bn' ? 'লিফি এআই অ্যাসিস্ট্যান্ট 🌿' : 'Leafy AI Assistant 🌿'}
            </h2>
            <p className="text-gray-500 mb-8">
              {language === 'bn' ? 'আপনার ব্যক্তিগত উদ্ভিদ ডাক্তার। বন্ধুত্বপূর্ণ, স্মার্ট এবং দ্রুত।' : 'Your personal plant doctor. Friendly, smart, and fast.'}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {quickQuestions.map((q, i) => (
                <button 
                  key={i}
                  onClick={() => handleQuickAction(q)}
                  className={`p-4 bg-white border rounded-2xl text-sm transition-all text-left shadow-sm ${q.includes("Emergency") || q.includes("জরুরি") ? 'border-red-100 text-red-600 hover:border-red-500 hover:bg-red-50' : 'border-gray-100 text-gray-600 hover:border-green-500 hover:text-green-600'}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div 
              key={msg.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-green-600' : 'bg-white border border-gray-100 shadow-sm'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-green-600" />}
              </div>
              <div className="flex flex-col gap-2 max-w-[80%]">
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-green-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 shadow-sm rounded-tl-none text-gray-700'}`}>
                  {msg.content}
                </div>
                {msg.links && msg.links.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {msg.links.map((link, idx) => (
                      <a 
                        key={idx} 
                        href={link.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.title || (language === 'bn' ? 'লিঙ্ক দেখুন' : 'View Link')}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
              <Bot className="w-5 h-5 text-green-600" />
            </div>
            <div className="bg-white border border-gray-100 shadow-sm p-4 rounded-2xl rounded-tl-none">
              <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="mt-6 relative">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={language === 'bn' ? 'আপনার গাছ সম্পর্কে জিজ্ঞাসা করুন...' : 'Ask about your plant...'}
          className="w-full p-4 pr-16 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl transition-all shadow-md"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
