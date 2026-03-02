import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';
import type { Merchant } from '@/types/finance';
import { Building2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type ValidationErrorResponse = {
    errors?: Record<string, string>;
};

const hasValidationErrors = (
    error: unknown,
): error is { response: { data?: ValidationErrorResponse } } => {
    if (typeof error !== 'object' || error === null) {
        return false;
    }

    const maybeResponse = (error as { response?: unknown }).response;
    if (typeof maybeResponse !== 'object' || maybeResponse === null) {
        return false;
    }

    const maybeData = (maybeResponse as { data?: unknown }).data;
    if (typeof maybeData !== 'object' || maybeData === null) {
        return false;
    }

    return 'errors' in maybeData;
};

interface MerchantFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    merchants: Merchant[];
    merchant?: Merchant | null;
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

export function MerchantFormModal({
    open,
    onOpenChange,
    merchants,
    merchant,
    onSuccess,
    trigger,
}: MerchantFormModalProps) {
    const isEdit = !!merchant;
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [name, setName] = useState('');
    const [type, setType] = useState<'company' | 'person'>('company');
    const [imagePath, setImagePath] = useState('');
    const [isSecret, setIsSecret] = useState(false);
    const [coverMerchantId, setCoverMerchantId] = useState('');

    useEffect(() => {
        if (open) {
            setName(merchant?.name || '');
            setType(merchant?.type || 'company');
            setImagePath(merchant?.image_path || '');
            setIsSecret(merchant?.is_secret || false);
            setCoverMerchantId(
                merchant?.cover_merchant_id
                    ? merchant.cover_merchant_id.toString()
                    : '',
            );
            setErrors({});
        }
    }, [open, merchant]);

    const potentialCovers = merchants.filter(
        (m) =>
            m.type === type &&
            !m.is_secret &&
            (!isEdit || m.id !== merchant.id),
    );

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setIsSaving(true);
        setErrors({});

        try {
            const payload: Record<string, unknown> = {
                name,
                type,
                is_secret: isSecret,
            };

            if (imagePath) payload.image_path = imagePath;
            if (isSecret && coverMerchantId) {
                payload.cover_merchant_id = parseInt(coverMerchantId);
            }

            if (isEdit) {
                await api.patch(`/merchants/${merchant.id}`, payload);
                toast.success('Merchant updated successfully!');
            } else {
                await api.post('/merchants', payload);
                toast.success('Merchant created successfully!');
            }

            onOpenChange(false);
            onSuccess();
        } catch (error: unknown) {
            if (hasValidationErrors(error) && error.response.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                console.error(error);
                toast.error(
                    isEdit
                        ? 'Failed to update merchant'
                        : 'Failed to create merchant',
                );
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSave}>
                    <DialogHeader>
                        <DialogTitle>
                            {isEdit ? 'Edit Merchant' : 'New Merchant'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? 'Update the details for this merchant.'
                                : 'Add a store, company, or person you transact with.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Migros, Coop, John Smith"
                                required
                                maxLength={255}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Type *</Label>
                            <Select
                                value={type}
                                onValueChange={(value: 'company' | 'person') =>
                                    setType(value)
                                }
                            >
                                <SelectTrigger>
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
                            {errors.type && (
                                <p className="text-sm text-red-500">
                                    {errors.type}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image_path">
                                Image URL (Optional)
                            </Label>
                            <Input
                                id="image_path"
                                value={imagePath}
                                onChange={(e) => setImagePath(e.target.value)}
                                placeholder="https://example.com/logo.png"
                                maxLength={500}
                                type="url"
                            />
                            {errors.image_path && (
                                <p className="text-sm text-red-500">
                                    {errors.image_path}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                URL to a logo or image for this merchant
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-fuchsia-500 dark:text-fuchsia-400">
                                        🔒 Secret Merchant
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Hide this merchant and its transactions
                                    </p>
                                </div>
                                <Switch
                                    checked={isSecret}
                                    onCheckedChange={(checked) => {
                                        setIsSecret(checked);
                                        if (!checked) setCoverMerchantId('');
                                    }}
                                    className="data-[state=checked]:bg-fuchsia-500"
                                />
                            </div>

                            {isSecret && (
                                <div className="animate-in space-y-2 pt-2 fade-in slide-in-from-top-2">
                                    <Label className="text-fuchsia-500 dark:text-fuchsia-400">
                                        Cover Merchant (Optional)
                                    </Label>
                                    <p className="mb-2 text-xs text-muted-foreground">
                                        When not in secret mode, transactions
                                        will masquerade under this merchant.
                                    </p>
                                    <Select
                                        value={coverMerchantId || 'none'}
                                        onValueChange={(val) =>
                                            setCoverMerchantId(
                                                val === 'none' ? '' : val,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="border-fuchsia-500/50 focus:ring-fuchsia-500/50">
                                            <SelectValue placeholder="Select a safe cover merchant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                No Cover (Hidden entirely)
                                            </SelectItem>
                                            {potentialCovers.map((m) => (
                                                <SelectItem
                                                    key={m.id}
                                                    value={m.id.toString()}
                                                >
                                                    {m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Preview</Label>
                            <div className="flex h-20 items-center gap-3 rounded-lg border p-4">
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                                        type === 'company'
                                            ? 'bg-purple-100'
                                            : 'bg-green-100'
                                    }`}
                                >
                                    {imagePath ? (
                                        <img
                                            src={imagePath}
                                            alt={name}
                                            className="h-10 w-10 rounded object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display =
                                                    'none';
                                            }}
                                        />
                                    ) : type === 'company' ? (
                                        <Building2 className="h-6 w-6 text-purple-600" />
                                    ) : (
                                        <User className="h-6 w-6 text-green-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        {name || 'Merchant Name'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {type === 'company'
                                            ? 'Company'
                                            : 'Person'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving || !name}>
                            {isSaving
                                ? 'Saving...'
                                : isEdit
                                  ? 'Save Changes'
                                  : 'Create Merchant'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
