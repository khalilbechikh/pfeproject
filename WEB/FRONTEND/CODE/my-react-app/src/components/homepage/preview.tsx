import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitFork, Moon, Sun, ChevronLeft, Folder, File, X } from 'lucide-react';
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
    forks_count: number;
    pull_requests_count: number;
    language: string;
    owner: {
        username: string;
    };
}

interface DirectoryItem {
    name: string;
    type: 'file' | 'folder';
    size?: number;
    lastModified?: string;
}

interface DirectoryContent {
    type: 'folder';
    path: string;
    content: DirectoryItem[];
}

const Preview = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [repo, setRepo] = useState<Repository | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [forkStatus, setForkStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [forkError, setForkError] = useState<string | null>(null);
    const [darkMode, setDarkMode] = useState(true); // Local dark mode state
    const [currentPath, setCurrentPath] = useState<string>('');
    const [directoryContents, setDirectoryContents] = useState<DirectoryItem[]>([]);
    const [directoryLoading, setDirectoryLoading] = useState(true);
    const [directoryError, setDirectoryError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);

    useEffect(() => {
        const fetchRepo = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('No authentication token found');

                // First fetch repository details
                const repoResponse = await fetch(`http://localhost:5000/v1/api/repositories/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!repoResponse.ok) throw new Error('Failed to fetch repository');
                const repoData = await repoResponse.json();

                // Then fetch owner details using owner_user_id from repository
                const userResponse = await fetch(
                    `http://localhost:5000/v1/api/users/${repoData.data.owner_user_id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!userResponse.ok) throw new Error('Failed to fetch user details');
                const userData = await userResponse.json();

                // Combine the data
                setRepo({
                    ...repoData.data,
                    owner: {
                        username: userData.data.username
                    }
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load repository');
            } finally {
                setLoading(false);
            }
        };

        fetchRepo();
    }, [id]);

    // Set initial current path when repo is loaded
    useEffect(() => {
        if (repo) {
            setCurrentPath(`${repo.name}.git`);
        }
    }, [repo]);

    // Fetch directory contents when currentPath or repo changes
    useEffect(() => {
        const fetchDirectoryContents = async () => {
            if (!repo || !currentPath) return;

            setDirectoryLoading(true);
            setDirectoryError(null);

            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('No authentication token found');

                const response = await fetch(
                    `http://localhost:5000/v1/api/preview/content?relativePath=${encodeURIComponent(currentPath)}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch directory contents');
                }

                const data: DirectoryContent = await response.json();
                if (data.type === 'folder') {
                    setDirectoryContents(data.content);
                } else {
                    throw new Error('Expected folder content');
                }
            } catch (err) {
                setDirectoryError(err instanceof Error ? err.message : 'Failed to load directory contents');
            } finally {
                setDirectoryLoading(false);
            }
        };

        fetchDirectoryContents();
    }, [currentPath, repo]);

    const handleFork = async () => {
        try {
            setForkStatus('loading');
            setForkError(null);
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(`http://localhost:5000/v1/api/repositories/${id}/fork`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fork repository');
            }

            setForkStatus('success');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setForkStatus('error');
            setForkError(err instanceof Error ? err.message : 'Failed to fork repository');
        }
    };

    // Navigation handlers
    const handleFolderClick = (folderName: string) => {
        setCurrentPath(`${currentPath}/${folderName}`);
    };

    const handleBackClick = () => {
        const pathSegments = currentPath.split('/');
        if (pathSegments.length > 1) {
            pathSegments.pop();
            setCurrentPath(pathSegments.join('/'));
        }
    };

    // File content handler
    const handleFileClick = async (fileName: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `http://localhost:5000/v1/api/preview/content?relativePath=${encodeURIComponent(`${currentPath}/${fileName}`)}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error('Failed to fetch file content');
            const data = await response.json();

            if (data.data.type === 'file') {
                setSelectedFile({ path: `${currentPath}/${fileName}`, content: data.data.content });
            }
        } catch (err) {
            setDirectoryError(err instanceof Error ? err.message : 'Failed to load file content');
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
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} text-red-500`}>
                <h2 className="text-lg font-bold mb-2">Error Loading Repository</h2>
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
        <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'} transition-colors duration-300`}>
            <header className={`fixed top-0 left-0 right-0 z-10 ${darkMode ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-md border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate(-1)}
                            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                        >
                            <ChevronLeft size={24} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                        </button>
                        <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-violet-600' : 'bg-cyan-600'} group hover:scale-110 transition-all duration-300 hover:rotate-12`}>
                                <GitFork className="h-6 w-6 text-white" />
                            </div>
                            <h1 className={`ml-3 text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Preview</h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors`}
                        >
                            {darkMode ? <Sun size={20} className="text-gray-400" /> : <Moon size={20} className="text-gray-600" />}
                        </button>
                    </div>
                </div>
            </header>
            <main className="pt-16 flex-1 transition-all duration-300">
                <div className="container mx-auto px-6 py-8 h-full flex flex-col">
                    <div className="flex-1">
                        <div className="mb-6 flex justify-between items-center">
                            <div>
                                <h1 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} mb-1`}>
                                    {repo?.owner.username}/{repo?.name}
                                </h1>
                                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {repo?.description || 'No description provided'}
                                </p>
                            </div>
                            <button
                                onClick={handleFork}
                                disabled={forkStatus === 'loading' || forkStatus === 'success'}
                                className={`flex items-center space-x-2 px-4 py-2 ${
                                    darkMode
                                        ? 'bg-violet-600/30 hover:bg-violet-600/50 text-violet-400'
                                        : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700'
                                    } rounded-lg transition-colors duration-300 ${
                                    (forkStatus === 'loading' || forkStatus === 'success') ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                <GitFork size={18} />
                                <span>
                                    {forkStatus === 'loading' ? 'Forking...' :
                                    forkStatus === 'success' ? 'Forked!' :
                                    'Add to my repositories'}
                                </span>
                            </button>
                        </div>

                        {forkStatus === 'error' && (
                            <div className={`p-4 mb-4 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
                                {forkError}
                            </div>
                        )}

                        {forkStatus === 'success' && (
                            <div className={`p-4 mb-4 rounded-lg ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                                Repository successfully forked! Redirecting...
                            </div>
                        )}

                        {/* Directory Browser */}
                        <div className={`rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-4`}>
                            <div className="flex items-center mb-4 space-x-2">
                                {currentPath !== `${repo?.name}.git` && (
                                    <button
                                        onClick={handleBackClick}
                                        className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                                    >
                                        <ChevronLeft size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                                    </button>
                                )}
                                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {currentPath}
                                </span>
                            </div>

                            {directoryLoading && (
                                <div className="flex justify-center p-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
                                </div>
                            )}

                            {directoryError && (
                                <div className={`p-4 mb-4 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
                                    {directoryError}
                                </div>
                            )}

                            {!directoryLoading && !directoryError && (
                                <div className="space-y-1">
                                    {directoryContents
                                        .sort((a, b) => a.type.localeCompare(b.type) * -1 || a.name.localeCompare(b.name))
                                        .map((item) => (
                                            <div
                                                key={item.name}
                                                onClick={() => item.type === 'folder' ? handleFolderClick(item.name) : handleFileClick(item.name)}
                                                className={`flex items-center p-2 rounded cursor-pointer ${
                                                    darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-200'
                                                }`}
                                            >
                                                {item.type === 'folder' ? (
                                                    <Folder className="h-5 w-5 mr-2 text-violet-400" />
                                                ) : (
                                                    <File className="h-5 w-5 mr-2 text-gray-400" />
                                                )}
                                                <span className="flex-1">{item.name}</span>
                                                {item.type === 'file' && (
                                                    <>
                                                        <span className={`text-sm mr-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {item.size ? `${(item.size / 1024).toFixed(2)} KB` : 'N/A'}
                                                        </span>
                                                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {item.lastModified ? new Date(item.lastModified).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            )}

                            {!directoryLoading && directoryContents.length === 0 && (
                                <div className="p-4 text-center">
                                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                        This directory is empty.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* File Content Preview */}
                        {selectedFile && (
                            <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-mono text-violet-400">{selectedFile.path}</span>
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-300'}`}
                                    >
                                        <X size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                                    </button>
                                </div>
                                <pre className={`text-sm whitespace-pre-wrap break-words ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                                    {selectedFile.content}
                                </pre>
                            </div>
                        )}
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
};

export default Preview;
