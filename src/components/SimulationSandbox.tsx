import React, { useEffect, useRef, useState } from 'react';

interface SimulationSandboxProps {
  code: string;
  controlValues: Record<string, number>;
}

const SimulationSandbox: React.FC<SimulationSandboxProps> = ({ code, controlValues }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isReady, setIsReady] = useState(false);

  const p5Cdn = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js';
  
  // Create the HTML content for the iframe
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="${p5Cdn}"></script>
        <style>
          body { margin: 0; padding: 0; overflow: hidden; background: #000; }
          canvas { display: block; }
        </style>
      </head>
      <body>
        <script>
          // Bridge to update variables
          window.addEventListener('message', (event) => {
            if (event.data.type === 'UPDATE_VARIABLE') {
              // Update global variable
              window[event.data.name] = event.data.value;
            }
          });

          // Notify parent that we are ready
          window.parent.postMessage({ type: 'SANDBOX_READY' }, '*');

          // The generated code
          try {
            ${code}
          } catch (err) {
            console.error('P5.js Execution Error:', err);
          }
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    setIsReady(false);
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SANDBOX_READY') {
        setIsReady(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [code]);

  // Update variables in real-time via postMessage
  useEffect(() => {
    if (!isReady || !iframeRef.current?.contentWindow) return;

    Object.entries(controlValues).forEach(([name, value]) => {
      iframeRef.current?.contentWindow?.postMessage({
        type: 'UPDATE_VARIABLE',
        name,
        value
      }, '*');
    });
  }, [controlValues, isReady]);

  return (
    <div className="w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      <iframe
        ref={iframeRef}
        title="Simulation Sandbox"
        className="w-full h-full border-none"
        srcDoc={htmlContent}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default SimulationSandbox;
