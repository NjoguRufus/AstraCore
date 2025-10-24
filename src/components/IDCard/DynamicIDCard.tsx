import React, { useEffect, useState, useRef } from "react";
import QRCode from "react-qr-code";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { User } from "../../types";

interface DynamicIDCardProps {
  user: User;
  onDownload?: () => void;
  compact?: boolean;
}

export const DynamicIDCard: React.FC<DynamicIDCardProps> = ({ 
  user, 
  onDownload,
  compact = false 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!user) {
    return <p className="text-center text-gray-500 mt-10">Loading your ID card...</p>;
  }

  const { name: displayName, role, idCode: id, photoURL } = user;

  // PDF download function
  const downloadAsPDF = async () => {
    if (!cardRef.current) return;
    
    try {
      const element = cardRef.current;
      const canvas = await html2canvas(element, { 
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`${displayName}_Astraronix_ID.pdf`);
      
      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (compact) {
    // Compact version for profile page
    return (
      <div className="relative">
        <div ref={cardRef} className="relative w-80 h-48 bg-[#0B1C48] rounded-xl text-white flex flex-col items-center justify-between p-4 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/30 to-transparent rounded-xl blur-3xl"></div>

          {/* Logo */}
          <div className="z-10 text-center">
            <h1 className="text-sm font-bold tracking-wide">ASTRARONIX</h1>
            <p className="text-xs uppercase text-sky-400 mt-1">Innovate. Build. Elevate.</p>
          </div>

          {/* Profile */}
          <div className="z-10 relative">
            <div className="absolute inset-0 rounded-full bg-sky-400 blur-md opacity-40"></div>
            <img
              src={photoURL || "https://i.pravatar.cc/200"}
              alt="profile"
              className="relative w-16 h-16 object-cover rounded-full border-2 border-sky-400 shadow-lg"
            />
          </div>

          {/* Info */}
          <div className="z-10 text-center space-y-1">
            <h2 className="text-sm font-semibold">{displayName}</h2>
            <p className="text-sky-400 text-xs font-medium uppercase">{role}</p>
            <p className="text-xs text-gray-300">ID: {id}</p>
          </div>

          {/* QR */}
          <div className="z-10 flex flex-col items-center space-y-1">
            <div className="bg-white p-1 rounded">
              <QRCode value={`https://astraronix.vercel.app/profile/${id}`} size={32} />
            </div>
            <p className="text-xs text-gray-300 uppercase tracking-wide">Astraronix Solutions</p>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={downloadAsPDF}
          className="w-full mt-3 bg-[#0B1C48] hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium shadow-md transition text-sm"
        >
          Download ID Card
        </button>
      </div>
    );
  }

  // Full version
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-10 space-y-6">
      {/* ID CARD */}
      <div ref={cardRef} className="relative flex flex-col md:flex-row items-center gap-10 bg-white shadow-2xl rounded-3xl p-10">
        {/* FRONT SIDE */}
        <div className="relative w-80 h-[460px] bg-[#0B1C48] rounded-3xl text-white flex flex-col items-center justify-between p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/30 to-transparent rounded-3xl blur-3xl"></div>

          {/* Logo */}
          <div className="z-10 text-center">
            <h1 className="text-2xl font-bold tracking-wide">ASTRARONIX</h1>
            <p className="text-xs uppercase text-sky-400 mt-1">Innovate. Build. Elevate.</p>
          </div>

          {/* Profile */}
          <div className="z-10 relative">
            <div className="absolute inset-0 rounded-full bg-sky-400 blur-md opacity-40"></div>
            <img
              src={photoURL || "https://i.pravatar.cc/200"}
              alt="profile"
              className="relative w-28 h-28 object-cover rounded-full border-4 border-sky-400 shadow-lg"
            />
          </div>

          {/* Info */}
          <div className="z-10 text-center space-y-1">
            <h2 className="text-lg font-semibold">{displayName}</h2>
            <p className="text-sky-400 text-sm font-medium uppercase">{role}</p>
            <p className="text-xs text-gray-300">ID: {id}</p>
          </div>

          {/* QR */}
          <div className="z-10 flex flex-col items-center space-y-2">
            <div className="bg-white p-2 rounded-lg">
              <QRCode value={`https://astraronix.vercel.app/profile/${id}`} size={64} />
            </div>
            <p className="text-xs text-gray-300 uppercase tracking-wide">Astraronix Solutions</p>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="relative w-80 h-[460px] bg-white rounded-3xl shadow-inner flex flex-col justify-between p-6">
          <div className="bg-[#0B1C48] text-white text-center py-2 rounded-xl">
            <h2 className="font-semibold">Astraronix Solutions</h2>
          </div>

          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Email:</strong> astraronixsolutions@gmail.com</p>
            <p><strong>Website:</strong> https://astraronix.vercel.app</p>
            <p><strong>Support:</strong> support@astraronix.com</p>
          </div>

          <div className="text-xs text-gray-500 border-t border-gray-300 pt-3">
            <p>If found, please return to Astraronix Solutions HQ or contact support.</p>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-gray-500">Authorized Signature</p>
              <div className="border-b border-gray-400 w-24 mt-2"></div>
            </div>
            <QRCode value={`https://astraronix.vercel.app/verify/${id}`} size={50} />
          </div>
        </div>
      </div>

      {/* DOWNLOAD BUTTON */}
      <button
        onClick={downloadAsPDF}
        className="bg-[#0B1C48] hover:bg-sky-600 text-white px-6 py-3 rounded-xl font-medium shadow-md transition"
      >
        Download Your Astraronix ID
      </button>
    </div>
  );
};
