import React, { useState, useEffect } from 'react';
import { User, Settings, Edit, Camera, Save, X, Key, Github, Mail, Calendar, MapPin, Clock, FileText, GitFork, Star, AlertCircle, RefreshCw, Shield, Code, MessageSquare, Trash2, Sun, Moon } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';



interface Particle {
    size: number;
    x: number;
    y: number;
    speedX: number;
    speedY: number;
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

interface ProfileProps {
    darkMode: boolean;
    setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

interface JwtPayload {
    userId: number;
    email: string;
}

export default function ProfileInterface({ darkMode, setDarkMode }: ProfileProps) {
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'repositories' | 'activity' | 'settings'>('overview');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [user, setUser] = useState<UserProfile | null>(null);
    const [editForm, setEditForm] = useState({
        username: '',
        email: '',
        bio: '',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);


    const [particles, setParticles] = useState<Particle[]>(Array(15).fill(null).map(() => ({
        size: Math.random() * 4 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3
    })));

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const decoded = jwtDecode<JwtPayload>(token);
                const response = await fetch(`http://localhost:5000/v1/api/users/${decoded.userId}?relations=repositories,issues,pull_requests`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const userData = await response.json();
                setUser(userData);
                setEditForm({
                    username: userData.username,
                    email: userData.email,
                    bio: userData.bio || '',
                });
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

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

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getTimeElapsed = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "today";
        if (diffDays === 1) return "yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) {
            const diffWeeks = Math.floor(diffDays / 7);
            return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
        }
        if (diffDays < 365) {
            const diffMonths = Math.floor(diffDays / 30);
            return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
        }
        const diffYears = Math.floor(diffDays / 365);
        return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
    };

    const handleSaveProfile = () => {
        if (!user) return;

        setUser({
            ...user,
            username: editForm.username,
            email: editForm.email,
            bio: editForm.bio,
            updated_at: new Date().toISOString()
        });
        setEditMode(false);
    };

    const handlePasswordChange = () => {
        setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setShowPasswordModal(false);
    };

    const handleCancelEdit = () => {
        if (!user) return;

        setEditForm({
            username: user.username,
            email: user.email,
            bio: user.bio || '',
        });
        setEditMode(false);
    };
    const handleDeleteAccount = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const decoded = jwtDecode<JwtPayload>(token);
            const userId = decoded.userId;

            const response = await fetch(`http://localhost:5000/v1/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete account');
            }

            // Clear local storage and redirect to login
            localStorage.removeItem('authToken');
            window.location.href = '/'; // Or use your router's navigation if applicable
        } catch (err) {
            console.error('Error deleting account:', err);
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete account');
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} text-red-500`}>
                    Error: {error}
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Calculate counts from the arrays
    const repositoriesCount = user.repositories?.length || 0;
    const issuesCount = user.issues?.length || 0;
    const pullRequestsCount = user.pull_requests?.length || 0;

    const recentActivity = [
        { type: 'repository', action: 'Created new repository', target: 'Neural Network Visualizer', time: '2 days ago' },
        { type: 'issue', action: 'Closed issue', target: 'Fix convolutional layer rendering', time: '4 days ago' },
        { type: 'pull_request', action: 'Opened pull request', target: 'Add export functionality for models', time: '1 week ago' },
        { type: 'repository', action: 'Forked repository', target: 'Quantum Algorithm Simulator', time: '2 weeks ago' },
        { type: 'issue', action: 'Commented on issue', target: 'Performance issues with large datasets', time: '3 weeks ago' },
    ];

    const repositories = [
        {
            name: "Neural Network Visualizer",
            description: "Interactive visualization tool for neural networks with real-time training data",
            language: "TypeScript",
            stars: 128,
            forks: 35,
            updated: "2 days ago",
            isPrivate: false
        },
        {
            name: "Code-Analysis-Engine",
            description: "Static code analysis tool with refactoring suggestions",
            language: "Python",
            stars: 87,
            forks: 21,
            updated: "1 week ago",
            isPrivate: false
        },
        {
            name: "Personal-Dashboard",
            description: "Customizable dashboard for tracking development metrics",
            language: "JavaScript",
            stars: 43,
            forks: 12,
            updated: "3 weeks ago",
            isPrivate: true
        }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className={`${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-sm border rounded-xl p-6`}>
                            <div className="flex flex-col md:flex-row items-start md:items-center">
                                <div className="relative mb-4 md:mb-0">
                                    <div className={`w-24 h-24 rounded-full ${darkMode ? 'bg-violet-600/20 text-violet-400 border-violet-600/30' : 'bg-cyan-50 text-cyan-600 border-cyan-200'} border-2 flex items-center justify-center text-3xl font-medium`}>
                                        {user.avatar_path ? (
                                            <img
                                                src={user.avatar_path}
                                                alt={user.username}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            user.username.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    {editMode && (
                                        <button className={`absolute bottom-0 right-0 p-1.5 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                            <Camera size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="md:ml-6 flex-1">
                                    {editMode ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                                                    Username
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.username}
                                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                                    className={`w-full px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none ${darkMode ? 'focus:border-violet-500' : 'focus:border-cyan-500'}`}
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={editForm.email}
                                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                    className={`w-full px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none ${darkMode ? 'focus:border-violet-500' : 'focus:border-cyan-500'}`}
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                                                    Bio
                                                </label>
                                                <textarea
                                                    value={editForm.bio}
                                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                                    rows={3}
                                                    className={`w-full px-3 py-2 rounded-md resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none ${darkMode ? 'focus:border-violet-500' : 'focus:border-cyan-500'}`}
                                                />
                                            </div>
                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={handleSaveProfile}
                                                    className={`flex items-center space-x-2 px-4 py-2 ${darkMode ? 'bg-violet-600 hover:bg-violet-500' : 'bg-cyan-600 hover:bg-cyan-500'} text-white rounded-lg transition-all duration-300 hover:shadow-lg ${darkMode ? 'hover:shadow-violet-500/30' : 'hover:shadow-cyan-500/30'}`}
                                                >
                                                    <Save size={16} />
                                                    <span>Save Changes</span>
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className={`flex items-center space-x-2 px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-gray-300' : 'text-gray-700'} rounded-lg transition-colors`}
                                                >
                                                    <X size={16} />
                                                    <span>Cancel</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                                    {user.username}
                                                    {user.is_admin && (
                                                        <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${darkMode ? 'bg-violet-600/20 text-violet-400' : 'bg-cyan-100 text-cyan-800'}`}>
                                                            Admin
                                                        </span>
                                                    )}
                                                </h2>
                                                <button
                                                    onClick={() => setEditMode(true)}
                                                    className={`flex items-center space-x-2 px-3 py-1.5 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} rounded-lg transition-colors`}
                                                >
                                                    <Edit size={16} />
                                                    <span>Edit Profile</span>
                                                </button>
                                            </div>
                                            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {user.email}
                                            </p>
                                            <p className={`mt-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {user.bio || 'No bio provided'}
                                            </p>
                                            <div className="mt-4 flex flex-wrap items-center text-sm gap-y-2 gap-x-4">
                                                <div className="flex items-center">
                                                    <Calendar size={16} className={`mr-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                        Joined {formatDate(user.created_at)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <RefreshCw size={16} className={`mr-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                        Updated {getTimeElapsed(user.updated_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Repositories', value: repositoriesCount, icon: <FileText size={20} /> },
                                { label: 'Issues', value: issuesCount, icon: <AlertCircle size={20} /> },
                                { label: 'Pull Requests', value: pullRequestsCount, icon: <GitFork size={20} /> }
                            ].map((stat, idx) => (
                                <div
                                    key={idx}
                                    className={`${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-sm border rounded-lg p-4 flex items-center`}
                                >
                                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-violet-600/20 text-violet-400' : 'bg-cyan-50 text-cyan-600'}`}>
                                        {stat.icon}
                                    </div>
                                    <div className="ml-4">
                                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                            {stat.value}
                                        </h3>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {stat.label}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={`${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-sm border rounded-lg overflow-hidden`}>
                            <div className="p-4 border-b border-gray-700">
                                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recent Activity</h3>
                            </div>
                            <div className="p-4">
                                <ul className="space-y-4">
                                    {recentActivity.map((activity, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <div className={`mt-1 p-1 rounded ${activity.type === 'repository'
                                                ? (darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600')
                                                : activity.type === 'issue'
                                                    ? (darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600')
                                                    : (darkMode ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-100 text-purple-600')
                                                }`}>
                                                {activity.type === 'repository' && <FileText size={16} />}
                                                {activity.type === 'issue' && <AlertCircle size={16} />}
                                                {activity.type === 'pull_request' && <GitFork size={16} />}
                                            </div>
                                            <div className="ml-3">
                                                <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                                    <span>{activity.action}</span>
                                                    <span className="mx-1">•</span>
                                                    <span className={`font-medium ${darkMode ? 'text-violet-400' : 'text-cyan-600'}`}>
                                                        {activity.target}
                                                    </span>
                                                </p>
                                                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    {activity.time}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                );

            case 'repositories':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>Your Repositories</h2>
                                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your code repositories</p>
                            </div>
                            <div className="flex space-x-3">
                                <div className={`flex items-center rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} px-3 py-2 w-64`}>
                                    <input
                                        type="text"
                                        placeholder="Find a repository..."
                                        className={`ml-2 w-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} focus:outline-none`}
                                    />
                                </div>
                                <button className={`flex items-center space-x-2 px-4 py-2 ${darkMode ? 'bg-violet-600 hover:bg-violet-500' : 'bg-cyan-600 hover:bg-cyan-500'} text-white rounded-lg transition-all duration-300 hover:shadow-lg ${darkMode ? 'hover:shadow-violet-500/30' : 'hover:shadow-cyan-500/30'}`}>
                                    <span>New</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {repositories.map((repo, index) => (
                                <div
                                    key={index}
                                    className={`${darkMode ? 'bg-gray-800/60 border-gray-700 hover:border-gray-600' : 'bg-white/70 border-gray-200 hover:border-cyan-300'} backdrop-blur-sm group border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
                                >
                                    <div className="p-5">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center space-x-3">
                                                    <h3 className={`text-lg font-semibold ${darkMode ? 'text-violet-400' : 'text-cyan-600'} group-hover:underline`}>
                                                        {repo.name}
                                                    </h3>
                                                    <span className={`text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded-full`}>
                                                        {repo.isPrivate ? 'Private' : 'Public'}
                                                    </span>
                                                </div>
                                                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{repo.description}</p>
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

                                        <div className="flex flex-wrap items-center text-sm mt-3 gap-y-2">
                                            <div className="flex items-center mr-5">
                                                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${repo.language === "JavaScript" ? "bg-yellow-400" :
                                                    repo.language === "TypeScript" ? "bg-blue-500" :
                                                        repo.language === "Python" ? "bg-indigo-500" : "bg-gray-400"
                                                    }`}></span>
                                                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{repo.language}</span>
                                            </div>
                                            <div className="flex items-center mr-5 group">
                                                <Star size={16} className={`mr-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'} group-hover:text-yellow-400 transition-colors`} />
                                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{repo.stars}</span>
                                            </div>
                                            <div className="flex items-center mr-5">
                                                <GitFork size={16} className="mr-1.5 text-gray-400" />
                                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{repo.forks}</span>
                                            </div>
                                            <span className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-sm ml-auto`}>Updated {repo.updated}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'activity':
                return (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>Activity Log</h2>
                            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your recent actions and contributions</p>
                        </div>

                        <div className={`${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-sm border rounded-lg p-6`}>
                            <ul className="space-y-6">
                                {[...Array(10)].map((_, idx) => {
                                    const types = ['commit', 'issue', 'pull_request', 'repository', 'comment'];
                                    const type = types[Math.floor(Math.random() * types.length)];

                                    return (
                                        <li key={idx} className="relative pl-8">
                                            <div className={`absolute left-0 top-0 rounded-full p-1 ${type === 'commit'
                                                ? (darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600')
                                                : type === 'issue'
                                                    ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600')
                                                    : type === 'pull_request'
                                                        ? (darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600')
                                                        : type === 'repository'
                                                            ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600')
                                                            : (darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600')
                                                }`}>
                                                {type === 'commit' && <Code size={16} />}
                                                {type === 'issue' && <AlertCircle size={16} />}
                                                {type === 'pull_request' && <GitFork size={16} />}
                                                {type === 'repository' && <FileText size={16} />}
                                                {type === 'comment' && <MessageSquare size={16} />}
                                            </div>
                                            <div>
                                                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                                    {type === 'commit' && 'Committed to '}
                                                    {type === 'issue' && (idx % 2 === 0 ? 'Opened issue in ' : 'Closed issue in ')}
                                                    {type === 'pull_request' && (idx % 2 === 0 ? 'Created pull request in ' : 'Merged pull request in ')}
                                                    {type === 'repository' && (idx % 2 === 0 ? 'Created repository ' : 'Forked repository ')}
                                                    {type === 'comment' && 'Commented on '}
                                                    <span className={`font-medium ${darkMode ? 'text-violet-400' : 'text-cyan-600'}`}>
                                                        {['Neural Network Visualizer', 'Quantum Algorithm Simulator', '3D Code Architecture', 'Blockchain Explorer'][idx % 4]}
                                                    </span>
                                                </p>
                                                <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {type === 'commit' && 'Added support for visualization of convolutional layers'}
                                                    {type === 'issue' && (idx % 2 === 0 ? 'Performance issues with large datasets' : 'Fixed rendering issues in Firefox')}
                                                    {type === 'pull_request' && (idx % 2 === 0 ? 'Add export functionality' : 'Improve UI responsiveness')}
                                                    {type === 'repository' && 'Great improvement! This solves the issue I was having.'}
                                                </p>
                                                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    {['5 hours ago', '1 day ago', '2 days ago', '4 days ago', '1 week ago', '2 weeks ago'][idx % 6]}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                );

            case 'settings':
                return (
                    <div className="space-y-6">
                        <div className="mb-6">
                            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>Settings</h2>
                            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your preferences</p>
                        </div>

                        <div className={`${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-sm border rounded-lg p-6`}>
                            <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Security</h3>
                            <div className="space-y-6">
                                <div>
                                    <h4 className={`text-md font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Password</h4>
                                    <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Change your account password</p>
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className={`flex items-center space-x-2 px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${darkMode ? 'text-gray-300' : 'text-gray-700'} rounded-lg transition-colors`}
                                    >
                                        <Key size={16} />
                                        <span>Change Password</span>
                                    </button>
                                </div>
                                <div>
                                    <h4 className={`text-md font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Two-Factor Authentication</h4>
                                    <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Add an extra layer of security to your account</p>
                                    <button className={`flex items-center space-x-2 px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${darkMode ? 'text-gray-300' : 'text-gray-700'} rounded-lg transition-colors`}>
                                        <Shield size={16} />
                                        <span>Enable 2FA</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={`${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-sm border rounded-lg p-6`}>
                            <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>App Preferences</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Dark Mode</h4>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Switch between dark and light mode</p>
                                    </div>
                                    <div
                                        onClick={() => setDarkMode(!darkMode)}
                                        className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${darkMode ? 'bg-violet-600' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute w-5 h-5 rounded-full top-0.5 transition-all ${darkMode ? 'right-0.5 bg-white' : 'left-0.5 bg-white'}`}></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notifications</h4>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Enable or disable app notifications</p>
                                    </div>
                                    <div className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors bg-violet-600`}>
                                        <div className={`absolute w-5 h-5 rounded-full top-0.5 right-0.5 bg-white`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`${darkMode ? 'bg-gray-800/70 border-gray-700' : 'bg-white/90 border-gray-200'} backdrop-blur-sm border rounded-lg p-6`}>
                            <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white/80' : 'text-gray-800'}`}>Danger Zone</h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className={`font-medium text-red-500`}>Delete Account</h4>
                                    <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>
                                    <button
                                        onClick={() => setShowDeleteConfirmation(true)}
                                        className={`flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors`}
                                    >
                                        <Trash2 size={16} />
                                        <span>Delete Account</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent">
                    {particles.map((particle, idx) => (
                        <div
                            key={idx}
                            style={{
                                position: 'absolute',
                                left: `${particle.x}%`,
                                top: `${particle.y}%`,
                                width: `${particle.size}px`,
                                height: `${particle.size}px`,
                                borderRadius: '50%',
                                backgroundColor: darkMode
                                    ? `rgba(139, 92, 246, ${0.2 * (particle.size / 5)})`
                                    : `rgba(6, 182, 212, ${0.2 * (particle.size / 5)})`,
                                transition: 'background-color 0.5s ease'
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Profile</h1>
                            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Manage your account and preferences</p>
                        </div>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>

                    <div className={`flex border-b mb-6 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'repositories', label: 'Repositories' },
                            { id: 'activity', label: 'Activity' },
                            { id: 'settings', label: 'Settings' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id
                                    ? darkMode
                                        ? 'border-violet-500 text-violet-400'
                                        : 'border-cyan-500 text-cyan-600'
                                    : darkMode
                                        ? 'border-transparent text-gray-400 hover:text-gray-300'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {renderTabContent()}
                </div>
            </div>

            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-xl p-6 w-full max-w-md`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Change Password</h3>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none ${darkMode ? 'focus:border-violet-500' : 'focus:border-cyan-500'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none ${darkMode ? 'focus:border-violet-500' : 'focus:border-cyan-500'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className={`w-full px-3 py-2 rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} border focus:outline-none ${darkMode ? 'focus:border-violet-500' : 'focus:border-cyan-500'}`}
                                />
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={handlePasswordChange}
                                    className={`flex-1 flex items-center justify-center space-x-2 py-2 ${darkMode ? 'bg-violet-600 hover:bg-violet-500' : 'bg-cyan-600 hover:bg-cyan-500'} text-white rounded-lg transition-all duration-300 hover:shadow-lg ${darkMode ? 'hover:shadow-violet-500/30' : 'hover:shadow-cyan-500/30'}`}
                                >
                                    <Key size={16} />
                                    <span>Update Password</span>
                                </button>
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    className={`px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded-lg transition-colors`}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showDeleteConfirmation && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-xl p-6 w-full max-w-md`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Delete Account</h3>
                            <button
                                onClick={() => setShowDeleteConfirmation(false)}
                                className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Are you sure you want to delete your account? This action cannot be undone.
                            </p>
                            {deleteError && (
                                <p className="text-red-500 text-sm">{deleteError}</p>
                            )}
                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={handleDeleteAccount}
                                    className={`flex-1 flex items-center justify-center space-x-2 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all duration-300 hover:shadow-lg ${darkMode ? 'hover:shadow-red-500/30' : 'hover:shadow-red-500/30'}`}
                                >
                                    <Trash2 size={16} />
                                    <span>Delete Account</span>
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirmation(false)}
                                    className={`px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} rounded-lg transition-colors`}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}