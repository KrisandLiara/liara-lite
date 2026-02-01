import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
  caption?: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    background: '#0f172a', // slate-900
    primaryColor: '#38bdf8', // sky-400
    primaryTextColor: '#e2e8f0', // slate-200
    primaryBorderColor: '#334155', // slate-700
    lineColor: '#64748b', // slate-500
    secondaryColor: '#1e293b', // slate-800
    tertiaryColor: '#334155', // slate-700
    textColor: '#e2e8f0', // slate-200
    mainBkg: '#0f172a',
    errorBkgColor: '#fef2f2',
    errorTextColor: '#ef4444'
  }
});

const Mermaid: React.FC<MermaidProps> = ({ chart, caption }) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [id] = useState(() => `mermaid-graph-${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!chart) {
        setSvg(null);
        setError(null);
        return;
      }
      try {
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
        setError(null);
      } catch (e: any) {
        console.error("Mermaid render error:", e.message);
        setError("Could not render diagram. Check Mermaid syntax.");
        setSvg(null);
      }
    };
    renderDiagram();
  }, [chart, id]);

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-md text-red-300">
        <p className="font-bold">Diagram Error</p>
        <p>{error}</p>
        <pre className="mt-2 p-2 bg-slate-900 rounded text-xs whitespace-pre-wrap"><code>{chart}</code></pre>
      </div>
    );
  }

  return (
    <div>
        {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <div>Loading diagram...</div>}
        {caption && svg && <p className="text-center text-sm text-slate-400 mt-2">{caption}</p>}
    </div>
  )
};

export default Mermaid; 