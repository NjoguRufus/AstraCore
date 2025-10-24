import jsPDF from 'jspdf';
import { User } from '../types';

// Modern luxury + tech hybrid ID card design
export const generateIDCard = (user: User): void => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85, 54] // Credit card size
  });

  const cardWidth = 85;
  const cardHeight = 54;

  // === FRONT LAYOUT ===
  
  // Deep Navy background (#0B1C48)
  pdf.setFillColor(11, 28, 72); // Deep Navy
  pdf.rect(0, 0, cardWidth, cardHeight, 'F');

  // Sky Blue gradient overlay for luxury effect
  pdf.setFillColor(0, 191, 255, 0.1); // Sky Blue with transparency
  pdf.rect(0, 0, cardWidth, cardHeight, 'F');

  // Top Section - Logo and Subtext
  pdf.setTextColor(255, 255, 255); // White text
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ASTRARONIX', cardWidth / 2, 8, { align: 'center' });
  
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Innovate. Build. Elevate.', cardWidth / 2, 12, { align: 'center' });

  // Middle Section - Profile Photo Area (circular with glowing ring)
  const photoX = cardWidth / 2;
  const photoY = 22;
  const photoRadius = 8;
  
  // Glowing ring effect (multiple circles with decreasing opacity)
  pdf.setFillColor(0, 191, 255, 0.3); // Sky Blue glow
  pdf.circle(photoX, photoY, photoRadius + 2, 'F');
  pdf.setFillColor(0, 191, 255, 0.2);
  pdf.circle(photoX, photoY, photoRadius + 1, 'F');
  pdf.setFillColor(0, 191, 255, 0.1);
  pdf.circle(photoX, photoY, photoRadius, 'F');
  
  // Profile photo placeholder (white circle)
  pdf.setFillColor(255, 255, 255);
  pdf.circle(photoX, photoY, photoRadius - 0.5, 'F');
  
  // Photo initials or placeholder
  pdf.setTextColor(11, 28, 72); // Deep Navy text
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  const initials = user.name.split(' ').map(n => n[0]).join('');
  pdf.text(initials, photoX, photoY + 1, { align: 'center' });

  // Name below photo
  pdf.setTextColor(255, 255, 255); // White text
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(user.name.toUpperCase(), photoX, photoY + 12, { align: 'center' });

  // Role in Sky Blue
  pdf.setTextColor(0, 191, 255); // Sky Blue
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text(user.role.toUpperCase(), photoX, photoY + 16, { align: 'center' });

  // ID Code
  pdf.setTextColor(255, 255, 255); // White text
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`ID: ${user.idCode}`, photoX, photoY + 20, { align: 'center' });

  // Bottom Section - QR Code placeholder and company info
  pdf.setTextColor(200, 200, 200); // Silver text
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Astraronix Solutions', cardWidth / 2, cardHeight - 8, { align: 'center' });
  
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(4);
  pdf.text('Internal Use Only', cardWidth / 2, cardHeight - 4, { align: 'center' });

  // QR Code placeholder (small square)
  pdf.setFillColor(255, 255, 255);
  pdf.rect(cardWidth - 12, cardHeight - 12, 8, 8, 'F');
  pdf.setTextColor(11, 28, 72);
  pdf.setFontSize(3);
  pdf.text('QR', cardWidth - 8, cardHeight - 6, { align: 'center' });

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
  pdf.setTextColor(0, 191, 255); // Sky Blue
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
  pdf.setTextColor(200, 200, 200); // Silver text
  pdf.setFontSize(5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Authorized Signature:', 8, cardHeight - 12);
  
  // Signature line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(8, cardHeight - 10, 25, cardHeight - 10);

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

export const generateContract = (user: User, signatureDataURL?: string): jsPDF => {
  const pdf = new jsPDF();
  
  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ASTRACORE', 105, 30, { align: 'center' });
  pdf.text('EMPLOYMENT AGREEMENT', 105, 45, { align: 'center' });
  
  // Content
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  const content = [
    `This Employment Agreement is entered into between Astracore and ${user.name}.`,
    '',
    'EMPLOYEE INFORMATION:',
    `Name: ${user.name}`,
    `ID Code: ${user.idCode}`,
    `Role: ${user.role}`,
    `Team: ${user.team}`,
    `Email: ${user.email}`,
    '',
    'TERMS AND CONDITIONS:',
    '1. The employee agrees to perform duties assigned to their role with professionalism and dedication.',
    '2. The employee will maintain confidentiality of all company information and trade secrets.',
    '3. The employee will comply with all company policies and procedures.',
    '4. This agreement is effective immediately upon signing.',
    '',
    'By signing below, both parties agree to the terms outlined in this agreement.',
    '',
    `Date: ${new Date().toLocaleDateString()}`,
  ];
  
  let yPosition = 60;
  content.forEach(line => {
    if (line === '') {
      yPosition += 5;
    } else if (line.includes(':') && !line.includes('EMPLOYEE') && !line.includes('TERMS')) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(line, 20, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition += 7;
    } else {
      pdf.text(line, 20, yPosition);
      yPosition += 7;
    }
  });
  
  // Signature area
  yPosition += 20;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Employee Signature:', 20, yPosition);
  
  if (signatureDataURL) {
    try {
      pdf.addImage(signatureDataURL, 'PNG', 20, yPosition + 5, 60, 20);
    } catch (error) {
      console.error('Error adding signature to PDF:', error);
    }
  }
  
  return pdf;
};