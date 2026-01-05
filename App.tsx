
import React, { useState, useEffect } from 'react';
import { UserRole, User, Product, ClientData, Order } from './types';
import ManagerDashboard from './components/Manager/ManagerDashboard';
import ClientDashboard from './components/Client/ClientDashboard';
import Login from './components/Auth/Login';
import { auth, db } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, query, orderBy } from 'firebase/firestore';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [managers, setManagers] = useState<User[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            if (userData.active) {
              setCurrentUser(userData);
            } else {
              await signOut(auth);
              setCurrentUser(null);
            }
          } else {
            // Usuário existe no Auth mas não tem perfil no Firestore
            await signOut(auth);
            setCurrentUser(null);
          }
        } catch (e) {
          console.error("Erro ao buscar usuário:", e);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      setClients([]);
      setOrders([]);
      setManagers([]);
      return;
    }

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setClients(allUsers.filter(u => u.role === UserRole.CLIENT) as ClientData[]);
      setManagers(allUsers.filter(u => u.role === UserRole.MANAGER));
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubUsers();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="mt-8 text-center animate-pulse">
          <h1 className="text-2xl font-black italic tracking-tighter opacity-80 text-blue-500">ATACADÃO</h1>
          <p className="text-[10px] font-bold tracking-[0.4em] opacity-30 mt-1 uppercase">Validando Identidade</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 page-transition">
      {currentUser.role === UserRole.MANAGER ? (
        <ManagerDashboard 
          user={currentUser} 
          products={products}
          setProducts={() => {}} 
          clients={clients}
          setClients={() => {}}
          orders={orders}
          setOrders={() => {}}
          managers={managers}
          setManagers={() => {}}
          onLogout={handleLogout} 
        />
      ) : (
        <ClientDashboard 
          user={currentUser as ClientData} 
          products={products}
          orders={orders}
          setOrders={() => {}}
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
};

export default App;
