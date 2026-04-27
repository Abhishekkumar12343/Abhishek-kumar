import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGoogle, logout } from '../firebase';
import { LogIn, LogOut, User } from 'lucide-react';

const Auth: React.FC = () => {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div className="animate-pulse w-8 h-8 rounded-full bg-white/10" />;

  if (user) {
    return (
      <div className="flex items-center gap-3 bg-white/5 p-1.5 pr-4 rounded-full border border-white/10">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
            <User size={16} />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-white/90 leading-none">{user.displayName}</span>
          <button 
            onClick={() => logout()}
            className="text-[10px] text-white/40 hover:text-white/60 text-left transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => signInWithGoogle()}
      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
    >
      <LogIn size={16} />
      Sign In
    </button>
  );
};

export default Auth;
