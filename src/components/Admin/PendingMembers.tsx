import React, { useState } from 'react';
import { useCollection } from '../../hooks/useFirestore';
import { useModal } from '../../contexts/ModalContext';
import { useAuth } from '../../hooks/useAuth';
import { approvePendingMember, rejectPendingMember } from '../../services/firebaseService';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { User } from '../../types';

export const PendingMembers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { data: users = [], loading } = useCollection<User>('users');
  const { showConfirmation, showNotification } = useModal();
  
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Filter pending members
  const pendingMembers = users?.filter(u => u?.status === 'pending') || [];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'dev': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'design': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cyber': return 'bg-green-100 text-green-800 border-green-200';
      case 'analyst': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'sales': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'marketing': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'campaign': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleApproveMember = async (member: User) => {
    if (!member.uid || !currentUser?.uid) return;

    const confirmed = await showConfirmation({
      title: 'Approve Member',
      message: `Are you sure you want to approve ${member.name}? They will gain access to the system.`,
      type: 'success',
      confirmText: 'Approve',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    setIsLoading(member.uid);
    try {
      await approvePendingMember(member.uid, currentUser.uid);
      showNotification({
        title: 'Success',
        message: `${member.name} has been approved and is now active!`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error approving member:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to approve member. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleRejectMember = async (member: User) => {
    if (!member.uid || !currentUser?.uid) return;

    const rejectionReason = prompt('Please provide a reason for rejection (optional):') || 'No reason provided';

    const confirmed = await showConfirmation({
      title: 'Reject Member',
      message: `Are you sure you want to reject ${member.name}? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Reject',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    setIsLoading(member.uid);
    try {
      await rejectPendingMember(member.uid, currentUser.uid, rejectionReason);
      showNotification({
        title: 'Member Rejected',
        message: `${member.name} has been rejected and deactivated.`,
        type: 'warning'
      });
    } catch (error) {
      console.error('Error rejecting member:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to reject member. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pending Members</h2>
              <p className="text-sm text-gray-600">
                {pendingMembers.length} member{pendingMembers.length !== 1 ? 's' : ''} awaiting approval
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {pendingMembers.length} Pending
            </span>
          </div>
        </div>

        {pendingMembers.length > 0 ? (
          <div className="space-y-4">
            {pendingMembers.map((member) => (
              <div 
                key={member.uid || member.idCode || member.email} 
                className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {member.photoURL ? (
                    <img
                      src={member.photoURL}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{member.name}</h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{member.email || 'Email not provided'}</p>
                    <p className="text-xs text-gray-500">ID: {member.idCode}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      <span className="text-xs text-gray-500">{member.team}</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Created {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleApproveMember(member)}
                    variant="success"
                    size="sm"
                    isLoading={isLoading === member.uid}
                    disabled={isLoading !== null}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleRejectMember(member)}
                    variant="danger"
                    size="sm"
                    isLoading={isLoading === member.uid}
                    disabled={isLoading !== null}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Members</h3>
            <p className="text-gray-500">All members have been processed. Great job!</p>
          </div>
        )}
      </div>
    </Card>
  );
};
