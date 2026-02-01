import React from 'react';
import { Link } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { DiagramSpoiler } from '@/components/system-overview/DiagramSpoiler';
import { SchemaViewer } from '@/components/system-overview/SchemaViewer';
import { Card, CardGrid } from '@/components/system-overview/Card';
import Mermaid from '@/components/system-overview/Mermaid';
import 'katex/dist/katex.min.css';
import katex from 'katex';

const InlineMath: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const ref = React.useRef<HTMLSpanElement>(null);
    React.useEffect(() => {
        const text = String(children || '').replace(/^\\\(|\\\)$/g, '');
        if (ref.current) {
            try { katex.render(text, ref.current, { throwOnError: false }); } catch {}
        }
    }, [children]);
    return <span ref={ref} />;
};

const BlockMath: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const text = String(children || '').replace(/^\\\[|\\\]$/g, '');
        if (ref.current) {
            try { katex.render(text, ref.current, { displayMode: true, throwOnError: false }); } catch {}
        }
    }, [children]);
    return <div ref={ref} className="my-2" />;
};

// Custom Link Component
const CustomLink = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const href = props.href || '';
    if (href.startsWith('/')) {
        return <Link to={href} {...props} className="text-sky-400 hover:text-sky-300 transition-colors" />;
    }
    return <a {...props} rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 transition-colors" />;
};

// Custom Code Block Component
const CodeBlock = (props: React.HTMLAttributes<HTMLElement>) => {
    const { className, children } = props;
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');

    if (lang === 'mermaid') {
        return <Mermaid chart={code} />;
    }

    return (
        <SyntaxHighlighter style={vscDarkPlus} language={lang} PreTag="div" {...props}>
            {code}
        </SyntaxHighlighter>
    );
}

// Custom Keyword Component
const Keyword = ({ children, to }: { children: React.ReactNode; to?: string }) => {
    const content = (
         <span className={cn(
            "font-semibold rounded-md px-1.5 py-0.5 transition-colors",
            to ? "text-amber-300 bg-amber-900/30 hover:bg-amber-900/50" : "text-slate-300 bg-slate-700/50"
         )}>
            {children}
        </span>
    );
    if (to) return <Link to={to} className="no-underline hover:brightness-110">{content}</Link>;
    return content;
}

// Custom Diagram Component
const Diagram = ({ children, caption }: { children: React.ReactNode, caption?: string }) => {
    if (typeof children !== 'string') return <div className="text-red-500">Diagram content must be a string.</div>;
    return <DiagramSpoiler><Mermaid chart={children} caption={caption} /></DiagramSpoiler>;
};

// Component map for MDXProvider
export const MDXComponents = {
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h1 className="text-4xl font-bold text-slate-100 tracking-tight mt-8 mb-4" {...props} />,
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className="text-3xl font-semibold text-slate-200 tracking-tight mt-6 mb-3" {...props} />,
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className="text-2xl font-semibold text-slate-200 mt-5 mb-2" {...props} />,
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => <p className="text-slate-400 leading-7 my-4" {...props} />,
    a: CustomLink,
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => <ul className="list-disc pl-6 my-4" {...props} />,
    li: (props: React.HTMLAttributes<HTMLLIElement>) => <li className="my-2" {...props} />,
    pre: (props: React.HTMLAttributes<HTMLPreElement>) => {
        const child = React.Children.only(props.children) as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
        return <CodeBlock {...child.props} />;
    },
    code: (props: React.HTMLAttributes<HTMLElement>) => {
         return <code className="bg-slate-700/50 text-slate-300 rounded-md px-1.5 py-1" {...props} />
    },
    Keyword,
    Diagram,
    DiagramSpoiler,
    SchemaViewer,
    Card,
    CardGrid,
    inlineMath: InlineMath,
    blockMath: BlockMath,
}; 