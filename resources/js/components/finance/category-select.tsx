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
import type { Category } from '@/types/finance';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CategorySelectProps {
    value: string;
    onValueChange: (value: string) => void;
    categories: Category[];
    type?: 'income' | 'expense';
    error?: string;
    placeholder?: string;
    onCategoryCreated?: (category: Category) => void;
}

export function CategorySelect({
    value,
    onValueChange,
    categories,
    type,
    error,
    placeholder = 'Select category',
    onCategoryCreated,
}: CategorySelectProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryParent, setNewCategoryParent] = useState<string>('none');

    // Filter categories based on type if provided
    const filteredCategories = type
        ? categories.filter((c) => c.type === type)
        : categories;

    // Potential parents are only top-level categories of the same type
    const potentialParents = filteredCategories.filter((c) => !c.parent_id);

    const handleCreate = async () => {
        if (!newCategoryName) return;

        setIsCreating(true);
        try {
            const payload: {
                name: string;
                type: string;
                color: string;
                parent_id?: number;
            } = {
                name: newCategoryName,
                type: type || 'expense', // Default to expense if not specified
                color: '#64748b', // Default color
            };

            if (newCategoryParent !== 'none') {
                payload.parent_id = parseInt(newCategoryParent);
            }

            const response = await api.post('/categories', payload);
            const newCategory = response.data.data;

            toast.success('Category created');
            setIsDialogOpen(false);
            setNewCategoryName('');
            setNewCategoryParent('none');

            if (onCategoryCreated) {
                onCategoryCreated(newCategory);
            }
            onValueChange(newCategory.id.toString());
        } catch (error) {
            console.error(error);
            toast.error('Failed to create category');
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
                                Create new category...
                            </div>
                        </SelectItem>
                        {filteredCategories.map((category) => (
                            <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                            >
                                {category.parent && '└ '}
                                {category.icon && (
                                    <span className="mr-2">
                                        {category.icon}
                                    </span>
                                )}
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Category</DialogTitle>
                        <DialogDescription>
                            Add a new category for your transactions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name">Name</Label>
                            <Input
                                id="category-name"
                                value={newCategoryName}
                                onChange={(e) =>
                                    setNewCategoryName(e.target.value)
                                }
                                placeholder="e.g., Groceries"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category-parent">
                                Parent Category (Optional)
                            </Label>
                            <Select
                                value={newCategoryParent}
                                onValueChange={setNewCategoryParent}
                            >
                                <SelectTrigger id="category-parent">
                                    <SelectValue placeholder="None (Top level)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        None (Top level)
                                    </SelectItem>
                                    {potentialParents.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={category.id.toString()}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
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
                            disabled={isCreating || !newCategoryName}
                        >
                            {isCreating ? 'Creating...' : 'Create Category'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
