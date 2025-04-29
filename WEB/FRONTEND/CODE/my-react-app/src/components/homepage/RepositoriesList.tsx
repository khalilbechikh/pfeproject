import React, { useState, useEffect } from 'react';
import { GitFork, Users, Code, Share2, Plus } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
    userId: number;
    email: string;
}

interface Repository {
    id: number;
    name: string;
    description: string;
    is_private: boolean;
    created_at: string;
    updated_at: string;
    forks: number;
    contributors: number;
    language: string;
}

const languageColors: Record<string, string> = {
    JavaScript: "bg-yellow-400",
    TypeScript: "bg-blue-500",
    Python: "bg-indigo-500",
    Rust: "bg-orange-500",
    CSS: "bg-purple-500",
    HTML: "bg-red-500",
    Java: "bg-red-600",
    Go: "bg-cyan-500",
    Ruby: "bg-red-700",
    PHP: "bg-purple-600",
    C: "bg-gray-500",
    "C++": "bg-blue-600",
    "C#": "bg-purple-700",
    Swift: "bg-orange-400",
    Kotlin: "bg-purple-500",
    Shell: "bg-gray-400",
    PowerShell: "bg-blue-400",
    R: "bg-blue-300",
    Scala: "bg-red-500",
    Dart: "bg-blue-200",
    Elixir: "bg-purple-400",
    Clojure: "bg-green-600",
    Haskell: "bg-purple-300",
    Erlang: "bg-red-400",
    Lua: "bg-blue-800",
    Perl: "bg-blue-700",
    Groovy: "bg-green-500",
    OCaml: "bg-yellow-600",
    Julia: "bg-purple-800",
    Nim: "bg-yellow-500",
    Zig: "bg-orange-300",
    V: "bg-blue-200",
    Crystal: "bg-white"
};

const RepositoriesList = ({ darkMode }: { darkMode: boolean }) => {
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRepositories = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('No authentication token found in localStorage');
                }

                const decoded = jwtDecode<JwtPayload>(token);
                const response = await fetch(`http://localhost:5000/v1/api/users/${decoded.userId}?relations=repositories`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Server responded with ${response.status}: ${response.statusText}`);
                }

                const userData = await response.json();
                const staticLanguages = ["TypeScript", "Python", "JavaScript", "Rust", "Go", "Java", "C++", "Ruby"];
                const staticForks = [35, 87, 42, 103, 28, 56, 74, 91];
                const staticContributors = [8, 12, 5, 15, 7, 9, 11, 14];

                const mergedRepos = (userData.data.repository || []).map((repo: any, index: number) => ({
                    ...repo,
                    forks: staticForks[index % staticForks.length],
                    contributors: staticContributors[index % staticContributors.length],
                    language: staticLanguages[index % staticLanguages.length]
                }));

                setRepositories(mergedRepos);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load repositories');
            } finally {
                setLoading(false);
            }
        };

        fetchRepositories();
    }, []);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "today";
        if (diffDays === 1) return "yesterday";
        if (diffDays < 30) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} text-red-500`}>
                <h2 className="text-lg font-bold mb-2">Error Loading Repositories</h2>
                <p className="mb-4">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className={`px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
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
            
            {repositories.length === 0 ? (
                <div className={`p-8 text-center rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No repositories found. Create your first repository!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {repositories.map((repository) => (
                        <div key={repository.id} className={`${darkMode ? 'bg-gray-800/60 border-gray-700 hover:border-gray-600' : 'bg-white/70 border-gray-200 hover:border-cyan-300'} backdrop-blur-sm group border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center space-x-3">
                                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-violet-400' : 'text-cyan-600'} group-hover:underline`}>
                                                {repository.name}
                                            </h3>
                                            <span className={`text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded-full`}>
                                                {repository.is_private ? 'Private' : 'Public'}
                                            </span>
                                        </div>
                                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                            {repository.description || 'No description provided'}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}>
                                            <GitFork size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center text-sm gap-y-2">
                                    <div className="flex items-center mr-5">
                                        <span className={`inline-block w-3 h-3 rounded-full ${languageColors[repository.language] || 'bg-gray-400'} mr-2`}></span>
                                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{repository.language}</span>
                                    </div>
                                    <div className="flex items-center mr-5">
                                        <GitFork size={16} className="mr-1.5 text-gray-400" />
                                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{repository.forks}</span>
                                    </div>
                                    <div className="flex items-center mr-5">
                                        <Users size={16} className="mr-1.5 text-gray-400" />
                                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{repository.contributors} contributors</span>
                                    </div>
                                    <span className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-sm ml-auto`}>
                                        Created {formatTime(repository.created_at)} • Updated {formatTime(repository.updated_at)}
                                    </span>
                                </div>
                            </div>
                            <div className={`px-6 py-3 flex justify-between items-center border-t ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/80'} backdrop-blur-sm`}>
                                <div className="flex -space-x-2">
                                    {[...Array(Math.min(3, repository.contributors))].map((_, i) => (
                                        <div key={i} className={`w-8 h-8 rounded-full border-2 ${darkMode ? 'border-gray-800 bg-gray-700' : 'border-white bg-gray-100'} flex items-center justify-center text-xs font-medium`}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                    ))}
                                    {repository.contributors > 3 && (
                                        <div className={`w-8 h-8 rounded-full border-2 ${darkMode ? 'border-gray-800 bg-gray-700 text-gray-300' : 'border-white bg-gray-100 text-gray-600'} flex items-center justify-center text-xs font-medium`}>
                                            +{repository.contributors - 3}
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
            )}
        </div>
    );
};

export default RepositoriesList;