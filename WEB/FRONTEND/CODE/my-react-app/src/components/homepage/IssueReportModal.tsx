// IssueReportModal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Zap, Loader, CheckCircle } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { useState } from 'react';

interface IssueReportModalProps {
  darkMode: boolean;
  repositoryId: number;
  onClose: () => void;
  onIssueCreated: () => void;
}

const IssueReportModal = ({ darkMode, repositoryId, onClose, onIssueCreated }: IssueReportModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Authentication required');

      const { userId } = jwtDecode<{ userId: number }>(token);

      const response = await fetch('http://localhost:5000/v1/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          repositoryId,
          authorId: userId,
          title,
          description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create issue');
      }

      setStatus('success');
      setTimeout(() => {
        onIssueCreated();
        onClose();
      }, 1500);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to submit issue');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'backdrop-blur-sm bg-black/60' : 'backdrop-blur-sm bg-gray-900/30'}`}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: -20 }}
        className={`relative rounded-2xl p-8 w-full max-w-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
      >
        <button
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-full hover:scale-110 transition-transform ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <X size={24} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
        </button>

        <AnimatePresence mode='wait'>
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <CheckCircle className="w-16 h-16 mx-auto text-green-400 animate-pulse" />
              <h3 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Issue Reported!
              </h3>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your contribution helps improve the project 🌟
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-violet-600/20' : 'bg-cyan-600/20'}`}>
                    <AlertCircle className={`w-8 h-8 ${darkMode ? 'text-violet-400' : 'text-cyan-600'}`} />
                  </div>
                  <div>
                    <h2 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      Report Issue
                    </h2>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Help maintainers understand and resolve the problem
                    </p>
                  </div>
                </div>

                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 rounded-xl ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}
                  >
                    {error}
                  </motion.div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Issue Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`w-full px-5 py-4 rounded-xl border ${
                        darkMode
                          ? 'bg-gray-700/50 border-gray-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30'
                          : 'bg-gray-50 border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30'
                      } transition-all placeholder-gray-500`}
                      placeholder="Brief but descriptive title"
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Detailed Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full px-5 py-4 rounded-xl border ${
                        darkMode
                          ? 'bg-gray-700/50 border-gray-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30'
                          : 'bg-gray-50 border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30'
                      } transition-all min-h-[150px] placeholder-gray-500`}
                      placeholder="Include steps to reproduce, expected behavior, and actual results..."
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className={`w-full py-5 px-8 rounded-xl font-bold flex items-center justify-center space-x-3 transition-all ${
                  status === 'loading'
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:scale-[1.02] hover:shadow-lg'
                } ${
                  darkMode
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                }`}
              >
                {status === 'loading' ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Submit Issue Report</span>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default IssueReportModal;
