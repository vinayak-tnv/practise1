
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
  ListTodo
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AiChatAssistant from '@/components/dashboard/AiChatAssistant';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

const Focus = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pomodoro');
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [customTime, setCustomTime] = useState(25);
  const interval = useRef<number | null>(null);
  
  // Stopwatch states
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchInterval = useRef<number | null>(null);
  
  // Task states
  const [focusTasks, setFocusTasks] = useState([
    { id: '1', title: 'Complete math assignment', completed: false },
    { id: '2', title: 'Review lecture notes', completed: false },
    { id: '3', title: 'Prepare for presentation', completed: false }
  ]);
  const [newTask, setNewTask] = useState('');
  
  // Sound states
  const [volume, setVolume] = useState(50);
  const [selectedSound, setSelectedSound] = useState('rain');
  
  // Effect for timer
  useEffect(() => {
    if (isRunning) {
      interval.current = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Time is up
            clearInterval(interval.current!);
            setIsRunning(false);
            notifyTimerEnd();
            
            // Increment completed pomodoro count
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
    }
    
    return () => {
      if (interval.current) {
        clearInterval(interval.current);
      }
    };
  }, [isRunning, activeTab]);
  
  // Effect for stopwatch
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchInterval.current = window.setInterval(() => {
        setStopwatchTime(prev => prev + 1);
      }, 1000);
    } else if (stopwatchInterval.current) {
      clearInterval(stopwatchInterval.current);
    }
    
    return () => {
      if (stopwatchInterval.current) {
        clearInterval(stopwatchInterval.current);
      }
    };
  }, [isStopwatchRunning]);
  
  const notifyTimerEnd = () => {
    toast({
      title: "Time's up!",
      description: activeTab === 'pomodoro' 
        ? "Take a 5-minute break now." 
        : "Your focus session has ended.",
    });
    
    // Play a sound when timer ends
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
    
    if (value === 'pomodoro') {
      setTimeLeft(25 * 60);
    } else if (value === 'custom') {
      setTimeLeft(customTime * 60);
    }
  };
  
  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setCustomTime(Math.min(Math.max(value, 1), 120)); // Limit between 1-120 minutes
    setTimeLeft(Math.min(Math.max(value, 1), 120) * 60);
  };
  
  const handleStopwatchStartPause = () => {
    setIsStopwatchRunning(!isStopwatchRunning);
  };
  
  const handleStopwatchReset = () => {
    setIsStopwatchRunning(false);
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Focus Session</h1>
        <p className="text-gray-600">Stay productive with timers, trackers, and focus tools</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timer Column */}
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
                
                {/* Pomodoro Timer */}
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
                
                {/* Stopwatch */}
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
                
                {/* Custom Timer */}
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
          
          {/* Focus Session Tasks */}
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
        
        {/* Focus Tips and Tools Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Focus Ambience</CardTitle>
              <CardDescription>Background sounds to help you focus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={selectedSound === 'rain' ? 'default' : 'outline'}
                    className="h-auto py-3"
                    onClick={() => setSelectedSound('rain')}
                  >
                    <div className="flex flex-col items-center">
                      <Music className="h-5 w-5 mb-1" />
                      <span className="text-sm">Rain</span>
                    </div>
                  </Button>
                  <Button 
                    variant={selectedSound === 'forest' ? 'default' : 'outline'}
                    className="h-auto py-3"
                    onClick={() => setSelectedSound('forest')}
                  >
                    <div className="flex flex-col items-center">
                      <Music className="h-5 w-5 mb-1" />
                      <span className="text-sm">Forest</span>
                    </div>
                  </Button>
                  <Button 
                    variant={selectedSound === 'cafe' ? 'default' : 'outline'}
                    className="h-auto py-3"
                    onClick={() => setSelectedSound('cafe')}
                  >
                    <div className="flex flex-col items-center">
                      <Music className="h-5 w-5 mb-1" />
                      <span className="text-sm">Café</span>
                    </div>
                  </Button>
                  <Button 
                    variant={selectedSound === 'white' ? 'default' : 'outline'}
                    className="h-auto py-3"
                    onClick={() => setSelectedSound('white')}
                  >
                    <div className="flex flex-col items-center">
                      <Music className="h-5 w-5 mb-1" />
                      <span className="text-sm">White Noise</span>
                    </div>
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="volume">Volume</Label>
                    <span className="text-sm text-gray-500">{volume}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-gray-500" />
                    <Slider
                      id="volume"
                      value={[volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(values) => setVolume(values[0])}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
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

      {/* AI Chat Assistant */}
      <AiChatAssistant />
    </div>
  );
};

export default Focus;
