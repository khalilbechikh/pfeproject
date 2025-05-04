import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MessageSquare, Clock, User, CheckCircle, Search, X } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    username: string;
    avatar_path?: string;
  };
  issue_comment: any[];
}

const IssueDisplay = ({ darkMode, repositoryId }: { darkMode: boolean, repositoryId: number }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const decoded = jwtDecode<{ userId: number }>(token);
      setUserId(decoded.userId);
    }
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      if (!token || !repositoryId) throw new Error('Authentication required');

      let url = '';
      if (isSearching) {
        url = `http://localhost:5000/v1/api/issues/repository/${repositoryId}/search?searchQuery=${encodeURIComponent(searchQuery)}`;
      } else if (viewMode === 'my' && userId) {
        url = `http://localhost:5000/v1/api/issues/user/${userId}`;
      } else {
        url = `http://localhost:5000/v1/api/issues/repository/${repositoryId}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch issues');
      const { data } = await response.json();

      setIssues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (repositoryId) {
      // Immediate fetch for non-search changes
      if (!isSearching) {
        fetchIssues();
      }

      // Debounced fetch for search queries
      const debounceTimer = setTimeout(() => {
        if (isSearching) {
          fetchIssues();
        }
      }, 500);

      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, viewMode, repositoryId, userId, isSearching]);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  const handleSearchToggle = () => {
    setIsSearching(!isSearching);
    if (!isSearching) setSearchQuery('');
  };

  if (!repositoryId) return null;

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-lg`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex-1">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Project Issues
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {issues.length} reported issues • Updated in real-time
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className={`relative flex-1 ${isSearching ? 'block' : 'hidden'} sm:block`}>
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-2 rounded-xl ${
                  darkMode
                    ? 'bg-gray-700/50 text-white placeholder-gray-400'
                    : 'bg-gray-100 text-gray-800 placeholder-gray-500'
                } pr-10 transition-all`}
              />
              <button
                onClick={handleSearchToggle}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${
                  darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {isSearching ? <X size={18} /> : <Search size={18} />}
              </button>
            </div>

            <div className={`flex rounded-xl p-1 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'all'
                    ? darkMode ? 'bg-violet-600 text-white' : 'bg-cyan-600 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-600/50' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setViewMode('my')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'my'
                    ? darkMode ? 'bg-violet-600 text-white' : 'bg-cyan-600 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-600/50' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                My Issues
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <AnimatePresence>
            {issues.map((issue) => (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`group relative p-6 rounded-xl transition-all ${
                  darkMode
                    ? 'bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700'
                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                } shadow-sm hover:shadow-md`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${
                    issue.status === 'closed'
                      ? 'bg-green-600/20'
                      : darkMode
                        ? 'bg-violet-600/20'
                        : 'bg-cyan-600/20'
                  }`}>
                    <AlertCircle className={`w-6 h-6 ${
                      issue.status === 'closed'
                        ? 'text-green-400'
                        : darkMode
                          ? 'text-violet-400'
                          : 'text-cyan-600'
                    }`} />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <h3 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {issue.title}
                      </h3>
                      <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {issue.description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        {issue.author.avatar_path ? (
                          <img
                            src={issue.author.avatar_path}
                            alt={issue.author.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-100'
                          } flex items-center justify-center`}>
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} ${
                          userId === issue.author.id ? 'font-semibold' : ''
                        }`}>
                          {issue.author.username}
                          {userId === issue.author.id && (
                            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                              You
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {getTimeAgo(issue.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <MessageSquare className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {issue.issue_comment.length} comments
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {issue.status === 'closed' && (
                    <div className={`p-2 rounded-full ${darkMode ? 'bg-green-900/20' : 'bg-green-100'}`}>
                      <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default IssueDisplay;
