import React, { useState } from "react";
import { Button } from "../UI/Button";
import { Card } from "../UI/Card";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

interface TermsAcceptanceProps {
  onNext: () => void;
  onBack?: () => void;
}

export const TermsAcceptance: React.FC<TermsAcceptanceProps> = ({ onNext, onBack }) => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!accepted) return;
    
    setLoading(true);
    try {
      // Store terms acceptance in localStorage or context
      localStorage.setItem('termsAccepted', 'true');
      localStorage.setItem('termsAcceptedAt', new Date().toISOString());
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onNext();
    } catch (error) {
      console.error('Error accepting terms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Terms & Conditions
        </h1>
        <p className="text-lg text-gray-600">
          Please read and accept our terms and conditions to continue
        </p>
      </div>

      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Astraronix Solutions Team Member Agreement
            </h2>
          </div>
          
          <div className="prose prose-gray max-w-none">
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed">
              <h3 className="font-semibold text-gray-900 mb-3">1. General Terms</h3>
              <p className="mb-3">
                By joining Astraronix Solutions as a team member, you agree to the following terms and conditions 
                that govern your relationship with the company and your participation in our projects.
              </p>
              
              <h3 className="font-semibold text-gray-900 mb-3">2. Responsibilities</h3>
              <ul className="list-disc pl-5 mb-3 space-y-1">
                <li>Perform assigned duties with diligence, integrity, and professionalism</li>
                <li>Maintain confidentiality of all proprietary and sensitive information</li>
                <li>Collaborate effectively with team members and stakeholders</li>
                <li>Meet project deadlines and quality standards</li>
                <li>Contribute to a positive and inclusive team environment</li>
              </ul>
              
              <h3 className="font-semibold text-gray-900 mb-3">3. Company Obligations</h3>
              <ul className="list-disc pl-5 mb-3 space-y-1">
                <li>Provide necessary tools, resources, and training</li>
                <li>Ensure fair compensation and benefits as agreed</li>
                <li>Maintain a safe and supportive work environment</li>
                <li>Provide clear project requirements and feedback</li>
              </ul>
              
              <h3 className="font-semibold text-gray-900 mb-3">4. Intellectual Property</h3>
              <p className="mb-3">
                All work created during your engagement with Astraronix Solutions, including but not limited to 
                code, designs, documentation, and creative content, shall be the property of the company.
              </p>
              
              <h3 className="font-semibold text-gray-900 mb-3">5. Confidentiality</h3>
              <p className="mb-3">
                You agree to maintain strict confidentiality of all company information, client data, trade secrets, 
                and proprietary knowledge both during and after your engagement.
              </p>
              
              <h3 className="font-semibold text-gray-900 mb-3">6. Termination</h3>
              <p className="mb-3">
                Either party may terminate this agreement with written notice, subject to any additional terms 
                agreed upon. Upon termination, you must return all company property and maintain confidentiality obligations.
              </p>
              
              <h3 className="font-semibold text-gray-900 mb-3">7. Governing Law</h3>
              <p className="mb-3">
                This agreement is governed by the laws of the jurisdiction where Astraronix Solutions is incorporated.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <div className="flex items-start space-x-3 mb-6">
            <input
              type="checkbox"
              id="terms-accept"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="terms-accept" className="text-sm text-gray-700">
              I have read, understood, and agree to the terms and conditions outlined above. 
              I acknowledge that by accepting these terms, I am entering into a binding agreement 
              with Astraronix Solutions.
            </label>
          </div>

          <div className="flex justify-between items-center">
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                className="flex items-center gap-2"
              >
                Back
              </Button>
            )}
            
            <Button
              onClick={handleAccept}
              disabled={!accepted || loading}
              className="flex items-center gap-2 ml-auto"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  Accept Terms & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {accepted && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">
              Terms accepted! You can now proceed to the contract signing step.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};