import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { db } from "../../config/firebase";
import { storage } from "../../config/firebase";
import { Button } from "../../components/UI/Button";
import { Card } from "../../components/UI/Card";
import { FileText, CheckCircle, X, PenTool, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

export const ClientContractSigning: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<string>("");
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    loadContract();
  }, [id]);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctxRef.current = ctx;
      }
    }
  }, [showSignaturePad]);

  const loadContract = async () => {
    if (!id) return;
    
    try {
      const docRef = doc(db, "contracts", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setContract({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("Contract not found");
        navigate("/");
      }
    } catch (error) {
      console.error("Error loading contract:", error);
      toast.error("Failed to load contract");
    } finally {
      setLoading(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !ctxRef.current) return;
    
    isDrawing.current = true;
    const ctx = ctxRef.current;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!canvasRef.current) return;
      const moveX = moveEvent.clientX - rect.left;
      const moveY = moveEvent.clientY - rect.top;
      ctx.lineTo(moveX, moveY);
      ctx.stroke();
    };
    
    const handleMouseUp = () => {
      isDrawing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const clearSignature = () => {
    if (canvasRef.current && ctxRef.current) {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const saveSignature = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL();
      setSignature(dataURL);
      setShowSignaturePad(false);
      toast.success("Signature captured");
    }
  };

  const handleSignContract = async () => {
    if (!contract || !signature || !id) return;
    
    setSigning(true);
    
    try {
      // Upload signature to Firebase Storage
      const signatureRef = ref(storage, `contract-signatures/${id}-${Date.now()}.png`);
      await uploadString(signatureRef, signature, 'data_url');
      const signatureUrl = await getDownloadURL(signatureRef);
      
      // Update contract in Firestore
      const contractRef = doc(db, "contracts", id);
      await updateDoc(contractRef, {
        status: "signed",
        signatureUrl,
        signedAt: serverTimestamp()
      });
      
      toast.success("Contract signed successfully!");
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
      
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error("Failed to sign contract");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Contract Not Found</h2>
            <p className="text-gray-600 mb-4">The contract you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contract Agreement</h1>
                <p className="text-gray-600">Please review and sign below</p>
              </div>
            </div>
            
            {contract.status === 'signed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">Contract Already Signed</p>
                  <p className="text-sm text-green-600">
                    Signed on {contract.signedAt?.toDate?.()?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Contract Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-4">Client Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-medium text-gray-900">{contract.clientName}</p>
              </div>
              <div>
                <span className="text-gray-600">Company:</span>
                <p className="font-medium text-gray-900">{contract.companyName}</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium text-gray-900">{contract.email}</p>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <p className="font-medium text-gray-900">{contract.phone}</p>
              </div>
            </div>
          </div>

          {/* Contract Content */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Service Agreement</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 mb-4">
                This contract is entered into between {contract.companyName} (Client) and Astraronix (Service Provider).
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Project Type:</strong> {contract.projectType || "Not specified"}
              </p>
              <p className="text-gray-700 mb-4">
                By signing this contract, you agree to the terms and conditions outlined in this agreement.
              </p>
            </div>
          </div>

          {/* Signature Section */}
          {contract.status !== 'signed' && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Sign Below</h3>
              
              {signature ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <img src={signature} alt="Signature" className="max-w-full h-32 mx-auto" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSignature("")}
                    className="mt-4"
                  >
                    Clear & Re-sign
                  </Button>
                </div>
              ) : (
                <div>
                  <Button
                    onClick={() => setShowSignaturePad(true)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <PenTool className="w-5 h-5" />
                    Add Your Signature
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {contract.status !== 'signed' && (
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSignContract}
                disabled={!signature || signing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {signing ? "Signing..." : "Sign & Submit"}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sign Here</h3>
                <button
                  onClick={() => setShowSignaturePad(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  width={600}
                  height={200}
                  className="w-full border border-gray-300 bg-white rounded cursor-crosshair"
                />
              </div>
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={clearSignature}
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button
                  onClick={saveSignature}
                  className="flex-1"
                >
                  Save Signature
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

