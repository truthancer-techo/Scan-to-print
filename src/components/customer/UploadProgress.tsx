import React from 'react';
import { ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface UploadProgressProps {
  fileName: string;
  fileSize: number;
  progress: number;
  isComplete: boolean;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  fileName,
  fileSize,
  progress,
  isComplete,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto bg-[#0b162d] rounded-3xl p-6 sm:p-7 shadow-2xl border border-blue-900/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-bold text-orange-400 tracking-wide uppercase">
            {isComplete ? 'Processing Complete' : 'Secure Document Ingestion'}
          </span>
          <h3 className="text-base font-extrabold text-white truncate max-w-sm mt-0.5">
            {fileName}
          </h3>
          <p className="text-xs text-slate-400">
            {(fileSize / (1024 * 1024)).toFixed(2)} MB • Uploading documents
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#112347] text-orange-400 flex items-center justify-center shrink-0 border border-blue-800/40">
          {isComplete ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-orange-400 animate-pulse" />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 my-4">
        <div className="w-full bg-[#070e1c] rounded-full h-3 overflow-hidden p-0.5 border border-blue-950">
          <motion.div
            className={`h-full rounded-full transition-all duration-200 ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-orange-500 to-amber-400 shadow-[0_0_8px_rgba(249,115,22,0.6)]'
            }`}
            style={{ width: `${progress}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 px-1">
          <span>{isComplete ? '✓ Upload complete' : 'Uploading...'}</span>
          <span className="font-mono text-orange-400 font-bold">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Security Guarantee Notice */}
      <div className="mt-5 pt-4 border-t border-blue-900/40 flex items-start gap-2.5 text-xs text-slate-300 bg-[#081124] p-3.5 rounded-2xl border border-blue-950">
        <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-slate-200">
            🔒 Your file is transferred securely and only used to process your print order.
          </p>
          <p className="text-[11px] text-slate-400">
            Uploaded documents are private and automatically deleted after order completion.
          </p>
        </div>
      </div>
    </div>
  );
};

