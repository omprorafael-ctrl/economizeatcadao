import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction } from '../types';

const COLLECTION_NAME = 'transactions';

const handleFirebaseError = (error: any, action: string) => {
  console.error(`Error ${action}: `, error);
  if (error.code === 'permission-denied') {
    throw new Error("Permissão negada: Verifique as Regras de Segurança do Firestore no Console do Firebase.");
  } else if (error.code === 'unavailable') {
    throw new Error("Serviço indisponível ou sem conexão com a internet.");
  }
  throw error;
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
  try {
    if (!transaction.userId) {
      throw new Error("Usuário não autenticado.");
    }

    // Logic for generating multiple installments (Fixed Count)
    if (transaction.isRecurring && transaction.recurrence?.count && transaction.recurrence.count > 1) {
      const batch = writeBatch(db);
      const count = transaction.recurrence.count;
      const baseDate = new Date(transaction.dueDate);
      // Adjust for timezone offset to prevent date shifting on simple calculations
      const userTimezoneOffset = baseDate.getTimezoneOffset() * 60000;
      
      const transactionsCreated = [];

      for (let i = 0; i < count; i++) {
        const newDocRef = doc(collection(db, COLLECTION_NAME));
        
        // Calculate new date
        const nextDate = new Date(baseDate.getTime());
        
        if (transaction.recurrence.frequency === 'monthly') {
          nextDate.setMonth(baseDate.getMonth() + i);
        } else if (transaction.recurrence.frequency === 'weekly') {
          nextDate.setDate(baseDate.getDate() + (i * 7));
        } else if (transaction.recurrence.frequency === 'yearly') {
          nextDate.setFullYear(baseDate.getFullYear() + i);
        }

        const dateStr = nextDate.toISOString().split('T')[0];

        // Append installment info to observation (e.g., "Compra (1/10)")
        let obs = transaction.observation || '';
        obs = `${obs} (${i + 1}/${count})`.trim();

        const newTransaction = {
          ...transaction,
          dueDate: dateStr,
          observation: obs,
          // Only the first one might be paid immediately, others usually start as pending unless specified otherwise
          // Logic: If user marks as paid, usually only the first one is paid now.
          status: (i === 0 ? transaction.status : 'pending'), 
          createdAt: Date.now()
        };

        batch.set(newDocRef, newTransaction);
        transactionsCreated.push({ ...newTransaction, id: newDocRef.id });
      }

      await batch.commit();
      return transactionsCreated[0]; // Return the first one created
    } 

    // Default: Single transaction or Indefinite recurrence (handled manually later or by another job)
    const docRef = await addDoc(collection(db, COLLECTION_NAME), transaction);
    return { ...transaction, id: docRef.id };

  } catch (error) {
    handleFirebaseError(error, "adding transaction");
  }
};

export const getTransactions = async (userId: string) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() } as Transaction);
    });
    
    return transactions.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  } catch (error) {
    handleFirebaseError(error, "fetching transactions");
    return []; 
  }
};

export const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
  try {
    const transactionRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(transactionRef, updates);
  } catch (error) {
    handleFirebaseError(error, "updating transaction");
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirebaseError(error, "deleting transaction");
  }
};

export const deleteAllTransactions = async (userId: string) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Firestore batch limit is 500
    const batch = writeBatch(db);
    let count = 0;

    querySnapshot.forEach((document) => {
      batch.delete(document.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }
    return count;
  } catch (error) {
    handleFirebaseError(error, "deleting all transactions");
  }
};