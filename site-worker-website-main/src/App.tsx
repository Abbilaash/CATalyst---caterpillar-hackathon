import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/toaster';
import { StatCardSkeleton } from '@/components/common/Skeleton';

const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Assets = lazy(() => import('@/pages/Assets').then((m) => ({ default: m.Assets })));
const AssetDetails = lazy(() => import('@/pages/AssetDetails').then((m) => ({ default: m.AssetDetails })));
const Operators = lazy(() => import('@/pages/Operators').then((m) => ({ default: m.Operators })));
const OperatorDetails = lazy(() => import('@/pages/OperatorDetails').then((m) => ({ default: m.OperatorDetails })));
const Operations = lazy(() => import('@/pages/Operations').then((m) => ({ default: m.Operations })));
const Maintenance = lazy(() => import('@/pages/Maintenance').then((m) => ({ default: m.Maintenance })));
const Reports = lazy(() => import('@/pages/Reports').then((m) => ({ default: m.Reports })));
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));

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
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
          <Route path="/assets" element={<Suspense fallback={<PageFallback />}><Assets /></Suspense>} />
          <Route path="/assets/:id" element={<Suspense fallback={<PageFallback />}><AssetDetails /></Suspense>} />
          <Route path="/operators" element={<Suspense fallback={<PageFallback />}><Operators /></Suspense>} />
          <Route path="/operators/:id" element={<Suspense fallback={<PageFallback />}><OperatorDetails /></Suspense>} />
          <Route path="/operations" element={<Suspense fallback={<PageFallback />}><Operations /></Suspense>} />
          <Route path="/maintenance" element={<Suspense fallback={<PageFallback />}><Maintenance /></Suspense>} />
          <Route path="/reports" element={<Suspense fallback={<PageFallback />}><Reports /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageFallback />}><Settings /></Suspense>} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
