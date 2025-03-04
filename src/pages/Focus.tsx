import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Music, 
  Volume2, 
  Coffee, 
  Clock,
  CheckCircle,
  BookOpen,
  AlertCircle,
  ListTodo,
  SkipForward,
  SkipBack,
  Headphones
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useTasks } from '@/context/TaskContext';

const musifyPlaylists = [
  { id: '1', name: 'Focus Flow', songs: 24, image: 'https://i.scdn.co/image/ab67706f00000002e4eadd417a05b2546e866934' },
  { id: '2', name: 'Deep Focus', songs: 18, image: 'https://i.scdn.co/image/ab67706f00000002fe24d7084be472288cd6ee6c' },
  { id: '3', name: 'Study Beats', songs: 32, image: 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc' },
  { id: '4', name: 'Instrumental Study', songs: 15, image: 'https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc' }
];

const currentlyPlayingSong = {
  title: "Focus Flow",
  artist: "Musify • Study Playlist",
  coverArt: "https://i.scdn.co/image/ab67706f00000002e4eadd417a05b2546e866934",
  progress: 35,
  duration: "3:42"
};

const Focus = () => {
  const { toast } = useToast();
  const { tasks, addTimeEntry } = useTasks();
  const [activeTab, setActiveTab] = useState('pomodoro');
  const [isMusifyConnected, setIsMusifyConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [customTime, setCustomTime] = useState(25);
  const interval = useRef<number | null>(null);
  
  const [currentSession, setCurrentSession] = useState<{
    startTime: string;
    startTimestamp: number;
    category: string;
  } | null>(null);
  
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchInterval = useRef<number | null>(null);
  
  const [focusTasks, setFocusTasks] = useState([
    { id: '1', title: 'Complete math assignment', completed: false },
    { id: '2', title: 'Review lecture notes', completed: false },
    { id: '3', title: 'Prepare for presentation', completed: false }
  ]);
  const [newTask, setNewTask] = useState('');
  
  const [volume, setVolume] = useState(50);
  
  useEffect(() => {
    const pendingTasks = tasks.filter(task => !task.completed);
    if (pendingTasks.length > 0) {
      const mappedTasks = pendingTasks.slice(0, 5).map(task => ({
        id: task.id,
        title: task.title,
        completed: false
      }));
      setFocusTasks([...mappedTasks, ...focusTasks]);
    }
  }, [tasks]);
  
  useEffect(() => {
    if (isRunning) {
      if (!currentSession) {
        const now = new Date();
        const formattedTime = now.getHours().toString().padStart(2, '0') + ':' + 
                             now.getMinutes().toString().padStart(2, '0');
        
        setCurrentSession({
          startTime: formattedTime,
          startTimestamp: Date.now(),
          category: activeTab === 'pomodoro' ? 'pomodoro' : 'custom'
        });
      }
      
      interval.current = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval.current!);
            setIsRunning(false);
            notifyTimerEnd();
            
            if (currentSession) {
              const durationInMinutes = Math.round((Date.now() - currentSession.startTimestamp) / 60000);
              addTimeEntry({
                startTime: currentSession.startTime,
                duration: durationInMinutes,
                category: currentSession.category,
                completed: true
              });
              
              setCurrentSession(null);
            }
            
            if (activeTab === 'pomodoro') {
              setPomodoroCount(prev => prev + 1);
            }
            
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (interval.current) {
      clearInterval(interval.current);
      
      if (currentSession && timeLeft > 0) {
        const durationInMinutes = Math.round((Date.now() - currentSession.startTimestamp) / 60000);
        if (durationInMinutes >= 1) {
          addTimeEntry({
            startTime: currentSession.startTime,
            duration: durationInMinutes,
            category: currentSession.category,
            completed: false
          });
        }
        setCurrentSession(null);
      }
    }
    
    return () => {
      if (interval.current) {
        clearInterval(interval.current);
      }
    };
  }, [isRunning, activeTab, addTimeEntry, currentSession, timeLeft]);
  
  useEffect(() => {
    if (isStopwatchRunning) {
      if (!currentSession) {
        const now = new Date();
        const formattedTime = now.getHours().toString().padStart(2, '0') + ':' + 
                             now.getMinutes().toString().padStart(2, '0');
        
        setCurrentSession({
          startTime: formattedTime,
          startTimestamp: Date.now(),
          category: 'stopwatch'
        });
      }
      
      stopwatchInterval.current = window.setInterval(() => {
        setStopwatchTime(prev => prev + 1);
      }, 1000);
    } else if (stopwatchInterval.current) {
      clearInterval(stopwatchInterval.current);
      
      if (currentSession && stopwatchTime > 0) {
        const durationInMinutes = Math.round(stopwatchTime / 60);
        if (durationInMinutes >= 1) {
          addTimeEntry({
            startTime: currentSession.startTime,
            duration: durationInMinutes,
            category: 'stopwatch',
            completed: true
          });
        }
        setCurrentSession(null);
      }
    }
    
    return () => {
      if (stopwatchInterval.current) {
        clearInterval(stopwatchInterval.current);
      }
    };
  }, [isStopwatchRunning, addTimeEntry, currentSession, stopwatchTime]);
  
  const notifyTimerEnd = () => {
    toast({
      title: "Time's up!",
      description: activeTab === 'pomodoro' 
        ? "Take a 5-minute break now." 
        : "Your focus session has ended.",
    });
    
    const audio = new Audio('/notification.mp3');
    audio.volume = volume / 100;
    audio.play().catch(e => console.log('Audio play failed:', e));
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStartPause = () => {
    setIsRunning(!isRunning);
    
    if (!isRunning) {
      toast({
        title: "Focus session started",
        description: "Stay focused and productive!",
      });
    }
  };
  
  const handleReset = () => {
    setIsRunning(false);
    
    if (currentSession) {
      const durationInMinutes = Math.round((Date.now() - currentSession.startTimestamp) / 60000);
      if (durationInMinutes >= 1) {
        addTimeEntry({
          startTime: currentSession.startTime,
          duration: durationInMinutes,
          category: currentSession.category,
          completed: false
        });
      }
      setCurrentSession(null);
    }
    
    if (activeTab === 'pomodoro') {
      setTimeLeft(25 * 60);
    } else if (activeTab === 'custom') {
      setTimeLeft(customTime * 60);
    }
    
    toast({
      title: "Timer reset",
      description: "Ready to start again when you are.",
    });
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsRunning(false);
    
    if (currentSession) {
      const durationInMinutes = activeTab === 'stopwatch' 
        ? Math.round(stopwatchTime / 60)
        : Math.round((Date.now() - currentSession.startTimestamp) / 60000);
      
      if (durationInMinutes >= 1) {
        addTimeEntry({
          startTime: currentSession.startTime,
          duration: durationInMinutes,
          category: currentSession.category,
          completed: false
        });
      }
      setCurrentSession(null);
    }
    
    if (value === 'pomodoro') {
      setTimeLeft(25 * 60);
    } else if (value === 'custom') {
      setTimeLeft(customTime * 60);
    } else if (value === 'stopwatch') {
      setStopwatchTime(0);
    }
  };
  
  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setCustomTime(Math.min(Math.max(value, 1), 120));
    setTimeLeft(Math.min(Math.max(value, 1), 120) * 60);
  };
  
  const handleStopwatchStartPause = () => {
    setIsStopwatchRunning(!isStopwatchRunning);
  };
  
  const handleStopwatchReset = () => {
    setIsStopwatchRunning(false);
    
    if (currentSession) {
      const durationInMinutes = Math.round(stopwatchTime / 60);
      if (durationInMinutes >= 1) {
        addTimeEntry({
          startTime: currentSession.startTime,
          duration: durationInMinutes,
          category: 'stopwatch',
          completed: false
        });
      }
      setCurrentSession(null);
    }
    
    setStopwatchTime(0);
  };
  
  const handleAddTask = () => {
    if (!newTask.trim()) return;
    
    setFocusTasks(prev => [
      ...prev, 
      { id: Date.now().toString(), title: newTask, completed: false }
    ]);
    setNewTask('');
  };
  
  const handleToggleTask = (id: string) => {
    setFocusTasks(prev => 
      prev.map(task => 
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
    
    const task = focusTasks.find(t => t.id === id);
    if (task && !task.completed) {
      toast({
        title: "Task completed",
        description: "Well done! Keep up the good work.",
      });
    }
  };

  const handleConnectMusify = () => {
    setIsMusifyConnected(true);
    toast({
      title: "Musify Connected",
      description: "Your Musify account has been successfully connected.",
    });
  };
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleSelectPlaylist = (id: string) => {
    setSelectedPlaylist(id);
    setIsPlaying(true);
    toast({
      title: "Playing Playlist",
      description: "Now playing " + musifyPlaylists.find(p => p.id === id)?.name,
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Focus Session</h1>
        <p className="text-gray-600">Stay productive with timers, trackers, and focus tools</p>
      </div>
      
      {isMusifyConnected && isPlaying && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white z-30 p-3 shadow-lg">
          <div className="container mx-auto flex items-center justify-between max-w-7xl">
            <div className="flex items-center">
              <img 
                src={currentlyPlayingSong.coverArt} 
                alt="Album cover" 
                className="h-12 w-12 rounded mr-3" 
              />
              <div>
                <h4 className="font-medium text-sm">{currentlyPlayingSong.title}</h4>
                <p className="text-xs text-gray-400">{currentlyPlayingSong.artist}</p>
              </div>
            </div>
            
            <div className="flex-1 mx-6 hidden md:block">
              <div className="flex items-center justify-center gap-4">
                <Button size="icon" variant="ghost" className="text-gray-300 hover:text-white">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  className="bg-white text-black hover:bg-gray-200 rounded-full h-8 w-8"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="text-gray-300 hover:text-white">
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">1:18</span>
                <Progress value={currentlyPlayingSong.progress} className="h-1 bg-gray-700" />
                <span className="text-xs text-gray-400">{currentlyPlayingSong.duration}</span>
              </div>
            </div>
            
            <div className="flex items-center md:gap-4">
              <Button 
                size="icon" 
                className="md:hidden bg-white text-black hover:bg-gray-200 rounded-full h-8 w-8 mr-2"
                onClick={handlePlayPause}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <div className="flex items-center gap-2 ml-2 max-w-[100px] md:max-w-[150px]">
                <Volume2 className="h-4 w-4 text-gray-400" />
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(values) => setVolume(values[0])}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Focus Timer</CardTitle>
              <CardDescription>
                Use the timer to track your focus sessions and breaks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pomodoro" onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
                  <TabsTrigger value="stopwatch">Stopwatch</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pomodoro" className="mt-6">
                  <div className="flex flex-col items-center space-y-8">
                    <div className="text-center">
                      <div className="text-7xl font-bold mb-4">{formatTime(timeLeft)}</div>
                      <p className="text-gray-500">Focus for 25 minutes, then take a 5-minute break</p>
                    </div>
                    
                    <Progress value={(25 * 60 - timeLeft) / (25 * 60) * 100} className="w-full h-2" />
                    
                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-32"
                        onClick={handleReset}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                      <Button 
                        size="lg" 
                        className="w-32 bg-blue-600 hover:bg-blue-700"
                        onClick={handleStartPause}
                      >
                        {isRunning ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
                      <Coffee className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">Pomodoros Completed: {pomodoroCount}</p>
                        <p className="text-xs text-gray-500">
                          Total focus time: {Math.floor(pomodoroCount * 25 / 60)} hours {pomodoroCount * 25 % 60} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="stopwatch" className="mt-6">
                  <div className="flex flex-col items-center space-y-8">
                    <div className="text-center">
                      <div className="text-7xl font-bold mb-4">{formatTime(stopwatchTime)}</div>
                      <p className="text-gray-500">Track how long you've been working</p>
                    </div>
                    
                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-32"
                        onClick={handleStopwatchReset}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                      <Button 
                        size="lg" 
                        className="w-32 bg-blue-600 hover:bg-blue-700"
                        onClick={handleStopwatchStartPause}
                      >
                        {isStopwatchRunning ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="custom" className="mt-6">
                  <div className="flex flex-col items-center space-y-8">
                    <div className="text-center">
                      <div className="text-7xl font-bold mb-4">{formatTime(timeLeft)}</div>
                      <p className="text-gray-500">Set your own focus session length</p>
                    </div>
                    
                    <div className="w-full max-w-xs">
                      <Label htmlFor="custom-time">Session duration (minutes):</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Input
                          id="custom-time"
                          type="number"
                          min="1"
                          max="120"
                          value={customTime}
                          onChange={handleCustomTimeChange}
                          className="w-24"
                        />
                        <span className="text-sm text-gray-500">min</span>
                      </div>
                    </div>
                    
                    <Progress value={(customTime * 60 - timeLeft) / (customTime * 60) * 100} className="w-full h-2" />
                    
                    <div className="flex gap-4">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-32"
                        onClick={handleReset}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                      <Button 
                        size="lg" 
                        className="w-32 bg-blue-600 hover:bg-blue-700"
                        onClick={handleStartPause}
                      >
                        {isRunning ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Start
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Focus Tasks</CardTitle>
              <CardDescription>
                Add specific tasks for this focus session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input 
                  placeholder="Add a task for this focus session..." 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                />
                <Button onClick={handleAddTask}>Add</Button>
              </div>
              
              <div className="space-y-2 mt-4">
                {focusTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center justify-between p-3 rounded-md border ${
                      task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-full h-6 w-6 ${
                          task.completed ? 'text-green-500' : 'text-gray-400'
                        }`}
                        onClick={() => handleToggleTask(task.id)}
                      >
                        <CheckCircle className={`h-5 w-5 ${task.completed ? 'fill-green-500' : ''}`} />
                      </Button>
                      <span className={task.completed ? 'line-through text-gray-500' : ''}>
                        {task.title}
                      </span>
                    </div>
                  </div>
                ))}
                
                {focusTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ListTodo className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Add tasks for your focus session</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-purple-500" />
                  <CardTitle>Musify</CardTitle>
                </div>
                {isMusifyConnected && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                    Connected
                  </Badge>
                )}
              </div>
              <CardDescription>
                Connect to Musify to play focus music
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isMusifyConnected ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Music className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-center mb-4">
                    Connect your Musify account to listen to focus music while you work
                  </p>
                  <Button 
                    onClick={handleConnectMusify} 
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Connect Musify
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {musifyPlaylists.map(playlist => (
                      <div
                        key={playlist.id}
                        className={`border rounded-md p-2 cursor-pointer transition-all hover:shadow-md ${
                          selectedPlaylist === playlist.id ? 'border-purple-500 bg-purple-50' : ''
                        }`}
                        onClick={() => handleSelectPlaylist(playlist.id)}
                      >
                        <img 
                          src={playlist.image} 
                          alt={playlist.name} 
                          className="w-full h-24 object-cover rounded-md mb-2" 
                        />
                        <h4 className="font-medium text-sm truncate">{playlist.name}</h4>
                        <p className="text-xs text-gray-500">{playlist.songs} songs</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Headphones className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-500">Volume</span>
                    </div>
                    <div className="flex items-center gap-2 w-32">
                      <Slider
                        value={[volume]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(values) => setVolume(values[0])}
                      />
                      <span className="text-xs text-gray-500 w-5">{volume}%</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Study Tips</CardTitle>
              <CardDescription>Techniques to maximize your focus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-700">Pomodoro Technique</h4>
                    <p className="text-sm text-blue-600 mt-1">
                      Work for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer 15-30 minute break.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-700">Avoid Multitasking</h4>
                    <p className="text-sm text-amber-600 mt-1">
                      Focus on one task at a time. Multitasking can reduce productivity by up to 40%.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-md border border-green-100">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-700">Time Block Your Day</h4>
                    <p className="text-sm text-green-600 mt-1">
                      Assign specific times for tasks to create structure and improve focus.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Focus Stats</CardTitle>
              <CardDescription>Your productivity summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Today</h4>
                  <p className="text-2xl font-bold mt-1">{pomodoroCount * 25} min</p>
                  <p className="text-xs text-gray-500 mt-1">Focus time</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500">Today</h4>
                  <p className="text-2xl font-bold mt-1">{focusTasks.filter(t => t.completed).length}</p>
                  <p className="text-xs text-gray-500 mt-1">Tasks completed</p>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Daily Streak</h4>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <div 
                      key={index} 
                      className={`h-6 w-full rounded-sm ${
                        index < 5 ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">Mon</span>
                  <span className="text-xs text-gray-500">Sun</span>
                </div>
                <p className="text-sm text-center mt-2 font-medium">5 day streak! 🔥</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Focus;
