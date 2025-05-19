import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Code, Star, GitFork, Users, Settings, FileText, Book, LogOut, Plus, Bell, MessageSquare, Moon, Sun, Share2, Clock, Filter, ChevronDown, User, AlertCircle, Bot } from 'lucide-react';
import Profile from './profile';
import RepositoriesList from './RepositoriesList';
import ExplorerRepo from './explorerepo';
import { jwtDecode } from 'jwt-decode';
import IssueDisplay, { Issue } from './IssueDisplay';

interface JwtPayload {
    userId: string;
}

interface UserProfile {
    id: number;
    username: string;
    email: string;
    bio: string | null;
    avatar_path: string | null;
    is_admin: boolean;
    created_at: string;
    updated_at: string;
    repositories?: any[];
    issues?: any[];
    pull_requests?: any[];
}

interface Particle {
    size: number;
    x: number;
    y: number;
    speedX: number;
    speedY: number;
}

interface MenuItem {
    icon: React.ReactNode;
    label: string;
    id: string;
}

interface EnhancedSharecodeDashboardProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export default function EnhancedSharecodeDashboard({ darkMode, setDarkMode }: EnhancedSharecodeDashboardProps) {
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState<string>('repositories');
    const [menuCollapsed, setMenuCollapsed] = useState<boolean>(false);
    const [issuesTab, setIssuesTab] = useState<string>('open');
    const [particles, setParticles] = useState<Particle[]>(Array(15).fill(null).map(() => ({
        size: Math.random() * 4 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3
    })));
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) return;

                const decoded = jwtDecode<JwtPayload>(token);
                const response = await fetch(`http://localhost:5000/v1/api/users/${decoded.userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch user data');

                const userData = await response.json();
                setUser(userData.data);
            } catch (err) {
                console.error('Error fetching user data:', err);
            }
        };

        fetchUserData();
    }, [])

    const issues: Issue[] = [
        {
            id: "ISS-1342",
            title: "Neural network fails to visualize convolutional layers correctly",
            project: "Neural Network Visualizer",
            status: "open",
            priority: "high",
            labels: ["bug", "visualization", "core-functionality"],
            assignee: "AlexC",
            createdAt: "2025-04-23T10:30:00Z",
            updatedAt: "2025-04-25T15:45:00Z",
            comments: 7
        },
        {
            id: "ISS-1341",
            title: "Add export functionality for trained models",
            project: "Neural Network Visualizer",
            status: "open",
            priority: "medium",
            labels: ["enhancement", "user-request"],
            assignee: "SarahK",
            createdAt: "2025-04-22T08:15:00Z",
            updatedAt: "2025-04-24T11:20:00Z",
            comments: 4
        },
        {
            id: "ISS-1338",
            title: "Performance degradation with datasets over 100k samples",
            project: "Quantum Algorithm Simulator",
            status: "open",
            priority: "critical",
            labels: ["performance", "optimization"],
            assignee: "MichaelR",
            createdAt: "2025-04-20T14:25:00Z",
            updatedAt: "2025-04-25T09:10:00Z",
            comments: 12
        },
        {
            id: "ISS-1335",
            title: "Blockchain explorer crashes when analyzing custom tokens",
            project: "Blockchain Explorer",
            status: "closed",
            priority: "high",
            labels: ["bug", "crash", "fixed"],
            assignee: "JenniferT",
            createdAt: "2025-04-18T16:45:00Z",
            updatedAt: "2025-04-24T13:30:00Z",
            comments: 9,
            closedAt: "2025-04-24T13:30:00Z"
        },
        {
            id: "ISS-1332",
            title: "3D visualization doesn't render properly on Firefox",
            project: "3D Code Architecture",
            status: "open",
            priority: "medium",
            labels: ["bug", "browser-compatibility"],
            assignee: null,
            createdAt: "2025-04-17T11:20:00Z",
            updatedAt: "2025-04-23T16:15:00Z",
            comments: 5
        },
        {
            id: "ISS-1331",
            title: "Add support for Solidity smart contracts",
            project: "Blockchain Explorer",
            status: "open",
            priority: "low",
            labels: ["enhancement", "feature-request"],
            assignee: "DanielP",
            createdAt: "2025-04-17T09:50:00Z",
            updatedAt: "2025-04-20T14:40:00Z",
            comments: 3
        },
        {
            id: "ISS-1328",
            title: "Implement dark mode theme for visualizations",
            project: "Neural Network Visualizer",
            status: "closed",
            priority: "medium",
            labels: ["enhancement", "ui", "fixed"],
            assignee: "AlexC",
            createdAt: "2025-04-15T13:10:00Z",
            updatedAt: "2025-04-21T10:25:00Z",
            comments: 6,
            closedAt: "2025-04-21T10:25:00Z"
        }
    ];

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    useEffect(() => {
        const interval = setInterval(() => {
            setParticles(particles =>
                particles.map(particle => ({
                    ...particle,
                    x: ((particle.x + particle.speedX + 100) % 100),
                    y: ((particle.y + particle.speedY + 100) % 100)
                }))
            );
        }, 50);

        return () => clearInterval(interval);
    }, []);

    const renderTabContent = () => {
        switch (currentTab) {
            case 'profile':
                return <Profile darkMode={darkMode} setDarkMode={setDarkMode} />;
            case 'issues':
                return (
                    <IssueDisplay
                        issues={issues}
                        darkMode={darkMode}
                        issuesTab={issuesTab}
                        setIssuesTab={setIssuesTab}
                    />
                );
            case 'repositories':
                return <RepositoriesList darkMode={darkMode} />;
            case 'explore':
                return <ExplorerRepo darkMode={darkMode} />;
            default:
                return (
                    <div className="text-center py-16">
                        <h2 className={`text-xl font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Select a tab to view content
                        </h2>
                    </div>
                );
        }
    };

    const menuItems: MenuItem[] = [
        { icon: <User size={20} />, label: 'Profile', id: 'profile' },
        { icon: <Code size={20} />, label: 'Repositories', id: 'repositories' },
        { icon: <GitFork size={20} />, label: 'Explore Repositories', id: 'explore' },
        { icon: <AlertCircle size={20} />, label: 'Issues', id: 'issues' },
        { icon: <Bot size={20} />, label: 'IA Agent', id: 'ia-agent' },
    ];

    return (
        <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} transition-colors duration-300`}>
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {particles.map((particle, idx) => (
                    <div
                        key={idx}
                        className={`absolute rounded-full ${darkMode ? 'bg-violet-500/10' : 'bg-cyan-500/10'}`}
                        style={{
                            width: particle.size + 'px',
                            height: particle.size + 'px',
                            left: particle.x + '%',
                            top: particle.y + '%',
                            filter: 'blur(1px)'
                        }}
                    ></div>
                ))}
            </div>
            <header className={`fixed top-0 left-0 right-0 z-10 ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-md border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-violet-600' : 'bg-cyan-600'} group hover:scale-110 transition-all duration-300 hover:rotate-12`}>
                            <Share2 className="h-6 w-6 text-white" />
                        </div>
                        <h1 className={`ml-3 text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>ShareCode</h1>
                    </div>
                    <div className="flex-1 max-w-xl mx-4">
                        <div className={`flex items-center rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} px-4 py-2`}>
                            <Search size={18} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search repositories, issues, and more..."
                                className={`ml-2 w-full ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'} focus:outline-none`}
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <Bell size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                        >
                            {darkMode ? <Sun size={20} className="text-gray-400" /> : <Moon size={20} className="text-gray-600" />}
                        </button>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                            {user?.avatar_path ? (
                                <img
                                    src={`http://localhost:5000${user.avatar_path}`}
                                    alt={user.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-white font-medium">
                                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            <aside className={`fixed top-16 left-0 bottom-0 ${menuCollapsed ? 'w-16' : 'w-60'} ${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} backdrop-blur-md border-r transition-all duration-300 z-10`}>
                <div className="h-full flex flex-col py-4">
                    <nav className="flex-1">
                        <ul className="space-y-1 px-2">
                            {menuItems.map((item) => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => setCurrentTab(item.id)}
                                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${currentTab === item.id
                                            ? darkMode
                                                ? 'bg-violet-600/20 text-violet-400'
                                                : 'bg-cyan-50 text-cyan-600'
                                            : darkMode
                                                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className={`${menuCollapsed ? 'mx-auto' : ''}`}>{item.icon}</span>
                                        {!menuCollapsed && <span>{item.label}</span>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <div className="px-2 mt-2">
                        <button
                            onClick={() => {
                                localStorage.removeItem('authToken');
                                navigate('/');
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                        >
                            <LogOut size={20} className={menuCollapsed ? 'mx-auto' : ''} />
                            {!menuCollapsed && <span>Logout</span>}
                        </button>
                    </div>
                    <div className="px-2 mt-auto">
                        <button
                            onClick={() => setMenuCollapsed(!menuCollapsed)}
                            className={`w-full flex items-center justify-center p-3 rounded-lg ${darkMode
                                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                                } transition-colors`}
                        >
                            {menuCollapsed ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </aside>
            <main className={`pt-16 flex-1 ${menuCollapsed ? 'pl-16' : 'pl-60'} transition-all duration-300`}>
                <div className="container mx-auto px-6 py-8 h-full flex flex-col">
                    <div className="flex-1">
                        {renderTabContent()}
                    </div>
                    <footer className="mt-8 py-4 border-t dark:border-gray-700 border-gray-200">
                        <p className={`text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            &copy; 2025 ShareCode. All rights reserved.
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
