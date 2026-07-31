import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Eye,
  Construction,
  Plus,
  Fuel,
  Wrench,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { fetchAssets, fetchSchedulingData } from '@/lib/api';
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

type SortKey = 'name' | 'machineId' | 'category' | 'rentalStatus' | 'healthScore' | 'engineHours';

export function Assets() {
  const [machinesList, setMachinesList] = useState<any[]>([]);
  const [operatorsList, setOperatorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const categoryIcon = (_category: string) => Construction;

  useEffect(() => {
    async function load() {
      try {
        const assetsData = await fetchAssets('mgr-01');
        const schedData = await fetchSchedulingData('mgr-01');
        
        const mapped = assetsData.map((a: any) => ({
          id: a.id,
          machineId: a.machineId,
          name: a.name,
          category: a.assetType,
          image: `https://picsum.photos/seed/cat-${a.id}/600/400`,
          rentalStatus: a.rentalStatus === 'active' ? 'Active' : 'Available',
          status: a.status === 'working' ? 'Working' : a.status === 'maintenance' ? 'Maintenance' : 'Idle',
          healthScore: a.healthScore,
          engineHours: a.engineHours,
          idleHours: a.idleHours,
          fuelLevel: 75,
          year: 2022,
          serialNumber: a.machineId,
          assignedOperatorId: a.assignedOperatorId,
          currentTask: a.status === 'working' ? 'Active assignment' : null
        }));

        setMachinesList(mapped);
        setOperatorsList(schedData.all_operators || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(machinesList.map((m) => m.category))),
    [machinesList]
  );

  const filtered = useMemo(() => {
    let result = machinesList.filter((m) => {
      const q = query.toLowerCase();
      const matchesQuery =
        m.name.toLowerCase().includes(q) ||
        m.machineId.toLowerCase().includes(q) ||
        m.serialNumber.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || m.rentalStatus === statusFilter;
      return matchesQuery && matchesCategory && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'healthScore' || sortKey === 'engineHours') {
        cmp = (a[sortKey] as number) - (b[sortKey] as number);
      } else {
        cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [machinesList, query, categoryFilter, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getOperatorName = (id: string | null) => {
    const op = operatorsList.find((o) => o.operator_id === id);
    return op ? op.name : 'Unassigned';
  };

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
        title="Assets"
        description="Monitor and manage your rental equipment fleet"
        icon={<Construction className="h-5 w-5" />}
        actions={
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> Add Asset
          </Button>
        }
      />

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or serial number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-border bg-accent/40 pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] border-border bg-accent/40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] border-border bg-accent/40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-border bg-popover">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Idle">Idle</SelectItem>
                <SelectItem value="On Maintenance">On Maintenance</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{filtered.length}</span> of{' '}
          {machinesList.length} machines
        </p>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Construction className="h-7 w-7" />}
          title="No machines found"
          description="Try adjusting your search or filters to find equipment."
          action={{ label: 'Clear filters', onClick: () => { setQuery(''); setCategoryFilter('all'); setStatusFilter('all'); } }}
        />
      ) : (
        <Card className="overflow-hidden border-border p-0">
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[70px]">Image</TableHead>
                  <TableHead>
                    <SortButton label="Machine" active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} />
                  </TableHead>
                  <TableHead>
                    <SortButton label="ID" active={sortKey === 'machineId'} dir={sortDir} onClick={() => toggleSort('machineId')} />
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <SortButton label="Category" active={sortKey === 'category'} dir={sortDir} onClick={() => toggleSort('category')} />
                  </TableHead>
                  <TableHead>
                    <SortButton label="Status" active={sortKey === 'rentalStatus'} dir={sortDir} onClick={() => toggleSort('rentalStatus')} />
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Operator</TableHead>
                  <TableHead>
                    <SortButton label="Health" active={sortKey === 'healthScore'} dir={sortDir} onClick={() => toggleSort('healthScore')} />
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">Engine Hrs</TableHead>
                  <TableHead className="hidden xl:table-cell">Fuel</TableHead>
                  <TableHead className="hidden lg:table-cell">Task</TableHead>
                  <TableHead className="w-[80px] text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m, i) => {
                  const CatIcon = categoryIcon(m.category);
                  return (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25, delay: i * 0.02 }}
                      className="group border-border transition-colors hover:bg-accent/30"
                    >
                      <TableCell>
                        <div className="relative h-10 w-14 overflow-hidden rounded-md bg-accent ring-1 ring-border">
                          <img src={m.image} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary sm:flex">
                            <CatIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{m.year} · {m.serialNumber}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">{m.machineId}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-foreground">{m.category}</span>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={m.rentalStatus} showIcon={false} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {m.assignedOperatorId ? (
                          <span className="text-sm text-foreground">{getOperatorName(m.assignedOperatorId)}</span>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-14">
                            <ProgressBar
                              value={m.healthScore}
                              size="sm"
                              tone={m.healthScore >= 85 ? 'success' : m.healthScore >= 70 ? 'warning' : 'danger'}
                            />
                          </div>
                          <span className={cn(
                            'text-xs font-medium tabular-nums',
                            m.healthScore >= 85 ? 'text-success' : m.healthScore >= 70 ? 'text-warning' : 'text-destructive'
                          )}>
                            {m.healthScore}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-sm tabular-nums text-foreground">{m.engineHours.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={cn(
                            'text-xs font-medium tabular-nums',
                            m.fuelLevel <= 30 ? 'text-destructive' : m.fuelLevel <= 50 ? 'text-warning' : 'text-foreground'
                          )}>
                            {m.fuelLevel}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {m.currentTask ? (
                          <span className="text-xs text-muted-foreground">{m.currentTask}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs italic text-muted-foreground/70">
                            <Wrench className="h-3 w-3" /> Idle
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary/15 hover:text-primary">
                          <Link to={`/assets/${m.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
      <ArrowUpDown className={cn('h-3 w-3', active && (dir === 'asc' ? 'rotate-0' : 'rotate-180'))} />
    </button>
  );
}
