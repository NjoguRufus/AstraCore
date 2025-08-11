// src/utils/contractPDF.ts
// This file contains two approaches for generating contract PDFs:
// 1. generateContractPDF: Uses jsPDF to create PDFs with manual styling
// 2. generateContractPDFFromScreenshot: Takes a screenshot of the HTML and converts it to PDF
//    This provides better visual fidelity as it captures exactly what the HTML looks like
import jsPDF from 'jspdf';
import { Contract } from '../types';

interface ContractData {
  name: string;
  role: string;
  email: string;
  idCode: string;
  date: string;
  contractId: string;
  signatureImage: string; // data URL
  selfieImage: string; // data URL
}

export async function generateContractPDF(data: ContractData): Promise<void>;
export async function generateContractPDF(contract: Contract): Promise<void>;
export async function generateContractPDF(data: ContractData | Contract): Promise<void> {
  // Helper function to safely convert Firestore timestamps
  const convertTimestamp = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    return null;
  };

  // Convert Contract to ContractData if needed
  let contractData: ContractData;
  
  if ('signatureImage' in data && 'selfieImage' in data) {
    // It's already ContractData
    contractData = data as ContractData;
  } else {
    // It's Contract, convert to ContractData
    const contract = data as Contract;
    const createdAtDate = convertTimestamp(contract.createdAt) || new Date();
    contractData = {
      name: contract.memberName,
      role: contract.memberRole,
      email: contract.memberEmail,
      idCode: contract.idCode,
      date: createdAtDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      contractId: contract.id,
      signatureImage: contract.memberSignatureUrl || '',
      selfieImage: contract.selfieImageUrl || ''
    };
  }

  // Create new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'A4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 25;
  let yPosition = 40;

  // Add background image to cover entire page
  try {
    const backgroundImg = new Image();
    backgroundImg.crossOrigin = 'anonymous';
    
    // Convert the image to base64 for PDF embedding
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Load and process the background image
    await new Promise((resolve, reject) => {
      backgroundImg.onload = () => {
        canvas.width = backgroundImg.width;
        canvas.height = backgroundImg.height;
        ctx?.drawImage(backgroundImg, 0, 0);
        resolve(true);
      };
      backgroundImg.onerror = reject;
      backgroundImg.src = '/images/contract.jpg';
    });
    
    const backgroundDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Add background image to cover entire page
    pdf.addImage(backgroundDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
    
    // Add semi-transparent white overlay for better text readability
    pdf.setFillColor(255, 255, 255, 0.9);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Set text color for header (white text on background)
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ASTRARONIX SOLUTIONS - TEAM MEMBER CONTRACT', pageWidth / 2, yPosition, { align: 'center' });
    
    // Reset text color for body text
    pdf.setTextColor(0, 0, 0);
    yPosition += 20;
  } catch (error) {
    console.warn('Could not load background image, continuing without it');
    // Set text color for header (dark text on white background)
    pdf.setTextColor(0, 51, 102);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ASTRARONIX SOLUTIONS - TEAM MEMBER CONTRACT', pageWidth / 2, yPosition, { align: 'center' });
    
    // Reset text color for body text
    pdf.setTextColor(0, 0, 0);
    yPosition += 20;
  }

  // Helper functions for text styling
  const setHeaderStyle = () => {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 51, 102);
  };

  const setSubHeaderStyle = () => {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 51, 102);
  };

  const setBodyStyle = () => {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
  };

  const setMetaStyle = () => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102);
  };

  // Contract content
  setBodyStyle();
  pdf.text(`This contract is made effective as of ${contractData.date} by and between:`, margin, yPosition);
  yPosition += 15;

  setHeaderStyle();
  pdf.text('Company Information', margin, yPosition);
  yPosition += 10;

  setBodyStyle();
  pdf.text('Name: Astraronix Solutions', margin, yPosition);
  yPosition += 8;
  pdf.text('Address: Online', margin, yPosition);
  yPosition += 8;
  pdf.text('Contact: +254714748299', margin, yPosition);
  yPosition += 15;

  setHeaderStyle();
  pdf.text('Team Member Information', margin, yPosition);
  yPosition += 10;

  setBodyStyle();
  pdf.text(`Name: ${contractData.name}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Role: ${contractData.role}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Email: ${contractData.email}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`ID Code: ${contractData.idCode}`, margin, yPosition);
  yPosition += 15;

  setHeaderStyle();
  pdf.text('Terms & Conditions', margin, yPosition);
  yPosition += 10;

  setBodyStyle();
  const terms = [
    'The team member agrees to perform assigned duties with diligence and integrity.',
    'Astraronix Solutions will provide necessary tools, resources, and agreed-upon compensation.',
    'Both parties must maintain confidentiality of all proprietary information.',
    'Either party may terminate this agreement with written notice, subject to any additional terms agreed upon.',
    'The team member will adhere to company policies and procedures.',
    'Intellectual property created during employment belongs to Astraronix Solutions.',
    'This contract is governed by applicable employment laws.'
  ];

  terms.forEach((term, index) => {
    const text = `${index + 1}. ${term}`;
    const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * 6;
  });

  yPosition += 10;

  // Signatures section
  setHeaderStyle();
  pdf.text('Signatures', margin, yPosition);
  yPosition += 15;

  // Member Signature
  if (contractData.signatureImage) {
    try {
      const signatureImg = new Image();
      signatureImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        signatureImg.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = signatureImg.width;
          canvas.height = signatureImg.height;
          ctx?.drawImage(signatureImg, 0, 0);
          
          const signatureDataUrl = canvas.toDataURL('image/png', 0.8);
          const imgWidth = 40;
          const imgHeight = 20;
          
          pdf.addImage(signatureDataUrl, 'PNG', margin, yPosition, imgWidth, imgHeight);
          resolve(true);
        };
        signatureImg.onerror = reject;
        signatureImg.src = contractData.signatureImage;
      });
      
      yPosition += 25;
    } catch (error) {
      console.warn('Could not load signature image');
      setBodyStyle();
      pdf.text('Member Signature: [Signature Image]', margin, yPosition);
      yPosition += 15;
    }
  } else {
    setBodyStyle();
    pdf.text('Member Signature: [Signature Image]', margin, yPosition);
    yPosition += 15;
  }

  // Selfie Image
  if (contractData.selfieImage) {
    try {
      const selfieImg = new Image();
      selfieImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        selfieImg.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = selfieImg.width;
          canvas.height = selfieImg.height;
          ctx?.drawImage(selfieImg, 0, 0);
          
          const selfieDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const imgWidth = 60; // Increased from 40 to 60 (1.5x bigger)
          const imgHeight = 45; // Increased from 30 to 45 (1.5x bigger)
          
          // Push half an inch to the right (12.7mm ≈ 0.5 inch)
          const rightMargin = margin + 12.7;
          pdf.addImage(selfieDataUrl, 'JPEG', pageWidth - rightMargin - imgWidth, yPosition - 25, imgWidth, imgHeight);
          resolve(true);
        };
        selfieImg.onerror = reject;
        selfieImg.src = contractData.selfieImage;
      });
    } catch (error) {
      console.warn('Could not load selfie image');
    }
  }

  // Meta information
  yPosition += 20;
  setMetaStyle();
  pdf.text(`Contract Date: ${contractData.date}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Contract ID: ${contractData.contractId}`, margin, yPosition);
  yPosition += 8;
  pdf.text('Status: ACTIVE', margin, yPosition);
  yPosition += 8;
  pdf.text('Version: 1.0', margin, yPosition);

  // Footer
  yPosition = pageHeight - 20;
  setMetaStyle();
  pdf.text('© Astraronix Solutions — All Rights Reserved', pageWidth / 2, yPosition, { align: 'center' });

  // Save the PDF
  pdf.save(`contract_${contractData.idCode}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function generateContractHTML(contract: Contract): string {
  // Helper function to safely format dates
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'Not specified';
    
    try {
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } else if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        // Firestore Timestamp
        return dateValue.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        // String or timestamp number
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
      }
      return 'Invalid date';
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Generate HTML content for viewing in browser
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Astraronix Solutions - Team Member Contract</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .page {
            width: 210mm;
            min-height: 297mm;
            margin: auto;
            background: white url('/images/contract.jpg') no-repeat top center;
            background-size: cover;
            position: relative;
            padding: 40mm 25mm 20mm 25mm;
            box-sizing: border-box;
        }
        h1, h2 {
            color: #003366;
            margin-bottom: 5px;
        }
        h1 {
            font-size: 22px;
            text-align: center;
            text-transform: uppercase;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
        }
        h2 {
            font-size: 16px;
            border-bottom: 2px solid #003366;
            padding-bottom: 3px;
            margin-top: 20px;
        }
        p, li {
            font-size: 14px;
            line-height: 1.5;
            margin: 4px 0;
        }
        ol {
            padding-left: 18px;
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
        }
        .signature-block {
            width: 45%;
            text-align: center;
        }
        .signature-block img {
            max-width: 100%;
            height: auto;
            margin-top: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .selfie-image {
            width: 150px !important;
            height: 150px !important;
            border-radius: 50% !important;
            object-fit: cover !important;
            border: 3px solid #3b82f6 !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            margin-left: 12.7mm !important; /* Push half an inch to the right (12.7mm ≈ 0.5 inch) */
        }
        .meta {
            margin-top: 15px;
            font-size: 14px;
        }
        .footer {
            position: absolute;
            bottom: 15mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .letterhead-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 40mm;
            background: rgba(255, 255, 255, 0.1);
            pointer-events: none;
        }
    </style>
</head>
<body>
<div class="page">
    <div class="letterhead-overlay"></div>
    <h1>Astraronix Solutions - Team Member Contract</h1>
    <p>This contract is made effective as of <strong>${formatDate(contract.createdAt)}</strong> by and between:</p>

    <h2>Company Information</h2>
    <p><strong>Name:</strong> Astraronix Solutions</p>
    <p><strong>Address:</strong> Online</p>
    <p><strong>Contact:</strong> +254714748299</p>

    <h2>Team Member Information</h2>
    <p><strong>Name:</strong> ${contract.memberName}</p>
    <p><strong>Role:</strong> ${contract.memberRole}</p>
    <p><strong>Email:</strong> ${contract.memberEmail}</p>
    <p><strong>ID Code:</strong> ${contract.idCode}</p>

    <h2>Terms & Conditions</h2>
    <ol>
        <li>The team member agrees to perform assigned duties with diligence and integrity.</li>
        <li>Astraronix Solutions will provide necessary tools, resources, and agreed-upon compensation.</li>
        <li>Both parties must maintain confidentiality of all proprietary information.</li>
        <li>Either party may terminate this agreement with written notice, subject to any additional terms agreed upon.</li>
        <li>The team member will adhere to company policies and procedures.</li>
        <li>Intellectual property created during employment belongs to Astraronix Solutions.</li>
        <li>This contract is governed by applicable employment laws.</li>
    </ol>

    <div class="signatures">
        <div class="signature-block">
            <p><strong>Member Signature:</strong></p>
            ${contract.memberSignatureUrl ? `<img src="${contract.memberSignatureUrl}" alt="Member Signature">` : '<p>[Signature Image]</p>'}
        </div>
        <div class="signature-block">
            <p><strong>Selfie Verification:</strong></p>
            ${contract.selfieImageUrl ? `<img src="${contract.selfieImageUrl}" alt="Member Selfie" class="selfie-image">` : '<p>[Selfie Image]</p>'}
        </div>
    </div>

    <div class="meta">
        <p><strong>Contract Date:</strong> ${formatDate(contract.createdAt)}</p>
        <p><strong>Contract ID:</strong> ${contract.id}</p>
        <p><strong>Status:</strong> ${contract.status?.toUpperCase() || 'PENDING'}</p>
        <p><strong>Version:</strong> ${contract.contractVersion || '1.0'}</p>
    </div>

    <div class="footer">
        © Astraronix Solutions — All Rights Reserved
    </div>
</div>
</body>
</html>
  `;

  return html;
}

        // New function: Generate PDF by taking screenshot of HTML
        export async function generateContractPDFFromScreenshot(contract: Contract): Promise<void> {
          try {
            // Show loading toast
            const { toast } = await import('react-hot-toast');
            toast.loading('Generating PDF from HTML...');
            
            // Generate the HTML content
            const htmlContent = generateContractHTML(contract);
            
            // Create a temporary container with proper sizing
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.style.width = '210mm';
            tempContainer.style.minHeight = '297mm';
            tempContainer.style.overflow = 'visible';
            tempContainer.innerHTML = htmlContent;
            
            // Add to DOM temporarily
            document.body.appendChild(tempContainer);
            
            // Wait for images to load with timeout for faster processing
            const images = tempContainer.querySelectorAll('img');
            if (images.length > 0) {
              await Promise.race([
                Promise.all(Array.from(images).map(img => {
                  return new Promise((resolve) => {
                    if (img.complete) {
                      resolve(true);
                    } else {
                      img.onload = () => resolve(true);
                      img.onerror = () => resolve(true);
                    }
                  });
                })),
                new Promise(resolve => setTimeout(resolve, 2000)) // 2 second timeout
              ]);
            }
            
            // Import html2canvas dynamically
            const html2canvas = (await import('html2canvas')).default;
            
            // Get the actual content dimensions
            const containerRect = tempContainer.getBoundingClientRect();
            const contentHeight = tempContainer.scrollHeight;
            const contentWidth = tempContainer.scrollWidth;
            
            // Take screenshot with optimized settings
            const canvas = await html2canvas(tempContainer, {
              width: contentWidth,
              height: contentHeight,
              scale: 1.5, // Reduced scale for faster processing, still good quality
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              logging: false,
              removeContainer: true, // Automatically remove container
              foreignObjectRendering: false, // Faster rendering
              imageTimeout: 5000, // 5 second timeout for images
              onclone: (clonedDoc) => {
                // Ensure the cloned document has proper dimensions
                const clonedContainer = clonedDoc.body.firstChild as HTMLElement;
                if (clonedContainer) {
                  clonedContainer.style.width = '100%';
                  clonedContainer.style.height = 'auto';
                  clonedContainer.style.minHeight = '297mm';
                }
              }
            });
            
            // Remove temporary container
            document.body.removeChild(tempContainer);
            
            // Convert canvas to PDF with proper scaling
            const imgData = canvas.toDataURL('image/jpeg', 0.9); // JPEG for smaller size, 0.9 quality
            
            // Calculate PDF dimensions to fit the content
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'A4'
            });
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Ensure full content capture - use full dimensions without scaling down
            const finalWidth = pageWidth;
            const finalHeight = (pageWidth * canvas.height) / canvas.width;
            
            // Always start from top-left corner to capture full content
            const xOffset = 0;
            const yOffset = 0;
            
            // Add the screenshot to PDF at full size
            pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
            
            // Save the PDF
            pdf.save(`contract_${contract.idCode}_${new Date().toISOString().split('T')[0]}.pdf`);
            
            // Success toast
            toast.success('PDF generated successfully!');
            
          } catch (error) {
            console.error('Error generating PDF from screenshot:', error);
            
            // Show error toast
            try {
              const { toast } = await import('react-hot-toast');
              toast.error('Screenshot method failed, trying fallback...');
            } catch (toastError) {
              console.error('Could not show toast:', toastError);
            }
            
            // Fallback to the original PDF generation method
            try {
              await generateContractPDF(contract);
            } catch (fallbackError) {
              console.error('Fallback PDF generation also failed:', fallbackError);
              throw new Error('Both PDF generation methods failed');
            }
          }
        }
