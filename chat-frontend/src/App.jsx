import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import CustomCursor from "./components/CustomCursor";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [socket, setSocket] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [authName, setAuthName] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [error, setError] = useState("");

  const [room, setRoom] = useState("lobby");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const msgsRef = useRef(null);

  // Decode JWT and restore user on mount
  useEffect(() => {
    if (token && !user) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("Restored user from token:", payload);
        setUser({ username: payload.username, id: payload.id });
      } catch (e) {
        console.error("Invalid token", e);
        setToken(null);
        localStorage.removeItem('token');
      }
    }
  }, [token, user]);

  // Auth Effect
  useEffect(() => {
    if (!token) {
      if (socket) { socket.disconnect(); setSocket(null); }
      return;
    }
    const s = io(API, {
      auth: { token },
      transports: ["websocket", "polling"]
    });
    setSocket(s);

    s.on('connect', () => console.log('connected', s.id));
    s.on('connect_error', (err) => {
      console.error(err);
      setToken(null);
      localStorage.removeItem('token');
      setError("Session expired or invalid");
    });

    s.on('message', (m) => setMessages(prev => [...prev, { ...m, local: m.username === user?.username }]));
    s.on('user_joined', ({ username }) => {
      setMessages(prev => [...prev, { system: true, text: `${username} joined` }]);
    });

    return () => s.disconnect();
  }, [token, user?.username]);

  useEffect(() => {
    if (token && room) {
      fetch(`${API}/rooms/${room}/messages`).then(r => r.json()).then(d => setMessages(d || []));
    }
  }, [room, token]);

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleAuth(e) {
    e.preventDefault();
    setError("");
    const endpoint = isLogin ? '/login' : '/register';
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authName, password: authPass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      if (isLogin) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setUser({ username: data.username, id: data.id });
      } else {
        setIsLogin(true);
        setError("Registered! Please login.");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function joinRoom() {
    if (!socket) return;
    socket.emit('join', { room });
    // Load history when joining
    fetch(`${API}/rooms/${room}/messages`).then(r => r.json()).then(d => {
      setMessages(d || []);
      setMessages(prev => [...prev, { system: true, text: `You joined ${room}` }]);
    });
  }

  function send() {
    if (!socket || !text.trim()) return;
    const payload = { room, text };
    socket.emit('message', payload);
    // REMOVED optimistic update to fix double text
    setText('');
  }

  function logout() {
    setToken(null);
    localStorage.removeItem('token');
    setUser(null);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <CustomCursor />
        <div className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Login' : 'Register'}</h2>
          {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleAuth}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input value={authName} onChange={e => setAuthName(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" required />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} className="mt-1 block w-full border rounded px-3 py-2" required />
            </div>
            <button type="submit" className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition">{isLogin ? 'Login' : 'Register'}</button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:underline">
              {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <CustomCursor />
      <aside className="w-72 border-r bg-white p-6 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">AeroChat</h2>
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">Logged in as <strong>{user?.username || 'User'}</strong></div>
          <button onClick={logout} className="text-xs text-red-500 hover:underline">Logout</button>
        </div>
        <div className="mb-4">
          <label className="block text-xs text-slate-500">Room</label>
          <input value={room} onChange={e => setRoom(e.target.value)} className="mt-1 px-3 py-2 border rounded w-full" />
          <button onClick={joinRoom} className="mt-3 w-full bg-black text-white px-3 py-2 rounded">Join</button>
        </div>
      </aside>

      <main className="flex-1 p-6 flex flex-col">
        <div className="flex-1 overflow-auto mb-4" ref={msgsRef} id="messages">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mb-3 ${m.system ? 'text-slate-500 text-sm' : ''}`}>
                  {!m.system ? (
                    <div className={`p-3 rounded-2xl ${m.username === user?.username ? 'bg-black text-white self-end' : 'bg-white shadow'}`}>
                      <div className="text-sm font-medium">{m.username || 'Anon'}</div>
                      <div className="mt-1">{m.text}</div>
                    </div>
                  ) : <div className="text-center">{m.text}</div>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="max-w-3xl mx-auto w-full">
          <div className="flex gap-3 items-center">
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} className="flex-1 px-4 py-3 border rounded-full" placeholder="Message..." />
            <button onClick={send} className="px-5 py-3 bg-black text-white rounded-full">Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}
