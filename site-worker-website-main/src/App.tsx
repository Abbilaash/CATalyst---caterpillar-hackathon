import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/toaster';
import { StatCardSkeleton } from '@/components/common/Skeleton';
import { Login } from '@/pages/Login';

const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Assets = lazy(() => import('@/pages/Assets').then((m) => ({ default: m.Assets })));
const AssetDetails = lazy(() => import('@/pages/AssetDetails').then((m) => ({ default: m.AssetDetails })));
const Scheduling = lazy(() => import('@/pages/Scheduling').then((m) => ({ default: m.Scheduling })));
const Operations = lazy(() => import('@/pages/Operations').then((m) => ({ default: m.Operations })));
const Reports = lazy(() => import('@/pages/Reports').then((m) => ({ default: m.Reports })));

function PageFallback() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 rounded-lg bg-muted/60 animate-pulse" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="h-96 rounded-xl bg-muted/40 animate-pulse" />
    </div>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem('site-manager-token')));

  useEffect(() => {
    const signOut = () => setAuthenticated(false);
    window.addEventListener('site-manager-sign-out', signOut);
    return () => window.removeEventListener('site-manager-sign-out', signOut);
  }, []);

  if (!authenticated) {
    return <Login onAuthenticated={() => setAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
          <Route path="/assets" element={<Suspense fallback={<PageFallback />}><Assets /></Suspense>} />
          <Route path="/assets/:id" element={<Suspense fallback={<PageFallback />}><AssetDetails /></Suspense>} />
          <Route path="/scheduling" element={<Suspense fallback={<PageFallback />}><Scheduling /></Suspense>} />
          <Route path="/operations" element={<Suspense fallback={<PageFallback />}><Operations /></Suspense>} />
          <Route path="/reports" element={<Suspense fallback={<PageFallback />}><Reports /></Suspense>} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
