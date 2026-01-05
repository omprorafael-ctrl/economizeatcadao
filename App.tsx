
import React, { useState, useEffect } from 'react';
import { UserRole, User, Product, ClientData, Order, Seller } from './types';
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
  const [sellers, setSellers] = useState<Seller[]>([]);

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
    if (!currentUser) return;

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

    const unsubSellers = onSnapshot(collection(db, 'sellers'), (snapshot) => {
      setSellers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Seller)));
    });

    return () => {
      unsubProducts();
      unsubOrders();
      unsubUsers();
      unsubSellers();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-slate-800">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-100 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">ATACADÃO</h1>
          <p className="text-[9px] font-bold tracking-[0.4em] text-slate-400 mt-2 uppercase">Carregando Ecossistema</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans page-transition">
      {currentUser.role === UserRole.MANAGER ? (
        <ManagerDashboard 
          user={currentUser} 
          products={products}
          setProducts={setProducts} 
          clients={clients}
          setClients={setClients}
          orders={orders}
          setOrders={setOrders}
          managers={managers}
          setManagers={setManagers}
          sellers={sellers}
          setSellers={setSellers}
          onLogout={handleLogout} 
        />
      ) : (
        <ClientDashboard 
          user={currentUser as ClientData} 
          products={products}
          orders={orders}
          sellers={sellers}
          setOrders={setOrders}
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
};

export default App;
