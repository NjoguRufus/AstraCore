import React, { useState, useRef, useEffect } from "react";
import { Button } from "../UI/Button";
import { Card } from "../UI/Card";
import { FileText, Download, CheckCircle, ArrowLeft, ArrowRight, Camera, RotateCcw, AlertCircle, X } from "lucide-react";
import { uploadSignatureToCloudinary } from "../../config/cloudinary";
import { toast } from "react-hot-toast";

interface ContractSigningProps {
  onNext: () => void;
  onBack: () => void;
  memberData: {
    name: string;
    email: string;
    role: string;
    idCode: string;
  };
}

export const ContractSigning: React.FC<ContractSigningProps> = ({
  onNext,
  onBack,
  memberData
}) => {
  const [memberSignature, setMemberSignature] = useState<string>("");
  const [selfieImage, setSelfieImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'member' | 'selfie'>('member');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const memberCanvasRef = useRef<HTMLCanvasElement>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const memberCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const modalCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (memberCanvasRef.current) {
      const canvas = memberCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        memberCtxRef.current = ctx;
      }
    }
  }, []);

  // Initialize modal canvas context when modal opens
  useEffect(() => {
    if (showSignatureModal && modalCanvasRef.current) {
      const canvas = modalCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        modalCtxRef.current = ctx;
      }
    }
  }, [showSignatureModal]);

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const ctx = memberCtxRef.current;
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const moveX = moveEvent.clientX - rect.left;
      const moveY = moveEvent.clientY - rect.top;
      ctx.lineTo(moveX, moveY);
      ctx.stroke();
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const clearSignature = () => {
    const canvas = memberCanvasRef.current;
    const ctx = memberCtxRef.current;

    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
        setMemberSignature("");
    }
  };

  const clearModalSignature = () => {
    const canvas = modalCanvasRef.current;
    const ctx = modalCtxRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Touch support for mobile signature drawing
  const startTouchDrawing = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = e.currentTarget;
    const ctx = memberCtxRef.current;
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      // Prevent the page from scrolling while drawing
      moveEvent.preventDefault();
      const currentCanvas = memberCanvasRef.current;
      const currentCtx = memberCtxRef.current;
      if (!currentCanvas || !currentCtx) return;

      const moveRect = currentCanvas.getBoundingClientRect();
      const moveTouch = moveEvent.touches[0];
      if (!moveTouch) return;
      const moveX = moveTouch.clientX - moveRect.left;
      const moveY = moveTouch.clientY - moveRect.top;
      currentCtx.lineTo(moveX, moveY);
      currentCtx.stroke();
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove as EventListener);
      document.removeEventListener('touchend', handleTouchEnd as EventListener);
      document.removeEventListener('touchcancel', handleTouchEnd as EventListener);
    };

    // Use non-passive listener so preventDefault works
    document.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false } as AddEventListenerOptions);
    document.addEventListener('touchend', handleTouchEnd as EventListener);
    document.addEventListener('touchcancel', handleTouchEnd as EventListener);
  };

  // Modal touch support for signature drawing
  const startModalTouchDrawing = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = e.currentTarget;
    const ctx = modalCtxRef.current;
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
      const currentCanvas = modalCanvasRef.current;
      const currentCtx = modalCtxRef.current;
      if (!currentCanvas || !currentCtx) return;
      const moveRect = currentCanvas.getBoundingClientRect();
      const moveTouch = moveEvent.touches[0];
      if (!moveTouch) return;
      const moveX = moveTouch.clientX - moveRect.left;
      const moveY = moveTouch.clientY - moveRect.top;
      currentCtx.lineTo(moveX, moveY);
      currentCtx.stroke();
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove as EventListener);
      document.removeEventListener('touchend', handleTouchEnd as EventListener);
      document.removeEventListener('touchcancel', handleTouchEnd as EventListener);
    };

    document.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false } as AddEventListenerOptions);
    document.addEventListener('touchend', handleTouchEnd as EventListener);
    document.addEventListener('touchcancel', handleTouchEnd as EventListener);
  };

  const startModalMouseDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const ctx = modalCtxRef.current;
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const moveX = moveEvent.clientX - rect.left;
      const moveY = moveEvent.clientY - rect.top;
      ctx.lineTo(moveX, moveY);
      ctx.stroke();
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const saveModalSignature = () => {
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (dataUrl && validateSignature(dataUrl)) {
      setMemberSignature(dataUrl);
      toast.success('Signature captured!');
      setShowSignatureModal(false);
    } else {
      toast.error('Please provide a valid signature.');
    }
  };

  const captureSignature = (): string => {
    const canvas = memberCanvasRef.current;
    if (!canvas) {
      console.error('Canvas not found for member signature');
      return "";
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      console.log('Signature captured:', {
        dataUrlLength: dataUrl.length,
        dataUrlStartsWith: dataUrl.substring(0, 50) + '...',
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      });
      
      if (!dataUrl || dataUrl === 'data:,') {
        console.error('Empty signature data URL');
        return "";
      }
      
      return dataUrl;
    } catch (error) {
      console.error('Error capturing signature:', error);
      return "";
    }
  };

  const startCamera = async () => {
    try {
      setShowCameraModal(true);
      setIsCameraActive(true);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
      setShowCameraModal(false);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
    setShowCameraModal(false);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSelfieImage(dataUrl);
    
    // Stop camera and close modal after capture
    stopCamera();
    
    toast.success('Selfie captured successfully!');
  };

  const retakeSelfie = () => {
    setSelfieImage("");
    startCamera();
  };

  const validateSignature = (signature: string): boolean => {
    if (!signature) return false;
    
    // Check if signature is not just empty canvas
    const canvas = memberCanvasRef.current;
    if (!canvas) return false;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    
    // Get image data to check if there's actual drawing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check if there are any non-transparent pixels (signature drawn)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) { // Alpha channel > 0 means pixel is drawn
        return true;
      }
    }
    
    return false;
  };

  const handleNextStep = () => {
    if (currentStep === 'member') {
      const signature = captureSignature();
      if (!signature || !validateSignature(signature)) {
        toast.error('Please provide a valid signature. The signature field cannot be blank.');
        return;
      }
      setMemberSignature(signature);
      setCurrentStep('selfie');
    } else {
      if (!selfieImage) {
        toast.error('Please capture your selfie');
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!memberSignature || !selfieImage) {
      toast.error('Both signature and selfie are required');
      return;
    }

    setLoading(true);
    try {
      // Upload signature and selfie to Cloudinary
      const memberSignatureUrl = await uploadSignatureToCloudinary(memberSignature);
      const selfieImageUrl = await uploadSignatureToCloudinary(selfieImage);

      // Store contract data
      const contractData = {
        memberName: memberData.name,
        memberEmail: memberData.email,
        memberRole: memberData.role,
        idCode: memberData.idCode,
        memberSignatureUrl,
        selfieImageUrl,
        signedAt: new Date().toISOString(),
        status: 'signed',
        contractVersion: '1.0'
      };

      console.log('📝 Contract data being stored in localStorage:', contractData);
      localStorage.setItem('contractData', JSON.stringify(contractData));
      console.log('💾 Contract data saved to localStorage');
      toast.success('Contract signed successfully!');

      // Proceed to next step
      onNext();
    } catch (error) {
      console.error('Error signing contract:', error);
      toast.error('Failed to sign contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadContract = async () => {
    try {
      // Create a contract object for HTML generation
      const contractData = {
        id: `${memberData.idCode}-${Date.now().toString().slice(-6)}`,
        uid: memberData.idCode,
        idCode: memberData.idCode,
        contractURL: '',
        signedAt: new Date(),
        signatureData: memberSignature || '',
        memberSignatureUrl: memberSignature || '',
        selfieImageUrl: selfieImage || '',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        status: memberSignature && selfieImage ? 'signed' as const : 'pending' as const,
        memberName: memberData.name,
        memberRole: memberData.role,
        memberEmail: memberData.email,
        contractVersion: '1.0',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Import and use the screenshot-based PDF generation utility
      const { generateContractPDFFromScreenshot } = await import('../../utils/contractPdf');
      await generateContractPDFFromScreenshot(contractData);
      
      toast.success('Contract PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating contract:', error);
      toast.error('Failed to generate contract. Please try again.');
    }
  };





  return (
    <div className="max-w-4xl mx-auto">
      {/* Contract Preview */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Contract Preview</h2>
            <div className="flex items-center gap-2">
              <Button
                onClick={downloadContract}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </div>
          
                      <div className="bg-gray-50 p-6 rounded-lg">
              {/* Company Logo */}
              <div className="flex items-center justify-center mb-6">
                <img 
                  src="https://i.imgur.com/T7mH4Ly.png" 
                  alt="Astraronix Solutions Logo" 
                  className="h-20 w-auto"
                />
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-4 text-center text-xl">Astraronix Solutions - Team Member Contract</h3>
              <p className="text-sm text-gray-600 mb-6 text-center">
                This contract is made effective as of {new Date().toLocaleDateString()} by and between:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 text-base">Company Information</h4>
                  <p className="mb-2"><strong>Name:</strong> Astraronix Solutions</p>
                  <p className="mb-2"><strong>Address:</strong> Nairobi, Kenya, Remote</p>
                  <p className="mb-2"><strong>Contact:</strong> +254 714 748 299</p>
                  <p className="mb-2"><strong>Email:</strong> astraronixsolutions@gmail.com</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 text-base">Team Member Information</h4>
                  <p className="mb-2"><strong>Name:</strong> {memberData.name}</p>
                  <p className="mb-2"><strong>Role:</strong> {memberData.role}</p>
                  <p className="mb-2"><strong>Email:</strong> {memberData.email}</p>
                  <p className="mb-2"><strong>ID Code:</strong> {memberData.idCode}</p>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3 text-base">Terms & Conditions:</h4>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <p>Each team member agrees to perform their duties responsibly, honestly, and with respect toward the company and clients.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <p>Astraronix Solutions will provide clear guidance, access to needed tools, and agreed compensation for completed work or closed deals.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <p>Both Astraronix and the team member agree to protect all company and client information from unauthorized sharing.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <p>Since Astraronix is a small, growing company, either party can end this working arrangement at any time with simple written notice. No penalties apply — just transparency and respect.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                    <p>Team members are expected to follow Astraronix's communication standards and maintain professionalism in all client interactions.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">6</span>
                    <p>Work created for Astraronix (designs, proposals, content, or code) remains property of Astraronix, but creators may showcase it in their personal portfolios with permission.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">7</span>
                    <p>This agreement is guided by general Kenyan labor principles, but built on trust and collaboration — not strict legal enforcement.</p>
                  </div>
                </div>
              </div>

              {/* Contract Status */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3 text-base">Contract Status:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="mb-2"><strong>Member Signature:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        memberSignature ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {memberSignature ? 'SIGNED' : 'PENDING'}
                      </span>
                    </p>
                    <p className="mb-2"><strong>Selfie Verification:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        selfieImage ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {selfieImage ? 'CAPTURED' : 'PENDING'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="mb-2"><strong>Contract Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p className="mb-2"><strong>Contract ID:</strong> {memberData.idCode}-{Date.now().toString().slice(-6)}</p>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </Card>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
            currentStep === 'member' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-green-600 border-green-600 text-white'
          }`}>
            {currentStep === 'member' ? 1 : <CheckCircle className="w-5 h-5" />}
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
            currentStep === 'selfie' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-200 border-gray-300 text-gray-500'
          }`}>
            {currentStep === 'selfie' ? 2 : currentStep === 'member' ? 2 : <CheckCircle className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {/* Member Signature */}
      {currentStep === 'member' && (
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Team Member Signature</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please sign below to indicate your acceptance of the terms and conditions:
              </label>
              <canvas
                ref={memberCanvasRef}
                width={320}
                height={160}
                className="border border-gray-300 rounded-lg cursor-crosshair touch-none w-full max-w-xs"
                onMouseDown={startDrawing}
                onTouchStart={startTouchDrawing}
              />
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={clearSignature}
                variant="outline"
                size="sm"
              >
                Clear Signature
              </Button>
              <Button
                onClick={() => {
                  const signature = captureSignature();
                  if (signature && validateSignature(signature)) {
                  setMemberSignature(signature);
                    toast.success('Signature captured!');
                  } else {
                    toast.error('Please provide a valid signature. The signature field cannot be blank.');
                  }
                }}
                variant="outline"
                size="sm"
              >
                Capture Signature
              </Button>
            </div>

            {memberSignature && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    Signature captured successfully!
                  </span>
                </div>
              </div>
            )}

            {/* Signature validation warning */}
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important:</p>
                  <p>Please ensure your signature is clearly visible and not blank. The system will validate your signature before proceeding.</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Selfie Capture */}
      {currentStep === 'selfie' && (
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Selfie Verification</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please capture a clear photo of yourself for verification purposes:
              </label>
              
              {!selfieImage ? (
                <div className="space-y-4">
                  <Button
                    onClick={startCamera}
                    className="flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Start Camera
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={selfieImage}
                      alt="Captured selfie"
                      className="w-full max-w-md border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex justify-center space-x-3">
                    <Button
                      onClick={retakeSelfie}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Retake Selfie
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {selfieImage && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">
                    Selfie captured successfully!
                  </span>
                </div>
              </div>
            )}

            {/* Hidden canvas for selfie capture */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Download Contract Buttons */}
            {memberSignature && selfieImage && (
              <div className="mt-4 text-center space-y-2">
                <Button
                  onClick={downloadContract}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Download Contract
                </Button>
                
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Selfie Capture</h3>
              <button
                onClick={stopCamera}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full border border-gray-300 rounded-lg"
              />
              <div className="flex justify-center space-x-3">
                <Button
                  onClick={captureSelfie}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Camera className="w-4 h-4" />
                  Capture
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sign Here</h3>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="border border-gray-300 rounded-lg">
                <canvas
                  ref={modalCanvasRef}
                  width={500}
                  height={250}
                  className="w-full h-auto cursor-crosshair touch-none"
                  onMouseDown={startModalMouseDrawing}
                  onTouchStart={startModalTouchDrawing}
                />
              </div>
              <div className="flex justify-between gap-3">
                <Button
                  onClick={clearModalSignature}
                  variant="outline"
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button
                  onClick={saveModalSignature}
                  className="flex-1"
                >
                  Save Signature
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}

        <Button
          onClick={handleNextStep}
          disabled={loading}
          className="flex items-center gap-2 ml-auto"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : currentStep === 'member' ? (
            <>
              Next Step
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Complete Contract
              <CheckCircle className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
