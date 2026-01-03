
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ICONS } from '../constants';
import Branding from './Branding';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-white shadow-xl relative overflow-hidden">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <Link to="/" className="transition-transform active:scale-95">
          <Branding size="sm" />
        </Link>
        <Link to="/settings" className="p-2 text-slate-500 hover:text-indigo-600 transition-all active:rotate-12">
          {ICONS.SETTINGS}
        </Link>
      </header>

      <main className="flex-1 pb-24 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-white/95 backdrop-blur-lg border-t border-slate-100 px-6 py-3 flex justify-around items-center z-20">
        <Link to="/" className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-90 ${isActive('/') ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className="text-xl"><i className="fa-solid fa-house"></i></div>
          <span className="text-[10px] font-black uppercase tracking-wider">Home</span>
        </Link>
        
        <Link 
          to="/add" 
          className="bg-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center -mt-10 shadow-xl shadow-indigo-200 border-4 border-white hover:scale-110 active:scale-90 transition-all duration-300 z-30"
        >
          <div className="text-xl">{ICONS.PLUS}</div>
        </Link>

        <Link to="/bills" className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-90 ${isActive('/bills') ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className="text-xl"><i className="fa-solid fa-list-ul"></i></div>
          <span className="text-[10px] font-black uppercase tracking-wider">Bills</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;
