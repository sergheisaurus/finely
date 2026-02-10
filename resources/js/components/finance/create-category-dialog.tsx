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
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/finance';
import { Tag } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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

interface CreateCategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    type?: 'income' | 'expense';
    onCategoryCreated: (category: Category) => void;
    trigger?: React.ReactNode;
}

export function CreateCategoryDialog({
    open,
    onOpenChange,
    categories,
    type,
    onCategoryCreated,
    trigger,
}: CreateCategoryDialogProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newParentId, setNewParentId] = useState<string>('none');
    const [newColor, setNewColor] = useState(PRESET_COLORS[10]); // Default blue
    const [newIcon, setNewIcon] = useState('Tag');
    const [selectedType, setSelectedType] = useState<'income' | 'expense'>(
        type || 'expense',
    );

    // If type is provided via props, use it. Otherwise, allow selection (or default)
    // Actually, usually we might want to let user choose type if not enforced
    // But for now, let's stick to the current logic: if type prop is passed, it filters potential parents

    // Calculate potential parents based on the *current* selected type (or forced type)
    const activeType = type || selectedType;

    const potentialParents = categories
        .filter((c) => c.type === activeType)
        .filter((c) => !c.parent_id);

    const handleCreate = async () => {
        if (!newName) return;

        setIsCreating(true);
        try {
            const payload: any = {
                name: newName,
                type: activeType,
                color: newColor,
                icon: newIcon,
            };

            if (newParentId !== 'none') {
                payload.parent_id = parseInt(newParentId);
            }

            const response = await api.post('/categories', payload);
            const newCategory = response.data.data;

            toast.success('Category created');
            onOpenChange(false);

            // Reset form
            setNewName('');
            setNewParentId('none');
            setNewColor(PRESET_COLORS[10]);
            setNewIcon('Tag');

            // If we are not enforcing type, maybe reset it? Nah.

            onCategoryCreated(newCategory);
        } catch (error) {
            console.error(error);
            toast.error('Failed to create category');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Category</DialogTitle>
                    <DialogDescription>
                        Define a new category to organize your finances.
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
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                        fallback={Tag}
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
                        disabled={isCreating}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isCreating || !newName}
                    >
                        {isCreating ? 'Creating...' : 'Create Category'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
