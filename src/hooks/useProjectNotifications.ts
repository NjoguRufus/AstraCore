import { useState, useEffect } from 'react';
import { useCollection } from './useFirestore';
import { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useProjectNotifications = () => {
  const { user } = useAuth();
  const { data: projects } = useCollection<Project>('projects');
  const [newProjects, setNewProjects] = useState<Project[]>([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  useEffect(() => {
    if (!user || !projects.length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for projects assigned to the user today
    const newlyAssignedProjects = projects.filter(project => {
      const isAssignedToUser = project.assignedTo.includes(user.uid);
      const isNewlyAssigned = project.createdAt && 
        new Date(project.createdAt) >= today;
      return isAssignedToUser && isNewlyAssigned;
    });

    setNewProjects(newlyAssignedProjects);
    setHasNewNotifications(newlyAssignedProjects.length > 0);
  }, [projects, user]);

  const markNotificationsAsRead = () => {
    setHasNewNotifications(false);
  };

  const clearNotifications = () => {
    setNewProjects([]);
    setHasNewNotifications(false);
  };

  return {
    newProjects,
    hasNewNotifications,
    markNotificationsAsRead,
    clearNotifications
  };
};
