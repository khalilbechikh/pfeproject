import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { diffLines } from 'diff';
import * as monaco from 'monaco-editor';
import { fetchDirectoryContents } from '../utils/api';

declare module 'monaco-editor' {
  export interface IModelDeltaDecoration {
    range: IRange;
    options: IModelDecorationOptions;
  }
}

const UserOwnRepoPreview = ({ selectedFile, currentPath, setSelectedFile, setNewFileContent, darkMode }) => {
  const [editorRef, setEditorRef] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleApplyChanges = async (fileName: string, newContent: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const fullPath = `${currentPath}/${fileName}`.replace('temp-working-directory/', '');

      const oldContent = selectedFile?.content || '';

      await fetch(`http://localhost:5000/v1/api/preview/content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          relativePath: fullPath,
          newContent: newContent
        })
      });

      if (selectedFile?.path.endsWith(fileName)) {
        setSelectedFile({...selectedFile, content: newContent});
        setNewFileContent(newContent);
      }

      const diffs = diffLines(oldContent, newContent);
      const decorations: monaco.editor.IModelDeltaDecoration[] = [];
      let lineNumber = 1;

      diffs.forEach(part => {
        const lines = part.value.split('\n');
        if (lines[lines.length - 1] === '') lines.pop();

        lines.forEach(line => {
          if (part.added) {
            decorations.push({
              range: new monaco.Range(lineNumber, 1, lineNumber, 1),
              options: {
                isWholeLine: true,
                className: darkMode ? 'added-line-dark' : 'added-line-light',
                marginClassName: darkMode ? 'added-margin-dark' : 'added-margin-light',
              },
            });
            lineNumber++;
          } else if (part.removed) {
            decorations.push({
              range: new monaco.Range(lineNumber, 1, lineNumber, 1),
              options: {
                isWholeLine: true,
                className: darkMode ? 'removed-line-dark' : 'removed-line-light',
                marginClassName: darkMode ? 'removed-margin-dark' : 'removed-margin-light',
                linesDecorationsClassName: 'line-decoration',
              },
            });
          } else {
            lineNumber += lines.length;
          }
        });
      });

      if (editorRef) {
        editorRef.deltaDecorations([], decorations);
      }

      fetchDirectoryContents();
    } catch (err) {
      setDirectoryError('Failed to apply changes: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div>
      <Editor
        onMount={(editor, monaco) => {
          setEditorRef(editor);
          monaco.editor.defineTheme('custom-theme', {
            base: darkMode ? 'vs-dark' : 'vs',
            inherit: true,
            rules: [],
            colors: {
              'editor.lineHighlightBackground': '#00000000',
              'editor.lineHighlightBorder': '#00000000',
            },
          });
          editor.updateOptions({ theme: 'custom-theme' });
        }}
        // ... rest of existing props
      />
    </div>
  );
};

export default UserOwnRepoPreview;