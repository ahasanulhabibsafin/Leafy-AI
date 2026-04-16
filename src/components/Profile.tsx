import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, Award, Zap, Leaf, History, Settings, LogOut, 
  ChevronRight, Star, TrendingUp, ShieldCheck, X, Globe, Loader2,
  Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, CheckCircle2, Circle, Plus, Trash2, Calendar, Camera
} from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, onSnapshot, collection, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, getDocs, where } from 'firebase/firestore';

interface UserStats {
  totalScans: number;
  points: number;
  savedPlants: number;
  updatedAt: any;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: any;
  reminderMinutes?: number;
  createdAt: any;
}

interface GrowthMilestone {
  id: string;
  plantId: string;
  day: number;
  imageUrl: string;
  note?: string;
  createdAt: any;
}

interface WeatherData {
  temp: number;
  condition: string;
  windSpeed: number;
  humidity?: number;
  locationName?: string;
}

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m`
        );
        const data = await response.json();
        
        // Get current humidity (approximate from hourly)
        const currentHour = new Date().getHours();
        const humidity = data.hourly.relativehumidity_2m[currentHour];

        setWeather({
          temp: data.current_weather.temperature,
          condition: getWeatherCondition(data.current_weather.weathercode),
          windSpeed: data.current_weather.windspeed,
          humidity: humidity,
        });
      } catch (err) {
        setError("Failed to load weather");
      } finally {
        setLoading(false);
      }
    };

    const getWeatherCondition = (code: number) => {
      if (code === 0) return "Clear Sky";
      if (code <= 3) return "Partly Cloudy";
      if (code <= 48) return "Foggy";
      if (code <= 67) return "Rainy";
      if (code <= 77) return "Snowy";
      if (code <= 82) return "Showers";
      if (code <= 99) return "Thunderstorm";
      return "Cloudy";
    };

    let interval: any;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
          
          // Update weather every 30 minutes
          interval = setInterval(() => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
          }, 30 * 60 * 1000);
        },
        (err) => {
          setError("Location access denied");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation not supported");
      setLoading(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const getWeatherIcon = (condition: string) => {
    if (condition.includes("Clear")) return <Sun className="w-8 h-8 text-yellow-500" />;
    if (condition.includes("Cloudy")) return <Cloud className="w-8 h-8 text-blue-400" />;
    if (condition.includes("Rain") || condition.includes("Showers")) return <CloudRain className="w-8 h-8 text-blue-600" />;
    return <Cloud className="w-8 h-8 text-gray-400" />;
  };

  if (loading) return (
    <div className="p-6 bg-white rounded-[2rem] border border-[#C8E6C9] shadow-xl flex items-center justify-center min-h-[140px]">
      <Loader2 className="w-6 h-6 animate-spin text-[#4CAF50]" />
    </div>
  );

  if (error) return (
    <div className="p-6 bg-white rounded-[2rem] border border-red-100 shadow-xl flex flex-col items-center justify-center text-center min-h-[140px]">
      <Cloud className="w-8 h-8 text-gray-300 mb-2" />
      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{error}</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 bg-white rounded-[2rem] border border-[#C8E6C9] shadow-xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Local Weather</p>
            <h4 className="text-2xl font-black text-[#1B5E20] tracking-tighter">{weather?.temp}°C</h4>
          </div>
          {weather && getWeatherIcon(weather.condition)}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Humidity</p>
              <p className="text-xs font-bold text-[#1B5E20]">{weather?.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Wind className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Wind</p>
              <p className="text-xs font-bold text-[#1B5E20]">{weather?.windSpeed} km/h</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-[10px] font-bold text-[#4CAF50] italic">
            {weather?.temp && weather.temp > 25 ? "Perfect for tropical plants! ☀️" : "Keep an eye on sensitive plants. 🌡️"}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const TaskManager = ({ userId }: { userId: string }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  };

  useEffect(() => {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const q = query(tasksRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(taskList);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'tasks');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Notification Scheduler
  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkReminders = () => {
      const now = new Date().getTime();
      tasks.forEach(task => {
        if (task.completed || !task.dueDate || !task.reminderMinutes) return;
        
        const dueTime = task.dueDate.toDate ? task.dueDate.toDate().getTime() : new Date(task.dueDate).getTime();
        const reminderTime = dueTime - (task.reminderMinutes * 60 * 1000);
        
        // If it's time to remind and it hasn't been reminded yet (we'll use a local storage to track)
        const reminderKey = `reminded_${task.id}_${task.reminderMinutes}`;
        if (now >= reminderTime && now < dueTime && !localStorage.getItem(reminderKey)) {
          new Notification("Plant Care Reminder", {
            body: `Task: ${task.title} is due in ${task.reminderMinutes} minutes!`,
            icon: "/favicon.ico"
          });
          localStorage.setItem(reminderKey, "true");
        }
      });
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [tasks, notificationsEnabled]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      await addDoc(collection(db, 'users', userId, 'tasks'), {
        userId,
        title: newTask.trim(),
        completed: false,
        dueDate: dueDate ? new Date(new Date(dueDate).setHours(23, 59, 59, 999)) : null,
        reminderMinutes: reminderMinutes > 0 ? reminderMinutes : null,
        createdAt: serverTimestamp()
      });
      setNewTask('');
      setDueDate('');
      setReminderMinutes(0);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId, 'tasks', taskId), {
        completed: !completed
      });
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const clearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.completed);
    for (const task of completedTasks) {
      await deleteTask(task.id);
    }
  };

  return (
    <div className="p-8 bg-white rounded-[3rem] border border-[#C8E6C9] shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black text-[#1B5E20] uppercase tracking-tighter">Plant Care Tasks</h3>
        <div className="flex items-center gap-2">
          {!notificationsEnabled && "Notification" in window && (
            <button 
              onClick={requestNotificationPermission}
              className="px-3 py-1 bg-orange-50 text-orange-500 text-[8px] font-black rounded-full uppercase tracking-widest hover:bg-orange-100 transition-colors"
            >
              Enable Notifications
            </button>
          )}
          <span className="px-3 py-1 bg-[#F0FFF0] text-[#4CAF50] text-[10px] font-black rounded-full uppercase tracking-widest">
            {tasks.filter(t => !t.completed).length} Pending
          </span>
          {tasks.some(t => t.completed) && (
            <button 
              onClick={clearCompleted}
              className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:underline"
            >
              Clear Done
            </button>
          )}
        </div>
      </div>

      <form onSubmit={addTask} className="space-y-3 mb-6">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-6 py-3 bg-[#F0FFF0] border border-[#C8E6C9] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] font-bold text-[#1B5E20]"
          />
          <button 
            type="submit"
            className="p-3 bg-[#1B5E20] text-white rounded-2xl hover:bg-[#4CAF50] transition-all shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 px-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#4CAF50]" />
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-transparent text-[10px] font-black text-[#4CAF50] uppercase tracking-widest focus:outline-none cursor-pointer"
              />
              {dueDate && (
                <button 
                  type="button"
                  onClick={() => setDueDate('')}
                  className="text-[8px] font-black text-red-400 uppercase tracking-widest hover:underline"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {dueDate && (
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4CAF50]" />
              <select 
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="bg-transparent text-[10px] font-black text-[#4CAF50] uppercase tracking-widest focus:outline-none cursor-pointer"
              >
                <option value={0}>No Reminder</option>
                <option value={15}>15m before</option>
                <option value={30}>30m before</option>
                <option value={60}>1h before</option>
                <option value={1440}>1 day before</option>
              </select>
            </div>
          )}
        </div>
      </form>

      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#4CAF50]" /></div>
        ) : tasks.length === 0 ? (
          <p className="text-center py-8 text-gray-400 font-bold italic">No tasks yet. Start by adding one!</p>
        ) : (
          tasks.map(task => (
            <motion.div 
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                task.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-[#C8E6C9] shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <button onClick={() => toggleTask(task.id, task.completed)}>
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-[#4CAF50]" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </button>
                <div>
                  <p className={`font-bold ${task.completed ? 'line-through text-gray-400' : 'text-[#1B5E20]'}`}>
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${
                        (() => {
                          const date = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
                          const isOverdue = date < new Date() && !task.completed;
                          return isOverdue ? 'text-red-500' : 'text-[#4CAF50]';
                        })()
                      }`}>
                        <Calendar className="w-2 h-2" />
                        {(() => {
                          const date = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
                          const isOverdue = date < new Date() && !task.completed;
                          return isOverdue ? 'Overdue: ' : 'Due: ';
                        })()}
                        {task.dueDate.toDate ? task.dueDate.toDate().toLocaleDateString() : new Date(task.dueDate).toLocaleDateString()}
                      </p>
                      {task.reminderMinutes && !task.completed && (
                        <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1">
                          <ShieldCheck className="w-2 h-2" />
                          Reminder: {task.reminderMinutes >= 1440 ? `${task.reminderMinutes / 1440}d` : task.reminderMinutes >= 60 ? `${task.reminderMinutes / 60}h` : `${task.reminderMinutes}m`} before
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => deleteTask(task.id)} className="p-2 text-red-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const GrowthTracker = ({ userId, onNavigate }: { userId: string, onNavigate: (page: any) => void }) => {
  const [milestones, setMilestones] = useState<GrowthMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const milestonesRef = collection(db, 'users', userId, 'growth_milestones');
    const q = query(milestonesRef, orderBy('day', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const milestoneList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GrowthMilestone[];
      setMilestones(milestoneList);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'growth_milestones');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addDummyMilestone = async () => {
    // This is for demo purposes as requested to visualize progress
    const nextDay = milestones.length === 0 ? 1 : milestones[milestones.length - 1].day + 7;
    try {
      await addDoc(collection(db, 'users', userId, 'growth_milestones'), {
        userId,
        plantId: 'demo-plant',
        day: nextDay,
        imageUrl: `https://picsum.photos/seed/plant-${nextDay}/400/400`,
        note: `Growth update for Day ${nextDay}`,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error adding milestone:", err);
    }
  };

  return (
    <div className="p-8 bg-white rounded-[3rem] border border-[#C8E6C9] shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-black text-[#1B5E20] uppercase tracking-tighter">Growth Timeline</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Visualize your plant's journey</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('growth-log')}
            className="p-3 bg-[#F0FFF0] text-[#4CAF50] rounded-2xl hover:bg-[#4CAF50] hover:text-white transition-all border border-[#C8E6C9] flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Full Log</span>
          </button>
          <button 
            onClick={addDummyMilestone}
            className="p-3 bg-[#F0FFF0] text-[#4CAF50] rounded-2xl hover:bg-[#4CAF50] hover:text-white transition-all border border-[#C8E6C9] flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Add Milestone</span>
          </button>
        </div>
      </div>

      <div className="relative px-4">
        {/* Timeline Line */}
        <div className="absolute top-[100px] left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C8E6C9] to-transparent z-0" />
        
        <div className="flex gap-8 overflow-x-auto pb-8 relative z-10 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center w-full py-8"><Loader2 className="w-6 h-6 animate-spin text-[#4CAF50]" /></div>
          ) : milestones.length === 0 ? (
            <div className="w-full text-center py-8">
              <p className="text-gray-400 font-bold italic">No milestones yet. Capture your plant's first day!</p>
            </div>
          ) : (
            milestones.map((milestone, i) => (
              <motion.div 
                key={milestone.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-52 group"
              >
                <div className="relative mb-6">
                  {/* Timeline Dot */}
                  <div className="absolute top-[76px] left-1/2 -translate-x-1/2 w-4 h-4 bg-[#4CAF50] rounded-full border-4 border-white shadow-md z-20" />
                  
                  <div className="w-52 h-52 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-lg group-hover:shadow-2xl transition-all group-hover:-translate-y-2">
                    <img 
                      src={milestone.imageUrl} 
                      alt={`Day ${milestone.day}`} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#1B5E20] text-white text-[12px] font-black rounded-full uppercase tracking-widest shadow-xl whitespace-nowrap">
                    Day {milestone.day}
                  </div>
                </div>
                <div className="bg-[#F0FFF0] p-4 rounded-2xl border border-[#C8E6C9] mt-4">
                  <p className="text-center text-xs font-bold text-[#1B5E20] line-clamp-2">{milestone.note}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface ProfileProps {
  onNavigate: (page: any) => void;
}

export default function Profile({ onNavigate }: ProfileProps) {
  const [user] = useAuthState(auth);
  const [stats, setStats] = useState<UserStats>({
    totalScans: 0,
    points: 0,
    savedPlants: 0,
    updatedAt: null
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTasksCount, setActiveTasksCount] = useState(0);

  useEffect(() => {
    if (user?.displayName && !newName) {
      setNewName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const tasksRef = collection(db, 'users', user.uid, 'tasks');
    const q = query(tasksRef, where('completed', '==', false));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveTasksCount(snapshot.size);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'tasks-count');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const statsRef = doc(db, 'users', user.uid, 'metadata', 'stats');
    const unsubscribe = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        setStats(doc.data() as UserStats);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'stats');
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;

    setIsUpdating(true);
    try {
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(user, { displayName: newName });
      
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', user.uid), { displayName: newName }, { merge: true });
      
      setIsSettingsOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  const level = Math.floor(stats.points / 500) + 1;
  const xpInLevel = stats.points % 500;
  const xpNeeded = 500;
  const progress = (xpInLevel / xpNeeded) * 100;

  const BADGES = [
    { id: 1, name: "Plant Parent", icon: <Leaf className="w-6 h-6 text-green-500" />, level: "Gold", description: "Scanned 50+ plants", achieved: stats.totalScans >= 50 },
    { id: 2, name: "Leafy Expert", icon: <Award className="w-6 h-6 text-yellow-500" />, level: "Silver", description: "10+ accurate diagnoses", achieved: stats.totalScans >= 10 },
    { id: 3, name: "Eco Warrior", icon: <Zap className="w-6 h-6 text-blue-500" />, level: "Bronze", description: "Earned 1000+ points", achieved: stats.points >= 1000 },
    { id: 4, name: "Green Thumb", icon: <Star className="w-6 h-6 text-purple-500" />, level: "Gold", description: "Saved 20 plants", achieved: stats.savedPlants >= 20 }
  ];

  const STATS_DISPLAY = [
    { label: "Total Scans", value: stats.totalScans.toLocaleString(), icon: <History className="w-5 h-5 text-blue-500" /> },
    { label: "Points", value: stats.points.toLocaleString(), icon: <Zap className="w-5 h-5 text-yellow-500" /> },
    { label: "Saved Plants", value: stats.savedPlants.toLocaleString(), icon: <Leaf className="w-5 h-5 text-green-500" /> },
    { label: "Active Tasks", value: activeTasksCount.toString(), icon: <CheckCircle2 className="w-5 h-5 text-orange-500" /> }
  ];

  return (
    <div className="min-h-screen bg-[#F0FFF0] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 p-10 bg-white rounded-[3rem] border border-[#C8E6C9] shadow-xl text-center"
          >
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#4CAF50] shadow-2xl mx-auto">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=4CAF50&color=fff`} 
                  alt={user.displayName || 'User'} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-10 h-10 bg-[#1B5E20] rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-extrabold text-[#1B5E20] tracking-tighter mb-1 uppercase">
              {user.displayName || 'Plant Lover'}
            </h2>
            <p className="text-[#4F4F4F] font-bold mb-6 opacity-60">{user.email}</p>
            
            <div className="flex justify-center gap-4 mb-8">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-4 bg-[#F0FFF0] hover:bg-[#4CAF50] hover:text-white text-[#1B5E20] rounded-2xl transition-all border border-[#C8E6C9] shadow-md"
              >
                <Settings className="w-6 h-6" />
              </button>
              <button 
                onClick={() => onNavigate('analytics')}
                className="p-4 bg-green-50 hover:bg-green-500 hover:text-white text-green-600 rounded-2xl transition-all border border-green-100 shadow-md"
              >
                <TrendingUp className="w-6 h-6" />
              </button>
              <button 
                onClick={() => auth.signOut()}
                className="p-4 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-2xl transition-all border border-red-100 shadow-md"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>

            {/* Settings Modal */}
            <AnimatePresence>
              {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-[#C8E6C9]"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-black text-[#1B5E20] uppercase tracking-tighter">Account Settings</h3>
                      <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                        <X className="w-6 h-6 text-gray-400" />
                      </button>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-[#4CAF50] uppercase tracking-widest mb-2">Display Name</label>
                        <input 
                          type="text" 
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full px-6 py-4 bg-[#F0FFF0] border border-[#C8E6C9] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] transition-all font-bold text-[#1B5E20]"
                          placeholder="Enter your name"
                        />
                      </div>

                      <div className="flex items-center justify-between p-6 bg-[#F0FFF0] rounded-2xl border border-[#C8E6C9]">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-[#4CAF50]" />
                          <div>
                            <p className="text-sm font-bold text-[#1B5E20]">Bangladesh Mode</p>
                            <p className="text-[10px] font-bold text-[#4CAF50] opacity-70">Localized plant context</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={localStorage.getItem('isBangladeshMode') === 'true'} onChange={(e) => {
                            localStorage.setItem('isBangladeshMode', e.target.checked.toString());
                            window.dispatchEvent(new Event('storage'));
                          }} />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4CAF50]"></div>
                        </label>
                      </div>

                      <button 
                        type="submit"
                        disabled={isUpdating}
                        className="w-full py-4 bg-[#1B5E20] text-white font-black uppercase tracking-widest rounded-2xl hover:bg-[#4CAF50] transition-all shadow-xl flex items-center justify-center gap-2"
                      >
                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="p-6 bg-[#1B5E20] rounded-[2rem] text-white text-left shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-widest opacity-70">Level {level}</span>
                <span className="text-xs font-black uppercase tracking-widest opacity-70">{xpInLevel} / {xpNeeded} XP</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-[#4CAF50]"
                />
              </div>
              <p className="text-[10px] font-bold opacity-60">{xpNeeded - xpInLevel} XP to next level</p>
            </div>

            {/* Weather Widget */}
            <div className="mt-8">
              <WeatherWidget />
            </div>

            {/* Task Manager */}
            <div className="mt-8">
              <TaskManager userId={user.uid} />
            </div>
          </motion.div>

          {/* Stats & Badges */}
          <div className="lg:col-span-8 space-y-8">
            {/* Growth Tracker */}
            <GrowthTracker userId={user.uid} onNavigate={onNavigate} />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS_DISPLAY.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-white rounded-[2rem] border border-[#C8E6C9] shadow-xl text-center hover:shadow-2xl transition-all"
                >
                  <div className="w-10 h-10 bg-[#F0FFF0] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    {stat.icon}
                  </div>
                  <h4 className="text-2xl font-black text-[#1B5E20] tracking-tighter">{stat.value}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="p-10 bg-white rounded-[3rem] border border-[#C8E6C9] shadow-xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-extrabold text-[#1B5E20] uppercase tracking-tighter">Achievement Badges</h3>
                <button className="text-xs font-black text-[#4CAF50] uppercase tracking-widest hover:underline">View All</button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {BADGES.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className={`p-6 rounded-[2rem] border flex items-center gap-6 group transition-all shadow-sm hover:shadow-md ${badge.achieved ? 'bg-[#F0FFF0] border-[#C8E6C9] hover:bg-white' : 'bg-gray-50 border-gray-100 grayscale opacity-50'}`}
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      {badge.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-extrabold text-[#1B5E20] tracking-tight">{badge.name}</h4>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          badge.level === 'Gold' ? 'bg-yellow-100 text-yellow-600' : 
                          badge.level === 'Silver' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {badge.level}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-400">{badge.description}</p>
                      {!badge.achieved && <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mt-1">Locked</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="p-10 bg-white rounded-[3rem] border border-[#C8E6C9] shadow-xl">
              <h3 className="text-2xl font-extrabold text-[#1B5E20] uppercase tracking-tighter mb-8">Quick Navigation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button 
                  onClick={() => onNavigate('history')}
                  className="p-6 bg-white hover:bg-[#F0FFF0] text-[#1B5E20] font-bold rounded-[2rem] border border-[#C8E6C9] flex items-center justify-between group transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center"><History className="w-5 h-5 text-blue-500" /></div>
                    <span>Scan History</span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
                <button 
                  onClick={() => onNavigate('growth-log')}
                  className="p-6 bg-white hover:bg-[#F0FFF0] text-[#1B5E20] font-bold rounded-[2rem] border border-[#C8E6C9] flex items-center justify-between group transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
                    <span>Growth Log</span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
                <button 
                  onClick={() => onNavigate('scan')} // Assuming 'Saved Plants' might lead back to scan or a new 'saved' page if it existed
                  className="p-6 bg-white hover:bg-[#F0FFF0] text-[#1B5E20] font-bold rounded-[2rem] border border-[#C8E6C9] flex items-center justify-between group transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center"><Star className="w-5 h-5 text-green-500" /></div>
                    <span>Saved Plants</span>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
