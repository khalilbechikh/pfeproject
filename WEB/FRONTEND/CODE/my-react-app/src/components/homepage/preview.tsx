import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Folder, File, X, Moon, Sun, GitBranch, GitFork, Search } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';

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

const Preview = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [repo, setRepo] = useState<Repository | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [forkStatus, setForkStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [forkError, setForkError] = useState<string | null>(null);
    const [darkMode, setDarkMode] = useState(
        location.state && typeof location.state.darkMode === 'boolean'
            ? location.state.darkMode
            : true
    );
    const [currentPath, setCurrentPath] = useState<string>('');
    const [displayPath, setDisplayPath] = useState<string>('');
    const [directoryContents, setDirectoryContents] = useState<DirectoryItem[]>([]);
    const [directoryLoading, setDirectoryLoading] = useState(true);
    const [directoryError, setDirectoryError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [headerScrolled, setHeaderScrolled] = useState(false);

    const filteredContents = directoryContents.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleScroll = useCallback(() => {
        setHeaderScrolled(window.scrollY > 50);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    useEffect(() => {
        const fetchRepo = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('No authentication token found');

                const repoResponse = await fetch(`http://localhost:5000/v1/api/repositories/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!repoResponse.ok) throw new Error('Failed to fetch repository');
                const repoData = await repoResponse.json();

                const userResponse = await fetch(
                    `http://localhost:5000/v1/api/users/${repoData.data.owner_user_id}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (!userResponse.ok) throw new Error('Failed to fetch user details');
                const userData = await userResponse.json();

                setRepo({
                    ...repoData.data,
                    owner: { username: userData.data.username }
                });

                const cloneResponse = await fetch(
                    `http://localhost:5000/v1/api/preview/clone/${repoData.data.name}.git?ownername=${userData.data.username}`,
                    { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
                );

                const cloneResult = await cloneResponse.json();

                if (cloneResult.status === 'success') {
                    setCurrentPath(cloneResult.data);
                    setDisplayPath(cloneResult.data.replace('temp-working-directory/', ''));
                } else if (cloneResult.error?.includes('File exists')) {
                    const path = `temp-working-directory/${repoData.data.name}.git`;
                    setCurrentPath(path);
                    setDisplayPath(path.replace('temp-working-directory/', ''));
                } else {
                    throw new Error(cloneResult.message || 'Clone failed');
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load repository');
            } finally {
                setLoading(false);
            }
        };

        fetchRepo();
    }, [id]);

    useEffect(() => {
        const fetchDirectoryContents = async () => {
            if (!repo || !currentPath) return;

            setDirectoryLoading(true);
            setDirectoryError(null);

            try {
                const token = localStorage.getItem('authToken');
                if (!token) throw new Error('No authentication token found');

                const cleanPath = currentPath.replace('temp-working-directory/', '');

                const response = await fetch(
                    `http://localhost:5000/v1/api/preview/content?relativePath=${encodeURIComponent(cleanPath)}&ownername=${encodeURIComponent(repo.owner.username)}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch directory contents');
                }

                const responseData = await response.json();

                if (responseData.data.type === 'folder') {
                    setDirectoryContents(responseData.data.content);
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

    const handleFolderClick = (folderName: string) => {
        const newPath = `${currentPath}/${folderName}`;
        setCurrentPath(newPath);
        setDisplayPath(newPath.replace('temp-working-directory/', ''));
    };

    const handleBackClick = () => {
        const pathSegments = currentPath.split('/');
        if (pathSegments.length > 1) {
            pathSegments.pop();
            const newPath = pathSegments.join('/');
            setCurrentPath(newPath);
            setDisplayPath(newPath.replace('temp-working-directory/', ''));
        }
    };

    const handleFileClick = async (fileName: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');

            const cleanPath = `${currentPath}/${fileName}`.replace('temp-working-directory/', '');
            const response = await fetch(
                `http://localhost:5000/v1/api/preview/content?relativePath=${encodeURIComponent(cleanPath)}&ownername=${encodeURIComponent(repo?.owner.username || '')}`,
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

    const FileIcon = ({ type, name }: { type: 'file' | 'folder', name: string }) => {
        const extension = name.split('.').pop();
        const getColor = () => {
            if (type === 'folder') return 'text-amber-400';
            switch(extension) {
                case 'js': return 'text-yellow-400';
                case 'ts': return 'text-blue-400';
                case 'css': return 'text-purple-400';
                case 'json': return 'text-green-400';
                case 'md': return 'text-pink-400';
                default: return 'text-gray-400';
            }
        };
        
        return (
            <motion.div whileHover={{ scale: 1.1 }} className="mr-2">
                {type === 'folder' ? (
                    <Folder className={`h-6 w-6 ${getColor()}`} />
                ) : (
                    <File className={`h-6 w-6 ${getColor()}`} />
                )}
            </motion.div>
        );
    };

    const DirectoryItemCard = ({ item }: { item: DirectoryItem }) => (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={`group relative flex items-center p-3 rounded-xl ${
                darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-200'
            } transition-all duration-200 shadow-sm ${
                darkMode ? 'bg-gray-800/30' : 'bg-white'
            }`}
        >
            <div className="flex items-center flex-1" onClick={() => item.type === 'folder' 
                ? handleFolderClick(item.name) 
                : handleFileClick(item.name)}>
                <FileIcon type={item.type} name={item.name} />
                <span className="font-mono text-sm">{item.name}</span>
                {item.size && (
                    <span className="ml-2 text-xs opacity-60">
                        {(item.size / 1024).toFixed(2)} KB
                    </span>
                )}
            </div>
        </motion.div>
    );

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
                    <h2 className="text-lg font-bold mb-2">Error Loading Repository</h2>
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className={`px-4 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded`}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen flex flex-col ${
            darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
            : 'bg-gradient-to-br from-gray-50 to-white text-gray-800'
        } transition-all duration-300`}>
            <header className={`fixed top-0 left-0 right-0 z-50 ${
                darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white/95 border-gray-200'
            } backdrop-blur-xl border-b transition-all duration-300 ${
                headerScrolled ? 'py-3' : 'py-4'
            }`}>
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate(-1)}
                            className={`p-2 rounded-xl ${
                                darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            } transition-colors`}
                        >
                            <ChevronLeft size={24} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                        </button>
                        <div className="flex items-center space-x-3">
                            <motion.div 
                                whileHover={{ rotate: 12, scale: 1.1 }}
                                className={`p-2 rounded-lg ${
                                    darkMode ? 'bg-violet-600' : 'bg-cyan-600'
                                }`}
                            >
                                <GitBranch size={24} className="text-white" />
                            </motion.div>
                            <div className="flex flex-col">
                                <h1 className={`text-xl font-bold ${
                                    darkMode ? 'text-white' : 'text-gray-800'
                                }`}>
                                    {repo?.owner.username}/<span className="text-violet-400">{repo?.name}</span>
                                </h1>
                                <p className={`text-sm ${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    {repo?.description || 'No description provided'}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <div className={`relative transition-all duration-300 ${
                            headerScrolled ? 'w-64' : 'w-96'
                        }`}>
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full px-4 py-2 rounded-xl ${
                                    darkMode 
                                    ? 'bg-gray-800 text-white placeholder-gray-500' 
                                    : 'bg-gray-100 text-gray-800 placeholder-gray-400'
                                } pr-10 transition-all`}
                            />
                            <Search size={18} className={`absolute right-3 top-3 ${
                                darkMode ? 'text-gray-500' : 'text-gray-400'
                            }`} />
                        </div>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`p-2 rounded-xl ${
                                    darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                {darkMode ? (
                                    <Sun size={20} className="text-amber-400" />
                                ) : (
                                    <Moon size={20} className="text-indigo-600" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 pt-20">
                {sidebarOpen && (
                    <motion.aside 
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        className={`w-80 fixed left-0 h-full p-6 border-r ${
                            darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white/50'
                        } backdrop-blur-lg`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className={`text-lg font-semibold ${
                                darkMode ? 'text-gray-300' : 'text-gray-800'
                            }`}>
                                Repository Structure
                            </h2>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className={`p-1 rounded-lg ${
                                    darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                                }`}
                            >
                                <X size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                            </button>
                        </div>
                        <div className="space-y-1">
                            {directoryContents
                                .filter(item => item.type === 'folder')
                                .map((folder) => (
                                    <div
                                        key={folder.name}
                                        className={`flex items-center p-2 rounded-lg cursor-pointer ${
                                            darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                                        }`}
                                        onClick={() => handleFolderClick(folder.name)}
                                    >
                                        <Folder className="h-5 w-5 mr-2 text-amber-400" />
                                        <span>{folder.name}</span>
                                    </div>
                                ))}
                        </div>
                    </motion.aside>
                )}

                <main className={`flex-1 transition-all duration-300 ${
                    sidebarOpen ? 'ml-80' : 'ml-0'
                }`}>
                    <div className="container mx-auto px-8 py-6">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-4">
                                {!sidebarOpen && (
                                    <button
                                        onClick={() => setSidebarOpen(true)}
                                        className={`p-2 rounded-lg ${
                                            darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                    >
                                        <Folder size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                                    </button>
                                )}
                                <div className={`flex items-center space-x-2 text-sm ${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    {displayPath.split('/').map((segment, index) => (
                                        <React.Fragment key={index}>
                                            <span 
                                                className="hover:text-violet-400 cursor-pointer"
                                                onClick={() => {
                                                    const newPath = displayPath.split('/').slice(0, index + 1).join('/');
                                                    setCurrentPath(`temp-working-directory/${newPath}`);
                                                    setDisplayPath(newPath);
                                                }}
                                            >
                                                {segment}
                                            </span>
                                            {index < displayPath.split('/').length - 1 && (
                                                <span className="mx-1">/</span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            
                            <button
                                onClick={handleFork}
                                disabled={forkStatus === 'loading' || forkStatus === 'success'}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
                                    darkMode 
                                    ? 'bg-violet-600 hover:bg-violet-700 text-white' 
                                    : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                } transition-colors ${
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
                            <div className={`p-4 mb-6 rounded-xl ${
                                darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                            }`}>
                                {forkError}
                            </div>
                        )}

                        {forkStatus === 'success' && (
                            <div className={`p-4 mb-6 rounded-xl ${
                                darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                            }`}>
                                Repository successfully forked! Redirecting...
                            </div>
                        )}

                        {directoryLoading && (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
                            </div>
                        )}

                        {directoryError && (
                            <div className={`p-4 mb-6 rounded-xl ${
                                darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                            }`}>
                                {directoryError}
                            </div>
                        )}

                        {!directoryLoading && !directoryError && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AnimatePresence>
                                    {filteredContents.length > 0 ? (
                                        filteredContents.map((item) => (
                                            <DirectoryItemCard key={item.name} item={item} />
                                        ))
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`col-span-full p-8 text-center rounded-xl ${
                                                darkMode ? 'bg-gray-800/30' : 'bg-white'
                                            }`}
                                        >
                                            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                {searchQuery 
                                                    ? 'No files match your search' 
                                                    : 'This directory is empty'}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        <AnimatePresence>
                            {selectedFile && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center`}
                                >
                                    <motion.div
                                        initial={{ y: 50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -50, opacity: 0 }}
                                        className={`w-full max-w-4xl rounded-2xl p-6 ${
                                            darkMode ? 'bg-gray-800' : 'bg-white'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center space-x-2">
                                                <FileIcon 
                                                    type="file" 
                                                    name={selectedFile.path.split('.').pop() || 'file'} 
                                                />
                                                <span className="font-mono text-sm">
                                                    {selectedFile.path.split('/').pop()}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedFile(null)}
                                                className={`p-2 rounded-full ${
                                                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                                }`}
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className={`rounded-xl overflow-hidden ${
                                            darkMode ? 'bg-gray-900' : 'bg-gray-100'
                                        }`}>
                                            <pre className={`text-sm whitespace-pre-wrap break-words ${
                                                darkMode ? 'text-gray-300' : 'text-gray-800'
                                            } p-4 overflow-auto max-h-[70vh]`}>
                                                {selectedFile.content}
                                            </pre>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Preview;