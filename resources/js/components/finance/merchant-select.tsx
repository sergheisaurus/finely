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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import type { Merchant } from '@/types/finance';
import { Plus } from 'lucide-react';
import { useState } from 'react';
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<'company' | 'person'>('company');

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
                <Select
                    value={value}
                    onValueChange={(val) => {
                        if (val === 'new') {
                            setIsDialogOpen(true);
                        } else {
                            onValueChange(val);
                        }
                    }}
                >
                    <SelectTrigger className={error ? 'border-red-500' : ''}>
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            value="new"
                            className="mb-1 border-b font-medium text-blue-600 focus:bg-blue-50 focus:text-blue-700"
                        >
                            <div className="flex items-center">
                                <Plus className="mr-2 h-4 w-4" />
                                Create new merchant...
                            </div>
                        </SelectItem>
                        {merchants.map((merchant) => (
                            <SelectItem
                                key={merchant.id}
                                value={merchant.id.toString()}
                            >
                                {merchant.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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
                            <Select
                                value={type}
                                onValueChange={(val: 'company' | 'person') =>
                                    setType(val)
                                }
                            >
                                <SelectTrigger id="merchant-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="company">
                                        Company
                                    </SelectItem>
                                    <SelectItem value="person">
                                        Person
                                    </SelectItem>
                                </SelectContent>
                            </Select>
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
