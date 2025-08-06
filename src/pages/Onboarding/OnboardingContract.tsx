import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { generateContract } from '../../utils/pdf';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { Layout } from '../../components/Layout/Layout';
import { User } from '../../types';

export const OnboardingContract: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [userProfile, setUserProfile] = useState<User | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/onboarding');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'active_members', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({
            uid: user.uid,
            name: userData.name,
            email: user.email!,
            photoURL: userData.photoURL,
            role: userData.role,
            team: userData.team,
            skills: userData.skills || [],
            github: userData.github,
            linkedin: userData.linkedin,
            phone: userData.phone,
            employeeID: userData.employeeID,
            isAdmin: userData.isAdmin || false,
            createdAt: userData.createdAt?.toDate() || new Date(),
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user, navigate]);

  const clearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !userProfile || !signaturePadRef.current) return;

    const signatureData = signaturePadRef.current.getTrimmedCanvas().toDataURL();
    if (signaturePadRef.current.isEmpty()) {
      alert('Please provide your signature.');
      return;
    }

    setIsLoading(true);
    try {
      // Generate contract PDF with signature
      const pdf = generateContract(userProfile, signatureData);
      const pdfBlob = pdf.output('blob');
      const pdfDataURL = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(pdfBlob);
      });

      // Upload contract to Firebase Storage
      const contractRef = ref(storage, `contracts/${userProfile.uid}_contract.pdf`);
      await uploadString(contractRef, pdfDataURL, 'data_url');
      const contractURL = await getDownloadURL(contractRef);

      // Save contract record to Firestore
      await setDoc(doc(db, 'contracts', userProfile.uid), {
        uid: userProfile.uid,
        employeeID: userProfile.employeeID,
        contractURL,
        signedAt: new Date(),
        signatureData,
      });

      // Navigate to completion
      navigate('/onboarding/complete');
    } catch (error) {
      console.error('Contract signing error:', error);
      alert('Failed to process contract. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userProfile) {
    return (
      <Layout showSidebar={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={false}>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">4</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Digital Employment Contract</h1>
            <p className="text-gray-600 mt-2">Please review and sign your employment agreement.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contract Preview */}
            <Card className="h-fit">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Terms</h2>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900">ASTRACORE EMPLOYMENT AGREEMENT</h3>
                  <p className="mt-2">This Employment Agreement is entered into between Astracore and {userProfile.name}.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900">EMPLOYEE INFORMATION:</h4>
                  <ul className="mt-1 space-y-1">
                    <li><strong>Name:</strong> {userProfile.name}</li>
                    <li><strong>Employee ID:</strong> {userProfile.employeeID}</li>
                    <li><strong>Role:</strong> {userProfile.role}</li>
                    <li><strong>Team:</strong> {userProfile.team}</li>
                    <li><strong>Email:</strong> {userProfile.email}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900">TERMS AND CONDITIONS:</h4>
                  <ol className="mt-1 space-y-1 list-decimal list-inside">
                    <li>The employee agrees to perform duties assigned to their role with professionalism and dedication.</li>
                    <li>The employee will maintain confidentiality of all company information and trade secrets.</li>
                    <li>The employee will comply with all company policies and procedures.</li>
                    <li>This agreement is effective immediately upon signing.</li>
                  </ol>
                </div>

                <p className="pt-4 text-gray-600">
                  By signing below, both parties agree to the terms outlined in this agreement.
                </p>
                <p className="text-gray-600">
                  <strong>Date:</strong> {new Date().toLocaleDateString()}
                </p>
              </div>
            </Card>

            {/* Signature Section */}
            <Card>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Digital Signature</h2>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <SignatureCanvas
                      ref={signaturePadRef}
                      canvasProps={{
                        className: 'w-full h-32 bg-white rounded',
                        width: 400,
                        height: 128
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-500">Sign above</p>
                    <Button
                      type="button"
                      onClick={clearSignature}
                      variant="ghost"
                      size="sm"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="agree" className="text-sm text-gray-700">
                    I have read and agree to the terms and conditions of this employment agreement. 
                    I understand that this constitutes a legally binding agreement.
                  </label>
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full"
                  disabled={!agreed}
                >
                  Sign Contract & Complete Onboarding
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};