import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula, prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { MessageSquare, Code, Bot, ChevronDown, X, Send, Circle, Zap, Play, CheckCircle2, FileCode2, File, Plus } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

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
  onApplyChanges: (fileName: string, newContent: string) => void;
  width?: number;
}

// Add user profile interface
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

interface JwtPayload {
  userId: string;
}

// Add this type for Markdown components
interface MarkdownComponents {
  [nodeType: string]: React.ElementType;
}

const ShareCodeAgent = ({ darkMode, onClose, repoOwner, authToken, onApplyChanges, width }: ShareCodeAgentProps) => {
  const [mode, setMode] = useState('ask');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [askConversation, setAskConversation] = useState<Message[]>([]);
  const [editConversation, setEditConversation] = useState<Message[]>([]);
  const [editPrompt, setEditPrompt] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<Array<{ name: string; content: string }>>([]);
  const [askConversationId, setAskConversationId] = useState<string | null>(null);
  const [editConversationId, setEditConversationId] = useState<string | null>(null);
  const [suggestions] = useState([
    "Générer des tests pour ce code",
    "Générer la documentation pour ce code",
    "Générer un rapport détaillé sur les tests pour ce code"
  ]);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = authToken;
        if (!token) return;

        const decoded = jwtDecode<JwtPayload>(token);
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
  }, [authToken]);

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

  const handleNewChat = () => {
    setAskConversation([]);
    setEditConversation([]);
    setAskConversationId(null);
    setEditConversationId(null);
    setPrompt('');
    setEditPrompt('');
    setDroppedFiles([]);
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
            ...(askConversationId && { conversation_id: askConversationId })
          })
        });

        apiResponse = await response.json();
        console.info('API Response:', apiResponse);
        setAskConversationId(apiResponse.conversation_id || null);
        setAskConversation(prev => [
          ...prev,
          newMessage,
          { role: 'assistant', content: apiResponse.message }
        ]);

      } else {
        const files = droppedFiles.reduce((acc, file) => {
          acc[file.name] = convertToLineFormat(file.content);
          return acc;
        }, {} as Record<string, Record<number, string>>);

        const response = await fetch('http://localhost:8000/edit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            prompt: editPrompt,
            files,
         ...(askConversationId && { conversation_id: askConversationId })
          })
        });

        const apiResponse = await response.json();
        

        // Extract and display only the message
        const assistantMessage = apiResponse.message;
