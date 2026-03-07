import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
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
import { useState } from 'react';
import { toast } from 'sonner';

interface QuickCreateMerchantModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: (merchant: Merchant) => void;
}

export function QuickCreateMerchantModal({
    open,
    onOpenChange,
    onCreated,
}: QuickCreateMerchantModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<'company' | 'person'>('company');
    const [isSecret, setIsSecret] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const reset = () => {
        setName('');
        setType('company');
        setIsSecret(false);
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});
        try {
            const response = await api.post('/merchants', {
                name,
                type,
                is_secret: isSecret,
            });
            const created: Merchant = response.data.data;
            toast.success(`Merchant "${created.name}" created!`);
            onCreated(created);
            reset();
            onOpenChange(false);
        } catch (err: unknown) {
            const e = err as {
                response?: { data?: { errors?: Record<string, string> } };
            };
            if (e.response?.data?.errors) {
                setErrors(e.response.data.errors);
            } else {
                toast.error('Failed to create merchant');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) reset();
                onOpenChange(v);
            }}
        >
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>New Merchant</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Name */}
                    <div className="space-y-1">
                        <Label htmlFor="merchant-name">Name *</Label>
                        <Input
                            id="merchant-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Amazon"
                            required
                            autoFocus
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Type */}
                    <div className="space-y-1">
                        <Label htmlFor="merchant-type">Type</Label>
                        <Select
                            value={type}
                            onValueChange={(v: 'company' | 'person') =>
                                setType(v)
                            }
                        >
                            <SelectTrigger id="merchant-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="company">Company</SelectItem>
                                <SelectItem value="person">Person</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Is Secret */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="merchant-secret"
                            checked={isSecret}
                            onCheckedChange={(v) => setIsSecret(!!v)}
                        />
                        <Label
                            htmlFor="merchant-secret"
                            className="cursor-pointer"
                        >
                            🔒 Secret merchant
                        </Label>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                reset();
                                onOpenChange(false);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? 'Creating…' : 'Create Merchant'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
