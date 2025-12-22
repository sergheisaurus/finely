import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { BankAccount, Card as CardType, Invoice, InvoiceAttachment, Transaction } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Ban,
    Calendar,
    Check,
    Clock,
    CreditCard,
    Download,
    Edit,
    ExternalLink,
    FileText,
    Paperclip,
    RefreshCw,
    Trash2,
    Upload,
    Wallet,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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

const frequencyLabels: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
};

export default function InvoiceView({ invoiceId }: { invoiceId: string }) {
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [cards, setCards] = useState<CardType[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<'account' | 'card'>('account');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [selectedCardId, setSelectedCardId] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Invoices',
            href: '/invoices',
        },
        {
            title: invoice?.creditor_name || invoice?.invoice_number || 'Loading...',
            href: `/invoices/${invoiceId}`,
        },
    ];

    const fetchData = useCallback(async () => {
        try {
            const [invoiceRes, transRes] = await Promise.all([
                api.get(`/invoices/${invoiceId}`),
                api.get(`/invoices/${invoiceId}/transactions`),
            ]);
            setInvoice(invoiceRes.data.data);
            setTransactions(transRes.data.data);
        } catch (error) {
            console.error('Failed to fetch invoice:', error);
            toast.error('Failed to load invoice');
        } finally {
            setIsLoading(false);
        }
    }, [invoiceId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Fetch accounts and cards for payment selection
    useEffect(() => {
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
        fetchPaymentMethods();
    }, []);

    const handleMarkPaid = () => {
        if (!invoice) return;
        setIsPayDialogOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!invoice) return;

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

            await api.post(`/invoices/${invoice.id}/pay`, payload);
            toast.success('Invoice marked as paid!');
            setIsPayDialogOpen(false);
            await fetchData();
        } catch (error) {
            console.error('Failed to mark invoice as paid:', error);
            toast.error('Failed to update invoice');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleCancel = async () => {
        if (!invoice) return;
        if (!confirm('Are you sure you want to cancel this invoice?')) {
            return;
        }

        try {
            await api.post(`/invoices/${invoice.id}/cancel`);
            toast.success('Invoice cancelled');
            await fetchData();
        } catch (error) {
            console.error('Failed to cancel invoice:', error);
            toast.error('Failed to cancel invoice');
        }
    };

    const handleDelete = async () => {
        if (!invoice) return;
        if (
            !confirm(
                `Are you sure you want to delete "${invoice.creditor_name || invoice.invoice_number || 'this invoice'}"?`,
            )
        ) {
            return;
        }

        try {
            await api.delete(`/invoices/${invoice.id}`);
            toast.success('Invoice deleted!');
            router.visit('/invoices');
        } catch (error) {
            console.error('Failed to delete invoice:', error);
            toast.error('Failed to delete invoice');
        }
    };

    const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!invoice || !e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            await api.post(`/invoices/${invoice.id}/attachments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Attachment uploaded!');
            await fetchData();
        } catch (error) {
            console.error('Failed to upload attachment:', error);
            toast.error('Failed to upload attachment');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteAttachment = async (attachment: InvoiceAttachment) => {
        if (!invoice) return;
        if (!confirm(`Delete "${attachment.file_name}"?`)) {
            return;
        }

        try {
            await api.delete(`/invoices/${invoice.id}/attachments/${attachment.id}`);
            toast.success('Attachment deleted');
            await fetchData();
        } catch (error) {
            console.error('Failed to delete attachment:', error);
            toast.error('Failed to delete attachment');
        }
    };


    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Loading..." />
                <div className="p-6">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 w-64 rounded bg-muted" />
                        <div className="h-64 rounded-xl bg-muted" />
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!invoice) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Not Found" />
                <div className="p-6 text-center">
                    <p className="text-muted-foreground">Invoice not found</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => router.visit('/invoices')}
                    >
                        Back to Invoices
                    </Button>
                </div>
            </AppLayout>
        );
    }

    const StatusIcon = statusIcons[invoice.status] || Clock;

    // Use raw QR text if available (exact format), otherwise generate from parsed data
    const generateQrFromData = (qrData: Invoice['qr_data']): string | null => {
        if (!qrData) return null;

        const lines = [
            'SPC',
            '0200',
            '1',
            qrData.iban || '',
            'S',
            qrData.creditor_name || '',
            qrData.creditor_address || '',
            '',
            '',
            '',
            'CH',
            '', '', '', '', '', '', '',
            qrData.amount?.toString() || '',
            qrData.currency || 'CHF',
            '', '', '', '', '', '',
            qrData.reference_type || 'NON',
            qrData.reference || '',
            qrData.message || '',
            'EPD',
            '',
        ];

        return lines.join('\n');
    };

    const qrContent = invoice.qr_raw_text || generateQrFromData(invoice.qr_data);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={invoice.creditor_name || invoice.invoice_number || 'Invoice'} />
            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit('/invoices')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div
                            className="flex h-14 w-14 items-center justify-center rounded-xl"
                            style={{
                                backgroundColor: invoice.color || '#8b5cf6',
                            }}
                        >
                            <DynamicIcon
                                name={invoice.icon}
                                fallback={FileText}
                                className="h-7 w-7 text-white"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold md:text-3xl">
                                {invoice.creditor_name || invoice.invoice_number || 'Invoice'}
                            </h1>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[invoice.status]}`}
                                >
                                    <StatusIcon className="h-3 w-3" />
                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                </span>
                                {invoice.is_recurring && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                                        <RefreshCw className="h-3 w-3" />
                                        Recurring
                                    </span>
                                )}
                                {invoice.invoice_number && invoice.creditor_name && (
                                    <span className="text-sm text-muted-foreground">
                                        #{invoice.invoice_number}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                            <Button
                                variant="outline"
                                onClick={handleMarkPaid}
                                className="text-green-600 hover:text-green-700"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Mark Paid
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => router.visit(`/invoices/${invoice.id}/edit`)}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        {invoice.status !== 'cancelled' && invoice.status !== 'paid' && (
                            <Button variant="outline" onClick={handleCancel}>
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        )}
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up stagger-1 opacity-0">
                    <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                        <CardContent className="p-6">
                            <p className="text-sm opacity-90">Amount</p>
                            <p className="mt-1 text-2xl font-bold">
                                {formatCurrency(invoice.amount, invoice.currency)}
                            </p>
                            {invoice.is_recurring && invoice.frequency && (
                                <p className="text-sm opacity-75">
                                    {frequencyLabels[invoice.frequency]}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">Due Date</p>
                            <p className="mt-1 text-2xl font-bold">
                                {invoice.due_date
                                    ? new Date(invoice.due_date).toLocaleDateString()
                                    : 'No due date'}
                            </p>
                            {invoice.status !== 'paid' && invoice.days_until_due !== undefined && invoice.days_until_due !== null && (
                                <p className={`text-sm ${invoice.days_until_due < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                    {invoice.days_until_due < 0
                                        ? `${Math.abs(invoice.days_until_due)} days overdue`
                                        : invoice.days_until_due === 0
                                          ? 'Due today'
                                          : `${invoice.days_until_due} days left`}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {invoice.is_recurring ? (
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-sm text-muted-foreground">Times Paid</p>
                                <p className="mt-1 text-2xl font-bold">
                                    {invoice.times_paid}
                                </p>
                                {invoice.next_due_date && (
                                    <p className="text-sm text-muted-foreground">
                                        Next: {new Date(invoice.next_due_date).toLocaleDateString()}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-sm text-muted-foreground">Issue Date</p>
                                <p className="mt-1 text-2xl font-bold">
                                    {new Date(invoice.issue_date).toLocaleDateString()}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {invoice.paid_date ? (
                        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                            <CardContent className="p-6">
                                <p className="text-sm opacity-90">Paid On</p>
                                <p className="mt-1 text-2xl font-bold">
                                    {new Date(invoice.paid_date).toLocaleDateString()}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-sm text-muted-foreground">Status</p>
                                <p className="mt-1 text-2xl font-bold capitalize">
                                    {invoice.status}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Details */}
                    <Card className="animate-fade-in-up stagger-2 opacity-0">
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {invoice.creditor_name && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Creditor</p>
                                    <p className="font-medium">{invoice.creditor_name}</p>
                                </div>
                            )}

                            {invoice.creditor_iban && (
                                <div>
                                    <p className="text-sm text-muted-foreground">IBAN</p>
                                    <p className="font-mono">{invoice.creditor_iban}</p>
                                </div>
                            )}

                            {invoice.payment_reference && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment Reference</p>
                                    <p className="font-mono text-sm break-all">{invoice.payment_reference}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Issue Date</p>
                                    <p>{new Date(invoice.issue_date).toLocaleDateString()}</p>
                                </div>
                                {invoice.due_date && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Due Date</p>
                                        <p>{new Date(invoice.due_date).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>

                            {invoice.is_recurring && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Frequency</p>
                                        <p>{frequencyLabels[invoice.frequency || 'monthly']}</p>
                                    </div>
                                    {invoice.billing_day && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Billing Day</p>
                                            <p>Day {invoice.billing_day}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {invoice.reference && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Reference</p>
                                    <p>{invoice.reference}</p>
                                </div>
                            )}

                            {invoice.merchant && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Merchant</p>
                                    <p>{invoice.merchant.name}</p>
                                </div>
                            )}

                            {invoice.category && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Category</p>
                                    <p>{invoice.category.name}</p>
                                </div>
                            )}

                            {invoice.notes && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Notes</p>
                                    <p className="whitespace-pre-wrap">{invoice.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* QR Code */}
                    {qrContent && (
                        <Card className="animate-fade-in-up stagger-3 opacity-0">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Payment QR Code
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="rounded-lg bg-white p-4">
                                        <QRCodeSVG
                                            value={qrContent}
                                            size={200}
                                            level="M"
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground text-center">
                                        Scan this QR code with your banking app to pay
                                    </p>
                                    {invoice.qr_data && (
                                        <div className="text-sm space-y-1 w-full">
                                            <p><span className="text-muted-foreground">Creditor:</span> {invoice.qr_data.creditor_name}</p>
                                            <p><span className="text-muted-foreground">IBAN:</span> {invoice.qr_data.iban}</p>
                                            <p><span className="text-muted-foreground">Amount:</span> {invoice.qr_data.amount} {invoice.qr_data.currency}</p>
                                            {invoice.qr_data.reference && (
                                                <p><span className="text-muted-foreground">Reference:</span> {invoice.qr_data.reference}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Attachments */}
                    <Card className="animate-fade-in-up stagger-4 opacity-0">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Paperclip className="h-5 w-5" />
                                Attachments ({invoice.attachments?.length || 0})
                            </CardTitle>
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept="image/*,.pdf"
                                    onChange={handleUploadAttachment}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {isUploading ? 'Uploading...' : 'Upload'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!invoice.attachments || invoice.attachments.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No attachments yet
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {invoice.attachments.map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                {attachment.is_image ? (
                                                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                                                        <img
                                                            src={attachment.url}
                                                            alt={attachment.file_name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-sm truncate max-w-[200px]">
                                                        {attachment.file_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {attachment.formatted_size}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                >
                                                    <a
                                                        href={attachment.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                >
                                                    <a
                                                        href={attachment.url}
                                                        download={attachment.file_name}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteAttachment(attachment)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment History */}
                    <Card className="animate-fade-in-up stagger-5 opacity-0">
                        <CardHeader>
                            <CardTitle>Payment History ({transactions.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    No payments recorded yet
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {transactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {transaction.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(
                                                        transaction.transaction_date,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-red-600">
                                                -{formatCurrency(
                                                    transaction.amount,
                                                    transaction.currency,
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
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
                                {invoice && formatCurrency(invoice.amount, invoice.currency)}
                            </p>
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
                            onClick={() => setIsPayDialogOpen(false)}
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
