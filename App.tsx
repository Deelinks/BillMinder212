import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Bill, UserProfile, Entitlement, BillStatus, Frequency } from './types';
// Standardized on PascalCase to resolve casing conflict
import { storageService } from './services/StorageService';
import { calculateNextDueDate } from './utils/dateUtils';
import { supabase } from './services/supabase';
import { syncService } from './services/syncService';

// Screens
import HomeScreen from './screens/HomeScreen';
import BillsScreen from './screens/BillsScreen';
import AddEditBillScreen from './screens/AddEditBillScreen';
import BillDetailsScreen from './screens/BillDetailsScreen';
import SettingsScreen from './screens/SettingsScreen';
import AuthScreen from './screens/AuthScreen';
import PaywallScreen from './screens/PaywallScreen';
import AdminDashboard from './screens/AdminDashboard';
import HelpScreen from './screens/HelpScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import TermsScreen from './screens/TermsScreen';

// Components
import Layout from './components/Layout';
import WelcomeModal from './components/WelcomeModal';
import PaymentVerificationModal from './components/PaymentVerificationModal';

const App: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [payingBill, setPayingBill] = useState<Bill | null>(null);

  const fetchCloudData = useCallback(async (userId: string) => {
    try {
      const [cloudBills, cloudProfile] = await Promise.all([
        syncService.fetchBills(userId),
        syncService.getProfile(userId)
      ]);
      
      if (cloudBills) {
        setBills(cloudBills);
        storageService.saveBills(cloudBills);
      }
      
      if (cloudProfile) {
        const mergedProfile: UserProfile = {
          uid: userId,
          email: storageService.getUser()?.email || null,
          displayName: cloudProfile.displayName || null,
          isAnonymous: false,
          entitlement: cloudProfile.entitlement || Entitlement.FREE,
          currency: cloudProfile.currency || 'NGN'
        };
        setProfile(mergedProfile);
        storageService.saveUser(mergedProfile);
      }
    } catch (err) {
      console.error("Sync error during init:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const localBills = storageService.getBills();
      const localUser = storageService.getUser();
      const welcomeShown = storageService.getWelcomeShown();
      
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const user = session.user;
        const currentProfile: UserProfile = {
          uid: user.id,
          email: user.email!,
          displayName: user.user_metadata?.full_name || 'User',
          isAnonymous: false,
          entitlement: Entitlement.FREE,
          currency: 'NGN'
        };
        setProfile(currentProfile);
        await fetchCloudData(user.id);
      } else if (localUser) {
        setProfile(localUser);
        setBills(localBills);
      } else {
        const guest: UserProfile = {
          uid: 'guest_' + Math.random().toString(36).substr(2, 9),
          email: null,
          displayName: 'Guest',
          isAnonymous: true,
          entitlement: Entitlement.FREE,
          currency: 'NGN'
        };
        setProfile(guest);
        setBills(localBills);
        storageService.saveUser(guest);
      }

      if (!welcomeShown) {
        setShowWelcome(true);
      }
      
      setLoading(false);
    };
    init();
  }, [fetchCloudData]);

  const handleSaveBill = useCallback(async (billData: Partial<Bill>) => {
    const now = new Date().toISOString();
    let updated: Bill;

    if (billData.id) {
      const existing = bills.find(b => b.id === billData.id);
      updated = { ...existing, ...billData, updatedAt: now } as Bill;
    } else {
      updated = {
        id: crypto.randomUUID(),
        name: billData.name!,
        amount: billData.amount,
        dueDate: billData.dueDate!,
        frequency: billData.frequency!,
        status: BillStatus.UPCOMING,
        userId: profile?.uid || 'anon',
        createdAt: now,
        updatedAt: now,
        ...billData
      } as Bill;
    }

    setBills(prev => {
      const next = prev.some(b => b.id === updated.id)
        ? prev.map(b => b.id === updated.id ? updated : b)
        : [...prev, updated];
      storageService.saveBills(next);
      return next;
    });

    if (profile && !profile.isAnonymous) {
      try {
        await syncService.upsertBill(updated);
      } catch (err) {
        console.error("Failed to sync bill to cloud:", err);
      }
    }
  }, [bills, profile]);

  const handleDeleteBill = useCallback(async (id: string) => {
    setBills(prev => {
      const next = prev.filter(b => b.id !== id);
      storageService.saveBills(next);
      return next;
    });

    if (profile && !profile.isAnonymous) {
      try {
        await syncService.deleteBill(id);
      } catch (err) {
        console.error("Failed to delete bill from cloud:", err);
      }
    }
  }, [profile]);

  const executePayment = useCallback(async (id: string, ref?: string, proof?: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;

    const now = new Date().toISOString();
    const isRecurring = bill.frequency !== Frequency.ONE_TIME;
    
    let updated: Bill;
    if (isRecurring) {
      updated = {
        ...bill,
        dueDate: calculateNextDueDate(bill.dueDate, bill.frequency),
        lastPaidDate: now,
        transactionRef: ref || bill.transactionRef,
        proofImage: proof || bill.proofImage,
        updatedAt: now
      };
    } else {
      updated = {
        ...bill,
        status: BillStatus.PAID,
        lastPaidDate: now,
        transactionRef: ref || bill.transactionRef,
        proofImage: proof || bill.proofImage,
        updatedAt: now
      };
    }

    setBills(prev => {
      const next = prev.map(b => b.id === id ? updated : b);
      storageService.saveBills(next);
      return next;
    });

    if (profile && !profile.isAnonymous) {
      try {
        await syncService.upsertBill(updated);
      } catch (err) {
        console.error("Failed to sync payment to cloud:", err);
      }
    }
    setPayingBill(null);
  }, [bills, profile]);

  const handlePayBill = useCallback((id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;

    const securityConfig = storageService.getSecurityConfig();
    const isPro = profile?.entitlement === Entitlement.PRO;
    const isStrict = isPro && (securityConfig.paymentValidationEnabled || bill.requireProof);

    if (isStrict) {
      setPayingBill(bill);
    } else {
      executePayment(id);
    }
  }, [bills, profile, executePayment]);

  const handleAuthComplete = useCallback(async (p: { uid: string; email: string; name: string }) => {
    const up: UserProfile = {
      uid: p.uid,
      email: p.email,
      displayName: p.name,
      isAnonymous: false,
      entitlement: Entitlement.FREE,
      currency: 'NGN'
    };
    setProfile(up);
    storageService.saveUser(up);
    await fetchCloudData(p.uid);
  }, [fetchCloudData]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    storageService.clearAll();
    window.location.reload();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/auth" element={<AuthScreen onAuthComplete={handleAuthComplete} />} />
        <Route path="/admin" element={<AdminDashboard userEmail={profile?.email} />} />
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<HomeScreen bills={bills} profile={profile} onPay={handlePayBill} onDelete={handleDeleteBill} onLogout={handleLogout} />} />
              <Route path="/bills" element={<BillsScreen bills={bills} profile={profile} onPay={handlePayBill} onDelete={handleDeleteBill} />} />
              <Route path="/bill/:id" element={<BillDetailsScreen bills={bills} currency={profile?.currency || 'NGN'} onPay={handlePayBill} onDelete={handleDeleteBill} />} />
              <Route path="/add" element={<AddEditBillScreen bills={bills} entitlement={profile?.entitlement || Entitlement.FREE} onSave={handleSaveBill} onDelete={handleDeleteBill} />} />
              <Route path="/edit/:id" element={<AddEditBillScreen bills={bills} entitlement={profile?.entitlement || Entitlement.FREE} onSave={handleSaveBill} onDelete={handleDeleteBill} />} />
              <Route path="/help" element={<HelpScreen />} />
              <Route path="/privacy" element={<PrivacyScreen />} />
              <Route path="/terms" element={<TermsScreen />} />
              <Route path="/settings" element={<SettingsScreen 
                profile={profile} 
                onLogout={handleLogout} 
                onUpdateCurrency={(curr) => {
                  if (profile) {
                    const newProfile = {...profile, currency: curr};
                    setProfile(newProfile);
                    storageService.saveUser(newProfile);
                    if (!profile.isAnonymous) syncService.upsertProfile(newProfile).catch(console.error);
                  }
                }}
                onShowWelcome={() => setShowWelcome(true)}
              />} />
              <Route path="/paywall" element={<PaywallScreen profile={profile} onUpgrade={() => {
                if (profile) {
                   const newProfile = {...profile, entitlement: Entitlement.PRO};
                   setProfile(newProfile);
                   storageService.saveUser(newProfile);
                   if (!profile.isAnonymous) syncService.upsertProfile(newProfile).catch(console.error);
                }
              }} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
      
      {showWelcome && (
        <WelcomeModal onClose={() => {
          storageService.setWelcomeShown(true);
          setShowWelcome(false);
        }} />
      )}

      {payingBill && (
        <PaymentVerificationModal 
          bill={payingBill}
          currency={profile?.currency || 'NGN'}
          onConfirm={(ref, proof) => executePayment(payingBill.id, ref, proof)}
          onCancel={() => setPayingBill(null)}
          isStrict={profile?.entitlement === Entitlement.PRO}
        />
      )}
    </HashRouter>
  );
};

export default App;