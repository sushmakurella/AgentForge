import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { useSession } from '../services/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md animate-pulse">
            <Bot className="w-6 h-6" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
