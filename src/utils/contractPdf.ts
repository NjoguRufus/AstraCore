import jsPDF from 'jspdf';
import { Contract } from '../types';
import { getRoleDisplayName } from './roleMapping';

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
      role: getRoleDisplayName(contract.memberRole), // Convert role code to display name
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
    
    console.log('🔍 Contract PDF generation - Role conversion:', {
      originalRole: contract.memberRole,
      convertedRole: getRoleDisplayName(contract.memberRole),
      finalRole: contractData.role
    });
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
  pdf.text('Address: Nairobi, Kenya, Remote', margin, yPosition);
  yPosition += 8;
  pdf.text('Contact: +254 714 748 299', margin, yPosition);
  yPosition += 8;
  pdf.text('Email: astraronixsolutions@gmail.com', margin, yPosition);
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
    'Each team member agrees to perform their duties responsibly, honestly, and with respect toward the company and clients.',
    'Astraronix Solutions will provide clear guidance, access to needed tools, and agreed compensation for completed work or closed deals.',
    'Both Astraronix and the team member agree to protect all company and client information from unauthorized sharing.',
    'Since Astraronix is a , growing company, either party can end this working arrangement at any time with simple written notice. No penalties apply — just transparency and respect.',
    'Team members are expected to follow Astraronix\'s communication standards and maintain professionalism in all client interactions.',
    'Work created for Astraronix (designs, proposals, content, or code) remains property of Astraronix, but creators may showcase it in their personal portfolios with permission.',
    'This agreement is guided by general Kenyan labor principles, but built on trust and collaboration — not strict legal enforcement.'
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

  // Generate HTML content for viewing in browser with EXACT styling from member dashboard
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
            margin: 0;
            background: white url('/images/contract.jpg') no-repeat top center;
            background-size: cover;
            position: relative;
            padding: 40mm 25mm 20mm 25mm;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
        h1 {
            color: white;
            font-size: 22px;
            text-align: center;
            text-transform: uppercase;
            margin-bottom: 20px;
            margin-top: 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
            font-weight: bold;
        }
        h2 {
            color: #003366;
            font-size: 16px;
            border-bottom: 2px solid #003366;
            padding-bottom: 3px;
            margin-top: 20px;
            margin-bottom: 5px;
            font-weight: bold;
        }
        p {
            font-size: 14px;
            line-height: 1.5;
            margin: 4px 0;
            color: #000;
        }
        ol {
            padding-left: 18px;
            margin: 10px 0;
            counter-reset: item;
            list-style: none;
        }
        ol li {
            font-size: 14px;
            line-height: 1.5;
            margin: 4px 0;
            color: #000;
            counter-increment: item;
            position: relative;
        }
        ol li::before {
            content: counter(item) ". ";
            font-weight: bold;
            color: #003366;
            position: absolute;
            left: -18px;
            top: 0;
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
            gap: 20px;
        }
        .signature-block {
            width: 45%;
            text-align: center;
        }
        .signature-block p {
            margin-bottom: 10px;
            font-weight: bold;
            color: #003366;
        }
        .signature-block img {
            max-width: 100%;
            height: auto;
            margin-top: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .signature-block .selfie-image {
            width: 150px !important;
            height: 150px !important;
            border-radius: 50% !important;
            object-fit: cover !important;
            border: 3px solid #3b82f6 !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            margin-left: 12.7mm !important;
        }
        .meta {
            margin-top: 15px;
            font-size: 14px;
            color: #000;
        }
        .meta p {
            margin: 4px 0;
            color: #000;
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
    <p><strong>Address:</strong> Nairobi, Kenya, Remote</p>
    <p><strong>Contact:</strong> +254 714 748 299</p>
    <p><strong>Email:</strong> astraronixsolutions@gmail.com</p>

    <h2>Team Member Information</h2>
    <p><strong>Name:</strong> ${contract.memberName}</p>
    <p><strong>Role:</strong> ${getRoleDisplayName(contract.memberRole)}</p>
    <p><strong>Email:</strong> ${contract.memberEmail}</p>
    <p><strong>ID Code:</strong> ${contract.idCode}</p>

    <h2>Terms & Conditions</h2>
    <ol>
        <li>Each team member agrees to perform their duties responsibly, honestly, and with respect toward the company and clients.</li>
        <li>Astraronix Solutions will provide clear guidance, access to needed tools, and agreed compensation for completed work or closed deals.</li>
        <li>Both Astraronix and the team member agree to protect all company and client information from unauthorized sharing.</li>
        <li>Since Astraronix is a , growing company, either party can end this working arrangement at any time with simple written notice. No penalties apply — just transparency and respect.</li>
        <li>Team members are expected to follow Astraronix's communication standards and maintain professionalism in all client interactions.</li>
        <li>Work created for Astraronix (designs, proposals, content, or code) remains property of Astraronix, but creators may showcase it in their personal portfolios with permission.</li>
        <li>This agreement is guided by general Kenyan labor principles, but built on trust and collaboration — not strict legal enforcement.</li>
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

        // New function: Generate PDF by taking screenshot of HTML with EXACT visual replication
        export async function generateContractPDFFromScreenshot(contract: Contract): Promise<void> {
          try {
            // Show loading toast
            const { toast } = await import('react-hot-toast');
            toast.loading('Generating PDF from HTML...');
            
            // Generate the HTML content with exact styling
            const htmlContent = generateContractHTML(contract);
            
            // Create a temporary container with proper sizing and styling
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.style.width = '210mm';
            tempContainer.style.minHeight = '297mm';
            tempContainer.style.overflow = 'visible';
            tempContainer.style.backgroundColor = '#ffffff';
            tempContainer.innerHTML = htmlContent;
            
            // Add to DOM temporarily
            document.body.appendChild(tempContainer);
            
            // Wait for images to load and styles to be applied
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
                new Promise(resolve => setTimeout(resolve, 3000)) // 3 second timeout for better image loading
              ]);
            }
            
            // Additional wait for styles to be fully applied
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Import html2canvas dynamically
            const html2canvas = (await import('html2canvas')).default;
            
            // Take screenshot with high-quality settings for exact replication
            const canvas = await html2canvas(tempContainer, {
              width: 210 * 3.779527559, // Convert mm to pixels (210mm * 3.779527559 = ~794px)
              height: 297 * 3.779527559, // Convert mm to pixels (297mm * 3.779527559 = ~1123px)
              scale: 2, // Higher scale for better quality
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              logging: false,
              removeContainer: true,
              foreignObjectRendering: false,
              imageTimeout: 10000, // 10 second timeout for images
              onclone: (clonedDoc) => {
                // Ensure the cloned document maintains exact styling
                const clonedContainer = clonedDoc.body.firstChild as HTMLElement;
                if (clonedContainer) {
                  clonedContainer.style.width = '210mm';
                  clonedContainer.style.minHeight = '297mm';
                  clonedContainer.style.margin = '0';
                  clonedContainer.style.padding = '0';
                }
              }
            });
            
            // Remove temporary container
            document.body.removeChild(tempContainer);
            
            // Convert canvas to PDF with exact dimensions
            const imgData = canvas.toDataURL('image/jpeg', 1.0); // Maximum quality for exact replication
            
            // Create PDF with exact A4 dimensions
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'A4'
            });
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Add the screenshot to PDF at exact A4 size
            pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
            
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