setAskConversationId(apiResponse.conversation_id || null);

        setEditConversation(prev => [
          ...prev,
          { role: 'user', content: editPrompt },
          {
            role: 'assistant',
            content: assistantMessage,
            //tool_calls: apiResponse.tool_calls
          }
        ]);

        // Process tool calls if present
        if (apiResponse.tool_calls) {
          console.info(apiResponse.tool_calls)
          processToolCalls(apiResponse.tool_calls, files);
        }
      }

      setPrompt('');
      setEditPrompt('');
      setDroppedFiles([]);

    } catch (error) {
      console.error('API Error:', error);

      // Update the appropriate conversation state based on the current mode
      if (mode === 'ask') {
        setAskConversation(prev => [
          ...prev,
          { role: 'assistant', content: 'Error processing your request. Please try again.' }
        ]);
      } else {
        setEditConversation(prev => [
          ...prev,
          { role: 'assistant', content: 'Error processing your request. Please try again.' }
        ]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

const processToolCalls = (toolCalls: ToolCall[], files: Record<string, Record<number, string>>) => {
  toolCalls.forEach(toolCall => {
    console.info(`Processing tool call: ${toolCall.name}`);

    if (toolCall.name === 'edit_file_lines') {
      console.info('Handling edit_file_lines tool call');
      toolCall.args.changes.forEach(change => {
        console.info(`Processing change for file: ${change.file_name}`);
        const fileName = change.file_name;
        const fileContent = files[fileName];

        console.info(`File content retrieved: ${!!fileContent}`);
        if (fileContent && change.edits) {
          console.info(`Processing ${change.edits.length} edits`);

          // Process edits in reverse order to handle line shifts
          const sortedEdits = [...change.edits].sort((a, b) => b.line_start - a.line_start);
          sortedEdits.forEach(edit => {
            console.info(`Processing edit from line ${edit.line_start} to ${edit.line_end}`);

            // Determine if we're replacing a single line or a range
            const isSingleLine = edit.line_start === edit.line_end;
            console.info(`Edit type: ${isSingleLine ? 'single line' : 'range'}`);

            // Remove original lines
            console.info(`Removing lines from ${edit.line_start} to ${edit.line_end}`);
            const removedLinesCount = edit.line_end - edit.line_start + 1;
            const removedLines = [];

            for (let line = edit.line_start; line <= edit.line_end; line++) {
              if (fileContent[line] !== undefined) {
                removedLines.push(fileContent[line]);
                console.info(`Deleting line ${line}: ${fileContent[line]}`);
                delete fileContent[line];
              }
            }

            // Insert new content
            console.info(`Inserting new content: ${edit.new_content}`);
            const newLines = edit.new_content.split('\n');
            const newLinesCount = newLines.length;
            const lineDifference = newLinesCount - removedLinesCount;

            // Store lines after the edit range to shift them later
            const linesToShift = [];
            let firstLineToShift = edit.line_start;

            // For single line replacement, we don't need to shift
            if (!isSingleLine) {
              // Collect lines after the edit range
              const allLines = Object.entries(fileContent)
                .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

              for (const [key, value] of allLines) {
                const lineNum = parseInt(key);
                if (lineNum > edit.line_end) {
                  linesToShift.push({ lineNum, value });
                } else if (lineNum > edit.line_start) {
                  firstLineToShift = Math.min(firstLineToShift, lineNum);
                }
              }
            }

            // Insert new lines
            newLines.forEach((content, index) => {
              const lineNum = edit.line_start + index;
              console.info(`Inserting line ${lineNum}: ${content}`);
              fileContent[lineNum] = content;
            });

            // Shift subsequent lines if needed (only for range edits)
            if (!isSingleLine && lineDifference !== 0) {
              console.info(`Shifting ${linesToShift.length} lines by ${lineDifference}`);

              // First, remove the lines that will be shifted
              linesToShift.forEach(({ lineNum }) => {
                delete fileContent[lineNum];
              });

              // Then insert them at their new positions
              linesToShift.forEach(({ lineNum, value }) => {
                const newLineNum = lineNum + lineDifference;
                console.info(`Moving line ${lineNum} to ${newLineNum}`);
                fileContent[newLineNum] = value;
              });
            }
          });

          // Update editor
          console.info('Updating editor with new content');
          const updatedContent = Object.values(fileContent)
            .sort((a, b) => {
              // Sort by line number (which is the index in the array)
              const lineA = parseInt(Object.keys(fileContent).find(key => fileContent[key] === a));
              const lineB = parseInt(Object.keys(fileContent).find(key => fileContent[key] === b));
              return lineA - lineB;
            })
            .join('\n');
          onApplyChanges(fileName, updatedContent);
        }
      });
    }
    else if (toolCall.name === 'insert_code_at_lines') {
      console.info('Handling insert_code_at_lines tool call');
      toolCall.args.changes.forEach(change => {
        console.info(`Processing change for file: ${change.file_name}`);
        const fileName = change.file_name;
        const fileContent = files[fileName];

        console.info(`File content retrieved: ${!!fileContent}`);
        if (fileContent && change.insertions) {
          console.info(`Processing ${change.insertions.length} insertions`);

          // Process insertions in reverse order to handle line shifts
          const sortedInsertions = [...change.insertions].sort((a, b) => b.insert_line - a.insert_line);
          sortedInsertions.forEach(insertion => {
            console.info(`Inserting code at line ${insertion.insert_line}`);

            // Split code into lines
            console.info(`Splitting code into lines: ${insertion.code}`);
            const codeLines = insertion.code.split('\n');
            const codeLinesCount = codeLines.length;

            // Collect lines after the insertion point to shift them
            const linesToShift = [];
            const allLines = Object.entries(fileContent)
              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

            for (const [key, value] of allLines) {
              const lineNum = parseInt(key);
              if (lineNum >= insertion.insert_line) {
                linesToShift.push({ lineNum, value });
              }
            }

            // Remove the lines that will be shifted
            linesToShift.forEach(({ lineNum }) => {
              delete fileContent[lineNum];
            });

            // Insert new lines
            codeLines.forEach((line, index) => {
              const lineNum = insertion.insert_line + index;
              console.info(`Inserting line ${lineNum}: ${line}`);
              fileContent[lineNum] = line;
            });

            // Insert shifted lines at their new positions
            linesToShift.forEach(({ lineNum, value }) => {
              const newLineNum = lineNum + codeLinesCount;
              console.info(`Moving line ${lineNum} to ${newLineNum}`);
              fileContent[newLineNum] = value;
            });
          });

          // Update editor
          console.info('Updating editor with new content');
          const updatedContent = Object.values(fileContent)
            .sort((a, b) => {
              // Sort by line number (which is the index in the array)
              const lineA = parseInt(Object.keys(fileContent).find(key => fileContent[key] === a));
              const lineB = parseInt(Object.keys(fileContent).find(key => fileContent[key] === b));
              return lineA - lineB;
            })
            .join('\n');
          onApplyChanges(fileName, updatedContent);
        }
      });
    }
  });
};

// Add line edit application function
const applyLineEdits = (
  fileName: string,
  fileContent: Record<number, string>,
  edit: {
    line_start: number;
    line_end: number;
    new_content: string;
  }
) => {
  // Remove original lines
  for (let line = edit.line_start; line <= edit.line_end; line++) {
    delete fileContent[line];
  }

  // Insert new content
  const newLines = edit.new_content.split('\n');
  newLines.forEach((content, index) => {
    fileContent[edit.line_start + index] = content;
  });

  // Re-number subsequent lines
  const lines = Object.entries(fileContent)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  let currentLine = edit.line_start + newLines.length;

  lines.forEach(([key, value]) => {
    const lineNum = parseInt(key);
    if (lineNum > edit.line_end) {
      fileContent[currentLine] = value;
      delete fileContent[lineNum];
      currentLine++;
    }
  });
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

// Inside the ShareCodeAgent component, modify the renderConversation function:
const renderConversation = (currentConversation: Message[]) => {
  const markdownComponents: MarkdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={darkMode ? dracula : prism}
          language={match[1]}
          PreTag="div"
          className="overflow-x-auto"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code
          className={`${className} ${
            darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-800'
          } px-1.5 py-0.5 rounded`}
          {...props}
        >
          {children}
        </code>
      );
    },
    pre({ node, children, ...props }) {
      return <div className="my-2">{children}</div>;
    },
  };

  return currentConversation.map((message, index) => (
    <div
      key={index}
      className={`mb-4 ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
    >
      <div className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''} max-w-[90%]`}>
        {/* Avatar for both roles */}
        {message.role === 'assistant' && (
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${darkMode ? 'bg-violet-600' : 'bg-cyan-600'} flex items-center justify-center`}>
            <Bot size={16} className="text-white" />
          </div>
        )}

        {message.role === 'user' && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
            {user?.avatar_path ? (
              <img
                src={`http://localhost:5000${user.avatar_path}`}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-medium">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`p-3 rounded-lg w-full ${
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

          <div className="prose max-w-none overflow-x-auto">
            <ReactMarkdown
              components={markdownComponents}
              remarkPlugins={[remarkGfm]}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  ));
};

// Add style for bouncing dots animation
const bounceAnimation = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); opacity: 0.75; }
    50% { transform: translateY(-3px); opacity: 1; }
  }
