import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Generate a random ID for each diagram
const randomId = () => `mermaid-diagram-${Math.random().toString(36).substr(2, 9)}`;

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState('default');
  const id = useRef(randomId()).current;

  useEffect(() => {
    // Function to get theme from html class
    const getTheme = () => {
      if (document.documentElement.classList.contains('dark')) {
        return 'dark';
      }
      return 'default';
    };
    
    setTheme(getTheme());

    // Observe class changes on the html element to react to theme switches
    const observer = new MutationObserver(() => {
        setTheme(getTheme());
    });
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });

    return () => {
        observer.disconnect();
    }
  }, []);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false, // We will render manually
      theme: theme,
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });

    if (containerRef.current && chart) {
        // Clear previous render
        containerRef.current.innerHTML = '';
        try {
            mermaid.render(id, chart, (svgCode) => {
                if(containerRef.current) {
                  containerRef.current.innerHTML = svgCode;
                }
              });
        } catch (e) {
            console.error("Mermaid rendering error:", e);
            if(containerRef.current) {
                containerRef.current.innerHTML = "Error rendering diagram.";
            }
        }
    }
  }, [chart, theme, id]);

  return <div ref={containerRef} className="mermaid-container w-full flex justify-center" key={id} />;
};

export default Mermaid; 