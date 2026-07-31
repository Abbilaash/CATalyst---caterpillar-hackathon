import { useState, useEffect } from 'react';
import { fetchRequests, fetchEquipment, allocateMachinery } from '@/services/api';
import { Loader2, Calendar, CheckCircle } from 'lucide-react';
import { Equipment } from '@/types';

export function MachineAssignmentForm() {
  const [requests, setRequests] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<string>('');
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [reqs, eq] = await Promise.all([fetchRequests(), fetchEquipment()]);
        setRequests(reqs);
        setEquipment(eq.filter((e: Equipment) => e.status === 'idle' || !e.status)); // Or whatever marks it as available
      } catch (err) {
        console.error("Failed to load assignment data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAllocate = async () => {
    if (!selectedReq || !selectedAsset) return;
    setSubmitting(true);
    try {
      await allocateMachinery({
        request_id: selectedReq,
        asset_ids: [selectedAsset],
        check_in_time: checkIn ? new Date(checkIn).toISOString() : undefined,
        check_out_time: checkOut ? new Date(checkOut).toISOString() : undefined,
      });
      setSuccess(true);
      setRequests(requests.filter(r => r.request_id !== selectedReq));
      setSelectedReq('');
      setSelectedAsset('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-cat-yellow" /></div>;

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-ink-50 mb-4">Pending Rental Requests</h2>
      {requests.length === 0 ? (
        <p className="text-ink-200">No pending requests.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-ink-200 mb-1">Select Request</label>
              <select
                className="w-full rounded-md border border-white/10 bg-ink-400 p-2 text-sm text-ink-50 focus:border-cat-yellow focus:outline-none"
                value={selectedReq}
                onChange={(e) => setSelectedReq(e.target.value)}
              >
                <option value="">-- Choose a Request --</option>
                {requests.map(r => (
                  <option key={r.request_id} value={r.request_id}>
                    {r.equipment_type} (Site: {r.site_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-200 mb-1">Assign Asset</label>
              <select
                className="w-full rounded-md border border-white/10 bg-ink-400 p-2 text-sm text-ink-50 focus:border-cat-yellow focus:outline-none"
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
              >
                <option value="">-- Choose Available Machine --</option>
                {equipment.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
             <div>
                <label className="block text-xs font-medium text-ink-200 mb-1">Check-in Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full rounded-md border border-white/10 bg-ink-400 p-2 text-sm text-ink-50"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-xs font-medium text-ink-200 mb-1">Check-out Time (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="w-full rounded-md border border-white/10 bg-ink-400 p-2 text-sm text-ink-50"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
             </div>
          </div>

          <button
            onClick={handleAllocate}
            disabled={!selectedReq || !selectedAsset || submitting}
            className="w-full mt-4 rounded-md bg-cat-yellow py-2 text-sm font-semibold text-ink-900 transition-all hover:bg-yellow-400 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Assign & Allocate Machinery'}
          </button>
          
          {success && (
            <div className="mt-2 flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2 h-4 w-4" /> Successfully allocated machine!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