`;

const renderHeader = () => (
  <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-violet-600' : 'bg-cyan-600'}`}>
        <Bot size={16} className="text-white" />
      </div>
      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>ShareCode Agent</h3>
      {isGenerating && (
        <div className="flex items-center space-x-1 ml-2">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              darkMode ? 'bg-violet-400' : 'bg-cyan-500'
            } animate-bounce`}
            style={{ animationDelay: '0.1s' }}
          />
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              darkMode ? 'bg-violet-400' : 'bg-cyan-500'
            } animate-bounce`}
            style={{ animationDelay: '0.2s' }}
          />
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              darkMode ? 'bg-violet-400' : 'bg-cyan-500'
            } animate-bounce`}
            style={{ animationDelay: '0.3s' }}
          />
        </div>
      )}
    </div>
    <div className="flex items-center gap-1">
      <button
        onClick={handleNewChat}
        className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
        title="New chat"
      >
        <Plus size={18} />
      </button>
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
);

// Modified generate button content
const generateButtonContent = isGenerating ? (
  <div className="flex items-center gap-2">
    <div className="flex space-x-1">
      <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-violet-400' : 'bg-cyan-500'} animate-bounce`} />
      <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-violet-400' : 'bg-cyan-500'} animate-bounce`}
        style={{ animationDelay: '0.15s' }} />
      <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-violet-400' : 'bg-cyan-500'} animate-bounce`}
        style={{ animationDelay: '0.3s' }} />
    </div>
    Generating...
  </div>
) : (
  <>
    <CheckCircle2 size={14} />
    Generate Changes
  </>
);

useEffect(() => {
  if (textareaRef.current) {
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }
}, [prompt, editPrompt]);

return (
  <div
    className={`h-full flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'} ${
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
    <style>{bounceAnimation}</style>

    {renderHeader()}

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
      {mode === 'ask' && askConversation.length === 0 && (
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

      {mode === 'edit' && editConversation.length === 0 && (
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
      {mode === 'ask' && askConversation.length > 0 && (
        <div>
          {renderConversation(askConversation)}
          <div ref={chatEndRef} />
        </div>
      )}

      {mode === 'edit' && editConversation.length > 0 && (
        <div>
          {renderConversation(editConversation)}
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
              {generateButtonContent}
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default ShareCodeAgent;
