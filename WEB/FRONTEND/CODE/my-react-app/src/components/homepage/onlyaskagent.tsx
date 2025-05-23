import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Zap, Plus, File, X, Code2, Sparkles, Brain, Terminal } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface OnlyAskAgentProps {
  darkMode: boolean;
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
}

interface ApiResponse {
  message: string;
  conversation_id?: string;
}

// Define JWT payload interface
interface JwtPayload {
  userId: string;
  [key: string]: any;
}

// Simple JWT decode function
const decodeJWT = (token: string): JwtPayload => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const OnlyAskAgent = ({ darkMode }: OnlyAskAgentProps) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [user, setUser] = useState<UserProfile | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const decoded = decodeJWT(token);
        const response = await fetch(`http://localhost:5000/v1/api/users/${decoded.userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch user data');
        const userData = await response.json();
        setUser(userData.data);
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversation]);

  const isBinaryFile = (fileName: string): boolean => {
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'pdf'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'];
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(ext) || videoExtensions.includes(ext);
  };

  const handleNewChat = () => {
    setConversation([]);
    setConversationId(null);
    setPrompt('');
    setDroppedFiles([]);
  };

  const handleSendPrompt = async () => {
    if (!prompt.trim()) return;

    try {
      setIsGenerating(true);
      const newMessage: Message = { role: 'user', content: prompt };

      const authToken = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:8000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          message: prompt,
          ...(conversationId && { conversation_id: conversationId })
        })
      });

      const apiResponse: ApiResponse = await response.json();
      setConversationId(apiResponse.conversation_id || null);
      setConversation(prev => [
        ...prev,
        newMessage,
        { role: 'assistant', content: apiResponse.message }
      ]);

      setPrompt('');
      setDroppedFiles([]);

    } catch (error) {
      console.error('API Error:', error);
      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: 'Error processing your request. Please try again.' }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const filePath = e.dataTransfer.getData('text/plain');
    if (!filePath) return;

    const fileName = filePath.split('/').pop() || '';

    if (isBinaryFile(fileName)) {
      alert('Binary files (images, videos, PDFs) cannot be dropped here.');
      return;
    }

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(
        `http://localhost:5000/v1/api/preview/content?relativePath=${encodeURIComponent(filePath)}&ownername=${encodeURIComponent('repoOwner')}`,
        { headers: { 'Authorization': `Bearer ${authToken}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch file content');
      const data = await response.json();
      if (data.data.type !== 'file') throw new Error('Dropped item is not a file');

      setDroppedFiles(prev => [...prev, {
        name: fileName,
        content: data.data.content
      }]);

    } catch (err) {
      console.error('Error fetching file content:', err);
      alert('Failed to load file content. Please try again.');
    }
  };

  const handleRemoveFile = (index: number) => {
    setDroppedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const FilePreview = () => (
    droppedFiles.length > 0 && (
      <div className="mb-4">
        {droppedFiles.map((file, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-xl ${
              darkMode 
                ? 'bg-gradient-to-r from-violet-900/20 to-purple-900/20 border border-violet-800/30' 
                : 'bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200/50'
            } mb-2 backdrop-blur-sm`}
          >
            <div className="flex items-center">
              <File size={18} className={`mr-3 ${darkMode ? 'text-violet-400' : 'text-cyan-600'}`} />
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {file.name}
              </span>
            </div>
            <button
              onClick={() => handleRemoveFile(index)}
              className={`p-1.5 rounded-full transition-all duration-200 ${
                darkMode ? 'hover:bg-violet-800/50 text-gray-400 hover:text-white' : 'hover:bg-cyan-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    )
  );

  // Simple markdown renderer
  const renderMarkdown = (content: string) => {
    // Split content by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // Extract language and code
        const lines = part.slice(3, -3).split('\n');
        const language = lines[0].trim();
        const code = lines.slice(1).join('\n');
        
        return (
          <div key={index} className="my-4">
            <div className={`p-4 rounded-lg overflow-x-auto ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100 border border-gray-200'
            }`}>
              {language && (
                <div className={`text-xs font-medium mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {language}
                </div>
              )}
              <pre className={`text-sm ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                <code>{code}</code>
              </pre>
            </div>
          </div>
        );
      } else {
        // Process inline code and basic formatting
        let processedContent = part
          .replace(/`([^`]+)`/g, `<code class="inline-code">$1</code>`)
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n/g, '<br>');
        
        return (
          <div 
            key={index}
            className="prose-content"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        );
      }
    });
  };

  const renderConversation = () => {
    return conversation.map((message, index) => (
      <div
        key={index}
        className={`mb-8 ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'} animate-in fade-in duration-500`}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className={`flex items-start gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''} max-w-[85%]`}>
          {/* Enhanced Avatar */}
          {message.role === 'assistant' && (
            <div className={`flex-shrink-0 w-10 h-10 rounded-2xl ${
              darkMode 
                ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-violet-500/25' 
                : 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 shadow-lg shadow-cyan-500/25'
            } flex items-center justify-center relative overflow-hidden`}>
              <Bot size={18} className="text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
            </div>
          )}

          {message.role === 'user' && (
            <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-lg shadow-purple-500/25 flex items-center justify-center overflow-hidden relative">
              {user?.avatar_path ? (
                <img
                  src={`http://localhost:5000${user.avatar_path}`}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-bold relative z-10">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
            </div>
          )}

          {/* Enhanced Message Bubble */}
          <div
            className={`px-5 py-4 rounded-2xl relative overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] ${
              message.role === 'user'
                ? darkMode
                  ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 text-white shadow-2xl shadow-gray-900/20 border border-gray-700/50'
                  : 'bg-gradient-to-br from-white to-gray-50 text-gray-800 shadow-2xl shadow-gray-900/10 border border-gray-200/50'
                : darkMode
                  ? 'bg-gradient-to-br from-violet-600/10 via-purple-600/10 to-indigo-600/10 text-gray-100 shadow-2xl shadow-violet-900/20 border border-violet-700/30'
                  : 'bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 text-gray-800 shadow-2xl shadow-cyan-900/10 border border-cyan-200/50'
            }`}
          >
            {/* Subtle gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${
              message.role === 'user'
                ? 'from-transparent via-transparent to-gray-500/5'
                : darkMode
                  ? 'from-violet-400/5 via-transparent to-purple-400/5'
                  : 'from-cyan-400/5 via-transparent to-blue-400/5'
            }`}></div>
            
            <div className="prose max-w-none overflow-x-auto relative z-10">
              <style>
                {`
                  .prose-content .inline-code {
                    background-color: ${darkMode ? '#374151' : '#f3f4f6'};
                    color: ${darkMode ? '#e5e7eb' : '#1f2937'};
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    font-size: 0.875rem;
                    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
                  }
                `}
              </style>
              {renderMarkdown(message.content)}
            </div>
          </div>
        </div>
      </div>
    ));
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  return (
    <div 
      className={`h-full flex flex-col overflow-hidden ${
        isDraggingOver 
          ? darkMode 
            ? 'border-2 border-violet-500 bg-violet-500/5' 
            : 'border-2 border-cyan-500 bg-cyan-500/5' 
          : ''
      } rounded-2xl transition-all duration-300 relative`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full ${
          darkMode ? 'bg-violet-600/10' : 'bg-cyan-400/10'
        } blur-3xl animate-pulse`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full ${
          darkMode ? 'bg-purple-600/10' : 'bg-blue-400/10'
        } blur-3xl animate-pulse`} style={{animationDelay: '1s'}}></div>
      </div>

      {/* Enhanced Header */}
      <div className={`flex-shrink-0 p-6 border-b backdrop-blur-sm relative z-10 ${
        darkMode ? 'border-gray-800/50 bg-gray-900/20' : 'border-gray-200/50 bg-white/20'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden ${
              darkMode 
                ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-violet-500/25' 
                : 'bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 shadow-lg shadow-cyan-500/25'
            }`}>
              <Bot size={24} className="text-white relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
            </div>
            <div>
              <h2 className={`text-2xl font-bold bg-gradient-to-r ${
                darkMode 
                  ? 'from-violet-400 via-purple-400 to-indigo-400' 
                  : 'from-cyan-600 via-blue-600 to-indigo-600'
              } bg-clip-text text-transparent`}>
                ShareCode AI Assistant
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>
                Your intelligent coding companion
              </p>
            </div>
            {isGenerating && (
              <div className="flex items-center space-x-2 ml-6">
                <div className={`flex space-x-1 ${darkMode ? 'text-violet-400' : 'text-cyan-500'}`}>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-violet-400' : 'text-cyan-600'}`}>
                  Thinking...
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleNewChat}
            className={`p-3 rounded-xl transition-all duration-200 ${
              darkMode 
                ? 'hover:bg-gray-800/50 text-gray-400 hover:text-white hover:scale-110' 
                : 'hover:bg-gray-100/50 text-gray-600 hover:text-gray-800 hover:scale-110'
            } backdrop-blur-sm`}
            title="New chat"
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* Chat Content Area - Fixed to take remaining space and enable scrolling */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto relative z-10"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: darkMode ? '#4b5563 #1f2937' : '#d1d5db #f9fafb'
        }}
      >
        <style>
          {`
            div::-webkit-scrollbar {
              width: 8px;
            }
            div::-webkit-scrollbar-track {
              background: ${darkMode ? '#1f2937' : '#f9fafb'};
              border-radius: 4px;
            }
            div::-webkit-scrollbar-thumb {
              background: ${darkMode ? '#4b5563' : '#d1d5db'};
              border-radius: 4px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: ${darkMode ? '#6b7280' : '#9ca3af'};
            }
          `}
        </style>
        <div className="p-6">
          {conversation.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center min-h-[60vh]">
              {/* Stunning Empty State */}
              <div className="text-center max-w-2xl mx-auto">
                {/* Animated Icon Cluster */}
                <div className="relative mb-8">
                  <div className={`mx-auto w-32 h-32 flex items-center justify-center rounded-3xl ${
                    darkMode 
                      ? 'bg-gradient-to-br from-violet-600/20 via-purple-600/20 to-indigo-600/20 shadow-2xl shadow-violet-900/20' 
                      : 'bg-gradient-to-br from-cyan-100 via-blue-100 to-indigo-100 shadow-2xl shadow-cyan-900/10'
                  } relative overflow-hidden backdrop-blur-sm border ${
                    darkMode ? 'border-violet-700/30' : 'border-cyan-200/50'
                  }`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/10"></div>
                    <Sparkles size={48} className={`${darkMode ? 'text-violet-400' : 'text-cyan-600'} relative z-10 animate-pulse`} />
                    
                    {/* Floating Icons */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center animate-bounce" style={{animationDelay: '0.5s'}}>
                      <Code2 size={16} className="text-white" />
                    </div>
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center animate-bounce" style={{animationDelay: '1s'}}>
                      <Brain size={16} className="text-white" />
                    </div>
                    <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center animate-bounce" style={{animationDelay: '1.5s'}}>
                      <Terminal size={16} className="text-white" />
                    </div>
                  </div>
                  
                  {/* Pulse Rings */}
                  <div className={`absolute inset-0 rounded-3xl ${
                    darkMode ? 'border-2 border-violet-400/20' : 'border-2 border-cyan-400/20'
                  } animate-ping`}></div>
                  <div className={`absolute inset-4 rounded-2xl ${
                    darkMode ? 'border border-purple-400/30' : 'border border-blue-400/30'
                  } animate-ping`} style={{animationDelay: '0.5s'}}></div>
                </div>

                <h3 className={`font-bold text-3xl mb-4 bg-gradient-to-r ${
                  darkMode 
                    ? 'from-violet-300 via-purple-300 to-indigo-300' 
                    : 'from-cyan-700 via-blue-700 to-indigo-700'
                } bg-clip-text text-transparent`}>
                  Transform Your Code with AI
                </h3>
                
                <p className={`text-lg leading-relaxed ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                } mb-8 max-w-lg mx-auto`}>
                  Start a conversation and I'll help you debug, optimize, document, and enhance your code with intelligent AI assistance.
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  {[
                    { icon: Code2, text: 'Code Analysis', color: 'from-blue-500 to-cyan-500' },
                    { icon: Zap, text: 'Optimization', color: 'from-yellow-500 to-orange-500' },
                    { icon: Brain, text: 'AI Insights', color: 'from-purple-500 to-pink-500' },
                    { icon: Terminal, text: 'Debugging', color: 'from-green-500 to-emerald-500' }
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${feature.color} text-white text-sm font-medium shadow-lg hover:scale-105 transition-transform duration-200 cursor-default`}
                    >
                      <feature.icon size={16} />
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Interactive Elements */}
                <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} font-medium uppercase tracking-wider`}>
                  Ready when you are ✨
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {renderConversation()}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Input Area - Fixed at bottom */}
      <div className={`flex-shrink-0 p-6 border-t backdrop-blur-sm relative z-10 ${
        darkMode ? 'border-gray-800/50 bg-gray-900/20' : 'border-gray-200/50 bg-white/20'
      }`}>
        <div className="max-w-4xl mx-auto">
          <FilePreview />
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask ShareCode AI anything about your code..."
              className={`w-full px-6 py-4 pr-16 rounded-2xl resize-none overflow-y-auto backdrop-blur-sm transition-all duration-300 ${
                darkMode
                  ? 'bg-gray-800/50 text-gray-100 placeholder-gray-400 border-gray-700/50 focus:border-violet-500/50 focus:bg-gray-800/70'
                  : 'bg-white/50 text-gray-800 placeholder-gray-500 border-gray-200/50 focus:border-cyan-500/50 focus:bg-white/70'
              } border-2 focus:outline-none focus:ring-4 ${
                darkMode ? 'focus:ring-violet-500/20' : 'focus:ring-cyan-500/20'
              } shadow-xl`}
              style={{ minHeight: '3.5rem', maxHeight: '12rem' }}
            />
            <button
              onClick={handleSendPrompt}
              disabled={!prompt.trim() || isGenerating}
              className={`absolute right-3 bottom-3 p-3 rounded-xl transition-all duration-200 ${
                prompt.trim() && !isGenerating
                  ? darkMode
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 hover:scale-110 hover:rotate-12'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 hover:scale-110 hover:rotate-12'
                  : darkMode
                    ? 'bg-gray-700/50 text-gray-500'
                    : 'bg-gray-200/50 text-gray-400'
              } backdrop-blur-sm`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlyAskAgent;