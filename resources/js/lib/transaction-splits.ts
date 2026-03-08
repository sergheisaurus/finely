import { parseAmount } from '@/lib/format';

export interface TransactionSplitDraft {
    id: string;
    amount: string;
    categoryId: string;
}

const roundToCents = (value: number): number => Math.round(value * 100) / 100;

export function createTransactionSplitDraft(): TransactionSplitDraft {
    return {
        id:
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : Math.random().toString(36).slice(2),
        amount: '',
        categoryId: '',
    };
}

export function calculateTransactionSplitTotal(
    splits: TransactionSplitDraft[],
): number {
    return roundToCents(
        splits.reduce((total, split) => total + parseAmount(split.amount), 0),
    );
}

export function calculateTransactionSplitRemainder(
    amount: string | number,
    splits: TransactionSplitDraft[],
): number {
    const totalAmount =
        typeof amount === 'number' ? amount : parseAmount(amount || '0');

    return roundToCents(totalAmount - calculateTransactionSplitTotal(splits));
}

export function buildTransactionSplitsPayload(splits: TransactionSplitDraft[]) {
    return splits
        .filter((split) => split.amount !== '' && split.categoryId !== '')
        .map((split) => ({
            amount: roundToCents(parseAmount(split.amount)),
            category_id: parseInt(split.categoryId, 10),
        }));
}
