import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { Budget } from '@/types/finance';
import { PiggyBank } from 'lucide-react';
import { useEffect, useState } from 'react';

export function BudgetsTab() {
    const [isLoading, setIsLoading] = useState(true);
    const [budgets, setBudgets] = useState<Budget[]>([]);

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/budgets', {
                    params: { is_active: 1, per_page: 20 },
                });

                if (!cancelled) {
                    setBudgets(response.data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch budgets:', error);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Loading budgets...
                </p>
            </div>
        );
    }

    if (budgets.length === 0) {
        return (
            <Card>
                <CardContent className="flex h-[400px] flex-col items-center justify-center">
                    <PiggyBank className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-lg font-medium">No Active Budgets</p>
                    <p className="text-sm text-muted-foreground">
                        Create budgets to track your spending
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                {budgets.map((budget) => {
                    const percentage = budget.spent_percentage || 0;
                    const healthColor =
                        percentage >= 100
                            ? 'text-red-600'
                            : percentage >= 80
                              ? 'text-orange-600'
                              : percentage >= 60
                                ? 'text-yellow-600'
                                : 'text-green-600';

                    return (
                        <Card key={budget.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{budget.name}</span>
                                    <span
                                        className={`text-sm font-normal ${healthColor}`}
                                    >
                                        {percentage.toFixed(0)}%
                                    </span>
                                </CardTitle>
                                <CardDescription>
                                    {formatCurrency(
                                        budget.current_period_spent,
                                        budget.currency,
                                    )}{' '}
                                    of{' '}
                                    {formatCurrency(
                                        budget.amount,
                                        budget.currency,
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Progress
                                    value={Math.min(percentage, 100)}
                                    className="h-2"
                                />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {formatCurrency(
                                        budget.remaining_amount,
                                        budget.currency,
                                    )}{' '}
                                    remaining
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
