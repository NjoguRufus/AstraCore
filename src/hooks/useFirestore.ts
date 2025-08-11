import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  DocumentData,
  Query,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useCollection = <T>(
  collectionName: string, 
  queryConstraints?: QueryConstraint[]
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const collectionRef = queryConstraints 
      ? query(collection(db, collectionName), ...queryConstraints)
      : collection(db, collectionName);
    
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firestore Timestamps to Date objects
          const convertedData = Object.keys(data).reduce((acc, key) => {
            const value = data[key];
            if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
              // This is a Firestore Timestamp
              acc[key] = value.toDate();
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as any);
          
          return {
            id: doc.id,
            ...convertedData
          };
        }) as T[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading, error };
};

export const useDocument = <T>(collectionName: string, documentId: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    const documentRef = doc(db, collectionName, documentId);
    
    const unsubscribe = onSnapshot(
      documentRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          // Convert Firestore Timestamps to Date objects
          const convertedData = Object.keys(data).reduce((acc, key) => {
            const value = data[key];
            if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
              // This is a Firestore Timestamp
              acc[key] = value.toDate();
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as any);
          
          setData({ id: doc.id, ...convertedData } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, documentId]);

  return { data, loading, error };
};