import React from 'react';
import { X, Printer, Download, Award } from 'lucide-react';
import { API_URL } from '../utils/api';

const CertificatePreviewModal = ({ isOpen, onClose, cert }) => {
  if (!isOpen || !cert) return null;

  const isWinner = cert.certificate_type?.toLowerCase() === 'winner';
  const certTitle = isWinner ? 'Certificate of Excellence' : 'Certificate of Participation';
  const recipientName = cert.user?.name || 'Hackathon Participant';
  const hackathonTitle = cert.hackathon_title || 'AI Hackathon';
  const certNum = cert.certificate_number || 'CERT-XXXX-XXXX';
  const formattedDate = cert.generated_at 
    ? new Date(cert.generated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:p-0 print:bg-white print:backdrop-blur-none">
      {/* Modal Card */}
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] print:border-none print:shadow-none print:rounded-none print:max-h-none print:w-full print:h-full">
        
        {/* Header - Hidden on Print */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 print:hidden">
          <div className="flex items-center space-x-2.5">
            <Award className="h-5.5 w-5.5 text-indigo-400" />
            <span className="font-bold text-white text-sm">Certificate Credentials Preview</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/15 cursor-pointer transition-all"
            >
              <Printer className="h-4 w-4 mr-1.5" /> Print / Save PDF
            </button>
            <a
              href={`${API_URL}/certificates/${cert.id}/download?token=${localStorage.getItem('accessToken')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              <Download className="h-4 w-4 mr-1.5" /> Download Original PDF
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container for Preview Screen - Full Screen on Print */}
        <div className="p-8 flex items-center justify-center overflow-auto bg-slate-950/20 print:p-0 print:bg-white print:overflow-visible">
          
          {/* A4 Landscape Aspect Ratio Frame */}
          <div 
            id="certificate-print-area"
            className="relative w-[1000px] h-[700px] bg-[#FCFBF8] border-[16px] border-white shadow-xl flex flex-col justify-between p-12 overflow-hidden print:shadow-none print:border-none print:w-[297mm] print:h-[210mm]"
            style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
          >
            
            {/* 1. Page Corner Accents (Navy & Gold) */}
            {/* Top Left */}
            <div className="absolute top-0 left-0 w-36 h-36 overflow-hidden pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon points="0,0 100,0 0,100" fill="#1E3A8A" />
                <polygon points="0,85 85,0 93,0 0,93" fill="#D4AF37" />
              </svg>
            </div>
            {/* Top Right */}
            <div className="absolute top-0 right-0 w-36 h-36 overflow-hidden pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon points="100,0 0,0 100,100" fill="#1E3A8A" />
                <polygon points="100,85 15,0 7,0 100,93" fill="#D4AF37" />
              </svg>
            </div>
            {/* Bottom Left */}
            <div className="absolute bottom-0 left-0 w-36 h-36 overflow-hidden pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon points="0,100 100,100 0,0" fill="#1E3A8A" />
                <polygon points="0,15 85,100 93,100 0,7" fill="#D4AF37" />
              </svg>
            </div>
            {/* Bottom Right */}
            <div className="absolute bottom-0 right-0 w-36 h-36 overflow-hidden pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polygon points="100,100 0,100 100,0" fill="#1E3A8A" />
                <polygon points="100,15 15,100 7,100 100,7" fill="#D4AF37" />
              </svg>
            </div>

            {/* 2. Classic Double Border */}
            <div className="absolute inset-4 border-2 border-[#D4AF37] pointer-events-none"></div>
            <div className="absolute inset-5.5 border border-[#1E3A8A] pointer-events-none"></div>

            {/* 3. Verification QR Code Widget (Top Right) */}
            <div className="absolute top-10 right-10 flex flex-col items-center pointer-events-none" style={{ fontFamily: "monospace" }}>
              <span className="text-[7px] text-slate-400 font-semibold tracking-wider mb-1">SECURE VERIFICATION</span>
              <div className="p-1 bg-white border border-slate-200 rounded-sm">
                <svg width="60" height="60" viewBox="0 0 21 21">
                  {/* Position detection corners */}
                  <rect x="0" y="0" width="7" height="7" fill="#1E3A8A" />
                  <rect x="1" y="1" width="5" height="5" fill="white" />
                  <rect x="2" y="2" width="3" height="3" fill="#1E3A8A" />

                  <rect x="14" y="0" width="7" height="7" fill="#1E3A8A" />
                  <rect x="15" y="1" width="5" height="5" fill="white" />
                  <rect x="16" y="2" width="3" height="3" fill="#1E3A8A" />

                  <rect x="0" y="14" width="7" height="7" fill="#1E3A8A" />
                  <rect x="1" y="15" width="5" height="5" fill="white" />
                  <rect x="2" y="16" width="3" height="3" fill="#1E3A8A" />

                  {/* Stylized random QR modules */}
                  <rect x="9" y="1" width="2" height="1" fill="#1E3A8A" />
                  <rect x="8" y="3" width="1" height="3" fill="#1E3A8A" />
                  <rect x="11" y="4" width="2" height="2" fill="#1E3A8A" />
                  <rect x="9" y="9" width="3" height="3" fill="#1E3A8A" />
                  <rect x="15" y="9" width="2" height="1" fill="#1E3A8A" />
                  <rect x="18" y="11" width="2" height="3" fill="#1E3A8A" />
                  <rect x="9" y="15" width="3" height="1" fill="#1E3A8A" />
                  <rect x="14" y="16" width="4" height="2" fill="#1E3A8A" />
                </svg>
              </div>
            </div>

            {/* 4. Certificate Body Text */}
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 pt-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-wide text-[#1E3A8A] uppercase">
                {certTitle}
              </h1>
              <p className="text-lg italic text-[#D4AF37] font-semibold" style={{ fontFamily: "Georgia, serif" }}>
                This is proudly presented to
              </p>
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                  {recipientName}
                </h2>
                <div className="h-0.5 w-64 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-2.5"></div>
              </div>
              <p className="max-w-2xl text-base text-slate-600 leading-relaxed font-sans">
                {isWinner 
                  ? `for achieving a winning position of outstanding technical innovation and design presentation in the international challenge`
                  : `for successfully coding, executing, and submitting project deliverables under the global artificial intelligence challenge`
                }
              </p>
              <h3 className="text-xl font-bold text-[#1E3A8A] font-sans">
                {hackathonTitle}
              </h3>
            </div>

            {/* 5. Footer Details & Signatures */}
            <div className="flex justify-between items-end mt-8 border-t border-slate-200/50 pt-6">
              
              {/* Gold Seal (Bottom Left) */}
              <div className="flex items-center space-x-4">
                <div className="relative h-18 w-18 flex items-center justify-center">
                  {/* Ribbons */}
                  <svg className="absolute -bottom-4 inset-x-0 mx-auto w-10 h-10" viewBox="0 0 40 40">
                    <polygon points="12,0 20,35 28,0" fill="#D4AF37" />
                    <polygon points="5,0 12,30 20,0" fill="#D4AF37" opacity="0.8" />
                    <polygon points="20,0 28,30 35,0" fill="#D4AF37" opacity="0.8" />
                  </svg>
                  {/* Outer circle */}
                  <div className="absolute inset-0 bg-[#D4AF37] rounded-full shadow-md flex items-center justify-center">
                    {/* Inner circle */}
                    <div className="h-14 w-14 bg-[#1E3A8A] rounded-full flex items-center justify-center text-[#D4AF37] text-base font-bold">
                      ★
                    </div>
                  </div>
                </div>
                <div className="flex flex-col text-left" style={{ fontFamily: "sans-serif" }}>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Secure Token ID</span>
                  <span className="text-[11px] font-mono text-slate-600 font-bold">{certNum}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Date Issued: {formattedDate}</span>
                </div>
              </div>

              {/* Signatures (Bottom Right) */}
              <div className="flex space-x-12 pr-6">
                {/* CEO Signature */}
                <div className="flex flex-col items-center relative">
                  {/* Handwriting curve */}
                  <svg className="absolute -top-6 h-10 w-24 text-[#1E3A8A]" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10,25 C30,5 60,35 80,10 C90,0 95,20 85,25 C75,30 65,15 70,20" />
                  </svg>
                  <div className="w-28 border-b border-slate-300"></div>
                  <span className="text-[10px] font-sans text-slate-700 font-semibold mt-1">Jane Doe</span>
                  <span className="text-[9px] font-sans text-slate-400">CEO, HackAI Global</span>
                </div>

                {/* Dean Signature */}
                <div className="flex flex-col items-center relative">
                  {/* Handwriting curve */}
                  <svg className="absolute -top-6 h-10 w-24 text-[#D4AF37]" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15,15 C25,35 45,5 65,25 C75,35 85,15 90,20 C95,25 90,30 80,25" />
                  </svg>
                  <div className="w-28 border-b border-slate-300"></div>
                  <span className="text-[10px] font-sans text-slate-700 font-semibold mt-1">Dr. John Smith</span>
                  <span className="text-[9px] font-sans text-slate-400">Dean, Evaluator Board</span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Global CSS Inject for Print Styling - Scoped to this component */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #certificate-print-area, #certificate-print-area * {
            visibility: visible !important;
          }
          #certificate-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 297mm !important;  /* A4 Landscape dimensions */
            height: 210mm !important;
            margin: 0 !important;
            padding: 2.5cm !important;
            box-sizing: border-box !important;
            background: #FCFBF8 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: landscape !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CertificatePreviewModal;
