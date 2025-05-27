import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import { Edit, MessageSquare, X, Save, Search, Trash2 } from 'lucide-react';

interface JwtPayload {
    userId: number;
    email: string;
}

export interface Issue {
    id: number;
    repository_id: number;
    author_id: number;
    title: string;
    description: string;
    status: 'open' | 'closed';
    created_at: string;
    updated_at: string;
    author: {
        username: string;
        avatar_path: string;
    };
    repositoryName: string; // Add this line
}

interface Comment {
    id: number;
    issue_id: number;
    author_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    author: {
        id: number;
        username: string;
        avatar_path: string;
    };
}

interface IssueItemProps {
    issue: Issue;
    darkMode: boolean;
    userId: number | null;
    onDelete: (issueId: number) => void;
    onEdit: (issue: Issue) => void;
    comments: Comment[];
    fetchComments: () => void;
}

const IssueItem: React.FC<IssueItemProps> = ({
    issue,
    darkMode,
    userId,
    onDelete,
    onEdit,
    comments,
    fetchComments
}) => {
    const [commentContent, setCommentContent] = useState('');
    const [isCommentsVisible, setIsCommentsVisible] = useState(false);

    const toggleComments = () => {
        const newVisibility = !isCommentsVisible;
        setIsCommentsVisible(newVisibility);
        if (newVisibility && comments.length === 0) {
            fetchComments();
        }
    };

    const handleCommentSubmit = async () => {
        if (!userId || !commentContent.trim()) return;

        try {
            const token = localStorage.getItem('authToken');
            await fetch('http://localhost:5000/v1/api/issues/comments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    issueId: issue.id,
                    authorId: userId,
                    content: commentContent.trim()
                })
            });
            setCommentContent('');
            fetchComments(); // Refresh comments after submission
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
        >
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {issue.title}
                        </h3>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {issue.repositoryName}
                        </p>
                    </div>
                    {issue.author_id === userId && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onEdit(issue)}
                                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                            >
                                <Edit size={18} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                            </button>
                            <button
                                onClick={() => onDelete(issue.id)}
                                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                            >
                                <Trash2 size={18} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`text-sm px-2 py-1 rounded-full ${
                        issue.status === 'open'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                        {issue.status}
                    </span>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-1">
                            <img
                                src={issue.author.avatar_path
                                    ? `http://localhost:5000${issue.author.avatar_path}`
                                    : '/default-avatar.png'}
                                alt="avatar"
                                className="w-6 h-6 rounded-full"
                            />
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {issue.author.username}
                            </span>
                        </div>

                        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
                        <span className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {issue.repositoryName}
                        </span>
                    </div>
                </div>
            </div>

            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {issue.description}
            </p>

            <button
                onClick={toggleComments}
                className={`text-sm mb-3 ${
                    darkMode
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-blue-600 hover:text-blue-700'
                } hover:underline cursor-pointer`}
            >
                {isCommentsVisible ? 'Hide Comments' : 'Show Comments'}
            </button>

            {isCommentsVisible && (
                <div className="ml-4 space-y-3">
                    {comments.map(comment => (
                        <div
                            key={comment.id}
                            className={`p-3 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <img
                                    src={comment.author.avatar_path
                                        ? `http://localhost:5000${comment.author.avatar_path}`
                                        : '/default-avatar.png'}
                                    alt="avatar"
                                    className="w-5 h-5 rounded-full"
                                />
                                <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {comment.author.username}
                                </span>
                                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {comment.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {issue.author_id !== userId && (
                <div className="flex gap-2 mt-4">
                    <input
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Add a comment..."
                        className={`flex-1 px-3 py-2 rounded-lg ${
                            darkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-800'
                        }`}
                        onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                    />
                    <button
                        onClick={handleCommentSubmit}
                        className={`px-4 py-2 rounded-lg ${
                            darkMode
                            ? 'bg-violet-600 hover:bg-violet-700'
                            : 'bg-cyan-600 hover:bg-cyan-700'
                        } text-white`}
                    >
                        <MessageSquare size={18} />
                    </button>
                </div>
            )}
        </motion.div>
    );
};

interface IssueDisplayProps {
    darkMode: boolean;
}

const IssueDisplay: React.FC<IssueDisplayProps> = ({ darkMode }) => {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
    const [commentsByIssueId, setCommentsByIssueId] = useState<Record<number, Comment[]>>({});
    const [showUserIssues, setShowUserIssues] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userId, setUserId] = useState<number | null>(null);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            const decoded = jwtDecode<JwtPayload>(token);
            setUserId(decoded.userId);
        }
    }, []);

    const fetchIssues = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(
                'http://localhost:5000/v1/api/issues/search',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            if (data.status === 'success') {
                setIssues(data.data);
                setFilteredIssues(data.data);
            }
        } catch (error) {
            console.error('Error fetching issues:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchComments = useCallback(async (issueId: number) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(
                `http://localhost:5000/v1/api/issues/${issueId}/comments`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            if (data.status === 'success') {
                setCommentsByIssueId(prev => ({
                    ...prev,
                    [issueId]: data.data
                }));
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }, []);

    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    useEffect(() => {
        const filtered = issues.filter(issue => {
            const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                issue.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch && (showUserIssues
                ? issue.author_id === userId
                : issue.author_id !== userId);
        });
        setFilteredIssues(filtered);
    }, [searchQuery, showUserIssues, issues, userId]);

    const handleIssueUpdate = async (updatedIssue: Issue) => {
        try {
            const token = localStorage.getItem('authToken');
            await fetch(`http://localhost:5000/v1/api/issues/${updatedIssue.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: updatedIssue.title,
                    description: updatedIssue.description,
                    status: updatedIssue.status
                })
            });
            setEditMode(false);
            fetchIssues();
        } catch (error) {
            console.error('Error updating issue:', error);
        }
    };

    const handleDeleteIssue = async (issueId: number) => {
        try {
            const token = localStorage.getItem('authToken');
            await fetch(`http://localhost:5000/v1/api/issues/${issueId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchIssues();
        } catch (error) {
            console.error('Error deleting issue:', error);
        }
    };

    return (
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setShowUserIssues(!showUserIssues)}
                        className={`px-4 py-2 rounded-xl transition-colors ${
                            darkMode
                            ? 'bg-violet-600 hover:bg-violet-700'
                            : 'bg-cyan-600 hover:bg-cyan-700'
                        } text-white`}
                    >
                        {showUserIssues ? "Show Others' Issues" : 'Show My Issues'}
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search issues..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`pl-4 pr-10 py-2 rounded-xl ${
                                darkMode
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-100 text-gray-800'
                            } transition-colors`}
                        />
                        <Search className={`absolute right-3 top-2.5 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} size={20} />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
                </div>
            ) : (
                <motion.div layout className="space-y-4">
                    <AnimatePresence>
                        {filteredIssues.map(issue => (
                            <IssueItem
                                key={issue.id}
                                issue={issue}
                                darkMode={darkMode}
                                userId={userId}
                                onDelete={handleDeleteIssue}
                                onEdit={(issue) => {
                                    setSelectedIssue(issue);
                                    setEditMode(true); // Add this to activate edit mode
                                }}
                                comments={commentsByIssueId[issue.id] || []}
                                fetchComments={() => fetchComments(issue.id)}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <AnimatePresence>
                {editMode && selectedIssue && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center`}
                    >
                        <motion.div
                            initial={{ y: 50 }}
                            animate={{ y: 0 }}
                            className={`p-6 rounded-xl w-full max-w-xl ${
                                darkMode ? 'bg-gray-700' : 'bg-white'
                            }`}
                        >
                            <div className="flex justify-between mb-4">
                                <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                    Edit Issue
                                </h3>
                                <button
                                    onClick={() => setEditMode(false)}
                                    className={`p-1 rounded-full ${
                                        darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <input
                                value={selectedIssue.title}
                                onChange={(e) => setSelectedIssue({
                                    ...selectedIssue,
                                    title: e.target.value
                                })}
                                className={`w-full mb-3 p-2 rounded-lg ${
                                    darkMode ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-800'
                                }`}
                            />
                            <textarea
                                value={selectedIssue.description}
                                onChange={(e) => setSelectedIssue({
                                    ...selectedIssue,
                                    description: e.target.value
                                })}
                                className={`w-full mb-3 p-2 rounded-lg ${
                                    darkMode ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-800'
                                }`}
                                rows={4}
                            />
                            <select
                                value={selectedIssue.status}
                                onChange={(e) => setSelectedIssue({
                                    ...selectedIssue,
                                    status: e.target.value as 'open' | 'closed'
                                })}
                                className={`w-full mb-4 p-2 rounded-lg ${
                                    darkMode ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                <option value="open">Open</option>
                                <option value="closed">Closed</option>
                            </select>

                            <button
                                onClick={() => handleIssueUpdate(selectedIssue)}
                                className={`w-full py-2 rounded-lg flex items-center justify-center space-x-2 ${
                                    darkMode
                                    ? 'bg-violet-600 hover:bg-violet-700'
                                    : 'bg-cyan-600 hover:bg-cyan-700'
                                } text-white`}
                            >
                                <Save size={18} />
                                <span>Save Changes</span>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default IssueDisplay;
