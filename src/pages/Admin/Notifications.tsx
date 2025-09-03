import React from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';

export const Notifications: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">View recent system notifications</p>
          </div>
        </div>

        <Card className="p-6">
          <div className="text-gray-500 text-center">
            No notifications to display.
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;


