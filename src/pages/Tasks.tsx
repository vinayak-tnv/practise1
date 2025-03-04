
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Search, Filter, ArrowUpDown, Clock, X, Calendar } from 'lucide-react';
import TaskCard from '@/components/dashboard/TaskCard';
import DonutChart from '@/components/charts/DonutChart';
import PriorityChart from '@/components/charts/PriorityChart';
import { CompletionStatus, PriorityStatus, RecurrencePattern, WeekendPreference, SleepSchedule } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { useTasks } from '@/context/TaskContext';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const Tasks = () => {
  const { toast } = useToast();
  const { tasks, addTask, toggleTaskCompletion, deleteTask } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    time: '',
    duration: '',
    priority: 'medium',
    category: 'work',
    date: new Date().toISOString().split('T')[0],
    recurrence: {
      enabled: false,
      type: 'none',
      interval: 1,
      endDate: '',
      daysOfWeek: []
    },
    weekendPreference: {
      treatAsWorkday: false,
      customHours: ''
    },
    sleepSchedule: {
      bedtime: '',
      wakeupTime: '',
      quality: 'good' as 'poor' | 'fair' | 'good' | 'excellent'
    }
  });

  const location = window.location;
  const params = new URLSearchParams(location.search);
  const timeParam = params.get('time');

  useEffect(() => {
    if (timeParam) {
      setNewTask(prev => ({
        ...prev,
        time: timeParam
      }));
      setNewTaskOpen(true);
    }
  }, [timeParam]);

  const formatTo24h = (timeString: string): string => {
    if (!timeString) return '';
    if (!timeString.includes('AM') && !timeString.includes('PM')) {
      return timeString;
    }
    
    const [time, modifier] = timeString.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = modifier === 'AM' ? '00' : '12';
    } else if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const formatTo12h = (timeString: string): string => {
    if (!timeString) return '';
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    
    if (hour === 0) {
      return `12:${minutes} AM`;
    } else if (hour < 12) {
      return `${hour}:${minutes} AM`;
    } else if (hour === 12) {
      return `12:${minutes} PM`;
    } else {
      return `${hour - 12}:${minutes} PM`;
    }
  };

  const handleToggleComplete = (taskId: string) => {
    toggleTaskCompletion(taskId);
    
    const taskToUpdate = tasks.find(task => task.id === taskId);
    
    if (taskToUpdate) {
      const newCompleted = !taskToUpdate.completed;
      
      if (newCompleted) {
        toast({
          title: "Task completed",
          description: `You've completed "${taskToUpdate.title}"!`,
        });
      }
    }
  };
  
  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    
    if (taskToDelete) {
      deleteTask(taskId);
      
      toast({
        title: "Task deleted",
        description: `"${taskToDelete.title}" has been removed from your task list.`,
      });
    }
  };

  const handleNewTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleRecurrenceChange = (field: string, value: any) => {
    setNewTask(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        [field]: value
      }
    }));
  };

  const handleDayOfWeekToggle = (day: number) => {
    setNewTask(prev => {
      const daysOfWeek = [...(prev.recurrence.daysOfWeek || [])];
      
      if (daysOfWeek.includes(day)) {
        const index = daysOfWeek.indexOf(day);
        daysOfWeek.splice(index, 1);
      } else {
        daysOfWeek.push(day);
      }
      
      return {
        ...prev,
        recurrence: {
          ...prev.recurrence,
          daysOfWeek
        }
      };
    });
  };

  const handleWeekendPreferenceChange = (field: string, value: any) => {
    setNewTask(prev => ({
      ...prev,
      weekendPreference: {
        ...prev.weekendPreference,
        [field]: value
      }
    }));
  };

  const handleSleepScheduleChange = (field: string, value: any) => {
    setNewTask(prev => ({
      ...prev,
      sleepSchedule: {
        ...prev.sleepSchedule,
        [field]: value
      }
    }));
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Task title required",
        description: "Please enter a title for your new task.",
        variant: "destructive"
      });
      return;
    }

    const time24h = formatTo24h(newTask.time || '12:00 PM');

    let recurrence: RecurrencePattern | undefined = undefined;
    
    if (newTask.recurrence.enabled && newTask.recurrence.type !== 'none') {
      recurrence = {
        type: newTask.recurrence.type as 'daily' | 'weekly' | 'monthly' | 'custom',
        interval: newTask.recurrence.interval
      };
      
      if (newTask.recurrence.endDate) {
        recurrence.endDate = newTask.recurrence.endDate;
      }
      
      if (newTask.recurrence.type === 'weekly' && newTask.recurrence.daysOfWeek.length > 0) {
        recurrence.daysOfWeek = newTask.recurrence.daysOfWeek;
      }
    }

    let weekendPreference: WeekendPreference | undefined = undefined;
    if (newTask.weekendPreference.treatAsWorkday || newTask.weekendPreference.customHours) {
      weekendPreference = {
        treatAsWorkday: newTask.weekendPreference.treatAsWorkday,
        customHours: newTask.weekendPreference.customHours || undefined
      };
    }

    let sleepSchedule: SleepSchedule | undefined = undefined;
    if (newTask.sleepSchedule.bedtime || newTask.sleepSchedule.wakeupTime) {
      sleepSchedule = {
        bedtime: newTask.sleepSchedule.bedtime,
        wakeupTime: newTask.sleepSchedule.wakeupTime,
        quality: newTask.sleepSchedule.quality
      };
    }

    addTask({
      title: newTask.title,
      description: newTask.description,
      time: time24h,
      duration: newTask.duration,
      priority: newTask.priority as 'high' | 'medium' | 'low',
      category: newTask.category as 'work' | 'personal' | 'meeting' | 'health',
      completed: false,
      date: newTask.date,
      recurrence,
      weekendPreference,
      sleepSchedule
    });

    setNewTaskOpen(false);
    setNewTask({
      title: '',
      description: '',
      time: '',
      duration: '',
      priority: 'medium',
      category: 'work',
      date: new Date().toISOString().split('T')[0],
      recurrence: {
        enabled: false,
        type: 'none',
        interval: 1,
        endDate: '',
        daysOfWeek: []
      },
      weekendPreference: {
        treatAsWorkday: false,
        customHours: ''
      },
      sleepSchedule: {
        bedtime: '',
        wakeupTime: '',
        quality: 'good'
      }
    });

    if (timeParam) {
      window.history.replaceState({}, '', '/tasks');
    }

    toast({
      title: "Task added",
      description: `"${newTask.title}" has been added to your task list.`,
    });
  };

  const filteredTasks = tasks.filter(task => {
    if (activeStatus === 'pending' && task.completed) return false;
    if (activeStatus === 'completed' && !task.completed) return false;
    
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const currentCompletionStatus = {
    completed: tasks.filter(task => task.completed).length,
    pending: tasks.filter(task => !task.completed).length
  };

  const currentPriorityStatus = {
    high: tasks.filter(task => task.priority === 'high').length,
    medium: tasks.filter(task => task.priority === 'medium').length,
    low: tasks.filter(task => task.priority === 'low').length
  };

  const daysOfWeek = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tasks</h1>
        <p className="text-gray-600">Manage and organize all your tasks</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tasks..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </Button>
              
              <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-black text-white hover:bg-gray-800">
                    <Plus className="h-4 w-4" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Add the details of your new task below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Task title"
                        value={newTask.title}
                        onChange={handleNewTaskChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        name="description"
                        placeholder="Brief description"
                        value={newTask.description}
                        onChange={handleNewTaskChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="time">Time (24h format)</Label>
                        <Input
                          id="time"
                          name="time"
                          type="time"
                          placeholder="14:00"
                          value={newTask.time}
                          onChange={handleNewTaskChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (Optional)</Label>
                        <Input
                          id="duration"
                          name="duration"
                          placeholder="1h"
                          value={newTask.duration}
                          onChange={handleNewTaskChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value) => handleSelectChange('priority', value)}
                        >
                          <SelectTrigger id="priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newTask.category}
                          onValueChange={(value) => handleSelectChange('category', value)}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="work">Work</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={newTask.date}
                        onChange={handleNewTaskChange}
                      />
                    </div>
                    
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="recurrence" 
                          checked={newTask.recurrence.enabled}
                          onCheckedChange={(checked) => 
                            handleRecurrenceChange('enabled', checked === true)
                          }
                        />
                        <Label htmlFor="recurrence" className="font-medium flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Make this a recurring task
                        </Label>
                      </div>
                      
                      {newTask.recurrence.enabled && (
                        <div className="space-y-4 pl-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="recurrenceType">Recurrence Type</Label>
                              <Select
                                value={newTask.recurrence.type}
                                onValueChange={(value) => handleRecurrenceChange('type', value)}
                              >
                                <SelectTrigger id="recurrenceType">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="interval">Interval</Label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  id="interval"
                                  type="number"
                                  min="1"
                                  placeholder="1"
                                  value={newTask.recurrence.interval}
                                  onChange={(e) => 
                                    handleRecurrenceChange('interval', parseInt(e.target.value) || 1)
                                  }
                                  className="w-full"
                                />
                                <span className="text-sm text-gray-500 whitespace-nowrap">
                                  {newTask.recurrence.type === 'daily' ? 'day(s)' : 
                                   newTask.recurrence.type === 'weekly' ? 'week(s)' : 
                                   newTask.recurrence.type === 'monthly' ? 'month(s)' : 'interval'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {newTask.recurrence.type === 'weekly' && (
                            <div className="space-y-2">
                              <Label>Days of Week</Label>
                              <div className="flex flex-wrap gap-2">
                                {daysOfWeek.map(day => (
                                  <Button
                                    key={day.value}
                                    type="button"
                                    variant={newTask.recurrence.daysOfWeek.includes(day.value) ? 'default' : 'outline'}
                                    className="min-w-[45px] py-1 px-2"
                                    onClick={() => handleDayOfWeekToggle(day.value)}
                                  >
                                    {day.label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label htmlFor="endDate">End Date (Optional)</Label>
                            <Input
                              id="endDate"
                              type="date"
                              value={newTask.recurrence.endDate}
                              onChange={(e) => handleRecurrenceChange('endDate', e.target.value)}
                              min={newTask.date}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="weekendPreference" 
                          checked={newTask.weekendPreference.treatAsWorkday}
                          onCheckedChange={(checked) => 
                            handleWeekendPreferenceChange('treatAsWorkday', checked === true)
                          }
                        />
                        <Label htmlFor="weekendPreference" className="font-medium">
                          Treat weekend as workday
                        </Label>
                      </div>
                      
                      {!newTask.weekendPreference.treatAsWorkday && (
                        <div className="space-y-2 pl-6">
                          <Label htmlFor="customHours">Custom Hours for Weekend (Optional)</Label>
                          <Input
                            id="customHours"
                            placeholder="e.g., 10:00-14:00"
                            value={newTask.weekendPreference.customHours}
                            onChange={(e) => handleWeekendPreferenceChange('customHours', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-sm font-medium">Sleep Schedule</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bedtime">Bedtime</Label>
                          <Input
                            id="bedtime"
                            type="time"
                            value={newTask.sleepSchedule.bedtime}
                            onChange={(e) => handleSleepScheduleChange('bedtime', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="wakeupTime">Wake-up Time</Label>
                          <Input
                            id="wakeupTime"
                            type="time"
                            value={newTask.sleepSchedule.wakeupTime}
                            onChange={(e) => handleSleepScheduleChange('wakeupTime', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sleepQuality">Sleep Quality</Label>
                        <Select
                          value={newTask.sleepSchedule.quality}
                          onValueChange={(value) => handleSleepScheduleChange('quality', value)}
                        >
                          <SelectTrigger id="sleepQuality">
                            <SelectValue placeholder="Select sleep quality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="poor">Poor</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="excellent">Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => {
                      setNewTaskOpen(false);
                      if (timeParam) {
                        window.history.replaceState({}, '', '/tasks');
                      }
                    }}>Cancel</Button>
                    <Button onClick={handleAddTask}>Add Task</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Tabs defaultValue="all" onValueChange={(value) => setActiveStatus(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {filteredTasks.length > 0 ? (
                <div className="space-y-2">
                  {filteredTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDeleteTask={handleDeleteTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No tasks found</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              {filteredTasks.length > 0 ? (
                <div className="space-y-2">
                  {filteredTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDeleteTask={handleDeleteTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No pending tasks</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              {filteredTasks.length > 0 ? (
                <div className="space-y-2">
                  {filteredTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDeleteTask={handleDeleteTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No completed tasks</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Task Summary</CardTitle>
              <CardDescription>Your task completion statistics</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Completion Status</h4>
                <DonutChart data={currentCompletionStatus} />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Priority Distribution</h4>
                <PriorityChart data={currentPriorityStatus} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Quick Add</CardTitle>
              <CardDescription>Create a new task quickly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input 
                  placeholder="Task title" 
                  value={newTask.title}
                  name="title"
                  onChange={handleNewTaskChange}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => handleSelectChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newTask.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleAddTask}>Add Task</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Removed AiChatSuggestions reference */}
    </div>
  );
};

export default Tasks;
