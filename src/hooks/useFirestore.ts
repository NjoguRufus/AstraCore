import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
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
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const ref = queryConstraints
          ? query(collection(db, collectionName), ...queryConstraints)
          : collection(db, collectionName);

        const snapshot = await getDocs(ref);
        const items = snapshot.docs.map(d => {
          const raw = d.data();
          const converted = Object.keys(raw).reduce((acc, key) => {
            const value = (raw as any)[key];
            if (value && typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
              acc[key] = (value as any).toDate();
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as any);

          if (collectionName === 'users') {
            return { uid: d.id, ...converted } as T;
          }
          return { id: d.id, ...converted } as T;
        });

        if (isMounted) {
          setData(items);
          setLoading(false);
        }
      } catch (err) {
        console.error('Firestore query error:', err);
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    // Skip if query constraints are provided but evidently incomplete (e.g., undefined values)
    const constraintsOk = Array.isArray(queryConstraints)
      ? queryConstraints.every(Boolean)
      : true;

    if (constraintsOk) {
      fetchData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [collectionName, JSON.stringify(queryConstraints || [])]);

  return { data, loading, error };
};

export const useDocument = <T>(collectionName: string, documentId: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!documentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const ref = doc(db, collectionName, documentId);
        const snap = await getDoc(ref);
        if (!isMounted) return;

        if (snap.exists()) {
          const raw = snap.data();
          const converted = Object.keys(raw).reduce((acc, key) => {
            const value = (raw as any)[key];
            if (value && typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
              acc[key] = (value as any).toDate();
            } else {
              acc[key] = value;
            }
            return acc;
          }, {} as any);

          if (collectionName === 'users') {
            setData({ uid: snap.id, ...converted } as T);
          } else {
            setData({ id: snap.id, ...converted } as T);
          }
        } else {
          setData(null);
        }
        setLoading(false);
      } catch (err) {
        console.error('Firestore document query error:', err);
        if (isMounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    run();
    return () => { isMounted = false; };
  }, [collectionName, documentId]);

  return { data, loading, error };
};