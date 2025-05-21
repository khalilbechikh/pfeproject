import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Code, Bot, ChevronDown, X, Send, Circle, Zap, Play, CheckCircle2, FileCode2, File } from 'lucide-react';

// Add types for tool calls
interface ToolCall {
  name: string;
  args: {
    changes: Array<{
      file_name: string;
      insertions?: Array<{ insert_line: number; code: string }>;
      edits?: Array<{ line_start: number; line_end: number; new_content: string }>;
    }>;
  };
  id: string;
  type: string;
}

interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
}

interface ShareCodeAgentProps {
  darkMode: boolean;
  onClose: () => void;
  repoOwner: string;
  authToken: string;
}

interface ApiResponse {
  message: string;
  tool_calls?: ToolCall[];
  conversation_id?: string;
}

const ShareCodeAgent = ({ darkMode, onClose, repoOwner, authToken }: ShareCodeAgentProps) => {
  const [mode, setMode] = useState('ask');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [editPrompt, setEditPrompt] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestions] = useState([
    "Générer des tests pour ce code",
    "Générer la documentation pour ce code",
    "Générer un rapport détaillé sur les tests pour ce code"
  ]);

  const isBinaryFile = (fileName: string): boolean => {
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'pdf'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'];
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return imageExtensions.includes(ext) || videoExtensions.includes(ext);
  };

  const convertToLineFormat = (content: string) => {
    return content.split('\n').reduce((acc, line, index) => {
      acc[index + 1] = line;
      return acc;
    }, {} as Record<number, string>);
  };

  const handleSendPrompt = async () => {
    if ((!prompt.trim() && mode === 'ask') || (!editPrompt.trim() && mode === 'edit')) return;

    try {
      setIsGenerating(true);
      let newMessage: Message;
      let apiResponse: ApiResponse;

      if (mode === 'ask') {
        newMessage = { role: 'user', content: prompt };

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

        apiResponse = await response.json();
        console.info('API Response:', apiResponse);
        setConversationId(apiResponse.conversation_id || null);
        setConversation(prev => [
          ...prev,
          newMessage,
          { role: 'assistant', content: apiResponse.message }
        ]);

      } else {
        const files = droppedFiles.reduce((acc, file) => {
          acc[file.name] = convertToLineFormat(file.content);
          return acc;
        }, {} as Record<string, Record<number, string>>);

        newMessage = {
          role: 'user',
          content: editPrompt,
          tool_calls: []
        };

        const response = await fetch('http://localhost:8000/edit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            prompt: editPrompt,
            files,
            ...(conversationId && { conversation_id: conversationId })
          })
        });

        apiResponse = await response.json();

        setConversationId(apiResponse.conversation_id || null);
        setConversation(prev => [
          ...prev,
          newMessage,
          {
            role: 'assistant',
            content: apiResponse.message,
            tool_calls: apiResponse.tool_calls
          }
        ]);

        if (apiResponse.tool_calls) {
          applyToolCalls(files, apiResponse.tool_calls);
        }
      }

      setPrompt('');
      setEditPrompt('');
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

  const applyToolCalls = (
    files: Record<string, Record<number, string>>,
    toolCalls: ToolCall[]
  ) => {
    const newFiles = { ...files };

    toolCalls.forEach(toolCall => {
      if (toolCall.name === 'insert_code_at_lines') {
        toolCall.args.changes.forEach(change => {
          change.insertions?.forEach(insertion => {
            const file = newFiles[change.file_name] || {};
            const lines = Object.entries(file)
              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

            const newContent = insertion.code.split('\n');
            newContent.forEach((line, index) => {
              const lineNumber = insertion.insert_line + index;
              file[lineNumber] = line;
            });

            Object.keys(file).forEach(key => {
              const num = parseInt(key);
              if (num >= insertion.insert_line) {
                file[num + newContent.length] = file[num];
                delete file[num];
              }
            });

            newFiles[change.file_name] = file;
          });
        });
      }

      if (toolCall.name === 'edit_file_lines') {
        toolCall.args.changes.forEach(change => {
          change.edits?.forEach(edit => {
            const file = newFiles[change.file_name] || {};
            const newLines = edit.new_content.split('\n');

            for (let i = edit.line_start; i <= edit.line_end; i++) {
              delete file[i];
            }

            newLines.forEach((line, index) => {
              file[edit.line_start + index] = line;
            });

            const lines = Object.entries(file)
              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
            let currentLine = edit.line_start + newLines.length;

            lines.forEach(([key, value]) => {
              const num = parseInt(key);
              if (num > edit.line_end) {
                file[currentLine] = value;
                delete file[num];
                currentLine++;
              }
            });

            newFiles[change.file_name] = file;
          });
        });
      }
    });

    return newFiles;
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      const response = await fetch(
        `http://localhost:5000/v1/api/preview/content?relativePath=${encodeURIComponent(filePath)}&ownername=${encodeURIComponent(repoOwner)}`,
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
    <div className="mb-2">
      {droppedFiles.map((file, index) => (
        <div
          key={index}
          className={`flex items-center justify-between p-2 rounded-lg ${
            darkMode ? 'bg-gray-800' : 'bg-gray-100'
          } mb-1`}
        >
          <div className="flex items-center">
            <File size={16} className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {file.name}
            </span>
          </div>
          <button
            onClick={() => handleRemoveFile(index)}
            className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <X size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>
      ))}
    </div>
  );

  const renderConversation = () => {
    return conversation.map((message, index) => (
      <div
        key={index}
        className={`mb-4 ${message.role === 'user' ? 'ml-auto' : 'mr-auto'} max-w-3/4`}
      >
        <div className="flex items-start gap-3">
          {message.role === 'assistant' && (
            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${darkMode ? 'bg-violet-600' : 'bg-cyan-600'} flex items-center justify-center`}>
              <Bot size={16} className="text-white" />
            </div>
          )}

          <div
            className={`p-3 rounded-lg ${
              message.role === 'user'
                ? darkMode
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
                : darkMode
                  ? 'bg-violet-600/20 text-gray-100'
                  : 'bg-cyan-50 text-gray-800'
            }`}
          >
            {message.tool_calls && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Suggested Changes:</h4>
                {message.tool_calls.map((toolCall, tcIndex) => (
                  <div key={tcIndex} className="mb-3">
                    <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(toolCall, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <pre className="whitespace-pre-wrap font-sans">
              {message.content.startsWith("```") ? (
                <div>
                  <div className={`mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Generated code:
                  </div>
                  <div className={`p-4 rounded-md ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} font-mono text-sm overflow-x-auto`}>
                    {message.content
                      .replace(/```jsx|```js|```tsx|```ts|```/g, '')
                      .trim()}
                  </div>
                </div>
              ) : (
                message.content
              )}
            </pre>
          </div>

          {message.role === 'user' && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-medium">U</span>
            </div>
          )}
        </div>
      </div>
    ));
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt, editPrompt]);

  return (
    <div
      className={`w-full h-full flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'} ${
        isDraggingOver ? (darkMode ? 'border-2 border-violet-500' : 'border-2 border-cyan-500') : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-violet-600' : 'bg-cyan-600'}`}>
            <Bot size={16} className="text-white" />
          </div>
          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>ShareCode Agent</h3>
          {isGenerating && (
            <div className="flex items-center">
              <Circle size={8} className={`animate-pulse ${darkMode ? 'text-violet-400' : 'text-cyan-500'}`} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <ChevronDown size={18} />
          </button>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className={`flex border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        <button
          onClick={() => setMode('ask')}
          className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 ${
            mode === 'ask'
              ? darkMode
                ? 'bg-gray-800 text-violet-400 border-b-2 border-violet-500'
                : 'bg-gray-50 text-cyan-600 border-b-2 border-cyan-500'
              : darkMode
                ? 'text-gray-400 hover:bg-gray-800/50'
                : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <MessageSquare size={16} />
          Ask
        </button>
        <button
          onClick={() => setMode('edit')}
          className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 ${
            mode === 'edit'
              ? darkMode
                ? 'bg-gray-800 text-violet-400 border-b-2 border-violet-500'
                : 'bg-gray-50 text-cyan-600 border-b-2 border-cyan-500'
              : darkMode
                ? 'text-gray-400 hover:bg-gray-800/50'
                : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Code size={16} />
          Edit Code
        </button>
      </div>

      {/* Content Area - Add flex-1 and remove padding */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'ask' && conversation.length === 0 && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full ${darkMode ? 'bg-violet-600/20' : 'bg-cyan-50'} mb-3`}>
                <Zap size={20} className={darkMode ? 'text-violet-400' : 'text-cyan-600'} />
              </div>
              <h3 className={`font-medium text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                ShareCode Assistant
              </h3>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Ask questions or get help with your code
              </p>
            </div>

            <div className="space-y-2 pl-4"> {/* Added pl-4 for left padding */}
              <p className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                SUGGESTED PROMPTS
              </p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setPrompt(suggestion);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg text-sm flex items-center gap-2 ${
                    darkMode
                      ? 'bg-gray-800/70 text-gray-300 hover:bg-gray-800'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  } transition-colors`}
                >
                  <Play size={14} className={darkMode ? 'text-violet-400' : 'text-cyan-600'} />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'edit' && conversation.length === 0 && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full ${darkMode ? 'bg-violet-600/20' : 'bg-cyan-50'} mb-3`}>
                <FileCode2 size={20} className={darkMode ? 'text-violet-400' : 'text-cyan-600'} />
              </div>
              <h3 className={`font-medium text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Code Edit Mode
              </h3>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Paste code below and describe how you want to modify it
              </p>
            </div>
          </div>
        )}

        {/* Conversation Messages */}
        {conversation.length > 0 && (
          <div>
            {renderConversation()}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Keep existing styles */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
        {mode === 'ask' ? (
          <div className="relative">
            <FilePreview />
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask ShareCode Agent..."
              className={`w-full px-4 py-3 pr-12 rounded-lg resize-none overflow-y-auto ${
                darkMode
                  ? 'bg-gray-800 text-gray-100 placeholder-gray-500 border-gray-700'
                  : 'bg-gray-50 text-gray-800 placeholder-gray-400 border-gray-200'
              } border focus:outline-none focus:ring-1 ${
                darkMode ? 'focus:ring-violet-500' : 'focus:ring-cyan-500'
              } transition-all duration-200`}
              style={{ minHeight: '3rem', maxHeight: '15rem' }}
            />
            <button
              onClick={handleSendPrompt}
              disabled={!prompt.trim() || isGenerating}
              className={`absolute right-2 bottom-2 p-2 rounded-md ${
                prompt.trim() && !isGenerating
                  ? darkMode
                    ? 'text-violet-400 hover:bg-gray-700'
                    : 'text-cyan-600 hover:bg-gray-100'
                  : darkMode
                    ? 'text-gray-600'
                    : 'text-gray-400'
              } transition-colors`}
            >
              <Send size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <FilePreview />
            <textarea
              ref={textareaRef}
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="Paste your code here and describe what changes you want..."
              className={`w-full p-3 rounded-lg resize-none ${
                darkMode
                  ? 'bg-gray-800 text-gray-100 placeholder-gray-500 border-gray-700'
                  : 'bg-gray-50 text-gray-800 placeholder-gray-400 border-gray-200'
              } border focus:outline-none focus:ring-1 ${
                darkMode ? 'focus:ring-violet-500' : 'focus:ring-cyan-500'
              } transition-all duration-200`}
              style={{ minHeight: '8rem', maxHeight: '20rem' }}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSendPrompt}
                disabled={!editPrompt.trim() || isGenerating}
                className={`px-4 py-2 rounded-md flex items-center gap-1.5 ${
                  editPrompt.trim() && !isGenerating
                    ? darkMode
                      ? 'bg-violet-600 hover:bg-violet-700 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : darkMode
                      ? 'bg-gray-800 text-gray-500'
                      : 'bg-gray-100 text-gray-400'
                } transition-colors font-medium text-sm`}
              >
                {isGenerating ? (
                  <>
                    <Circle size={14} className="animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Generate Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareCodeAgent;
