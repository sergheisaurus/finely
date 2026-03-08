import { formatCurrency } from '@/lib/format';
import type { TransactionBalanceSnapshot } from '@/types/finance';

interface TransactionBalanceSnapshotsProps {
    snapshots?: TransactionBalanceSnapshot[];
}

export function TransactionBalanceSnapshots({
    snapshots = [],
}: TransactionBalanceSnapshotsProps) {
    if (snapshots.length === 0) {
        return null;
    }

    return (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {snapshots.map((snapshot) => (
                <span key={`${snapshot.kind}-${snapshot.id}-${snapshot.label}`}>
                    {snapshot.label}:{' '}
                    {formatCurrency(snapshot.balance, snapshot.currency)}
                </span>
            ))}
        </div>
    );
}
