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
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { IconPicker } from '@/components/ui/icon-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/finance';
import { Folder } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type CategoryPayload = {
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string;
    is_secret: boolean;
    parent_id: number | null;
    cover_category_id: number | null;
};

const PRESET_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#64748b', // slate
];

interface CategoryFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    category?: Category | null;
    type?: 'income' | 'expense';
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

export function CategoryFormModal({
    open,
    onOpenChange,
    categories,
    category,
    type,
    onSuccess,
    trigger,
}: CategoryFormModalProps) {
    const isEdit = !!category;
    const [isSaving, setIsSaving] = useState(false);

    // Initialize state properly based on whether we are editing or creating
    const [newName, setNewName] = useState('');
    const [newParentId, setNewParentId] = useState<string>('none');
    const [newColor, setNewColor] = useState(PRESET_COLORS[10]);
    const [newIcon, setNewIcon] = useState('Receipt');
    const [selectedType, setSelectedType] = useState<'income' | 'expense'>(
        'expense',
    );
    const [isSecret, setIsSecret] = useState(false);
    const [coverCategoryId, setCoverCategoryId] = useState<string>('none');

    // Reset form when modal opens or category changes
    useEffect(() => {
        if (open) {
            setNewName(category?.name || '');
            setNewParentId(
                category?.parent_id ? category.parent_id.toString() : 'none',
            );
            setNewColor(category?.color || PRESET_COLORS[10]);
            setNewIcon(category?.icon || 'Receipt');
            setSelectedType(category?.type || type || 'expense');
            setIsSecret(category?.is_secret || false);
            setCoverCategoryId(
                category?.cover_category_id
                    ? category.cover_category_id.toString()
                    : 'none',
            );
        }
    }, [open, category, type]);

    // If type is provided via props, use it. Otherwise, allow selection (or default)
    // Actually, usually we might want to let user choose type if not enforced
    // But for now, let's stick to the current logic: if type prop is passed, it filters potential parents

    // Calculate potential parents based on the *current* selected type (or forced type).
    // Do not allow a category to be its own parent.
    const activeType = type || selectedType;

    const potentialParents = categories
        .filter((c) => c.type === activeType)
        .filter((c) => !c.parent_id)
        .filter((c) => !isEdit || c.id !== category.id);

    const potentialCovers = categories.filter(
        (c) =>
            c.type === activeType &&
            !c.is_secret &&
            (!isEdit || c.id !== category.id),
    );

    const topLevelCovers = potentialCovers.filter((c) => !c.parent_id);
    const subcategoryCovers = potentialCovers.filter((c) => c.parent_id);

    const handleSave = async () => {
        if (!newName) return;

        setIsSaving(true);
        try {
            const payload: CategoryPayload = {
                name: newName,
                type: activeType,
                color: newColor,
                icon: newIcon,
                is_secret: isSecret,
                parent_id:
                    newParentId !== 'none' ? parseInt(newParentId) : null,
                cover_category_id:
                    isSecret && coverCategoryId !== 'none'
                        ? parseInt(coverCategoryId)
                        : null,
            };

            if (isEdit) {
                await api.patch(`/categories/${category.id}`, payload);
                toast.success('Category updated');
            } else {
                await api.post('/categories', payload);
                toast.success('Category created');
            }

            onOpenChange(false);
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error(
                isEdit
                    ? 'Failed to update category'
                    : 'Failed to create category',
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Category' : 'Create New Category'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Update the details for this category.'
                            : 'Define a new category to organize your finances.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex gap-6">
                        <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="category-name">Name</Label>
                                <Input
                                    id="category-name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g., Groceries"
                                />
                            </div>

                            {!type && (
                                <div className="space-y-2">
                                    <Label htmlFor="category-type">Type</Label>
                                    <Select
                                        value={selectedType}
                                        onValueChange={(
                                            v: 'income' | 'expense',
                                        ) => {
                                            setSelectedType(v);
                                            setNewParentId('none'); // Reset parent if type changes
                                        }}
                                    >
                                        <SelectTrigger>
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

                            <div className="space-y-2">
                                <Label htmlFor="category-parent">
                                    Parent Category
                                </Label>
                                <Select
                                    value={newParentId}
                                    onValueChange={setNewParentId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="None (Top level)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            None (Top level)
                                        </SelectItem>
                                        {potentialParents.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.id.toString()}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <DynamicIcon
                                                        name={cat.icon}
                                                        fallback={Folder}
                                                        className="h-4 w-4 text-muted-foreground"
                                                    />
                                                    <span>{cat.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-4 rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-fuchsia-500 dark:text-fuchsia-400">
                                            🔒 Secret Category
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Hide this category and its
                                            transactions
                                        </p>
                                    </div>
                                    <Switch
                                        checked={isSecret}
                                        onCheckedChange={(checked) => {
                                            setIsSecret(checked);
                                            if (!checked)
                                                setCoverCategoryId('none');
                                        }}
                                        className="data-[state=checked]:bg-fuchsia-500"
                                    />
                                </div>

                                {isSecret && (
                                    <div className="animate-in space-y-2 pt-2 fade-in slide-in-from-top-2">
                                        <Label className="text-fuchsia-500 dark:text-fuchsia-400">
                                            Cover Category (Optional)
                                        </Label>
                                        <p className="mb-2 text-xs text-muted-foreground">
                                            When not in secret mode, this
                                            category will masquerade as the
                                            selected cover category.
                                        </p>
                                        <Select
                                            value={coverCategoryId}
                                            onValueChange={setCoverCategoryId}
                                        >
                                            <SelectTrigger className="border-fuchsia-500/50 focus:ring-fuchsia-500/50">
                                                <SelectValue placeholder="Select a safe cover" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    No Cover (Hidden entirely)
                                                </SelectItem>
                                                {topLevelCovers.length > 0 && (
                                                    <SelectGroup>
                                                        <SelectLabel>
                                                            Main Categories
                                                        </SelectLabel>
                                                        {topLevelCovers.map(
                                                            (cat) => (
                                                                <SelectItem
                                                                    key={cat.id}
                                                                    value={cat.id.toString()}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <DynamicIcon
                                                                            name={
                                                                                cat.icon
                                                                            }
                                                                            fallback={
                                                                                Folder
                                                                            }
                                                                            className="h-4 w-4 text-muted-foreground"
                                                                        />
                                                                        <span>
                                                                            {
                                                                                cat.name
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectGroup>
                                                )}
                                                {subcategoryCovers.length >
                                                    0 && (
                                                    <SelectGroup>
                                                        <SelectLabel>
                                                            Subcategories
                                                        </SelectLabel>
                                                        {subcategoryCovers.map(
                                                            (cat) => (
                                                                <SelectItem
                                                                    key={cat.id}
                                                                    value={cat.id.toString()}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <DynamicIcon
                                                                            name={
                                                                                cat.icon
                                                                            }
                                                                            fallback={
                                                                                Folder
                                                                            }
                                                                            className="h-4 w-4 text-muted-foreground"
                                                                        />
                                                                        <span>
                                                                            {
                                                                                cat.name
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectGroup>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <Label>Icon & Preview</Label>
                            <IconPicker
                                value={newIcon}
                                onChange={setNewIcon}
                                color={newColor}
                            />
                            <div className="mt-2 flex flex-col items-center gap-1">
                                <div
                                    className="flex h-8 items-center gap-2 rounded-full px-3 text-xs font-medium text-white shadow-sm"
                                    style={{ backgroundColor: newColor }}
                                >
                                    <DynamicIcon
                                        name={newIcon}
                                        fallback={Folder}
                                        className="h-3.5 w-3.5"
                                    />
                                    {newName || 'Category Preview'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Category Color</Label>
                        <div className="grid grid-cols-9 gap-2">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={cn(
                                        'h-8 w-8 rounded-full border-2 transition-all hover:scale-110',
                                        newColor === color
                                            ? 'scale-110 border-slate-900 dark:border-white'
                                            : 'border-transparent',
                                    )}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setNewColor(color)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !newName}
                    >
                        {isSaving
                            ? 'Saving...'
                            : isEdit
                              ? 'Save Changes'
                              : 'Create Category'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
