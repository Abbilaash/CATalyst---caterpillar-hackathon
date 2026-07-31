import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/ui/Page';
import { Button } from '@/components/ui/Button';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { checkInAsset, checkOutAsset } from '@/services/api';

export function RentalsPage() {
  const [checkInForm, setCheckInForm] = useState({
    asset_id: '',
    manager_id: '6a6bea17f2c2dd0bdcc1e202',
    check_in_date: new Date().toISOString().split('T')[0],
    check_out_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [checkOutForm, setCheckOutForm] = useState({ asset_id: '' });
  
  const [checkInStatus, setCheckInStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });
  const [checkOutStatus, setCheckOutStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCheckInStatus({ type: null, msg: '' });
    try {
      await checkInAsset({
        ...checkInForm,
        check_in_date: new Date(checkInForm.check_in_date).toISOString(),
        check_out_date: new Date(checkInForm.check_out_date).toISOString(),
      });
      setCheckInStatus({ type: 'success', msg: `Successfully checked in ${checkInForm.asset_id} to manager ${checkInForm.manager_id}` });
      setCheckInForm({ ...checkInForm, asset_id: '' }); // reset asset id field
    } catch (err: any) {
      setCheckInStatus({ type: 'error', msg: err.response?.data?.detail || 'Failed to check in asset' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCheckOutStatus({ type: null, msg: '' });
    try {
      await checkOutAsset(checkOutForm.asset_id);
      setCheckOutStatus({ type: 'success', msg: `Successfully checked out ${checkOutForm.asset_id}` });
      setCheckOutForm({ asset_id: '' }); // reset field
    } catch (err: any) {
      setCheckOutStatus({ type: 'error', msg: err.response?.data?.detail || 'Failed to check out asset' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Rental Management">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Check In / Dispatch Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ok/10 text-ok">
              <ArrowRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Check In (Dispatch)</h2>
              <p className="text-sm text-ink-200">Rent an asset to a Site Manager.</p>
            </div>
          </div>

          <form onSubmit={handleCheckIn} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-100">Asset ID</label>
              <input 
                type="text" 
                required
                value={checkInForm.asset_id}
                onChange={e => setCheckInForm({...checkInForm, asset_id: e.target.value})}
                placeholder="e.g. CAT-EXC-349" 
                className="w-full rounded-lg border border-white/[0.08] bg-ink-400 p-2.5 text-white placeholder-ink-300 focus:border-cat-yellow focus:outline-none focus:ring-1 focus:ring-cat-yellow"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-100">Site Manager ID</label>
              <input 
                type="text" 
                required
                value={checkInForm.manager_id}
                onChange={e => setCheckInForm({...checkInForm, manager_id: e.target.value})}
                className="w-full rounded-lg border border-white/[0.08] bg-ink-400 p-2.5 text-white placeholder-ink-300 focus:border-cat-yellow focus:outline-none focus:ring-1 focus:ring-cat-yellow"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-100">Check In Date</label>
                <input 
                  type="date" 
                  required
                  value={checkInForm.check_in_date}
                  onChange={e => setCheckInForm({...checkInForm, check_in_date: e.target.value})}
                  className="w-full rounded-lg border border-white/[0.08] bg-ink-400 p-2.5 text-white placeholder-ink-300 focus:border-cat-yellow focus:outline-none focus:ring-1 focus:ring-cat-yellow"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-100">Expected Check Out Date</label>
                <input 
                  type="date" 
                  required
                  value={checkInForm.check_out_date}
                  onChange={e => setCheckInForm({...checkInForm, check_out_date: e.target.value})}
                  className="w-full rounded-lg border border-white/[0.08] bg-ink-400 p-2.5 text-white placeholder-ink-300 focus:border-cat-yellow focus:outline-none focus:ring-1 focus:ring-cat-yellow"
                />
              </div>
            </div>

            {checkInStatus.msg && (
              <div className={`mt-2 p-3 rounded-lg text-sm ${checkInStatus.type === 'success' ? 'bg-ok/10 text-ok' : 'bg-crit/10 text-crit'}`}>
                {checkInStatus.msg}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full justify-center bg-ok hover:bg-ok/90" disabled={loading}>
                {loading ? 'Processing...' : 'Check In Asset'}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Check Out / Return Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cat-yellow/10 text-cat-yellow">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Check Out (Return)</h2>
              <p className="text-sm text-ink-200">Receive an asset back and close rental.</p>
            </div>
          </div>

          <form onSubmit={handleCheckOut} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-100">Asset ID</label>
              <input 
                type="text" 
                required
                value={checkOutForm.asset_id}
                onChange={e => setCheckOutForm({...checkOutForm, asset_id: e.target.value})}
                placeholder="e.g. CAT-EXC-349" 
                className="w-full rounded-lg border border-white/[0.08] bg-ink-400 p-2.5 text-white placeholder-ink-300 focus:border-cat-yellow focus:outline-none focus:ring-1 focus:ring-cat-yellow"
              />
            </div>

            {checkOutStatus.msg && (
              <div className={`mt-2 p-3 rounded-lg text-sm ${checkOutStatus.type === 'success' ? 'bg-ok/10 text-ok' : 'bg-crit/10 text-crit'}`}>
                {checkOutStatus.msg}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full justify-center bg-cat-yellow text-ink-500 hover:bg-cat-yellow/90" disabled={loading}>
                {loading ? 'Processing...' : 'Approve Check Out'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </PageContainer>
  );
}
