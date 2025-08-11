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
    
    try {
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          try {
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
              
              // Special handling for users collection - map document ID to uid field
              if (collectionName === 'users') {
                return {
                  uid: doc.id,  // Map document ID to uid for users
                  ...convertedData
                } as T;
              }
              
              return {
                id: doc.id,
                ...convertedData
              };
            }) as T[];
            setData(items);
            setLoading(false);
          } catch (processError) {
            console.error('Error processing snapshot data:', processError);
            setError(processError as Error);
            setLoading(false);
          }
        },
        (err) => {
          console.error('Firestore snapshot error:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => {
        try {
          unsubscribe();
        } catch (unsubError) {
          console.error('Error unsubscribing from Firestore:', unsubError);
        }
      };
    } catch (setupError) {
      console.error('Error setting up Firestore listener:', setupError);
      setError(setupError as Error);
      setLoading(false);
    }
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
    
    try {
      const unsubscribe = onSnapshot(
        documentRef,
        (doc) => {
          try {
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
              
              // Special handling for users collection - map document ID to uid field
              if (collectionName === 'users') {
                setData({ uid: doc.id, ...convertedData } as T);
              } else {
                setData({ id: doc.id, ...convertedData } as T);
              }
            } else {
              setData(null);
            }
            setLoading(false);
          } catch (processError) {
            console.error('Error processing document data:', processError);
            setError(processError as Error);
            setLoading(false);
          }
        },
        (err) => {
          console.error('Firestore document snapshot error:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => {
        try {
          unsubscribe();
        } catch (unsubError) {
          console.error('Error unsubscribing from Firestore document:', unsubError);
        }
      };
    } catch (setupError) {
      console.error('Error setting up Firestore document listener:', setupError);
      setError(setupError as Error);
      setLoading(false);
    }
  }, [collectionName, documentId]);

  return { data, loading, error };
};