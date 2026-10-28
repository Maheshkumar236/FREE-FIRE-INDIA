import React, { useState } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AIBugDetectorProps {
  logs: any[];
}

const AIBugDetector: React.FC<AIBugDetectorProps> = ({ logs }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (logs.length === 0) {
      toast.error('No logs to analyze');
      return;
    }

    setLoading(true);
    try {
      const logSummary = logs.map((log) => `${log.action} - ${log.target}`).join('\n');
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze these recent system logs for potential bugs, errors, or suspicious activity. Provide a concise summary of findings.\n\nLogs:\n${logSummary}`,
        }),
      });
      const data = await res.json();
      setAnalysis(data.text || 'No issues detected.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to run AI analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" /> AI Bug Detector
        </h2>
        <button 
          onClick={runAnalysis}
          disabled={loading}
          className="neon-button text-xs py-1 px-3 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>
      
      {analysis && (
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-white/80 whitespace-pre-wrap">
          {analysis}
        </div>
      )}
    </div>
  );
};

export default AIBugDetector;
