import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Folder, File, X, Moon, Sun, GitBranch, GitFork, AlertCircle } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import IssueReportModal from './IssueReportModal';
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

interface TreeNode {
    name: string;
    type: 'file' | 'folder';
    path: string;
    isExpanded: boolean;
    children: TreeNode[];
    loaded: boolean;
    parentPath?: string;
}

interface PreviewProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const Preview = ({ darkMode, setDarkMode }: PreviewProps) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    // const location = useLocation(); // No longer needed for darkMode
    const [repo, setRepo] = useState<Repository | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [forkStatus, setForkStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [forkError, setForkError] = useState<string | null>(null);
    // const [darkMode, setDarkMode] = useState( // Removed local state
    //     location.state && typeof location.state.darkMode === 'boolean'
    //         ? location.state.darkMode
    //         : true
    // );
    const [currentPath, setCurrentPath] = useState<string>('');
    const [displayPath, setDisplayPath] = useState<string>('');
    const [directoryContents, setDirectoryContents] = useState<DirectoryItem[]>([]);
    const [directoryLoading, setDirectoryLoading] = useState(true);
    const [directoryError, setDirectoryError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [headerScrolled, setHeaderScrolled] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [sidebarTree, setSidebarTree] = useState<TreeNode[]>([]);
    const [initialRootPath, setInitialRootPath] = useState<string>('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('plaintext');

    const handleScroll = useCallback(() => {
        setHeaderScrolled(window.scrollY > 50);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const getLanguageFromExtension = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        switch (extension) {
            // Popular languages
            case 'js':
                return 'javascript';
            case 'ts':
                return 'typescript';
            case 'py':
                return 'python';
            case 'java':
                return 'java';
            case 'cs':
                return 'csharp';
            case 'cpp':
                return 'cpp';
            case 'c':
                return 'c';
            case 'h':
                return 'cpp';
            case 'html':
                return 'html';
            case 'css':
                return 'css';
            case 'json':
                return 'json';
            case 'md':
                return 'markdown';
            case 'php':
                return 'php';
            case 'go':
                return 'go';
            case 'rb':
                return 'ruby';
            case 'rs':
                return 'rust';
            case 'swift':
                return 'swift';
            case 'kt':
                return 'kotlin';
            case 'scala':
                return 'scala';
            case 'sh':
                return 'shell';
            case 'pl':
                return 'perl';
            case 'lua':
                return 'lua';
            case 'r':
                return 'r';
            case 'dart':
                return 'dart';
            case 'jl':
                return 'julia';
            case 'hs':
                return 'haskell';
            case 'elm':
                return 'elm';
            case 'clj':
                return 'clojure';
            case 'scm':
                return 'scheme';
            case 'erl':
                return 'erlang';
            case 'fsharp':
                return 'fsharp';
            case 'ex':
                return 'elixir';
            case 'exs':
                return 'elixir';
            case 'groovy':
                return 'groovy';
            case 'sql':
                return 'sql';
            case 'yaml':
                return 'yaml';
            case 'yml':
                return 'yaml';
            case 'xml':
                return 'xml';
            case 'toml':
                return 'toml';
            case 'ini':
                return 'ini';
            case 'm':
                return 'objective-c';
            case 'mm':
                return 'objective-c';
            case 'vb':
                return 'vb';
            case 'ps1':
                return 'powershell';
            case 'coffee':
                return 'coffeescript';
            case 'fsx':
                return 'fsharp';
            case 'sc':
                return 'scala';
            case 'lisp':
                return 'lisp';
            case 'asm':
                return 'assembly';
            case 's':
                return 'assembly';
            case 'pas':
                return 'pascal';
            case 'd':
                return 'd';
            case 'v':
                return 'verilog';
            case 'sv':
                return 'systemverilog';
            case 'vhdl':
                return 'vhdl';
            case 'tcl':
                return 'tcl';
            case 'awk':
                return 'awk';
            case 'sed':
                return 'sed';
            case 'bat':
                return 'batch';
            case 'cmd':
                return 'batch';
            case 'ps':
                return 'postscript';
            case 'tex':
                return 'latex';
            case 'bib':
                return 'bibtex';
            case 'make':
                return 'makefile';
            case 'mk':
                return 'makefile';
            case 'cmake':
                return 'cmake';
            case 'dockerfile':
                return 'dockerfile';
            case 'graphql':
                return 'graphql';
            case 'proto':
                return 'protobuf';
            case 'thrift':
                return 'thrift';
            case 'vue':
                return 'vue';
            case 'svelte':
                return 'svelte';
            case 'jsx':
                return 'javascriptreact';
            case 'tsx':
                return 'typescriptreact';
            case 'vue':
                return 'vue';
            case 'svelte':
                return 'svelte';

            // Additional languages and file types
            case 'f':
                return 'fortran';
            case 'f90':
                return 'fortran';
            case 'f95':
                return 'fortran';
            case 'adb':
                return 'ada';
            case 'ads':
                return 'ada';
            case 'pl':
                return 'prolog';
            case 'p':
                return 'pascal';
            case 'pp':
                return 'pascal';
            case 'lsp':
                return 'lisp';
            case 'cl':
                return 'commonlisp';
            case 'sc':
                return 'supercollider';
            case 'scd':
                return 'supercollider';
            case 'nut':
                return 'squirrel';
            case 'st':
                return 'smalltalk';
            case 't':
                return 'turing';
            case 'tu':
                return 'turing';
            case 'vhd':
                return 'vhdl';
            case 'vhdl':
                return 'vhdl';
            case 'vb':
                return 'vbscript';
            case 'vbs':
                return 'vbscript';
            case 'xq':
                return 'xquery';
            case 'xql':
                return 'xquery';
            case 'xqm':
                return 'xquery';
            case 'xqy':
                return 'xquery';
            case 'zsh':
                return 'zsh';
            case 'fish':
                return 'fish';
            case 'nu':
                return 'nushell';
            case 'zig':
                return 'zig';
            case 'wren':
                return 'wren';
            case 'nim':
                return 'nim';
            case 'cr':
                return 'crystal';
            case 'ec':
                return 'ec';
            case 'ecl':
                return 'ecl';
            case 'ex':
                return 'eiffel';
            case 'frt':
                return 'frege';
            case 'g':
                return 'gap';
            case 'gd':
                return 'gdscript';
            case 'glsl':
                return 'glsl';
            case 'gnu':
                return 'gnuplot';
            case 'gp':
                return 'gnuplot';
            case 'hx':
                return 'haxe';
            case 'hxsl':
                return 'hxsl';
            case 'idr':
                return 'idris';
            case 'lidr':
                return 'idris';
            case 'janet':
                return 'janet';
            case 'jl':
                return 'julia';
            case 'kts':
                return 'kotlin';
            case 'ktm':
                return 'kotlin';
            case 'lean':
                return 'lean';
            case 'hlean':
                return 'lean';
            case 'lagda':
                return 'agda';
            case 'litcoffee':
                return 'coffeescript';
            case 'ls':
                return 'livescript';
            case 'mumps':
                return 'mumps';
            case 'm':
                return 'mercury';
            case 'moo':
                return 'moocode';
            case 'n':
                return 'nemerle';
            case 'nl':
                return 'nl';
            case 'nix':
                return 'nix';
            case 'ocaml':
                return 'ocaml';
            case 'ml':
                return 'ocaml';
            case 'mli':
                return 'ocaml';
            case 'mll':
                return 'ocaml';
            case 'mly':
                return 'ocaml';
            case 'opa':
                return 'opa';
            case 'p6':
                return 'perl6';
            case 'pl6':
                return 'perl6';
            case 'pm6':
                return 'perl6';
            case 'pogo':
                return 'pogo';
            case 'pony':
                return 'pony';
            case 'psc':
                return 'papyrus';
            case 'pss':
                return 'powershell';
            case 'purs':
                return 'purescript';
            case 'pyw':
                return 'python';
            case 'pyi':
                return 'python';
            case 'pyx':
                return 'cython';
            case 'pxd':
                return 'cython';
            case 'pxi':
                return 'cython';
            case 'rkt':
                return 'racket';
            case 'rktl':
                return 'racket';
            case 'rl':
                return 'ragel';
            case 'rst':
                return 'restructuredtext';
            case 'rs':
                return 'rust';
            case 'sas':
                return 'sas';
            case 'sc':
                return 'scala';
            case 'scm':
                return 'scheme';
            case 'scala':
                return 'scala';
            case 'sc':
                return 'supercollider';
            case 'scd':
                return 'supercollider';
            case 'sls':
                return 'scheme';
            case 'sml':
                return 'sml';
            case 'sol':
                return 'solidity';
            case 'st':
                return 'smalltalk';
            case 'stan':
                return 'stan';
            case 'tac':
                return 'tac';
            case 'tcsh':
                return 'tcsh';
            case 'texi':
                return 'texinfo';
            case 'tf':
                return 'terraform';
            case 'thrift':
                return 'thrift';
            case 'tl':
                return 'tl';
            case 'tla':
                return 'tla';
            case 'tm':
                return 'tcl';
            case 'tcl':
                return 'tcl';
            case 'toml':
                return 'toml';
            case 'tp':
                return 'turing';
            case 'tu':
                return 'turing';
            case 'uc':
                return 'unrealscript';
            case 'upc':
                return 'upc';
            case 'urs':
                return 'urscript';
            case 'v':
                return 'verilog';
            case 'vb':
                return 'vbnet';
            case 'vbs':
                return 'vbscript';
            case 'vcl':
                return 'vcl';
            case 'vhd':
                return 'vhdl';
            case 'vhdl':
                return 'vhdl';
            case 'vb':
                return 'visualbasic';
            case 'vbs':
                return 'vbscript';
            case 'wast':
                return 'webassembly';
            case 'wat':
                return 'webassembly';
            case 'wisp':
                return 'wisp';
            case 'wlk':
                return 'wollok';
            case 'wls':
                return 'wollok';
            case 'wren':
                return 'wren';
            case 'x10':
                return 'xten';
            case 'xpl':
                return 'xproc';
            case 'xq':
                return 'xquery';
            case 'xql':
                return 'xquery';
            case 'xqm':
                return 'xquery';
            case 'xqy':
                return 'xquery';
            case 'xsl':
                return 'xsl';
            case 'xslt':
                return 'xslt';
            case 'y':
                return 'yacc';
            case 'yaml':
                return 'yaml';
            case 'yml':
                return 'yaml';
            case 'zep':
                return 'zephir';
            case 'zimpl':
                return 'zimpl';
            case 'zsh':
                return 'zsh';
            default:
                return 'plaintext';
        }
    };

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

    const handleFileClick = async (filePath: string) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('No authentication token found');

            const cleanPath = filePath.replace('temp-working-directory/', '');
            const response = await fetch(
                `http://localhost:5000/v1/api/preview/content?relativePath=${encodeURIComponent(cleanPath)}&ownername=${encodeURIComponent(repo?.owner.username || '')}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error('Failed to fetch file content');
            const data = await response.json();

            if (data.data.type === 'file') {
                const fileExtension = filePath.split('.').pop()?.toLowerCase() || '';
                const language = getLanguageFromExtension(fileExtension);
                setSelectedLanguage(language);
                setSelectedFile({ path: filePath, content: data.data.content });
            }
        } catch (err) {
            setDirectoryError(err instanceof Error ? err.message : 'Failed to load file content');
        }
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
                        .filter((item: DirectoryItem) => item.name !== '.git')
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

    const TreeView = ({ nodes, onToggle, onFileClick }: { nodes: TreeNode[], onToggle: (path: string) => void, onFileClick: (path: string) => void }) => (
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
                            <span
                                className="ml-2"
                                onClick={() => {
                                    if (node.type === 'file') {
                                        onFileClick(node.path);
                                    }
                                }}
                            >
                                {node.name}
                            </span>
                        </div>
                    </div>
                    {node.type === 'folder' && node.isExpanded && (
                        <TreeView nodes={node.children} onToggle={onToggle} onFileClick={onFileClick} />
                    )}
                </div>
            ))}
        </div>
    );

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
                : handleFileClick(`${currentPath}/${item.name}`)}>
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

    const SIDEBAR_WIDTH = 320;

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
                        style={{ width: `${SIDEBAR_WIDTH}px` }}
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
                        <div className="overflow-y-auto h-[calc(100vh-150px)]"> {/* Adjust the height as needed */}
                            <TreeView
                                nodes={sidebarTree}
                                onToggle={toggleFolder}
                                onFileClick={handleFileClick}
                            />
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

                            <div className="flex space-x-4">
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

                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className={`px-4 py-2 rounded-xl flex items-center space-x-2 ${
                                        darkMode
                                        ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400'
                                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                                    } transition-all`}
                                >
                                    <AlertCircle size={18} className="inline-block" />
                                    <span>Report Issue</span>
                                </button>
                            </div>
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
                                    {directoryContents.length > 0 ? (
                                        directoryContents.map((item) => (
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
                                                This directory is empty
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

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
                                                    <option value="javascript">JavaScript</option>
                                                    <option value="typescript">TypeScript</option>
                                                    <option value="python">Python</option>
                                                    <option value="java">Java</option>
                                                    <option value="csharp">C#</option>
                                                    <option value="cpp">C++</option>
                                                    <option value="c">C</option>
                                                    <option value="html">HTML</option>
                                                    <option value="css">CSS</option>
                                                    <option value="json">JSON</option>
                                                    <option value="markdown">Markdown</option>
                                                    <option value="php">PHP</option>
                                                    <option value="go">Go</option>
                                                    <option value="ruby">Ruby</option>
                                                    <option value="rust">Rust</option>
                                                    <option value="swift">Swift</option>
                                                    <option value="kotlin">Kotlin</option>
                                                    <option value="scala">Scala</option>
                                                    <option value="shell">Shell</option>
                                                    <option value="perl">Perl</option>
                                                    <option value="lua">Lua</option>
                                                    <option value="r">R</option>
                                                    <option value="dart">Dart</option>
                                                    <option value="julia">Julia</option>
                                                    <option value="haskell">Haskell</option>
                                                    <option value="elm">Elm</option>
                                                    <option value="clojure">Clojure</option>
                                                    <option value="scheme">Scheme</option>
                                                    <option value="erlang">Erlang</option>
                                                    <option value="fsharp">F#</option>
                                                    <option value="elixir">Elixir</option>
                                                    <option value="groovy">Groovy</option>
                                                    <option value="sql">SQL</option>
                                                    <option value="yaml">YAML</option>
                                                    <option value="xml">XML</option>
                                                    <option value="toml">TOML</option>
                                                    <option value="ini">INI</option>
                                                    <option value="objective-c">Objective-C</option>
                                                    <option value="vb">VB</option>
                                                    <option value="powershell">PowerShell</option>
                                                    <option value="coffeescript">CoffeeScript</option>
                                                    <option value="fsharp">F#</option>
                                                    <option value="scala">Scala</option>
                                                    <option value="lisp">Lisp</option>
                                                    <option value="assembly">Assembly</option>
                                                    <option value="pascal">Pascal</option>
                                                    <option value="d">D</option>
                                                    <option value="verilog">Verilog</option>
                                                    <option value="systemverilog">SystemVerilog</option>
                                                    <option value="vhdl">VHDL</option>
                                                    <option value="tcl">Tcl</option>
                                                    <option value="awk">AWK</option>
                                                    <option value="sed">SED</option>
                                                    <option value="batch">Batch</option>
                                                    <option value="postscript">PostScript</option>
                                                    <option value="latex">LaTeX</option>
                                                    <option value="bibtex">BibTeX</option>
                                                    <option value="makefile">Makefile</option>
                                                    <option value="cmake">CMake</option>
                                                    <option value="dockerfile">Dockerfile</option>
                                                    <option value="graphql">GraphQL</option>
                                                    <option value="protobuf">Protocol Buffers</option>
                                                    <option value="thrift">Thrift</option>
                                                    <option value="vue">Vue</option>
                                                    <option value="svelte">Svelte</option>
                                                    <option value="javascriptreact">JavaScript React</option>
                                                    <option value="typescriptreact">TypeScript React</option>
                                                    <option value="fortran">Fortran</option>
                                                    <option value="ada">Ada</option>
                                                    <option value="prolog">Prolog</option>
                                                    <option value="commonlisp">Common Lisp</option>
                                                    <option value="supercollider">SuperCollider</option>
                                                    <option value="squirrel">Squirrel</option>
                                                    <option value="smalltalk">Smalltalk</option>
                                                    <option value="turing">Turing</option>
                                                    <option value="vbscript">VBScript</option>
                                                    <option value="xquery">XQuery</option>
                                                    <option value="zsh">Zsh</option>
                                                    <option value="fish">Fish</option>
                                                    <option value="nushell">NuShell</option>
                                                    <option value="zig">Zig</option>
                                                    <option value="wren">Wren</option>
                                                    <option value="nim">Nim</option>
                                                    <option value="crystal">Crystal</option>
                                                    <option value="eiffel">Eiffel</option>
                                                    <option value="forth">Forth</option>
                                                    <option value="frege">Frege</option>
                                                    <option value="gap">GAP</option>
                                                    <option value="gdscript">GDScript</option>
                                                    <option value="glsl">GLSL</option>
                                                    <option value="gnuplot">Gnuplot</option>
                                                    <option value="haxe">Haxe</option>
                                                    <option value="hxsl">HXML</option>
                                                    <option value="idris">Idris</option>
                                                    <option value="janet">Janet</option>
                                                    <option value="mercury">Mercury</option>
                                                    <option value="moocode">Moo</option>
                                                    <option value="nemerle">Nemerle</option>
                                                    <option value="nl">NL</option>
                                                    <option value="nix">Nix</option>
                                                    <option value="ocaml">OCaml</option>
                                                    <option value="ml">OCaml</option>
                                                    <option value="mli">OCaml</option>
                                                    <option value="mll">OCaml</option>
                                                    <option value="mly">OCaml</option>
                                                    <option value="opa">Opa</option>
                                                    <option value="p6">Perl 6</option>
                                                    <option value="pl6">Perl 6</option>
                                                    <option value="pm6">Perl 6</option>
                                                    <option value="pogo">Pogo</option>
                                                    <option value="pony">Pony</option>
                                                    <option value="psc">Papyrus</option>
                                                    <option value="pss">PowerShell</option>
                                                    <option value="purs">PureScript</option>
                                                    <option value="pyw">Python</option>
                                                    <option value="pyi">Python</option>
                                                    <option value="pyx">Cython</option>
                                                    <option value="pxd">Cython</option>
                                                    <option value="pxi">Cython</option>
                                                    <option value="rkt">Racket</option>
                                                    <option value="rktl">Racket</option>
                                                    <option value="rl">Ragel</option>
                                                    <option value="rst">reStructuredText</option>
                                                    <option value="rs">Rust</option>
                                                    <option value="sas">SAS</option>
                                                    <option value="sc">Scala</option>
                                                    <option value="scm">Scheme</option>
                                                    <option value="scala">Scala</option>
                                                    <option value="sc">SuperCollider</option>
                                                    <option value="scd">SuperCollider</option>
                                                    <option value="sls">Scheme</option>
                                                    <option value="sml">SML</option>
                                                    <option value="sol">Solidity</option>
                                                    <option value="st">Smalltalk</option>
                                                    <option value="stan">Stan</option>
                                                    <option value="tac">TAC</option>
                                                    <option value="tcsh">Tcsh</option>
                                                    <option value="texi">Texinfo</option>
                                                    <option value="tf">Terraform</option>
                                                    <option value="thrift">Thrift</option>
                                                    <option value="tl">TL</option>
                                                    <option value="tla">TLA</option>
                                                    <option value="tm">Tcl</option>
                                                    <option value="tcl">Tcl</option>
                                                    <option value="toml">TOML</option>
                                                    <option value="tp">Turing</option>
                                                    <option value="tu">Turing</option>
                                                    <option value="uc">UnrealScript</option>
                                                    <option value="upc">UPC</option>
                                                    <option value="urs">URScript</option>
                                                    <option value="v">Verilog</option>
                                                    <option value="vb">VB.NET</option>
                                                    <option value="vbs">VBScript</option>
                                                    <option value="vcl">VCL</option>
                                                    <option value="vhd">VHDL</option>
                                                    <option value="vhdl">VHDL</option>
                                                    <option value="vb">Visual Basic</option>
                                                    <option value="vbs">VBScript</option>
                                                    <option value="wast">WebAssembly</option>
                                                    <option value="wat">WebAssembly</option>
                                                    <option value="wisp">Wisp</option>
                                                    <option value="wlk">Wollok</option>
                                                    <option value="wls">Wollok</option>
                                                    <option value="wren">Wren</option>
                                                    <option value="x10">X10</option>
                                                    <option value="xpl">XProc</option>
                                                    <option value="xq">XQuery</option>
                                                    <option value="xql">XQuery</option>
                                                    <option value="xqm">XQuery</option>
                                                    <option value="xqy">XQuery</option>
                                                    <option value="xsl">XSL</option>
                                                    <option value="xslt">XSLT</option>
                                                    <option value="y">Yacc</option>
                                                    <option value="yaml">YAML</option>
                                                    <option value="yml">YAML</option>
                                                    <option value="zep">Zephir</option>
                                                    <option value="zimpl">Zimpl</option>
                                                    <option value="zil">Zil</option>
                                                    <option value="zpl">ZPL</option>
                                                    <option value="zsh">Zsh</option>
                                                </select>
                                            </div>
                                            <div className="flex space-x-2">
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
                                                value={selectedFile.content}
                                                options={{
                                                    minimap: { enabled: false },
                                                    automaticLayout: true,
                                                    scrollBeyondLastLine: false,
                                                    readOnly: true
                                                }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {showReportModal && repo && (
                <IssueReportModal
                    darkMode={darkMode}
                    repositoryId={repo.id}
                    onClose={() => setShowReportModal(false)}
                    onIssueCreated={() => {}}
                />
            )}
        </div>
    );
};

export default Preview;
