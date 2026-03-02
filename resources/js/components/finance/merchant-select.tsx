import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Merchant } from '@/types/finance';
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface MerchantSelectSpecialOption {
    value: string;
    label: string;
}

interface MerchantSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    merchants: Merchant[];
    error?: string;
    placeholder?: string;
    onMerchantCreated?: (merchant: Merchant) => void;
    allowCreate?: boolean;
    specialOptions?: MerchantSelectSpecialOption[];
    triggerClassName?: string;
    disabled?: boolean;
}

export function MerchantSelect({
    value,
    onValueChange,
    merchants,
    error,
    placeholder = 'Select merchant',
    onMerchantCreated,
    allowCreate = true,
    specialOptions,
    triggerClassName,
    disabled = false,
}: MerchantSelectProps) {
    const [open, setOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<'company' | 'person'>('company');
    const [searchQuery, setSearchQuery] = useState('');
    const [locallyCreated, setLocallyCreated] = useState<Merchant[]>([]);

    useEffect(() => {
        if (!open) {
            setSearchQuery('');
        }
    }, [open]);

    const allMerchants = useMemo(() => {
        const byId = new Map<number, Merchant>();
        for (const m of merchants) byId.set(m.id, m);
        for (const m of locallyCreated) byId.set(m.id, m);
        return Array.from(byId.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
        );
    }, [merchants, locallyCreated]);

    const selectedSpecial = useMemo(() => {
        return specialOptions?.find((o) => o.value === value);
    }, [specialOptions, value]);

    const selectedMerchant = useMemo(() => {
        return allMerchants.find((m) => m.id.toString() === value) ?? null;
    }, [allMerchants, value]);

    const filteredMerchants = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return allMerchants;
        return allMerchants.filter((m) => m.name.toLowerCase().includes(q));
    }, [allMerchants, searchQuery]);

    const handleCreate = async () => {
        if (!name) return;

        setIsCreating(true);
        try {
            const payload = {
                name,
                type,
            };

            const response = await api.post('/merchants', payload);
            const newMerchant = response.data.data;

            toast.success('Merchant created');
            setIsDialogOpen(false);
            setName('');
            setType('company');

            setLocallyCreated((prev) => {
                const byId = new Map(prev.map((m) => [m.id, m]));
                byId.set(newMerchant.id, newMerchant);
                return Array.from(byId.values());
            });

            if (onMerchantCreated) {
                onMerchantCreated(newMerchant);
            }
            onValueChange(newMerchant.id.toString());
        } catch (error) {
            console.error(error);
            toast.error('Failed to create merchant');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            <div className="space-y-1">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            disabled={disabled}
                            className={cn(
                                'w-full justify-between px-3 font-normal',
                                !value && 'text-muted-foreground',
                                error && 'border-red-500',
                                triggerClassName,
                            )}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            {selectedSpecial ? (
                                <span className="truncate">
                                    {selectedSpecial.label}
                                </span>
                            ) : selectedMerchant ? (
                                <span className="truncate">
                                    {selectedMerchant.name}
                                </span>
                            ) : (
                                placeholder
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-full min-w-[var(--radix-popover-trigger-width)] p-0"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search merchants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
                            <div className="p-1">
                                {allowCreate && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full justify-start font-medium text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"
                                        onClick={() => {
                                            setIsDialogOpen(true);
                                            setOpen(false);
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create new merchant...
                                    </Button>
                                )}

                                {specialOptions &&
                                    specialOptions.length > 0 && (
                                        <div
                                            className={cn(
                                                allowCreate && 'mt-1 border-t',
                                            )}
                                        >
                                            {specialOptions.map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    className={cn(
                                                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                                        value === opt.value &&
                                                            'bg-accent text-accent-foreground',
                                                    )}
                                                    onClick={() => {
                                                        onValueChange(
                                                            opt.value,
                                                        );
                                                        setOpen(false);
                                                    }}
                                                >
                                                    <span className="truncate">
                                                        {opt.label}
                                                    </span>
                                                    {value === opt.value && (
                                                        <Check className="ml-auto h-4 w-4 opacity-50" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                <div className="mt-1 space-y-1">
                                    {filteredMerchants.length === 0 && (
                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                            No merchants found.
                                        </p>
                                    )}

                                    {filteredMerchants.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            className={cn(
                                                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                                value === m.id.toString() &&
                                                    'bg-accent text-accent-foreground',
                                            )}
                                            onClick={() => {
                                                onValueChange(m.id.toString());
                                                setOpen(false);
                                            }}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate font-medium">
                                                    {m.name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {m.type === 'person'
                                                        ? 'Person'
                                                        : 'Company'}
                                                </div>
                                            </div>

                                            {value === m.id.toString() && (
                                                <Check className="ml-auto h-4 w-4 opacity-50" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Merchant</DialogTitle>
                        <DialogDescription>
                            Add a new merchant or person.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="merchant-name">Name</Label>
                            <Input
                                id="merchant-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Apple Store, John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="merchant-type">Type</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={
                                        type === 'company'
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                    className="flex-1"
                                    onClick={() => setType('company')}
                                >
                                    Company
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        type === 'person'
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                    className="flex-1"
                                    onClick={() => setType('person')}
                                >
                                    Person
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isCreating || !name}
                        >
                            {isCreating ? 'Creating...' : 'Create Merchant'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
