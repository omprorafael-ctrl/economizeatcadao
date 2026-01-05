
import React, { useState, useEffect } from 'react';
import { UserRole, User, Product, ClientData, Order, Seller } from './types';
import ManagerDashboard from './components/Manager/ManagerDashboard';
import ClientDashboard from './components/Client/ClientDashboard';
import SellerDashboard from './components/Seller/SellerDashboard';
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
      try {
        if (firebaseUser) {
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
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        console.error("Critical Auth Error:", e);
        setCurrentUser(null);
      } finally {
        // ESSENCIAL: Garante que o loading pare mesmo se houver erro, evitando tela branca
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    }, (err) => console.error("Firestore Products Error:", err));

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
      const ords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ords);
    }, (err) => console.error("Firestore Orders Error:", err));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setClients(allUsers.filter(u => u.role === UserRole.CLIENT) as ClientData[]);
      setManagers(allUsers.filter(u => u.role === UserRole.MANAGER));
      setSellers(allUsers.filter(u => u.role === UserRole.SELLER) as Seller[]);
    }, (err) => console.error("Firestore Users Error:", err));

    return () => {
      unsubProducts();
      unsubOrders();
      unsubUsers();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout Error:", e);
    }
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Atacadão</h1>
          <p className="text-[9px] font-bold tracking-[0.4em] text-slate-400 mt-2 uppercase">Sincronizando Ecossistema</p>
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
          setSellers={setSellers as any}
          onLogout={handleLogout} 
        />
      ) : currentUser.role === UserRole.SELLER ? (
        <SellerDashboard 
          user={currentUser as Seller}
          orders={orders}
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
