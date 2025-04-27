import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, Code, Star, GitFork, Users, Settings, FileText, Book, LogOut, Plus, Bell, MessageSquare, Moon, Sun, Share2, AlertCircle, Check, Clock, Filter, ChevronDown, Tag, User } from 'lucide-react';
import Profile from './profile';

const languageColors = {
    JavaScript: "bg-yellow-400",
    TypeScript: "bg-blue-500",
    Python: "bg-indigo-500",
    Rust: "bg-orange-500",
    CSS: "bg-purple-500",
    HTML: "bg-red-500"
};

interface Project {
    name: string;
    description: string;
    language: keyof typeof languageColors;
    stars: number;
    forks: number;
    updated: string;
    contributors: number;
    progress: number;
}

const labelColors = {
    "bug": {
        bg: "bg-red-100",
        text: "text-red-700",
        darkBg: "bg-red-900/30",
        darkText: "text-red-400"
    },
    "enhancement": {
        bg: "bg-green-100",
        text: "text-green-700",
        darkBg: "bg-green-900/30",
        darkText: "text-green-400"
    },
    "performance": {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        darkBg: "bg-yellow-900/30",
        darkText: "text-yellow-400"
    },
    "feature-request": {
        bg: "bg-purple-100",
        text: "text-purple-700",
        darkBg: "bg-purple-900/30",
        darkText: "text-purple-400"
    },
    "ui": {
        bg: "bg-pink-100",
        text: "text-pink-700",
        darkBg: "bg-pink-900/30",
        darkText: "text-pink-400"
    },
    "fixed": {
        bg: "bg-blue-100",
        text: "text-blue-700",
        darkBg: "bg-blue-900/30",
        darkText: "text-blue-400"
    },
    "visualization": {
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        darkBg: "bg-indigo-900/30",
        darkText: "text-indigo-400"
    },
    "user-request": {
        bg: "bg-teal-100",
        text: "text-teal-700",
        darkBg: "bg-teal-900/30",
        darkText: "text-teal-400"
    },
    "optimization": {
        bg: "bg-orange-100",
        text: "text-orange-700",
        darkBg: "bg-orange-900/30",
        darkText: "text-orange-400"
    },
    "crash": {
        bg: "bg-rose-100",
        text: "text-rose-700",
        darkBg: "bg-rose-900/30",
        darkText: "text-rose-400"
    },
    "browser-compatibility": {
        bg: "bg-sky-100",
        text: "text-sky-700",
        darkBg: "bg-sky-900/30",
        darkText: "text-sky-400"
    },
    "core-functionality": {
        bg: "bg-amber-100",
        text: "text-amber-700",
        darkBg: "bg-amber-900/30",
        darkText: "text-amber-400"
    }
};

interface Issue {
    id: string;
    title: string;
    project: string;
    status: 'open' | 'closed';
    priority: 'critical' | 'high' | 'medium' | 'low';
    labels: (keyof typeof labelColors)[];
    assignee: string | null;
    createdAt: string;
    updatedAt: string;
    comments: number;
    closedAt?: string;
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

interface Activity {
    type: 'commit' | 'issue' | 'star' | 'fork';
    project: string;
    action: string;
    time: string;
    icon: React.ReactNode;
}

export default function EnhancedSharecodeDashboard() {
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState<string>('repositories');
    const [menuCollapsed, setMenuCollapsed] = useState<boolean>(false);
    const [darkMode, setDarkMode] = useState<boolean>(true);
    const [issuesTab, setIssuesTab] = useState<string>('open');
    const [particles, setParticles] = useState<Particle[]>(Array(15).fill(null).map(() => ({
        size: Math.random() * 4 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3
    })));

    const projects: Project[] = [
        {
            name: "Neural Network Visualizer",
            description: "Interactive visualization tool for neural networks with real-time training data",
            language: "TypeScript",
            stars: 128,
            forks: 35,
            updated: "2 days ago",
            contributors: 8,
            progress: 85
        },
        {
            name: "Quantum Algorithm Simulator",
            description: "Simulate quantum computing algorithms and visualize qubit states",
            language: "Python",
            stars: 246,
            forks: 87,
            updated: "5 days ago",
            contributors: 12,
            progress: 92
        },
        {
            name: "3D Code Architecture",
            description: "Generate interactive 3D visualizations of code architecture and dependencies",
            language: "JavaScript",
            stars: 193,
            forks: 42,
            updated: "1 week ago",
            contributors: 5,
            progress: 78
        },
        {
            name: "Blockchain Explorer",
            description: "Advanced blockchain visualization and transaction analysis tool",
            language: "Rust",
            stars: 317,
            forks: 103,
            updated: "3 days ago",
            contributors: 15,
            progress: 96
        }
    ];

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
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
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

    const filteredIssues = issues.filter(issue => {
        if (issuesTab === 'open') return issue.status === 'open';
        if (issuesTab === 'closed') return issue.status === 'closed';
        return true;
    });

    const getDaysAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "today";
        else if (diffDays === 1) return "yesterday";
        else return `${diffDays} days ago`;
    };

