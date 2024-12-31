import Navbar from "@/components/navbar";
import React from "react";

const Homepage = () => {
  // Timer state
  const [workTime, setWorkTime] = React.useState(30);
  const [breakTime, setBreakTime] = React.useState(5);
  const [timeLeft, setTimeLeft] = React.useState(workTime * 60);
  const [isActive, setIsActive] = React.useState(false);
  const [isWork, setIsWork] = React.useState(true);
  const [completedSessions, setCompletedSessions] = React.useState([]);
  const [stats, setStats] = React.useState({
    today: { count: 0, hours: 0, minutes: 0 },
    thisMonth: { count: 0, hours: 0, minutes: 0 },
    thisYear: { count: 0, hours: 0, minutes: 0 }
  });

  // Task state
  const [tasks, setTasks] = React.useState([]);
  const [newTask, setNewTask] = React.useState('');
  const [editingTask, setEditingTask] = React.useState(null);
  const [editText, setEditText] = React.useState('');

  React.useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');
    setTasks(storedTasks);
  }, []);

  const addTask = () => {
    if (newTask.trim()) {
      const updatedTasks = [...tasks, { id: Date.now(), text: newTask }];
      setTasks(updatedTasks);
      localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));
      setNewTask('');
    }
  };

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));
  };

  const startEdit = (task) => {
    setEditingTask(task.id);
    setEditText(task.text);
  };

  const saveEdit = () => {
    const updatedTasks = tasks.map(task =>
      task.id === editingTask ? { ...task, text: editText } : task
    );
    setTasks(updatedTasks);
    localStorage.setItem('pomodoroTasks', JSON.stringify(updatedTasks));
    setEditingTask(null);
    setEditText('');
  };

  React.useEffect(() => {
    let interval;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  React.useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem('pomodoroData') || '{}');
    if (storedData.completedSessions) {
      setCompletedSessions(storedData.completedSessions);
      updateStats(storedData.completedSessions);
    }
  }, []);

  const calculateTime = (sessions) => {
    const totalMinutes = sessions.reduce((acc, session) => acc + session.duration, 0);
    return {
      hours: Math.floor(totalMinutes / 60),
      minutes: totalMinutes % 60
    };
  };

  const updateStats = (sessions) => {
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();

    const todaySessions = sessions.filter(s => s.date === today);
    const monthSessions = sessions.filter(s => new Date(s.date).getMonth() === thisMonth);
    const yearSessions = sessions.filter(s => new Date(s.date).getFullYear() === thisYear);

    setStats({
      today: { count: todaySessions.length, ...calculateTime(todaySessions) },
      thisMonth: { count: monthSessions.length, ...calculateTime(monthSessions) },
      thisYear: { count: yearSessions.length, ...calculateTime(yearSessions) }
    });
  };

  const handleTimerComplete = () => {
    const audio = document.getElementById('dingSound');
    audio.play();

    const newSession = {
      date: new Date().toDateString(),
      duration: isWork ? workTime : breakTime,
      type: isWork ? 'work' : 'break'
    };

    const updatedSessions = [...completedSessions, newSession];
    setCompletedSessions(updatedSessions);
    updateStats(updatedSessions);
    localStorage.setItem('pomodoroData', JSON.stringify({ completedSessions: updatedSessions }));

    setIsActive(false);
    setIsWork(!isWork);
    setTimeLeft(isWork ? breakTime * 60 : workTime * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCalendarDays = () => {
    const days = [];
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), i).toDateString();
      days.push({ day: i, hasSession: completedSessions.some(s => s.date === date) });
    }

    return days;
  };

  const formatDuration = (hours, minutes) => hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const clearAllData = () => {
    setCompletedSessions([]);
    setStats({
      today: { count: 0, hours: 0, minutes: 0 },
      thisMonth: { count: 0, hours: 0, minutes: 0 },
      thisYear: { count: 0, hours: 0, minutes: 0 }
    });
    localStorage.removeItem('pomodoroData');
  };

  const validateTimerInput = (value, type) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 1) return 1;
    if (type === 'work' && numValue > 120) return 120;
    if (type === 'break' && numValue > 60) return 60;
    return numValue;
  };

  return (
    <div className="flex bg-gray-900 min-h-screen">
      <div className="w-1/4 bg-gray-800 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Tasks & Notes</h2>
        <div className="mb-6">
          <textarea
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-700 text-white mb-3"
            placeholder="Add a new task or note..."
            rows="3"
          />
          <button
            onClick={addTask}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            Add Task
          </button>
        </div>
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="bg-gray-700 p-3 rounded-lg">
              {editingTask === task.id ? (
                <>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full p-2 rounded-lg bg-gray-600 text-white mb-2"
                    rows="3"
                  />
                  <button
                    onClick={saveEdit}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg mr-2 hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingTask(null)}
                    className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <p className="text-white break-words">{task.text}</p>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => startEdit(task)}
                      className="text-sm bg-yellow-600 text-white px-2 py-1 rounded-lg hover:bg-yellow-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-sm bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={clearAllData} className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-all">Clear All Data</button>

          <div className="bg-gray-800 rounded-xl p-8 shadow-2xl">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-6">Pomodoro Timer</h1>
              <div className="flex justify-center space-x-8 mb-8">
                <div className="flex flex-col items-center">
                  <label className="text-gray-300 mb-2">Work (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={workTime}
                    onChange={(e) => {
                      const validatedValue = validateTimerInput(e.target.value, 'work');
                      setWorkTime(validatedValue);
                      if (!isActive && isWork) setTimeLeft(validatedValue * 60);
                    }}
                    className="w-24 p-3 rounded-lg bg-gray-700 text-white text-center focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <label className="text-gray-300 mb-2">Break (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={breakTime}
                    onChange={(e) => {
                      const validatedValue = validateTimerInput(e.target.value, 'break');
                      setBreakTime(validatedValue);
                      if (!isActive && !isWork) setTimeLeft(validatedValue * 60);
                    }}
                    className="w-24 p-3 rounded-lg bg-gray-700 text-white text-center focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="text-8xl font-mono text-white mb-8">{formatTime(timeLeft)}</div>
              <div className="space-x-4">
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`${
                    isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  } text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105`}
                >
                  {isActive ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={() => {
                    setIsActive(false);
                    setTimeLeft(isWork ? workTime * 60 : breakTime * 60);
                  }}
                  className="bg-gray-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-3xl font-bold text-white mb-6">Your Progress</h2>
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-gray-300 mb-2">Today</h3>
                <p className="text-3xl text-white mb-1">{stats.today.count}</p>
                <p className="text-gray-400">{formatDuration(stats.today.hours, stats.today.minutes)}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-gray-300 mb-2">This Month</h3>
                <p className="text-3xl text-white mb-1">{stats.thisMonth.count}</p>
                <p className="text-gray-400">{formatDuration(stats.thisMonth.hours, stats.thisMonth.minutes)}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-gray-300 mb-2">This Year</h3>
                <p className="text-3xl text-white mb-1">{stats.thisYear.count}</p>
                <p className="text-gray-400">{formatDuration(stats.thisYear.hours, stats.thisYear.minutes)}</p>
              </div>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl">
              <h3 className="text-gray-300 mb-6 text-xl">Activity Calendar</h3>
              <div className="grid grid-cols-7 gap-3">
                {getCalendarDays().map((day, i) => (
                  <div
                    key={i}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${
                      day?.hasSession ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
                    } ${!day ? 'opacity-0' : 'cursor-pointer hover:scale-110'}`}
                    title={day ? `Day ${day.day}` : ''}
                  >
                    {day?.day}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <audio id="dingSound" src="/ding.mp3"></audio>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
