import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2, Sparkles, Languages, X, MessageCircle, Leaf, Minus, Mic, Square, Volume2 } from 'lucide-react';
import { getChatResponse, generateSpeech } from '../lib/gemini';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';

interface Message {
  id?: string;
  role: 'user' | 'model';
  content: string;
  links?: { uri: string; title: string }[];
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isReading, setIsReading] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!auth.currentUser || !isOpen) return;

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
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (text?: string, audioBase64?: string) => {
    const messageToSend = text || input.trim() || (audioBase64 ? "Voice message" : "");
    if (!messageToSend || isLoading) return;

    setInput('');
    setIsLoading(true);

    // Optimistic update if not logged in
    if (!auth.currentUser) {
      setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    } else {
      try {
        const path = `users/${auth.currentUser.uid}/chats`;
        await addDoc(collection(db, path), {
          userId: auth.currentUser.uid,
          role: 'user',
          content: messageToSend,
          language,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'chats');
      }
    }

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await getChatResponse(messageToSend, history, language, 'general', undefined, audioBase64);
      
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
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Chat failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          handleSend(undefined, reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const readAloud = async (text: string, id: string) => {
    if (isReading === id) return;
    setIsReading(id);
    try {
      const url = await generateSpeech(text);
      const audio = new Audio(url);
      audio.onended = () => setIsReading(null);
      audio.play();
    } catch (err) {
      console.error("Error reading aloud:", err);
      setIsReading(null);
    }
  };

  const quickQuestions = language === 'bn' ? [
    "পাতা হলুদ হয়ে যাচ্ছে 🍂",
    "আমার গাছটি মরে যাচ্ছে 😢",
    "ছত্রাক সমস্যা 🍄",
    "জল দেওয়ার নিয়ম 💧"
  ] : [
    "Leaves turning yellow 🍂",
    "My plant is dying 😢",
    "Fungus problem 🍄",
    "Watering rules 💧"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[95vw] sm:w-[500px] h-[400px] max-h-[85vh] bg-[#F0FFF0] rounded-[2rem] shadow-2xl border border-[#4CAF50]/20 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#4CAF50] p-4 flex items-center justify-between text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-[#4CAF50]" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-[#4CAF50] rounded-full shadow-sm" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-none">Leafy AI</h3>
                  <p className="text-[10px] opacity-90 mt-1">Your personal plant doctor 🌱</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Toggle Language"
                >
                  <Languages className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Sparkles className="w-6 h-6 text-[#4CAF50]" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium px-4">
                    {language === 'bn' 
                      ? "হ্যালো! আমি লিফি এআই। আপনার গাছ সম্পর্কে কিছু জিজ্ঞাসা করুন।" 
                      : "Hello! I'm Leafy AI. Ask me anything about your plants."}
                  </p>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div 
                    key={msg.id || i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-[#4CAF50]' : 'bg-white border border-[#4CAF50]/20'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-[#4CAF50]" />}
                    </div>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group/msg ${msg.role === 'user' ? 'bg-[#C8E6C9] text-gray-800 rounded-tr-none' : 'bg-white border border-[#4CAF50]/20 rounded-tl-none text-gray-800'}`}>
                      {msg.content}
                      {msg.role === 'model' && (
                        <button
                          onClick={() => readAloud(msg.content, msg.id || i.toString())}
                          className={`absolute -right-8 top-0 p-1.5 rounded-full opacity-0 group-hover/msg:opacity-100 transition-all ${isReading === (msg.id || i.toString()) ? 'bg-[#4CAF50] text-white animate-pulse opacity-100' : 'text-[#4CAF50] hover:bg-green-50'}`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {msg.links && msg.links.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {msg.links.map((link, idx) => (
                            <a 
                              key={idx} 
                              href={link.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg text-[8px] font-bold text-green-700 hover:bg-green-100 transition-colors border border-green-100"
                            >
                              {link.title || 'Link'}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#4CAF50]/20 shadow-sm flex items-center justify-center">
                    <Bot className="w-4 h-4 text-[#4CAF50]" />
                  </div>
                  <div className="bg-white border border-[#4CAF50]/20 shadow-sm p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full" />
                    <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#4CAF50] rounded-full" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="whitespace-nowrap px-3 py-1.5 bg-white border border-[#4CAF50]/20 rounded-full text-xs font-medium text-gray-600 hover:bg-[#C8E6C9] hover:border-[#4CAF50] transition-all flex-shrink-0 shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-[#4CAF50]/10">
              <div className="relative flex items-center gap-2">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-3 rounded-2xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#F0FFF0] text-[#4CAF50] border border-[#4CAF50]/20 hover:bg-green-50'}`}
                >
                  {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isRecording ? "Recording..." : (language === 'bn' ? "লিফি এআই-কে জিজ্ঞাসা করুন..." : "Ask Leafy AI about your plant...")}
                  className="flex-1 p-3 pr-12 bg-[#F0FFF0] border border-[#4CAF50]/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] transition-all"
                  disabled={isRecording}
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && !isRecording) || isLoading}
                  className="absolute right-2 p-2 bg-[#1B5E20] hover:bg-[#4CAF50] disabled:bg-gray-300 text-white rounded-xl transition-all shadow-md group"
                >
                  <Leaf className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${isOpen ? 'bg-[#1B5E20] rotate-90' : 'bg-[#4CAF50]'}`}
      >
        {isOpen ? (
          <Minus className="w-8 h-8 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-8 h-8 text-white" />
            <Leaf className="absolute -top-1 -right-1 w-4 h-4 text-white fill-white" />
          </div>
        )}
      </motion.button>
    </div>
  );
}
