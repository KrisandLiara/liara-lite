import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  return (
    <div className="my-4 rounded-lg overflow-hidden bg-[#1e1e1e]">
        <SyntaxHighlighter language={language} style={vscDarkPlus}>
            {value}
        </SyntaxHighlighter>
    </div>
  );
}; 