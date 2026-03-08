import { AmountInput } from '@/components/finance/amount-input';
import { CategorySelect } from '@/components/finance/category-select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { TransactionSplitDraft } from '@/lib/transaction-splits';
import {
    calculateTransactionSplitRemainder,
    createTransactionSplitDraft,
} from '@/lib/transaction-splits';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/finance';
import { Plus, Trash2 } from 'lucide-react';

interface TransactionSplitEditorProps {
    amount: string | number;
    currency: string;
    type: 'income' | 'expense';
    categories: Category[];
    mainCategoryId: string;
    splits: TransactionSplitDraft[];
    errors: Record<string, string>;
    onChange: (splits: TransactionSplitDraft[]) => void;
    onCategoryCreated?: (category: Category) => void;
}

export function TransactionSplitEditor({
    amount,
    currency,
    type,
    categories,
    mainCategoryId,
    splits,
    errors,
    onChange,
    onCategoryCreated,
}: TransactionSplitEditorProps) {
    const remainingAmount = calculateTransactionSplitRemainder(amount, splits);

    const updateSplit = (
        splitId: string,
        updates: Partial<TransactionSplitDraft>,
    ) => {
        onChange(
            splits.map((split) =>
                split.id === splitId ? { ...split, ...updates } : split,
            ),
        );
    };

    const removeSplit = (splitId: string) => {
        onChange(splits.filter((split) => split.id !== splitId));
    };

    return (
        <div className="space-y-4 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium">Split categories</p>
                    <p className="text-sm text-muted-foreground">
                        Add extra category rows. Whatever is left stays on the
                        main category.
                    </p>
                </div>
            </div>

            <div
                className={cn(
                    'rounded-lg border bg-background/80 px-3 py-2 text-sm',
                    remainingAmount < 0 &&
                        'border-destructive text-destructive',
                )}
            >
                <span className="font-medium">Main category remainder:</span>{' '}
                {currency} {remainingAmount.toFixed(2)}
                {!mainCategoryId && ' - choose a main category'}
            </div>

            {splits.length > 0 && (
                <div className="space-y-3">
                    {splits.map((split, index) => (
                        <div
                            key={split.id}
                            className="grid gap-3 rounded-lg border bg-background p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                        >
                            <div className="space-y-2">
                                <Label>Split amount</Label>
                                <AmountInput
                                    name={`split-amount-${split.id}`}
                                    value={Number(split.amount) || 0}
                                    onChange={(value) =>
                                        updateSplit(split.id, {
                                            amount:
                                                value > 0
                                                    ? value.toString()
                                                    : '',
                                        })
                                    }
                                    currency={currency}
                                    error={errors[`splits.${index}.amount`]}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Split category</Label>
                                <CategorySelect
                                    value={split.categoryId}
                                    onValueChange={(value) =>
                                        updateSplit(split.id, {
                                            categoryId: value,
                                        })
                                    }
                                    categories={categories}
                                    type={type}
                                    error={
                                        errors[`splits.${index}.category_id`]
                                    }
                                    onCategoryCreated={onCategoryCreated}
                                />
                            </div>

                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeSplit(split.id)}
                                    aria-label={`Remove split row ${index + 1}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {errors.splits && (
                <p className="text-sm text-destructive">{errors.splits}</p>
            )}

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                    onChange([...splits, createTransactionSplitDraft()])
                }
            >
                <Plus className="mr-2 h-4 w-4" />
                Add split row
            </Button>
        </div>
    );
}
