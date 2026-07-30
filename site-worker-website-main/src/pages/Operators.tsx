import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Users,
  Plus,
  Eye,
  Phone,
  Award,
  Clock,
} from 'lucide-react';
import { fetchSchedulingData, fetchOperations } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { ProgressBar } from '@/components/common/ProgressBar';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function Operators() {
  const [operatorsList, setOperatorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const schedData = await fetchSchedulingData('mgr-01');
        const opsData = await fetchOperations('mgr-01');

        const mapped = (schedData.all_operators || []).map((o: any) => {
          const activeTask = opsData.find((op: any) => op.operatorId === o.operator_id && op.status === 'in_progress');
          return {
            id: o.operator_id,
            employeeId: o.license_number || `EMP-${o.operator_id.slice(0, 4).upper()}`,
            name: o.name,
            role: o.certified_equipment_types?.length ? `${o.certified_equipment_types.join(', ')} Operator` : 'General Operator',
            avatar: `https://i.pravatar.cc/150?u=${o.operator_id}`,
            assignedMachineId: activeTask ? activeTask.machineId : null,
            currentTask: activeTask ? activeTask.task : null,
            shift: o.status === 'on_duty' ? 'On Shift' : 'Off Shift',
            experienceYears: o.experience_years,
            safetyScore: 95,
            availability: activeTask ? 'On Task' : o.status === 'on_duty' ? 'Available' : 'Unavailable',
          };
        });

        setOperatorsList(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return operatorsList.filter((o) => {
      const q = query.toLowerCase();
      const matchesQuery =
        o.name.toLowerCase().includes(q) ||
        o.employeeId.toLowerCase().includes(q) ||
        o.role.toLowerCase().includes(q);
      const matchesShift = shiftFilter === 'all' || o.shift === shiftFilter;
      const matchesAvail = availabilityFilter === 'all' || o.availability === availabilityFilter;
      return matchesQuery && matchesShift && matchesAvail;
    });
  }, [operatorsList, query, shiftFilter, availabilityFilter]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operators"
        description="Manage your equipment operators and shift assignments"
        icon={<Users className="h-5 w-5" />}
        actions={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> Add Operator
          </Button>
        }
      />

      <Card className="border-border">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, employee ID, or role..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-border bg-accent/40 pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger className="w-[140px] border-border bg-accent/40">
                <SelectValue placeholder="Shift" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="On Shift">On Shift</SelectItem>
                <SelectItem value="Off Shift">Off Shift</SelectItem>
                <SelectItem value="Break">Break</SelectItem>
                <SelectItem value="Off Sick">Off Sick</SelectItem>
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-[150px] border-border bg-accent/40">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="On Task">On Task</SelectItem>
                <SelectItem value="Unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{filtered.length}</span> of {operatorsList.length} operators
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No operators found"
          description="Try adjusting your search or filters."
          action={{ label: 'Clear filters', onClick: () => { setQuery(''); setShiftFilter('all'); setAvailabilityFilter('all'); } }}
        />
      ) : (
        <Card className="overflow-hidden border-border p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[60px]">Photo</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead className="hidden md:table-cell">Employee ID</TableHead>
                  <TableHead className="hidden lg:table-cell">Assigned Machine</TableHead>
                  <TableHead className="hidden xl:table-cell">Current Task</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead className="hidden md:table-cell">Experience</TableHead>
                  <TableHead>Safety</TableHead>
                  <TableHead className="hidden lg:table-cell">Availability</TableHead>
                  <TableHead className="w-[80px] text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o, i) => (
                  <motion.tr
                    key={o.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25, delay: i * 0.02 }}
                    className="border-border transition-colors hover:bg-accent/30"
                  >
                    <TableCell>
                      <img src={o.avatar} alt={o.name} className="h-9 w-9 rounded-full object-cover ring-1 ring-border" />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.role}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">{o.employeeId}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {o.assignedMachineId ? (
                        <span className="text-sm text-foreground">Assigned</span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {o.currentTask ? (
                        <span className="text-xs text-muted-foreground">{o.currentTask}</span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground/70">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={o.shift} showIcon={false} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm tabular-nums text-foreground">{o.experienceYears} yrs</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12">
                          <ProgressBar value={o.safetyScore} size="sm" tone={o.safetyScore >= 95 ? 'success' : o.safetyScore >= 85 ? 'primary' : 'warning'} />
                        </div>
                        <span className={cn(
                          'text-xs font-medium tabular-nums',
                          o.safetyScore >= 95 ? 'text-success' : o.safetyScore >= 85 ? 'text-primary' : 'text-warning'
                        )}>{o.safetyScore}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <StatusChip status={o.availability} showIcon={false} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/15 hover:text-primary">
                        <Link to={`/operators/${o.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