    const renderTabContent = () => {
        switch (currentTab) {
            case 'profile':
                return <Profile darkMode={darkMode} setDarkMode={setDarkMode} />;
            case 'issues':
                return (
                    <div className="space-y-6">
                        <div className="mb-6 flex justify-between items-center">
                            <div>
                                <h1 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>Issues</h1>
                                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Track and manage issues across your projects</p>
                            </div>
                            <button className={`flex items-center space-x-2 px-4 py-2 ${darkMode ? 'bg-violet-600 hover:bg-violet-500' : 'bg-cyan-600 hover:bg-cyan-500'} text-white rounded-lg transition-all duration-300 hover:shadow-lg ${darkMode ? 'hover:shadow-violet-500/30' : 'hover:shadow-cyan-500/30'} transform hover:-translate-y-0.5`}>
                                <Plus size={18} />
                                <span>New Issue</span>
                            </button>
                        </div>
                        <div className={`${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-sm border rounded-lg p-4 mb-6`}>
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex rounded-md">
                                    {['open', 'closed', 'all'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setIssuesTab(tab)}
                                            className={`px-4 py-2 text-sm font-medium ${issuesTab === tab
                                                ? darkMode
                                                    ? 'bg-violet-600/20 text-violet-400 border-violet-600/30'
                                                    : 'bg-cyan-50 text-cyan-600 border-cyan-200'
                                                : darkMode
                                                    ? 'bg-gray-800 text-gray-400 hover:text-gray-300 border-gray-700'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                                                } border ${tab === 'open' ? 'rounded-l-md' : tab === 'all' ? 'rounded-r-md' : ''} transition-colors`}
                                        >
                                            {tab === 'open' && <AlertCircle size={14} className="inline mr-1.5" />}
                                            {tab === 'closed' && <Check size={14} className="inline mr-1.5" />}
                                            {tab === 'all' && <span className="h-3.5 w-3.5 inline-block mr-1.5"></span>}
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                            <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {issues.filter(issue => tab === 'all' ? true : issue.status === tab).length}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <div className="flex-1 flex justify-end">
                                    <div className="flex items-center space-x-3">
                                        <button className={`flex items-center px-3 py-2 text-sm ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } rounded-md transition-colors`}>
                                            <Filter size={14} className="mr-2" />
                                            Filters
                                            <ChevronDown size={14} className="ml-2" />
                                        </button>
                                        <button className={`flex items-center px-3 py-2 text-sm ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } rounded-md transition-colors`}>
                                            <Tag size={14} className="mr-2" />
                                            Labels
                                            <ChevronDown size={14} className="ml-2" />
                                        </button>
                                        <button className={`flex items-center px-3 py-2 text-sm ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } rounded-md transition-colors`}>
                                            <Users size={14} className="mr-2" />
                                            Assignees
                                            <ChevronDown size={14} className="ml-2" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={`${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-sm border rounded-lg overflow-hidden`}>
                            <ul>
                                {filteredIssues.map((issue, idx) => (
                                    <li
                                        key={issue.id}
                                        className={`${idx !== filteredIssues.length - 1 ? (darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200') : ''
                                            } ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors group cursor-pointer`}
                                    >
                                        <div className="p-4 flex items-start">
                                            <div className="mt-1">
                                                {issue.status === 'open' ? (
                                                    <div className={`p-1 rounded-full ${issue.priority === 'critical' ?
                                                        'text-red-500 bg-red-100 dark:bg-red-900/20' :
                                                        'text-green-500 bg-green-100 dark:bg-green-900/20'}`}>
                                                        <AlertCircle size={16} />
                                                    </div>
                                                ) : (
                                                    <div className="p-1 rounded-full text-purple-500 bg-purple-100 dark:bg-purple-900/20">
                                                        <Check size={16} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-3 flex-1">
                                                <div className="flex flex-wrap items-center">
                                                    <h3 className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'} ${issue.status === 'closed' ? 'line-through opacity-70' : ''} group-hover:underline`}>
                                                        {issue.title}
                                                    </h3>
                                                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {issue.id}
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-sm">
                                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                                        {issue.status === 'open' ? 'Opened' : 'Closed'} {getDaysAgo(issue.status === 'open' ? issue.createdAt : issue.closedAt!)}
                                                        {issue.project && ` in `}
                                                        {issue.project && (
                                                            <span className={`font-medium ${darkMode ? 'text-violet-400' : 'text-cyan-600'}`}>
                                                                {issue.project}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {issue.labels.map((label) => (
                                                        <span
                                                            key={label}
                                                            className={`text-xs px-2 py-1 rounded-full ${darkMode
                                                                ? `${labelColors[label].darkBg} ${labelColors[label].darkText}`
                                                                : `${labelColors[label].bg} ${labelColors[label].text}`
                                                                }`}
                                                        >
                                                            {label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="ml-4 flex flex-col items-end">
                                                <span className={`text-xs px-2 py-1 rounded-full ${issue.priority === 'critical'
                                                    ? darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                                                    : issue.priority === 'high'
                                                        ? darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-700'
                                                        : issue.priority === 'medium'
                                                            ? darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                                                            : darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {issue.priority}
                                                </span>
                                                <div className="mt-2 flex items-center space-x-3">
                                                    {issue.assignee ? (
                                                        <div className="flex items-center">
                                                            <div className={`w-6 h-6 rounded-full border-2 ${darkMode ? 'border-gray-800 bg-gray-700' : 'border-white bg-gray-200'} flex items-center justify-center text-xs font-medium`}>
                                                                {issue.assignee.charAt(0)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unassigned</span>
                                                    )}
                                                    <div className="flex items-center">
                                                        <MessageSquare size={14} className={`mr-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{issue.comments}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex items-center text-xs">
                                                    <Clock size={12} className={`mr-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                    <span className={`${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                        Updated {getDaysAgo(issue.updatedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex justify-center mt-6">
                            <div className="inline-flex rounded-md shadow-sm">
                                {['Previous', '1', '2', '3', '...', '8', 'Next'].map((page, idx) => (
                                    <button
                                        key={idx}
                                        className={`px-4 py-2 text-sm font-medium ${page === '1'
                                            ? darkMode
                                                ? 'bg-violet-600/20 text-violet-400 border-violet-600/30'
                                                : 'bg-cyan-50 text-cyan-600 border-cyan-300'
                                            : darkMode
                                                ? 'bg-gray-800 text-gray-400 hover:text-white border-gray-700'
                                                : 'bg-white text-gray-700 hover:text-gray-900 border-gray-300'
                                            } border ${idx === 0
                                                ? 'rounded-l-md'
                                                : idx === 6
                                                    ? 'rounded-r-md'
                                                    : ''
                                            } ${idx !== 0 ? 'border-l-0' : ''
                                            } transition-colors`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'repositories':
                return (
                    <>
                        <div className="mb-6 flex justify-between items-center">
                            <div>
                                <h1 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>Your Repositories</h1>
                                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage and explore your code repositories</p>
                            </div>
                            <button className={`flex items-center space-x-2 px-4 py-2 ${darkMode ? 'bg-violet-600 hover:bg-violet-500' : 'bg-cyan-600 hover:bg-cyan-500'} text-white rounded-lg transition-all duration-300 hover:shadow-lg ${darkMode ? 'hover:shadow-violet-500/30' : 'hover:shadow-cyan-500/30'} transform hover:-translate-y-0.5`}>
                                <Plus size={18} />
                                <span>New</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {projects.map((project, index) => (
                                <div
                                    key={index}
                                    className={`${darkMode ? 'bg-gray-800/60 border-gray-700 hover:border-gray-600' : 'bg-white/70 border-gray-200 hover:border-cyan-300'} backdrop-blur-sm group border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center space-x-3">
                                                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-violet-400' : 'text-cyan-600'} group-hover:underline`}>
                                                        {project.name}
                                                    </h3>
                                                    <span className={`text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded-full`}>
                                                        Public
                                                    </span>
                                                </div>
                                                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{project.description}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}>
                                                    <Star size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                                                </button>
                                                <button className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}>
                                                    <GitFork size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Project completion</span>
                                                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{project.progress}%</span>
                                            </div>
                                            <div className={`h-1.5 w-full rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ease-out ${darkMode ? 'bg-gradient-to-r from-violet-500 to-purple-500' : 'bg-gradient-to-r from-cyan-500 to-teal-400'
                                                        }`}
                                                    style={{ width: `${project.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center text-sm gap-y-2">
                                            <div className="flex items-center mr-5">
                                                <span className={`inline-block w-3 h-3 rounded-full ${languageColors[project.language]} mr-2`}></span>
                                                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{project.language}</span>
                                            </div>
                                            <div className="flex items-center mr-5 group">
                                                <Star size={16} className={`mr-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'} group-hover:text-yellow-400 transition-colors`} />
                                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{project.stars}</span>
                                            </div>
                                            <div className="flex items-center mr-5">
                                                <GitFork size={16} className="mr-1.5 text-gray-400" />
                                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{project.forks}</span>
                                            </div>
                                            <div className="flex items-center mr-5">
                                                <Users size={16} className="mr-1.5 text-gray-400" />
                                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{project.contributors} contributors</span>
                                            </div>
                                            <span className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-sm ml-auto`}>Updated {project.updated}</span>
                                        </div>
                                    </div>
                                    <div className={`px-6 py-3 flex justify-between items-center border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/80'} backdrop-blur-sm`}>
                                        <div className="flex -space-x-2">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className={`w-8 h-8 rounded-full border-2 ${darkMode ? 'border-gray-800 bg-gray-700' : 'border-white bg-gray-100'} flex items-center justify-center text-xs font-medium`}>
                                                    {['A', 'B', 'C'][i]}
                                                </div>
                                            ))}
                                            {project.contributors > 3 && (
                                                <div className={`w-8 h-8 rounded-full border-2 ${darkMode ? 'border-gray-800 bg-gray-700 text-gray-300' : 'border-white bg-gray-100 text-gray-600'} flex items-center justify-center text-xs font-medium`}>
                                                    +{project.contributors - 3}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button className={`px-3 py-1.5 text-sm rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} transition-colors`}>
                                                <Code size={14} className="inline-block mr-1.5" />
                                                Code
                                            </button>
                                            <button className={`px-3 py-1.5 text-sm rounded-md ${darkMode ? 'bg-violet-600/30 hover:bg-violet-600/50 text-violet-400' : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700'} transition-colors`}>
                                                <Share2 size={14} className="inline-block mr-1.5" />
                                                Share
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 'activity':
                return (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h1 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>Recent Activity</h1>
                            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your recent interactions and updates</p>
                        </div>
                        <div className={`${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-sm border rounded-lg overflow-hidden`}>
                            <div className="p-4">
                                <ul className="space-y-6">
                                    {[
                                        { type: 'commit', project: 'Neural Network Visualizer', action: 'Fixed visualization bug in convolutional layers', time: '2 hours ago', icon: <Code size={16} /> },
                                        { type: 'issue', project: 'Quantum Algorithm Simulator', action: 'Closed issue #42: Performance optimization', time: '5 hours ago', icon: <AlertCircle size={16} /> },
                                        { type: 'star', project: '3D Code Architecture', action: 'Starred this repository', time: 'Yesterday', icon: <Star size={16} /> },
                                        { type: 'fork', project: 'Blockchain Explorer', action: 'Forked this repository', time: '2 days ago', icon: <GitFork size={16} /> },
                                        { type: 'commit', project: 'Neural Network Visualizer', action: 'Added export functionality for trained models', time: '3 days ago', icon: <Code size={16} /> },
                                    ].map((activity, idx) => (
                                        <li key={idx} className="relative pl-8">
                                            <div className={`absolute left-0 top-0 rounded-full p-1 ${activity.type === 'commit'
                                                ? darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                                                : activity.type === 'issue'
                                                    ? darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'
                                                    : activity.type === 'star'
                                                        ? darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                                                        : darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                                                }`}>
                                                {activity.icon}
                                            </div>
                                            <div>
                                                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                                    <span className={`font-medium ${darkMode ? 'text-violet-400' : 'text-cyan-600'}`}>
                                                        {activity.project}
                                                    </span>
                                                    <span className="mx-1">•</span>
                                                    {activity.action}
                                                </p>
                                                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{activity.time}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                );
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
        { icon: <AlertCircle size={20} />, label: 'Issues', id: 'issues' },
        { icon: <Clock size={20} />, label: 'Activity', id: 'activity' },
        { icon: <FileText size={20} />, label: 'Documentation', id: 'docs' },
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
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            U
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