import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Merchant } from '@/types/finance';
import {
    Building2,
    Check,
    ChevronsUpDown,
    Plus,
    Search,
    User,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface MerchantSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    merchants: Merchant[];
    error?: string;
    placeholder?: string;
    onMerchantCreated?: (merchant: Merchant) => void;
}

export function MerchantSelect({
    value,
    onValueChange,
    merchants,
    error,
    placeholder = 'Select merchant',
    onMerchantCreated,
}: MerchantSelectProps) {
    const [open, setOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // New Merchant Form State
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'company' | 'person'>('company');

    const filteredMerchants = useMemo(() => {
        if (!searchQuery) return merchants;
        return merchants.filter((m) =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [merchants, searchQuery]);

    const selectedMerchant = useMemo(
        () => merchants.find((m) => m.id.toString() === value),
        [merchants, value],
    );

    const handleCreate = async () => {
        if (!newName) return;

        setIsCreating(true);
        try {
            const payload = {
                name: newName,
                type: newType,
            };

            const response = await api.post('/merchants', payload);
            const newMerchant = response.data.data;

            toast.success('Merchant created');
            setIsDialogOpen(false);
            setNewName('');
            setNewType('company');

            if (onMerchantCreated) {
                onMerchantCreated(newMerchant);
            }
            onValueChange(newMerchant.id.toString());
            setOpen(false);
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
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn(
                                'w-full justify-between px-3 font-normal',
                                !value && 'text-muted-foreground',
                                error && 'border-red-500',
                            )}
                        >
                            {selectedMerchant ? (
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Avatar className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
                                        {selectedMerchant.image_url && (
                                            <AvatarImage
                                                src={selectedMerchant.image_url}
                                                alt={selectedMerchant.name}
                                            />
                                        )}
                                        <AvatarFallback className="rounded bg-slate-100 dark:bg-slate-800">
                                            {selectedMerchant.type ===
                                            'company' ? (
                                                <Building2 className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                                            ) : (
                                                <User className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">
                                        {selectedMerchant.name}
                                    </span>
                                </div>
                            ) : (
                                placeholder
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
                        <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search merchants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[300px]">
                            <div className="p-1">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                    onClick={() => {
                                        setIsDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create new merchant...
                                </Button>
                                <div className="mt-1 space-y-1">
                                    {filteredMerchants.length === 0 && (
                                        <p className="py-6 text-center text-sm text-muted-foreground">
                                            No merchants found.
                                        </p>
                                    )}
                                    {filteredMerchants.map((merchant) => (
                                        <button
                                            key={merchant.id}
                                            className={cn(
                                                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                                value ===
                                                    merchant.id.toString() &&
                                                    'bg-accent text-accent-foreground',
                                            )}
                                            onClick={() => {
                                                onValueChange(
                                                    merchant.id.toString(),
                                                );
                                                setOpen(false);
                                            }}
                                        >
                                            <Avatar className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 dark:bg-slate-800">
                                                {merchant.image_url && (
                                                    <AvatarImage
                                                        src={merchant.image_url}
                                                        alt={merchant.name}
                                                    />
                                                )}
                                                <AvatarFallback className="rounded bg-slate-100 dark:bg-slate-800">
                                                    {merchant.type ===
                                                    'company' ? (
                                                        <Building2 className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                                                    ) : (
                                                        <User className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="truncate">
                                                {merchant.name}
                                            </span>
                                            {value ===
                                                merchant.id.toString() && (
                                                <Check className="ml-auto h-4 w-4 opacity-50" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Merchant</DialogTitle>
                        <DialogDescription>
                            Add a new store, company, or person to your
                            contacts.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="merchant-name">Name</Label>
                            <Input
                                id="merchant-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g., Apple Store, John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="merchant-type">Type</Label>
                            <Select
                                value={newType}
                                onValueChange={(val: 'company' | 'person') =>
                                    setNewType(val)
                                }
                            >
                                <SelectTrigger id="merchant-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="company">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            Company / Store
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="person">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Person
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                {newType === 'company' ? (
                                    <Building2 className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                ) : (
                                    <User className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                )}
                            </div>
                            <div className="text-center">
                                <p className="font-semibold">
                                    {newName || 'Merchant Name'}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {newType}
                                </p>
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
                            disabled={isCreating || !newName}
                        >
                            {isCreating ? 'Creating...' : 'Create Merchant'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
