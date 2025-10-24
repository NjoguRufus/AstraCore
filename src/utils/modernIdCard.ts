// src/utils/modernIdCard.ts
// Modern luxury + tech hybrid ID card with advanced features
import jsPDF from 'jspdf';
import { User } from '../types';

interface IDCardData {
  user: User;
  profilePhotoUrl?: string;
  qrCodeData?: string;
  signatureUrl?: string;
}

export const generateModernIDCard = async (data: IDCardData): Promise<void> => {
  const { user, profilePhotoUrl, qrCodeData, signatureUrl } = data;
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85, 54] // Credit card size
  });

  const cardWidth = 85;
  const cardHeight = 54;

  // === FRONT LAYOUT ===
  
  // Deep Navy background (#0B1C48)
  pdf.setFillColor(11, 28, 72);
  pdf.rect(0, 0, cardWidth, cardHeight, 'F');

  // Sky Blue gradient overlay for luxury effect
  pdf.setFillColor(0, 191, 255, 0.1);
  pdf.rect(0, 0, cardWidth, cardHeight, 'F');

  // Top Section - Logo and Subtext
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ASTRARONIX', cardWidth / 2, 8, { align: 'center' });
  
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Innovate. Build. Elevate.', cardWidth / 2, 12, { align: 'center' });

  // Middle Section - Profile Photo Area
  const photoX = cardWidth / 2;
  const photoY = 22;
  const photoRadius = 8;
  
  // Glowing ring effect
  pdf.setFillColor(0, 191, 255, 0.3);
  pdf.circle(photoX, photoY, photoRadius + 2, 'F');
  pdf.setFillColor(0, 191, 255, 0.2);
  pdf.circle(photoX, photoY, photoRadius + 1, 'F');
  pdf.setFillColor(0, 191, 255, 0.1);
  pdf.circle(photoX, photoY, photoRadius, 'F');
  
  // Profile photo or initials
  if (profilePhotoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = photoRadius * 2 * 3.779527559; // Convert mm to pixels
          canvas.height = photoRadius * 2 * 3.779527559;
          
          // Create circular clipping
          ctx?.beginPath();
          ctx?.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI);
          ctx?.clip();
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          pdf.addImage(dataUrl, 'JPEG', photoX - photoRadius, photoY - photoRadius, photoRadius * 2, photoRadius * 2);
          resolve(true);
        };
        img.onerror = reject;
        img.src = profilePhotoUrl;
      });
    } catch (error) {
      console.warn('Could not load profile photo, using initials');
      // Fallback to initials
      pdf.setFillColor(255, 255, 255);
      pdf.circle(photoX, photoY, photoRadius - 0.5, 'F');
      
      pdf.setTextColor(11, 28, 72);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      const initials = user.name.split(' ').map(n => n[0]).join('');
      pdf.text(initials, photoX, photoY + 1, { align: 'center' });
    }
  } else {
    // Use initials as fallback
    pdf.setFillColor(255, 255, 255);
    pdf.circle(photoX, photoY, photoRadius - 0.5, 'F');
    
    pdf.setTextColor(11, 28, 72);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const initials = user.name.split(' ').map(n => n[0]).join('');
    pdf.text(initials, photoX, photoY + 1, { align: 'center' });
  }

  // Name below photo
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(user.name.toUpperCase(), photoX, photoY + 12, { align: 'center' });

  // Role in Sky Blue
  pdf.setTextColor(0, 191, 255);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text(user.role.toUpperCase(), photoX, photoY + 16, { align: 'center' });

  // ID Code
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`ID: ${user.idCode}`, photoX, photoY + 20, { align: 'center' });

  // Bottom Section - QR Code and company info
  pdf.setTextColor(200, 200, 200);
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Astraronix Solutions', cardWidth / 2, cardHeight - 8, { align: 'center' });
  
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(4);
  pdf.text('Internal Use Only', cardWidth / 2, cardHeight - 4, { align: 'center' });

  // QR Code
  if (qrCodeData) {
    try {
      // Generate QR code using a QR code library (you'd need to install qrcode-generator)
      // For now, we'll use a placeholder
      pdf.setFillColor(255, 255, 255);
      pdf.rect(cardWidth - 12, cardHeight - 12, 8, 8, 'F');
      pdf.setTextColor(11, 28, 72);
      pdf.setFontSize(3);
      pdf.text('QR', cardWidth - 8, cardHeight - 6, { align: 'center' });
    } catch (error) {
      console.warn('Could not generate QR code');
    }
  } else {
    // QR Code placeholder
    pdf.setFillColor(255, 255, 255);
    pdf.rect(cardWidth - 12, cardHeight - 12, 8, 8, 'F');
    pdf.setTextColor(11, 28, 72);
    pdf.setFontSize(3);
    pdf.text('QR', cardWidth - 8, cardHeight - 6, { align: 'center' });
  }

  // Add new page for back layout
  pdf.addPage();

  // === BACK LAYOUT ===
  
  // Deep Navy background
  pdf.setFillColor(11, 28, 72);
  pdf.rect(0, 0, cardWidth, cardHeight, 'F');

  // Sky Blue gradient overlay
  pdf.setFillColor(0, 191, 255, 0.1);
  pdf.rect(0, 0, cardWidth, cardHeight, 'F');

  // Top Section - Company Contact Info
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('COMPANY CONTACT', cardWidth / 2, 8, { align: 'center' });

  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Email: astraronixsolutions@gmail.com', cardWidth / 2, 12, { align: 'center' });
  pdf.text('Website: https://astraronix.vercel.app', cardWidth / 2, 16, { align: 'center' });

  // Middle Section - Emergency/Verification Statement
  pdf.setTextColor(0, 191, 255);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('VERIFICATION', cardWidth / 2, 24, { align: 'center' });

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('If found, please return to', cardWidth / 2, 28, { align: 'center' });
  pdf.text('Astraronix Solutions HQ', cardWidth / 2, 31, { align: 'center' });
  pdf.text('or contact support.', cardWidth / 2, 34, { align: 'center' });

  // Bottom Section - Signature area and barcode
  pdf.setTextColor(200, 200, 200);
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Authorized Signature:', 8, cardHeight - 12);
  
  // Signature line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(8, cardHeight - 10, 25, cardHeight - 10);

  // Add signature if available
  if (signatureUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/png', 0.8);
          pdf.addImage(dataUrl, 'PNG', 8, cardHeight - 12, 15, 6);
          resolve(true);
        };
        img.onerror = reject;
        img.src = signatureUrl;
      });
    } catch (error) {
      console.warn('Could not load signature');
    }
  }

  // Barcode placeholder
  pdf.setFillColor(255, 255, 255);
  pdf.rect(cardWidth - 20, cardHeight - 12, 15, 8, 'F');
  pdf.setTextColor(11, 28, 72);
  pdf.setFontSize(3);
  pdf.text('BARCODE', cardWidth - 12.5, cardHeight - 6, { align: 'center' });

  // Footer
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(4);
  pdf.text('Astraronix Solutions • Nairobi, Kenya', cardWidth / 2, cardHeight - 2, { align: 'center' });

  // Save the PDF
  pdf.save(`${user.name.replace(' ', '_')}_ID_Card_Modern.pdf`);
};

// Enhanced version with QR code generation
export const generateIDCardWithQR = async (data: IDCardData): Promise<void> => {
  // Generate QR code data URL
  const qrData = `https://astraronix.vercel.app/verify/${data.user.idCode}`;
  
  // For now, we'll use the basic version
  // In a real implementation, you'd use a QR code library like 'qrcode-generator'
  await generateModernIDCard({
    ...data,
    qrCodeData: qrData
  });
};
