import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageContainer, PageHeader } from '@/components/ui/Page';
import { fetchManagerProfile, updateManagerProfile } from '@/services/api';

export function SettingsPage() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchManagerProfile();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || '',
          status: data.status || '',
          password: '',
        });
      } catch (error) {
        console.error(error);
        setMessage('Unable to load profile data.');
      }
    };
    loadProfile();
  }, []);

  const handleChange = (field: keyof typeof profile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        status: profile.status,
      };
      if (profile.password) payload.password = profile.password;
      const updated = await updateManagerProfile(payload);
      setProfile((current) => ({ ...current, name: updated.name, email: updated.email, phone: updated.phone || '', role: updated.role, status: updated.status, password: '' }));
      setMessage('Profile saved successfully.');
    } catch (error) {
      console.error(error);
      setMessage('Unable to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Settings">
      <PageHeader title="Settings" subtitle="Manage your manager profile details." />

      <div className="mx-auto max-w-3xl space-y-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cat-yellow/10 text-cat-yellow">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Profile</h3>
              <p className="text-xs text-ink-200">Edit your user record in MongoDB.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-ink-200">
              <span>Name</span>
              <input value={profile.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-ink-50 outline-none" />
            </label>
            <label className="space-y-1 text-sm text-ink-200">
              <span>Email</span>
              <input type="email" value={profile.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-ink-50 outline-none" />
            </label>
            <label className="space-y-1 text-sm text-ink-200">
              <span>Phone</span>
              <input value={profile.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-ink-50 outline-none" />
            </label>
            <label className="space-y-1 text-sm text-ink-200">
              <span>Role</span>
              <input value={profile.role} onChange={(e) => handleChange('role', e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-ink-50 outline-none" />
            </label>
            <label className="space-y-1 text-sm text-ink-200">
              <span>Status</span>
              <input value={profile.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-ink-50 outline-none" />
            </label>
            <label className="space-y-1 text-sm text-ink-200">
              <span>Password</span>
              <input type="password" value={profile.password} onChange={(e) => handleChange('password', e.target.value)} className="w-full rounded-lg border border-white/10 bg-ink-950/60 px-3 py-2 text-sm text-ink-50 outline-none" placeholder="Leave blank to keep existing" />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-ink-200">{message}</div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
}
