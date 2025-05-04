import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Folder, File, X, Moon, Sun, Plus, Edit, Trash, Save, GitBranch, GitCommit, Search, Terminal } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Rocket } from 'lucide-react';
import Confetti from 'react-dom-confetti';
import Editor from '@monaco-editor/react';

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
    language: string;
    owner: {
        username: string;
    };
    actualName?: string;
    parent_id?: number;
}

interface DirectoryItem {
    name: string;
    type: 'file' | 'folder';
    size?: number;
    lastModified?: string;
}

interface TreeNode {
    name: string;
    type: 'file' | 'folder';
    path: string;
    isExpanded: boolean;
    children: TreeNode[];
    loaded: boolean;
    parentPath?: string;
}

const UserOwnRepoPreview = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [repo, setRepo] = useState<Repository | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();
    const [darkMode, setDarkMode] = useState(location.state?.darkMode ?? true);
    const [currentPath, setCurrentPath] = useState<string>('');
    const [displayPath, setDisplayPath] = useState<string>('');
    const [directoryContents, setDirectoryContents] = useState<DirectoryItem[]>([]);
    const [directoryLoading, setDirectoryLoading] = useState(true);
    const [directoryError, setDirectoryError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
    const [newItemName, setNewItemName] = useState<string>('');
    const [newItemType, setNewItemType] = useState<'file' | 'folder'>('folder');
    const [newFileContent, setNewFileContent] = useState<string>('');
    const [renameItem, setRenameItem] = useState<{ oldPath: string; newPath: string } | null>(null);
    const [commitMessage, setCommitMessage] = useState<string>('');
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [headerScrolled, setHeaderScrolled] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showCommitSuccess, setShowCommitSuccess] = useState(false);
    const [sidebarTree, setSidebarTree] = useState<TreeNode[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('plaintext');
    const [terminalOpen, setTerminalOpen] = useState(false);
    const [initialRootPath, setInitialRootPath] = useState<string>('');

    const filteredContents = directoryContents
        .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.name.endsWith('.git'))
        .sort((a, b) => a.type === 'folder' ? -1 : 1);

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

                let originalOwner = "";
                let originalRepoName = "";
                if (repoData.data.parent_id) {
                    const parentRepoResponse = await fetch(
                        `http://localhost:5000/v1/api/repositories/${repoData.data.parent_id}`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    if (!parentRepoResponse.ok) throw new Error('Failed to fetch parent repository');
                    const parentRepoData = await parentRepoResponse.json();

                    const parentUserResponse = await fetch(
                        `http://localhost:5000/v1/api/users/${parentRepoData.data.owner_user_id}`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    if (!parentUserResponse.ok) throw new Error('Failed to fetch parent user details');
                    const parentUserData = await parentUserResponse.json();

                    originalOwner = parentUserData.data.username;
                    originalRepoName = parentRepoData.data.name;
                }

                setRepo({
                    ...repoData.data,
                    owner: {
                        username: userData.data.username
                    },
                    originalOwner: originalOwner,
                    originalRepoName: originalRepoName
                });

                const cloneResponse = await fetch(
                    `http://localhost:5000/v1/api/preview/clone/${encodeURIComponent(repoData.data.name)}.git?ownername=${encodeURIComponent(userData.data.username)}`,
                    { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
                );

                const cloneResult = await cloneResponse.json();
                if (cloneResult.status === 'success') {
                    setCurrentPath(cloneResult.data);
                    setDisplayPath(cloneResult.data.replace('temp-working-directory/', ''));
                    setInitialRootPath(cloneResult.data);
                } else if (cloneResult.error?.includes('File exists')) {
                    const path = `temp-working-directory/${repoData.data.name}.git`;
                    setCurrentPath(path);
                    setDisplayPath(path.replace('temp-working-directory/', ''));
                    setInitialRootPath(path);
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

    const SIDEBAR_WIDTH = 320;

    useEffect(() => {
        if (!repo || !initialRootPath) return;

        const loadInitialTree = async () => {
            const cleanPath = initialRootPath.replace('temp-working-directory/', '');
            const rootNode: TreeNode = {
                name: cleanPath.split('/').pop() || cleanPath,
                type: 'folder',
                path: cleanPath,
                isExpanded: true,
                children: [],
                loaded: false,
                parentPath: ''
            };
            setSidebarTree([rootNode]);
        };

        loadInitialTree();
    }, [repo, initialRootPath]);

    const toggleFolder = async (path: string) => {
        const node = findNode(sidebarTree, path);
        if (!node) return;

        if (!node.loaded) {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(
                    `http://localhost:5000/v1/api/preview/content?relativePath=${encodeURIComponent(path)}&ownername=${encodeURIComponent(repo?.owner.username || '')}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.ok) {
                    const data = await response.json();
                    const children = data.data.content
                        .filter((item: DirectoryItem) => item.name !== '.git') // Filter out .git folder
                        .map((item: DirectoryItem) => ({
                            name: item.name,
                            type: item.type,
                            path: `${path}/${item.name}`,
                            isExpanded: false,
                            children: [],
                            loaded: false,
                            parentPath: path
                        }));

                    setSidebarTree(prev => updateTree(prev, path, n => ({
                        ...n,
                        children,
                        loaded: true
                    })));
                }
            } catch (err) {
                console.error('Error loading folder contents:', err);
            }
        }

        setSidebarTree(prev => updateTree(prev, path, n => ({
            ...n,
            isExpanded: !n.isExpanded
        })));
    };

    const findNode = (nodes: TreeNode[], targetPath: string): TreeNode | undefined => {
        for (const node of nodes) {
            if (node.path === targetPath) return node;
            const found = findNode(node.children, targetPath);
            if (found) return found;
        }
        return undefined;
    };

    const updateTree = (nodes: TreeNode[], targetPath: string, updater: (node: TreeNode) => TreeNode): TreeNode[] => {
        return nodes.map(node => {
            if (node.path === targetPath) return updater(node);
            return { ...node, children: updateTree(node.children, targetPath, updater) };
        });
    };

    const addChildNode = (nodes: TreeNode[], parentPath: string, newNode: TreeNode): TreeNode[] => {
        return nodes.map(node => {
            if (node.path === parentPath) {
                return { ...node, children: [newNode, ...node.children] };
            }
            return { ...node, children: addChildNode(node.children, parentPath, newNode) };
        });
    };

    const removeNode = (nodes: TreeNode[], targetPath: string): TreeNode[] => {
        return nodes.filter(node => node.path !== targetPath).map(node => ({
            ...node,
            children: removeNode(node.children, targetPath)
        }));
    };

    const TreeView = ({ nodes, onToggle }: { nodes: TreeNode[], onToggle: (path: string) => void }) => (
        <div className="pl-2">
            {nodes.map(node => (
                <div key={node.path}>
                    <div className="flex items-center">
                        {node.type === 'folder' && (
                            <button
                                onClick={() => onToggle(node.path)}
                                className="mr-1 p-1 hover:bg-gray-700 rounded text-sm"
                            >
                                {node.isExpanded ? '▼' : '▶'}
                            </button>
                        )}
                        <div className={`flex items-center flex-1 p-2 rounded-lg cursor-pointer ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}>
                            <FileIcon type={node.type} name={node.name} />
                            <span className="ml-2">{node.name}</span>
                        </div>
                    </div>
                    {node.type === 'folder' && node.isExpanded && (
                        <TreeView nodes={node.children} onToggle={onToggle} />
                    )}
                </div>
            ))}
        </div>
    );

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
                    setDirectoryContents(responseData.data.content.filter((item: DirectoryItem) => !(item.type === 'folder' && item.name.endsWith('.git'))));
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
                setNewFileContent(data.data.content);
            }
        } catch (err) {
            setDirectoryError(err instanceof Error ? err.message : 'Failed to load file content');
        }
    };

    const handleCreateItem = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');

            const cleanPath = currentPath.replace('temp-working-directory/', '');
            const rawPath = `${cleanPath}/${newItemName}`;

            const response = await fetch(`http://localhost:5000/v1/api/preview/item`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    relativePath: rawPath,
                    type: newItemType,
                    ...(newItemType === 'file' && { content: newFileContent })
                })
            });

            if (!response.ok) throw new Error('Failed to create item');

            setNewItemName('');
            setNewFileContent('');
            setIsCreating(false);
            const newItemPath = `${cleanPath}/${newItemName}`;
            const newTreeNode: TreeNode = {
                name: newItemName,
                type: newItemType,
                path: newItemPath,
                isExpanded: newItemType === 'folder',
                children: [],
                loaded: false,
                parentPath: cleanPath
            };
            setDirectoryContents([{ name: newItemName, type: newItemType }, ...directoryContents]);
            setSidebarTree(prev => addChildNode(prev, cleanPath, newTreeNode));
            if (newItemType === 'file') {
                setHasChanges(true);
            }
        } catch (err) {
            setDirectoryError(err instanceof Error ? err.message : 'Failed to create item');
        }
    };

    const handleModifyFileContent = async () => {
        if (!selectedFile) return;

        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');

            const cleanPath = selectedFile.path.replace('temp-working-directory/', '');
            const response = await fetch(`http://localhost:5000/v1/api/preview/content`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    relativePath: cleanPath,
                    newContent: newFileContent
                })
            });

            if (!response.ok) throw new Error('Failed to modify file content');

            setSelectedFile({ ...selectedFile, content: newFileContent });
            setNewFileContent('');
            setHasChanges(true);
        } catch (err) {
            setDirectoryError(err instanceof Error ? err.message : 'Failed to modify file content');
        }
    };

    const handleRenameItem = async () => {
        if (!renameItem) return;

        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');

            const oldCleanPath = renameItem.oldPath.replace('temp-working-directory/', '');
            const newCleanPath = renameItem.newPath.replace('temp-working-directory/', '');

            const response = await fetch(`http://localhost:5000/v1/api/preview/item`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    oldRelativePath: oldCleanPath,
                    newRelativePath: newCleanPath
                })
            });

            if (!response.ok) throw new Error('Failed to rename item');

            setDirectoryContents(directoryContents.map(item =>
                item.name === renameItem.oldPath.split('/').pop()
                    ? { ...item, name: renameItem.newPath.split('/').pop() || item.name }
                    : item
            ));
            setRenameItem(null);
            setHasChanges(true);

            const oldPath = renameItem.oldPath.replace('temp-working-directory/', '');
            const newPath = renameItem.newPath.replace('temp-working-directory/', '');
            setSidebarTree(prev =>
                updateTree(prev, oldPath, n => ({
                    ...n,
                    name: newPath.split('/').pop() || n.name,
                    path: newPath,
                    children: n.children.map(child => ({
                        ...child,
                        path: child.path.replace(oldPath, newPath),
                        parentPath: newPath
                    }))
                }))
            );
        } catch (err) {
            setDirectoryError(err instanceof Error ? err.message : 'Failed to rename item');
        }
    };

    const handleDeleteItem = async (itemName: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');

            const item = directoryContents.find(item => item.name === itemName);
            if (!item) throw new Error('Item not found');

            const cleanPath = `${currentPath}/${itemName}`.replace('temp-working-directory/', '');

            let containsFiles = false;
            if (item.type === 'file') {
                containsFiles = true;
            } else {
                containsFiles = await checkIfContainsFiles(cleanPath);
            }

            const response = await fetch(`http://localhost:5000/v1/api/preview/item?relativePath=${encodeURIComponent(cleanPath)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete item');

            setDirectoryContents(directoryContents.filter(item => item.name !== itemName));

            const itemPath = `${currentPath}/${itemName}`.replace('temp-working-directory/', '');
            setSidebarTree(prev => removeNode(prev, itemPath));

            if (containsFiles) {
                setHasChanges(true);
            }
        } catch (err) {
            setDirectoryError(err instanceof Error ? err.message : 'Failed to delete item');
        }
    };

    const checkIfContainsFiles = async (path: string): Promise<boolean> => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(`http://localhost:5000/v1/api/preview/content?relativePath=${encodeURIComponent(path)}&ownername=${encodeURIComponent(repo?.owner.username || '')}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch directory contents');

            const data = await response.json();

            if (data.data.type === 'file') {
                return true;
            }

            if (data.data.type === 'folder') {
                for (const item of data.data.content) {
                    if (item.type === 'file' || await checkIfContainsFiles(`${path}/${item.name}`)) {
                        return true;
                    }
                }
            }

            return false;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const handleCommitChanges = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');

            const response = await fetch(
                `http://localhost:5000/v1/api/preview/push/${encodeURIComponent(repo?.name)}.git?ownername=${encodeURIComponent(repo?.owner.username || '')}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ commitMessage })
                }
            );

            if (!response.ok) throw new Error('Failed to commit changes');

            setShowCommitSuccess(true);
            setCommitMessage('');
            setHasChanges(false);

            setTimeout(() => setShowCommitSuccess(false), 3000);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to commit changes';
            if (errorMessage.includes('nothing to commit') || errorMessage.includes('No changes')) {
                setDirectoryError('No changes to any files to commit. Make file modifications to enable commit.');
            } else {
                setDirectoryError(errorMessage);
            }
        }
    };

    const FileIcon = ({ type, name }: { type: 'file' | 'folder', name: string }) => {
        const extension = name.split('.').pop();
        const getColor = () => {
            if (type === 'folder') return 'text-amber-400';
            switch (extension) {
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
            className={`group relative flex items-center p-3 rounded-xl ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-200'
                } transition-all duration-200 shadow-sm ${darkMode ? 'bg-gray-800/30' : 'bg-white'
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
            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setRenameItem({
                        oldPath: `${currentPath}/${item.name}`,
                        newPath: `${currentPath}/${item.name}`
                    })}
                    className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-300'
                        }`}
                >
                    <Edit size={16} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                </button>
                <button
                    onClick={() => handleDeleteItem(item.name)}
                    className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-300'
                        }`}
                >
                    <Trash size={16} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                </button>
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
        <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white'
                : 'bg-gradient-to-br from-gray-50 to-white text-gray-800'
            } transition-all duration-300`}>
            <header className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white/95 border-gray-200'
                } backdrop-blur-xl border-b transition-all duration-300 ${headerScrolled ? 'py-3' : 'py-4'
                }`}>
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate(-1)}
                            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                                } transition-colors`}
                        >
                            <ChevronLeft size={24} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                        </button>
                        <div className="flex items-center space-x-3">
                            <motion.div
                                whileHover={{ rotate: 12, scale: 1.1 }}
                                className={`p-2 rounded-lg ${darkMode ? 'bg-violet-600' : 'bg-cyan-600'
                                    }`}
                            >
                                <GitBranch size={24} className="text-white" />
                            </motion.div>
                            <div className="flex flex-col">
                                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'
                                    }`}>
                                    {repo?.owner.username}/<span className="text-violet-400">{repo?.actualName || repo?.name}</span>
                                </h1>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    {repo?.description || 'No description provided'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className={`relative transition-all duration-300 ${headerScrolled ? 'w-64' : 'w-96'
                            }`}>
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full px-4 py-2 rounded-xl ${darkMode
                                        ? 'bg-gray-800 text-white placeholder-gray-500'
                                        : 'bg-gray-100 text-gray-800 placeholder-gray-400'
                                    } pr-10 transition-all`}
                            />
                            <Search size={18} className={`absolute right-3 top-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'
                                }`} />
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={() => setTerminalOpen(!terminalOpen)}
                                className={`p-2 rounded-xl ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                <Terminal size={20} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                            </button>
                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className={`p-2 rounded-xl ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
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
                <motion.aside
                    initial={{ x: 0 }}
                    className={`w-80 fixed left-0 h-full p-6 border-r z-60 ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white/50'
                        } backdrop-blur-lg`}
                    style={{ width: `${SIDEBAR_WIDTH}px` }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'
                            }`}>
                            Repository Structure
                        </h2>
                    </div>
                    <TreeView
                        nodes={sidebarTree}
                        onToggle={toggleFolder}
                    />
                </motion.aside>

                <main className={`flex-1 transition-all duration-300 ml-80`}>
                    <div className="container mx-auto px-8 py-6">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-4">
                                <div className={`flex items-center space-x-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'
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
                                onClick={() => setIsCreating(true)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${darkMode
                                        ? 'bg-violet-600 hover:bg-violet-700 text-white'
                                        : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                    } transition-colors`}
                            >
                                <Plus size={18} />
                                <span>New</span>
                            </button>
                        </div>

                        <AnimatePresence>
                            {isCreating && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`mb-6 p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50' : 'bg-white'
                                        } backdrop-blur-lg shadow-xl`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">Create New Item</h3>
                                        <button
                                            onClick={() => setIsCreating(false)}
                                            className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                                }`}
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="Item name"
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            className={`w-full px-4 py-2 rounded-lg ${darkMode
                                                    ? 'bg-gray-700 text-white placeholder-gray-500'
                                                    : 'bg-gray-100 text-gray-800 placeholder-gray-400'
                                                }`}
                                        />
                                        <select
                                            value={newItemType}
                                            onChange={(e) => setNewItemType(e.target.value as 'file' | 'folder')}
                                            className={`w-full px-4 py-2 rounded-lg ${darkMode
                                                    ? 'bg-gray-700 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            <option value="folder">Folder</option>
                                            <option value="file">File</option>
                                        </select>
                                        <button
                                            onClick={handleCreateItem}
                                            className={`w-full py-2.5 rounded-lg ${darkMode
                                                    ? 'bg-violet-600 hover:bg-violet-700'
                                                    : 'bg-cyan-600 hover:bg-cyan-700'
                                                } text-white transition-colors`}
                                        >
                                            Create Item
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {directoryLoading && (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
                            </div>
                        )}

                        {directoryError && (
                            <div className={`p-4 mb-6 rounded-xl ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
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
                                            className={`col-span-full p-8 text-center rounded-xl ${darkMode ? 'bg-gray-800/30' : 'bg-white'
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
                            {renameItem && (
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
                                        className={`w-full max-w-md rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Rename Item</h3>
                                            <button
                                                onClick={() => setRenameItem(null)}
                                                className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                                    }`}
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={renameItem.newPath.split('/').pop() || ''}
                                            onChange={(e) => setRenameItem({
                                                ...renameItem,
                                                newPath: `${renameItem.newPath.split('/').slice(0, -1).join('/')}/${e.target.value}`
                                            })}
                                            className={`w-full px-4 py-2 rounded-lg ${darkMode
                                                    ? 'bg-gray-700 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                                } mb-4`}
                                        />
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => setRenameItem(null)}
                                                className={`px-4 py-2 rounded-lg ${darkMode
                                                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                                    }`}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleRenameItem}
                                                className={`px-4 py-2 rounded-lg ${darkMode
                                                        ? 'bg-violet-600 hover:bg-violet-700 text-white'
                                                        : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                                    }`}
                                            >
                                                Rename
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {selectedFile && (
                                <motion.div
                                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                                    style={{ left: `${SIDEBAR_WIDTH}px`, width: `calc(100% - ${SIDEBAR_WIDTH}px)` }}
                                >
                                    <div className="h-screen w-full flex flex-col">
                                        <div className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                            <div className="flex items-center space-x-4">
                                                <select
                                                    value={selectedLanguage}
                                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                                    className={`px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}
                                                >
                                                    <option value="plaintext">Plain Text</option>
                                                    <option value="python">Python</option>
                                                    <option value="javascript">JavaScript</option>
                                                    <option value="typescript">TypeScript</option>
                                                    <option value="java">Java</option>
                                                    <option value="csharp">C#</option>
                                                    <option value="cpp">C++</option>
                                                    <option value="html">HTML</option>
                                                    <option value="css">CSS</option>
                                                </select>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={handleModifyFileContent}
                                                    className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-violet-600 hover:bg-violet-700' : 'bg-cyan-600 hover:bg-cyan-700'} text-white`}
                                                >
                                                    Save Changes
                                                </button>
                                                <button
                                                    onClick={() => setSelectedFile(null)}
                                                    className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <Editor
                                                height="100%"
                                                language={selectedLanguage as string}
                                                theme={darkMode ? 'vs-dark' : 'vs-light'}
                                                value={newFileContent}
                                                onChange={(value) => setNewFileContent(value || '')}
                                                options={{
                                                    minimap: { enabled: false },
                                                    automaticLayout: true,
                                                    scrollBeyondLastLine: false,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {terminalOpen && (
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800' : 'bg-white'
                                        } border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'
                                        } shadow-2xl rounded-t-2xl`}
                                >
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center space-x-2">
                                            <Terminal size={18} className="text-green-400" />
                                            <span className="font-mono text-sm">Terminal</span>
                                        </div>
                                        <button
                                            onClick={() => setTerminalOpen(false)}
                                            className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                                }`}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div className={`h-48 p-4 font-mono text-sm overflow-auto ${darkMode ? 'bg-gray-900 text-green-400' : 'bg-gray-100 text-green-800'
                                        }`}>
                                        <div className="mb-2">$ git status</div>
                                        <div className="text-gray-400">On branch main</div>
                                        <div className="text-gray-400">Your branch is up to date.</div>
                                        <div className="mt-4 mb-2">$ git add .</div>
                                        <div className="mt-4 mb-2">$ git commit -m "{commitMessage || 'Update files'}"</div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className={`fixed bottom-6 right-6 p-4 rounded-2xl shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'
                            }`}>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="text"
                                    placeholder="Commit message"
                                    value={commitMessage}
                                    onChange={(e) => setCommitMessage(e.target.value)}
                                    className={`px-4 py-2 rounded-xl ${darkMode
                                            ? 'bg-gray-700 text-white placeholder-gray-500'
                                            : 'bg-gray-100 text-gray-800 placeholder-gray-400'
                                        } w-64`}
                                />
                                <div className="relative group">
                                    <button
                                        onClick={handleCommitChanges}
                                        disabled={!hasChanges}
                                        className={`px-4 py-2 rounded-xl flex items-center space-x-2 ${
                                            darkMode
                                                ? hasChanges
                                                    ? 'bg-violet-600 hover:bg-violet-700 text-white'
                                                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                                : hasChanges
                                                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        <GitCommit size={18} />
                                        <span>Commit Changes</span>
                                    </button>
                                    {!hasChanges && (
                                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm rounded-lg ${
                                            darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-900 text-white'
                                        } opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}>
                                            Git tracks only file modifications. Make changes to files to enable commit.
                                            <div className={`absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 ${
                                                darkMode ? 'bg-gray-800' : 'bg-gray-900'
                                            } rotate-45`} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showCommitSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 p-6 rounded-2xl backdrop-blur-lg ${
                                        darkMode
                                            ? 'bg-violet-700/30 border border-violet-600/50'
                                            : 'bg-cyan-500/20 border border-cyan-400/30'
                                        } shadow-xl overflow-hidden`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className={`p-3 rounded-full ${
                                                darkMode ? 'bg-violet-600/80' : 'bg-cyan-500/80'
                                            }`}
                                        >
                                            <CheckCircle
                                                size={32}
                                                className={`${darkMode ? 'text-white' : 'text-white'} animate-pop-in`}
                                            />
                                        </motion.div>

                                        <div className="flex-1">
                                            <h3 className={`text-lg font-semibold ${
                                                darkMode ? 'text-violet-100' : 'text-cyan-900'
                                            }`}>
                                                Commit Successful!
                                            </h3>
                                            <p className={`text-sm ${
                                                darkMode ? 'text-violet-300/90' : 'text-cyan-800/90'
                                            }`}>
                                                Changes to <span className="font-mono">{repo?.name}</span> have been securely stored
                                            </p>
                                            <div className={`mt-2 text-xs ${
                                                darkMode ? 'text-violet-400' : 'text-cyan-700'
                                            }`}>
                                                <span className="font-mono">"{commitMessage || 'Update files'}"</span>
                                            </div>
                                        </div>

                                        <Confetti
                                            active={showCommitSuccess}
                                            config={{
                                                elementCount: 200,
                                                spread: 90,
                                                startVelocity: 30,
                                                dragFriction: 0.12,
                                                duration: 3000,
                                                stagger: 3,
                                                colors: darkMode
                                                    ? ['#7c3aed', '#a78bfa', '#c4b5fd']
                                                    : ['#0891b2', '#06b6d4', '#67e8f9']
                                            }}
                                        />
                                    </div>

                                    <motion.div
                                        initial={{ width: '100%' }}
                                        animate={{ width: '0%' }}
                                        transition={{ duration: 3, ease: 'linear' }}
                                        className={`absolute bottom-0 left-0 h-1 ${
                                            darkMode ? 'bg-violet-500/80' : 'bg-cyan-400/80'
                                        }`}
                                    />

                                    <Rocket
                                        size={20}
                                        className={`absolute -top-4 -right-4 opacity-20 ${
                                            darkMode ? 'text-violet-300' : 'text-cyan-400'
                                        } transform rotate-45`}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default UserOwnRepoPreview;
