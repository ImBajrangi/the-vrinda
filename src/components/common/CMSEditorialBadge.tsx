import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Database, Download, Globe, X, Server } from 'lucide-react';
import { cms } from '../../services/cms';
import { SacredPad } from '../../types/devotional';

interface CMSEditorialBadgeProps {
  currentPad?: SacredPad | null;
  activeTab?: string;
}

export const CMSEditorialBadge: React.FC<CMSEditorialBadgeProps> = ({ currentPad }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      closeTimerRef.current = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
        closeTimerRef.current = null;
      }, 240);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const [connectionInfo, setConnectionInfo] = useState<{ ok: boolean; message: string; latencyMs?: number }>({
    ok: true,
    message: 'Local Canonical Repository Ready',
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    cms.getActiveProvider().checkConnection().then((info) => {
      setConnectionInfo(info);
    });
  }, []);

  const handleClose = () => {
    if (isClosing) return;
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isRendered) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRendered, isClosing]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      cms.downloadCMSManifestFile();
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  return (
    <>
      {/* Discreet Fixed Trigger in bottom right */}
      <div className="fixed bottom-3 right-3 z-40 hidden lg:flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="CMS, SEO & Data Architecture Hub"
          className="h-7 px-2.5 rounded-full bg-white/95 hover:bg-white text-[#71717A] hover:text-[#18181B] text-[10.5px] font-mono font-medium border border-neutral-200/80 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          <span>CMS • SEO</span>
        </button>
      </div>

      {/* Slide-out Editorial Modal */}
      {isRendered && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 z-[100] bg-black/45 flex items-center justify-center p-4 transition-opacity ${
            isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
          }`}
          onClick={handleClose}
        >
          <div
            className={`w-full max-w-lg bg-white rounded-[28px] p-6 space-y-5 text-[#18181B] relative ${
              isClosing ? 'apple-sheet-exit' : 'apple-sheet-enter'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#18181B]">
                    CMS & SEO Architecture Desk
                  </h3>
                  <p className="text-[11px] text-[#71717A] font-mono">
                    Vrindopnisad 2.0 • Headless CMS & Metadata Gateway
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-[#71717A] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Architecture Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-neutral-200/60">
                <span className="text-[10px] font-bold text-[#71717A] uppercase font-mono block mb-1">
                  Active CMS Layer
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-[#18181B]">
                  <Server className="w-3.5 h-3.5 text-amber-700" />
                  <span>{cms.getActiveProvider().name}</span>
                </div>
                <p className="text-[10.5px] text-[#71717A] mt-1">
                  {connectionInfo.message}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-neutral-200/60">
                <span className="text-[10px] font-bold text-[#71717A] uppercase font-mono block mb-1">
                  SEO & Structured Data
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-[#18181B]">
                  <Globe className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Google Schema JSON-LD</span>
                </div>
                <p className="text-[10.5px] text-[#71717A] mt-1">
                  OpenGraph, Twitter Cards & Canonical active
                </p>
              </div>
            </div>

            {/* Current Active Pada CMS Payload */}
            {currentPad && (
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs space-y-1.5">
                <span className="text-[10px] font-bold text-amber-800 uppercase font-mono block">
                  Active Content Node Payload
                </span>
                <div className="font-serif font-bold text-sm text-[#18181B]">
                  {currentPad.titleDevanagari}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-[#71717A]">
                  <div>
                    <span className="block text-[9px] uppercase">ID:</span>
                    <span className="font-semibold text-[#18181B] truncate block">{currentPad.id}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase">Raga:</span>
                    <span className="font-semibold text-[#18181B]">{currentPad.rag}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase">Stanzas:</span>
                    <span className="font-semibold text-[#18181B]">{currentPad.verses?.length || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions: Export CMS Manifest */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-2.5 px-4 rounded-full bg-[#FEF08A] hover:bg-[#FDE047] text-[#78350F] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exporting 4,204 Verses...' : 'Export Full CMS Manifest (JSON)'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
