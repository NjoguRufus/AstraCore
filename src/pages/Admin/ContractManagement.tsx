import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Button } from '../../components/UI/Button';
import { Card } from '../../components/UI/Card';
import { Layout } from '../../components/Layout/Layout';
import { Download, Eye, FileText, User, Calendar, CheckCircle } from 'lucide-react';
import { Contract } from '../../types';
import { toast } from 'react-hot-toast';
import { generateContractPDF, generateContractHTML, generateContractPDFFromScreenshot } from '../../utils/contractPdf';

export const ContractManagement: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const contractsRef = collection(db, 'contracts');
      const q = query(contractsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const contractsData: Contract[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Debug: Log the raw data structure
        console.log('Raw contract data:', {
          id: doc.id,
          signedAt: data.signedAt,
          signedAtType: typeof data.signedAt,
          hasToDate: data.signedAt?.toDate ? typeof data.signedAt.toDate : 'no toDate method'
        });
        
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

        contractsData.push({
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt) || new Date(),
          updatedAt: convertTimestamp(data.updatedAt) || new Date(),
          signedAt: convertTimestamp(data.signedAt),
          termsAcceptedAt: convertTimestamp(data.termsAcceptedAt) || new Date()
        } as Contract);
      });
      
      setContracts(contractsData);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  };

  const downloadContractPDF = async (contract: Contract) => {
    try {
      await generateContractPDFFromScreenshot(contract);
      toast.success('Contract PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading contract PDF:', error);
      toast.error('Failed to download contract PDF');
    }
  };



  const viewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowModal(true);
  };

  const viewContractHTML = (contract: Contract) => {
    const htmlContent = generateContractHTML(contract);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContract(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p>Loading contracts...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract Management</h1>
          <p className="text-gray-600">
            View and manage all team member contracts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
                <p className="text-sm text-gray-600">Total Contracts</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.filter(c => c.status === 'signed').length}
                </p>
                <p className="text-sm text-gray-600">Signed Contracts</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <User className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.filter(c => c.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {contracts.filter(c => c.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contracts List */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Contracts</h2>
            
            {contracts.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No contracts found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Signed Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {contract.memberName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contract.memberEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contract.memberRole}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                            {contract.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contract.signedAt ? contract.signedAt.toLocaleDateString() : 'Not signed yet'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => viewContract(contract)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <Button
                              onClick={() => viewContractHTML(contract)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              HTML
                            </Button>
                            <Button
                              onClick={() => downloadContractPDF(contract)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              PDF
                            </Button>
                            
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Contract Detail Modal */}
        {showModal && selectedContract && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Contract Details
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Member Name</label>
                      <p className="text-sm text-gray-900">{selectedContract.memberName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <p className="text-sm text-gray-900">{selectedContract.memberRole}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedContract.memberEmail}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedContract.status)}`}>
                        {selectedContract.status}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID Code</label>
                    <p className="text-sm text-gray-900">{selectedContract.idCode}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Signed Date</label>
                    <p className="text-sm text-gray-900">{selectedContract.signedAt ? selectedContract.signedAt.toLocaleDateString() : 'Not signed yet'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Member Signature</label>
                      {selectedContract.memberSignatureUrl ? (
                        <img 
                          src={selectedContract.memberSignatureUrl} 
                          alt="Member Signature" 
                          className="w-32 h-16 border border-gray-300 rounded mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-500">Not available</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Member Selfie</label>
                      {selectedContract.selfieImageUrl ? (
                        <img 
                          src={selectedContract.selfieImageUrl} 
                          alt="Member Selfie" 
                          className="w-32 h-16 border border-gray-300 rounded mt-1"
                        />
                      ) : (
                        <p className="text-sm text-gray-500">Not available</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    onClick={() => downloadContractPDF(selectedContract)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                  
                  <Button onClick={closeModal}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
