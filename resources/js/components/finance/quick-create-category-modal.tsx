import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
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
import type { Category } from '@/types/finance';
import { Folder } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface QuickCreateCategoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Pre-fill the type (income/expense) from the transaction context */
    defaultType?: 'income' | 'expense';
    /** When true, the type selector is hidden/locked */
    lockType?: boolean;
    /** All existing categories - used to populate the parent dropdown */
    existingCategories: Category[];
    onCreated: (category: Category) => void;
}

export function QuickCreateCategoryModal({
    open,
    onOpenChange,
    defaultType = 'expense',
    lockType = false,
    existingCategories,
    onCreated,
}: QuickCreateCategoryModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState<'income' | 'expense'>(defaultType);
    const [isSecret, setIsSecret] = useState(false);
    const [isParent, setIsParent] = useState(true);
    const [parentId, setParentId] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const parentCategories = existingCategories.filter(
        (c) => c.type === type && c.is_parent,
    );

    const reset = () => {
        setName('');
        setType(defaultType);
        setIsSecret(false);
        setIsParent(true);
        setParentId('');
        setColor('#6366f1');
        setErrors({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});
        try {
            const payload: Record<string, unknown> = {
                name,
                type,
                is_secret: isSecret,
                is_parent: isParent,
                color,
            };
            if (!isParent && parentId) {
                payload.parent_id = parseInt(parentId);
            }
            const response = await api.post('/categories', payload);
            const created: Category = response.data.data;
            toast.success(`Category "${created.name}" created!`);
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
                toast.error('Failed to create category');
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Category</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Name */}
                    <div className="space-y-1">
                        <Label htmlFor="cat-name">Name *</Label>
                        <Input
                            id="cat-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Groceries"
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
                    {lockType ? (
                        <div className="space-y-1">
                            <Label>Type</Label>
                            <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm">
                                {type === 'income' ? 'Income' : 'Expense'}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <Label htmlFor="cat-type">Type *</Label>
                            <Select
                                value={type}
                                onValueChange={(v: 'income' | 'expense') => {
                                    setType(v);
                                    setParentId('');
                                }}
                            >
                                <SelectTrigger id="cat-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="expense">
                                        Expense
                                    </SelectItem>
                                    <SelectItem value="income">
                                        Income
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Is Parent */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="cat-is-parent"
                            checked={isParent}
                            onCheckedChange={(v) => {
                                setIsParent(!!v);
                                if (v) setParentId('');
                            }}
                        />
                        <Label
                            htmlFor="cat-is-parent"
                            className="cursor-pointer"
                        >
                            Main category (no parent)
                        </Label>
                    </div>

                    {/* Parent selector - only when NOT a parent */}
                    {!isParent && (
                        <div className="space-y-1">
                            <Label htmlFor="cat-parent">Parent Category</Label>
                            <Select
                                value={parentId}
                                onValueChange={setParentId}
                            >
                                <SelectTrigger id="cat-parent">
                                    <SelectValue placeholder="Select parent…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {parentCategories.map((c) => (
                                        <SelectItem
                                            key={c.id}
                                            value={c.id.toString()}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                                                    style={{
                                                        backgroundColor:
                                                            c.color,
                                                    }}
                                                >
                                                    <DynamicIcon
                                                        name={c.icon}
                                                        fallback={Folder}
                                                        className="h-3 w-3 text-white"
                                                    />
                                                </div>
                                                <span className="truncate">
                                                    {c.name}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.parent_id && (
                                <p className="text-sm text-red-500">
                                    {errors.parent_id}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Color */}
                    <div className="space-y-1">
                        <Label htmlFor="cat-color">Color</Label>
                        <div className="flex items-center gap-3">
                            <input
                                id="cat-color"
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="h-9 w-14 cursor-pointer rounded border border-input bg-background"
                            />
                            <span className="text-sm text-muted-foreground">
                                {color}
                            </span>
                        </div>
                    </div>

                    {/* Is Secret */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="cat-secret"
                            checked={isSecret}
                            onCheckedChange={(v) => setIsSecret(!!v)}
                        />
                        <Label htmlFor="cat-secret" className="cursor-pointer">
                            🔒 Secret category
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
                            {isSubmitting ? 'Creating…' : 'Create Category'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
