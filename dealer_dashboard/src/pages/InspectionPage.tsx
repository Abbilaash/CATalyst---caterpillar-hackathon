import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, AlertTriangle, ChevronRight, X, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/ui/Page';
import { Badge } from '@/components/ui/Badge';

export function InspectionPage() {
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      if (type === 'before') {
        setBeforeFile(file);
        setBeforePreview(preview);
      } else {
        setAfterFile(file);
        setAfterPreview(preview);
      }
      setResults(null);
      setError(null);
    }
  };

  const removeFile = (type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforeFile(null);
      setBeforePreview(null);
      if (beforeInputRef.current) beforeInputRef.current.value = '';
    } else {
      setAfterFile(null);
      setAfterPreview(null);
      if (afterInputRef.current) afterInputRef.current.value = '';
    }
    setResults(null);
  };

  const handleAnalyze = async () => {
    if (!beforeFile || !afterFile) return;

    setAnalyzing(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('before_image', beforeFile);
    formData.append('after_image', afterFile);

    try {
      const response = await fetch('/api/v1/inspection/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze images');
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <PageContainer title="AI Visual Inspection">
      <PageHeader
        title="AI Visual Inspection"
        subtitle="Upload before and after images of equipment to instantly detect new damage using Gemini 3.6 Flash."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Before Upload */}
        <div className="card p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Before Rental</h3>
          {!beforePreview ? (
            <div 
              className="flex-1 border-2 border-dashed border-ink-400 rounded-xl bg-ink-700/50 flex flex-col items-center justify-center p-8 transition-colors hover:bg-ink-600/50 hover:border-cat-yellow/50 cursor-pointer min-h-[300px]"
              onClick={() => beforeInputRef.current?.click()}
            >
              <UploadCloud className="h-10 w-10 text-ink-200 mb-3" />
              <p className="text-sm font-medium text-ink-50">Click to upload before image</p>
              <p className="text-xs text-ink-200 mt-1">JPEG, PNG up to 10MB</p>
            </div>
          ) : (
            <div className="relative flex-1 rounded-xl overflow-hidden min-h-[300px] border border-white/[0.08]">
              <img src={beforePreview} alt="Before" className="absolute inset-0 w-full h-full object-contain bg-ink-800" />
              <button 
                onClick={() => removeFile('before')}
                className="absolute top-3 right-3 bg-ink-900/80 p-1.5 rounded-lg text-ink-200 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-3">
                <Badge tone="cat">Before</Badge>
              </div>
            </div>
          )}
          <input type="file" ref={beforeInputRef} onChange={(e) => handleFileChange(e, 'before')} accept="image/*" className="hidden" />
        </div>

        {/* After Upload */}
        <div className="card p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">After Rental</h3>
          {!afterPreview ? (
            <div 
              className="flex-1 border-2 border-dashed border-ink-400 rounded-xl bg-ink-700/50 flex flex-col items-center justify-center p-8 transition-colors hover:bg-ink-600/50 hover:border-info/50 cursor-pointer min-h-[300px]"
              onClick={() => afterInputRef.current?.click()}
            >
              <UploadCloud className="h-10 w-10 text-ink-200 mb-3" />
              <p className="text-sm font-medium text-ink-50">Click to upload after image</p>
              <p className="text-xs text-ink-200 mt-1">JPEG, PNG up to 10MB</p>
            </div>
          ) : (
            <div className="relative flex-1 rounded-xl overflow-hidden min-h-[300px] border border-white/[0.08]">
              <img src={afterPreview} alt="After" className="absolute inset-0 w-full h-full object-contain bg-ink-800" />
              <button 
                onClick={() => removeFile('after')}
                className="absolute top-3 right-3 bg-ink-900/80 p-1.5 rounded-lg text-ink-200 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-3">
                <Badge tone="info">After</Badge>
              </div>
            </div>
          )}
          <input type="file" ref={afterInputRef} onChange={(e) => handleFileChange(e, 'after')} accept="image/*" className="hidden" />
        </div>
      </div>

      <div className="flex justify-center mb-10">
        <button
          onClick={handleAnalyze}
          disabled={!beforeFile || !afterFile || analyzing}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-ink-900 shadow-glow transition-all ${
            !beforeFile || !afterFile 
              ? 'bg-ink-500 text-ink-200 shadow-none cursor-not-allowed' 
              : analyzing 
              ? 'bg-cat-yellow/70 cursor-wait' 
              : 'bg-cat-yellow hover:bg-cat-yellow-light hover:-translate-y-0.5'
          }`}
        >
          {analyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing with Gemini...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Run AI Inspection
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-crit/10 border border-crit/20 text-crit flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
              <div className="h-10 w-10 rounded-lg bg-cat-yellow/20 flex items-center justify-center text-cat-yellow">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Inspection Results</h3>
                <p className="text-sm text-ink-200">Powered by Gemini 3.6 Flash</p>
              </div>
            </div>

            {results.message ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-ok/10 text-ok flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-semibold text-white">Equipment is clean!</h4>
                <p className="text-ink-200 mt-2">{results.message}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-xs font-semibold text-ink-200 uppercase tracking-wider">
                      <th className="pb-3 pl-4">Part</th>
                      <th className="pb-3">Damage Type</th>
                      <th className="pb-3">Severity</th>
                      <th className="pb-3 pr-4 text-right">AI Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {results.damages?.map((d: any, i: number) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 pl-4 font-medium text-white">{d.part}</td>
                        <td className="py-4 text-ink-100">{d.damage}</td>
                        <td className="py-4">
                          <Badge 
                            tone={
                              d.severity?.toLowerCase() === 'high' ? 'crit' :
                              d.severity?.toLowerCase() === 'medium' ? 'warn' : 'cat'
                            }
                          >
                            {d.severity || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="py-4 pr-4 text-right text-ink-200">
                          {d.confidence ? `${(d.confidence * 100).toFixed(0)}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
