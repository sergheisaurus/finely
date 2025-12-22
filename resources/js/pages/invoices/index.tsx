import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { type BreadcrumbItem } from '@/types';
import type { BankAccount, Card as CardType, Invoice, InvoiceStats } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    Ban,
    Calendar,
    Check,
    Clock,
    CreditCard,
    Edit,
    Eye,
    FileText,
    Plus,
    RefreshCw,
    Trash2,
    Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Invoices',
        href: '/invoices',
    },
];

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    cancelled: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    pending: Clock,
    paid: Check,
    overdue: AlertCircle,
    cancelled: Ban,
};

export default function InvoicesIndex() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [stats, setStats] = useState<InvoiceStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Payment dialog state
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [cards, setCards] = useState<CardType[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'account' | 'card'>('account');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [selectedCardId, setSelectedCardId] = useState<string>('');

    useEffect(() => {
        fetchData();
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const [accountsRes, cardsRes] = await Promise.all([
                api.get('/accounts'),
                api.get('/cards'),
            ]);
            setAccounts(accountsRes.data.data || []);
            setCards(cardsRes.data.data || []);

            // Set default selection
            const defaultAccount = (accountsRes.data.data || []).find((a: BankAccount) => a.is_default);
            if (defaultAccount) {
                setSelectedAccountId(defaultAccount.id.toString());
            } else if ((accountsRes.data.data || []).length > 0) {
                setSelectedAccountId((accountsRes.data.data[0] as BankAccount).id.toString());
            }

            const defaultCard = (cardsRes.data.data || []).find((c: CardType) => c.is_default);
            if (defaultCard) {
                setSelectedCardId(defaultCard.id.toString());
            } else if ((cardsRes.data.data || []).length > 0) {
                setSelectedCardId((cardsRes.data.data[0] as CardType).id.toString());
            }
        } catch (error) {
            console.error('Failed to fetch payment methods:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [invoicesResponse, statsResponse] = await Promise.all([
                api.get('/invoices'),
                api.get('/invoices/stats'),
            ]);
            setInvoices(invoicesResponse.data.data);
            setStats(statsResponse.data);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (invoice: Invoice) => {
        if (
            !confirm(
                `Are you sure you want to delete invoice "${invoice.invoice_number || invoice.creditor_name || 'this invoice'}"?`,
            )
        ) {
            return;
        }

        try {
            await api.delete(`/invoices/${invoice.id}`);
            toast.success('Invoice deleted!');
            await fetchData();
        } catch (error) {
            console.error('Failed to delete invoice:', error);
            toast.error('Failed to delete invoice');
        }
    };

    const handleMarkPaid = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPayDialogOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!selectedInvoice) return;

        setIsProcessingPayment(true);
        try {
            const payload: Record<string, unknown> = {
                create_transaction: true,
            };

            if (paymentMethod === 'account' && selectedAccountId) {
                payload.from_account_id = parseInt(selectedAccountId);
            } else if (paymentMethod === 'card' && selectedCardId) {
                payload.from_card_id = parseInt(selectedCardId);
            }

            await api.post(`/invoices/${selectedInvoice.id}/pay`, payload);
            toast.success('Invoice marked as paid!');
            setIsPayDialogOpen(false);
            setSelectedInvoice(null);
            await fetchData();
        } catch (error) {
            console.error('Failed to mark invoice as paid:', error);
            toast.error('Failed to update invoice');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const pendingInvoices = invoices.filter((i) => i.status === 'pending');
    const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
    const paidInvoices = invoices.filter((i) => i.status === 'paid');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
                    <div>
                        <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                            Invoices
                        </h1>
                        <p className="text-muted-foreground">
                            Track and manage your bills
                        </p>
                    </div>
                    <Button
                        onClick={() => router.visit('/invoices/create')}
                        className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Invoice
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="animate-fade-in-up stagger-1 opacity-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Pending
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {formatCurrency(stats?.pending_total ?? 0, 'CHF')}
                                    </p>
                                    <p className="text-sm opacity-80">
                                        {stats?.pending_count ?? 0} invoices
                                    </p>
                                </div>
                                <Clock className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-2 opacity-0 bg-gradient-to-br from-red-500 to-rose-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Overdue
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {formatCurrency(stats?.overdue_total ?? 0, 'CHF')}
                                    </p>
                                    <p className="text-sm opacity-80">
                                        {stats?.overdue_count ?? 0} invoices
                                    </p>
                                </div>
                                <AlertCircle className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-3 opacity-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white hover-lift">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Paid
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {stats?.paid_count ?? 0}
                                    </p>
                                    <p className="text-sm opacity-80">
                                        invoices
                                    </p>
                                </div>
                                <Check className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="animate-fade-in-up stagger-4 opacity-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white hover-lift sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Recurring
                                    </p>
                                    <p className="mt-2 text-2xl font-bold md:text-3xl">
                                        {stats?.recurring_count ?? 0}
                                    </p>
                                    <p className="text-sm opacity-80">
                                        invoices
                                    </p>
                                </div>
                                <RefreshCw className="h-10 w-10 md:h-12 md:w-12 opacity-80" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up stagger-5 opacity-0">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="h-40 animate-pulse rounded-xl bg-muted"
                            />
                        ))}
                    </div>
                ) : invoices.length === 0 ? (
                    <Card className="animate-fade-in-up stagger-5 opacity-0 overflow-hidden">
                        <CardContent className="p-12 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50">
                                <FileText className="h-10 w-10 text-violet-500" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold">
                                No invoices yet
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Start tracking your bills and payments
                            </p>
                            <Button
                                className="mt-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                                onClick={() => router.visit('/invoices/create')}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Invoice
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {overdueInvoices.length > 0 && (
                            <div className="space-y-4 animate-fade-in-up stagger-5 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl text-red-600 dark:text-red-400">
                                    Overdue
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {overdueInvoices.map((invoice) => (
                                        <InvoiceCard
                                            key={invoice.id}
                                            invoice={invoice}
                                            onDelete={handleDelete}
                                            onMarkPaid={handleMarkPaid}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {pendingInvoices.length > 0 && (
                            <div className="space-y-4 animate-fade-in-up stagger-6 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl">
                                    Pending
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {pendingInvoices.map((invoice) => (
                                        <InvoiceCard
                                            key={invoice.id}
                                            invoice={invoice}
                                            onDelete={handleDelete}
                                            onMarkPaid={handleMarkPaid}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {paidInvoices.length > 0 && (
                            <div className="space-y-4 animate-fade-in-up stagger-7 opacity-0">
                                <h2 className="text-xl font-bold md:text-2xl text-muted-foreground">
                                    Paid
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paidInvoices.map((invoice) => (
                                        <InvoiceCard
                                            key={invoice.id}
                                            invoice={invoice}
                                            onDelete={handleDelete}
                                            onMarkPaid={handleMarkPaid}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Payment Dialog */}
            <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Mark Invoice as Paid</DialogTitle>
                        <DialogDescription>
                            Select the account or card you used to pay this invoice.
                            A transaction will be created and the balance will be updated.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Amount summary */}
                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-sm text-muted-foreground">Amount to pay</p>
                            <p className="text-2xl font-bold">
                                {selectedInvoice && formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                            </p>
                            {selectedInvoice?.creditor_name && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    {selectedInvoice.creditor_name}
                                </p>
                            )}
                        </div>

                        {/* Payment method toggle */}
                        <div className="space-y-2">
                            <Label>Pay from</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={paymentMethod === 'account' ? 'default' : 'outline'}
                                    className="flex-1"
                                    onClick={() => setPaymentMethod('account')}
                                >
                                    <Wallet className="mr-2 h-4 w-4" />
                                    Bank Account
                                </Button>
                                <Button
                                    type="button"
                                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                                    className="flex-1"
                                    onClick={() => setPaymentMethod('card')}
                                >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Card
                                </Button>
                            </div>
                        </div>

                        {/* Account/Card selector */}
                        {paymentMethod === 'account' ? (
                            <div className="space-y-2">
                                <Label>Select Account</Label>
                                {accounts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No bank accounts found. Add one in Settings.
                                    </p>
                                ) : (
                                    <Select
                                        value={selectedAccountId}
                                        onValueChange={setSelectedAccountId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map((account) => (
                                                <SelectItem
                                                    key={account.id}
                                                    value={account.id.toString()}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: account.color }}
                                                        />
                                                        <span>{account.name}</span>
                                                        <span className="text-muted-foreground">
                                                            ({formatCurrency(account.balance, account.currency)})
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Select Card</Label>
                                {cards.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No cards found. Add one in Settings.
                                    </p>
                                ) : (
                                    <Select
                                        value={selectedCardId}
                                        onValueChange={setSelectedCardId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a card" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cards.map((card) => (
                                                <SelectItem
                                                    key={card.id}
                                                    value={card.id.toString()}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: card.color }}
                                                        />
                                                        <span>
                                                            {card.card_holder_name} •••• {card.card_number.slice(-4)}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsPayDialogOpen(false);
                                setSelectedInvoice(null);
                            }}
                            disabled={isProcessingPayment}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmPayment}
                            disabled={
                                isProcessingPayment ||
                                (paymentMethod === 'account' && !selectedAccountId) ||
                                (paymentMethod === 'card' && !selectedCardId)
                            }
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isProcessingPayment ? (
                                'Processing...'
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Confirm Payment
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function InvoiceCard({
    invoice,
    onDelete,
    onMarkPaid,
}: {
    invoice: Invoice;
    onDelete: (i: Invoice) => void;
    onMarkPaid: (i: Invoice) => void;
}) {
    const StatusIcon = statusIcons[invoice.status] || Clock;

    return (
        <Card
            className={`group transition-all duration-200 hover:shadow-md hover-lift overflow-hidden ${
                invoice.status === 'paid' ? 'opacity-70' : ''
            }`}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                            style={{
                                backgroundColor: invoice.color || '#8b5cf6',
                            }}
                        >
                            <DynamicIcon
                                name={invoice.icon}
                                fallback={FileText}
                                className="h-6 w-6 text-white"
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold">
                                {invoice.creditor_name || invoice.invoice_number || 'Invoice'}
                            </h3>
                            {invoice.invoice_number && invoice.creditor_name && (
                                <p className="text-sm text-muted-foreground">
                                    #{invoice.invoice_number}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold">
                            {formatCurrency(invoice.amount, invoice.currency)}
                        </p>
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[invoice.status]}`}
                        >
                            <StatusIcon className="h-3 w-3" />
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {invoice.is_recurring && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                            <RefreshCw className="h-3 w-3" />
                            Recurring
                        </span>
                    )}
                    {invoice.due_date && invoice.status !== 'paid' && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </span>
                    )}
                    {invoice.days_overdue && invoice.days_overdue > 0 && (
                        <span className="text-xs text-red-500">
                            {invoice.days_overdue} days overdue
                        </span>
                    )}
                </div>

                {invoice.merchant && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        {invoice.merchant.name}
                    </p>
                )}

                <div className="mt-4 flex gap-1 border-t pt-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.visit(`/invoices/${invoice.id}`)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.visit(`/invoices/${invoice.id}/edit`)}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    {invoice.status !== 'paid' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkPaid(invoice)}
                            title="Mark as paid"
                        >
                            <Check className="h-4 w-4 text-green-500" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(invoice)}
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
