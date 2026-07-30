import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Building2, Save } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function Settings() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    equipmentAlerts: true,
    maintenanceReminders: true,
    taskUpdates: true,
    operatorReports: false,
    weeklyDigest: true,
  });
  const [theme, setTheme] = useState('dark');
  const [units, setUnits] = useState('imperial');

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated successfully.',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and application preferences"
        icon={<SettingsIcon className="h-5 w-5" />}
        actions={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
            <Save className="mr-1.5 h-4 w-4" /> Save Changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile */}
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" /> Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <img src="https://i.pravatar.cc/150?img=68" alt="Profile" className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/30" />
              <div>
                <Button variant="outline" size="sm" className="border-border bg-transparent">Change Photo</Button>
                <p className="mt-1.5 text-xs text-muted-foreground">JPG or PNG. Max 2MB.</p>
              </div>
            </div>
            <Separator className="bg-border" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <Input defaultValue="Frank Reynolds" className="border-border bg-accent/40" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input defaultValue="frank.reynolds@cat-rental.com" className="border-border bg-accent/40" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Input defaultValue="Site Manager" disabled className="border-border bg-accent/20 opacity-70" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input defaultValue="(555) 210-8800" className="border-border bg-accent/40" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Site preferences */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-info" /> Site Preferences
            </CardTitle>
            <CardDescription>Default display settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Default Site</Label>
              <Select defaultValue="site-01">
                <SelectTrigger className="border-border bg-accent/40"><SelectValue /></SelectTrigger>
                <SelectContent className="border-border bg-popover">
                  <SelectItem value="site-01">Highland Ridge Quarry</SelectItem>
                  <SelectItem value="site-02">Cedar Creek Dam Project</SelectItem>
                  <SelectItem value="site-03">Summit Highway Expansion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Measurement Units</Label>
              <Select value={units} onValueChange={setUnits}>
                <SelectTrigger className="border-border bg-accent/40"><SelectValue /></SelectTrigger>
                <SelectContent className="border-border bg-popover">
                  <SelectItem value="imperial">Imperial (°F, ft, lbs)</SelectItem>
                  <SelectItem value="metric">Metric (°C, m, kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Time Zone</Label>
              <Select defaultValue="pt">
                <SelectTrigger className="border-border bg-accent/40"><SelectValue /></SelectTrigger>
                <SelectContent className="border-border bg-popover">
                  <SelectItem value="pt">Pacific (PT)</SelectItem>
                  <SelectItem value="mt">Mountain (MT)</SelectItem>
                  <SelectItem value="ct">Central (CT)</SelectItem>
                  <SelectItem value="et">Eastern (ET)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-warning" /> Notifications
            </CardTitle>
            <CardDescription>Choose what alerts you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <NotifRow
              label="Equipment Alerts"
              description="Critical equipment issues and breakdowns"
              checked={notifications.equipmentAlerts}
              onChange={(v) => setNotifications((n) => ({ ...n, equipmentAlerts: v }))}
            />
            <NotifRow
              label="Maintenance Reminders"
              description="Upcoming and overdue service notifications"
              checked={notifications.maintenanceReminders}
              onChange={(v) => setNotifications((n) => ({ ...n, maintenanceReminders: v }))}
            />
            <NotifRow
              label="Task Updates"
              description="Task status changes and completions"
              checked={notifications.taskUpdates}
              onChange={(v) => setNotifications((n) => ({ ...n, taskUpdates: v }))}
            />
            <NotifRow
              label="Operator Reports"
              description="Daily operator performance summaries"
              checked={notifications.operatorReports}
              onChange={(v) => setNotifications((n) => ({ ...n, operatorReports: v }))}
            />
            <NotifRow
              label="Weekly Digest"
              description="Weekly site operations summary email"
              checked={notifications.weeklyDigest}
              onChange={(v) => setNotifications((n) => ({ ...n, weeklyDigest: v }))}
            />
          </CardContent>
        </Card>

        {/* Appearance + Security */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4 text-primary" /> Appearance
              </CardTitle>
              <CardDescription>Theme and display</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="border-border bg-accent/40"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-border bg-popover">
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                {['Dark', 'CAT Yellow', 'Custom'].map((t, i) => (
                  <button
                    key={t}
                    className={cn(
                      'rounded-lg border p-3 text-center text-xs transition-colors',
                      i === 0 ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-accent/40 text-muted-foreground hover:bg-accent'
                    )}
                  >
                    <div className={cn('mx-auto mb-1.5 h-6 w-6 rounded-full', i === 0 ? 'bg-primary' : 'bg-accent')} />
                    {t}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-success" /> Security
              </CardTitle>
              <CardDescription>Account protection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full border-border bg-transparent text-sm">Change Password</Button>
              <Button variant="outline" className="w-full border-border bg-transparent text-sm">Enable Two-Factor Auth</Button>
              <div className="rounded-lg bg-accent/40 p-3 text-xs text-muted-foreground">
                Last login: Today at 06:14 AM from Bakersfield, CA
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NotifRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-accent/30">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
