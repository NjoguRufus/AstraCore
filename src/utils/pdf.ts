import jsPDF from 'jspdf';
import { User } from '../types';

export const generateIDCard = (user: User): void => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85, 54] // Credit card size
  });

  // Background
  pdf.setFillColor(37, 99, 235); // Blue background
  pdf.rect(0, 0, 85, 54, 'F');

  // White content area
  pdf.setFillColor(255, 255, 255);
  pdf.rect(5, 5, 75, 44, 'F');

  // Company name
  pdf.setTextColor(37, 99, 235);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ASTRACORE', 42.5, 15, { align: 'center' });

  // Employee name
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(user.name, 42.5, 25, { align: 'center' });

  // Role and ID
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${user.role.toUpperCase()} • ID: ${user.employeeID}`, 42.5, 32, { align: 'center' });

  // Team
  pdf.text(user.team.toUpperCase(), 42.5, 38, { align: 'center' });

  // Footer
  pdf.setFontSize(6);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Internal Use Only', 42.5, 45, { align: 'center' });

  pdf.save(`${user.name.replace(' ', '_')}_ID_Card.pdf`);
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
    `Employee ID: ${user.employeeID}`,
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