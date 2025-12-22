import { Button } from '@/components/ui/button';
import {
    Card as CardUI,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import type { Category, Invoice, InvoiceFrequency, Merchant } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const frequencies: { value: InvoiceFrequency; label: string }[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
];

export default function InvoiceEdit({ invoiceId }: { invoiceId: string }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Data for selects
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form fields
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [reference, setReference] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('CHF');
    const [issueDate, setIssueDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [merchantId, setMerchantId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [notes, setNotes] = useState('');
    const [color, setColor] = useState('#8b5cf6');
    const [icon, setIcon] = useState('');

    // Recurring settings
    const [isRecurring, setIsRecurring] = useState(false);
    const [frequency, setFrequency] = useState<InvoiceFrequency>('monthly');
    const [billingDay, setBillingDay] = useState('1');

    // Creditor
    const [creditorName, setCreditorName] = useState('');
    const [creditorIban, setCreditorIban] = useState('');
    const [paymentReference, setPaymentReference] = useState('');

    const [invoiceName, setInvoiceName] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Invoices', href: '/invoices' },
        { title: invoiceName || 'Edit', href: `/invoices/${invoiceId}/edit` },
    ];

    const fetchData = useCallback(async () => {
        try {
            const [invoiceRes, merchantsRes, categoriesRes] = await Promise.all([
                api.get(`/invoices/${invoiceId}`),
                api.get('/merchants'),
                api.get('/categories'),
            ]);

            const invoice: Invoice = invoiceRes.data.data;

            // Populate form
            setInvoiceNumber(invoice.invoice_number || '');
            setReference(invoice.reference || '');
            setAmount(invoice.amount.toString());
            setCurrency(invoice.currency);
            setIssueDate(invoice.issue_date);
            setDueDate(invoice.due_date || '');
            setMerchantId(invoice.merchant_id?.toString() || '');
            setCategoryId(invoice.category_id?.toString() || '');
            setNotes(invoice.notes || '');
            setColor(invoice.color || '#8b5cf6');
            setIcon(invoice.icon || '');
            setIsRecurring(invoice.is_recurring);
            setFrequency(invoice.frequency || 'monthly');
            setBillingDay(invoice.billing_day?.toString() || '1');
            setCreditorName(invoice.creditor_name || '');
            setCreditorIban(invoice.creditor_iban || '');
            setPaymentReference(invoice.payment_reference || '');
            setInvoiceName(invoice.creditor_name || invoice.invoice_number || 'Invoice');

            setMerchants(merchantsRes.data.data);
            setCategories(
                categoriesRes.data.data.filter(
                    (c: Category) => c.type === 'expense',
                ),
            );
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load invoice');
        } finally {
            setIsLoading(false);
        }
    }, [invoiceId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const payload: Record<string, unknown> = {
                amount: parseFloat(amount),
                currency,
                issue_date: issueDate,
                is_recurring: isRecurring,
                color,
            };

            if (invoiceNumber) payload.invoice_number = invoiceNumber;
            if (reference) payload.reference = reference;
            if (dueDate) payload.due_date = dueDate;
            if (merchantId) payload.merchant_id = parseInt(merchantId);
            if (categoryId) payload.category_id = parseInt(categoryId);
            if (notes) payload.notes = notes;
            if (icon) payload.icon = icon;
            if (creditorName) payload.creditor_name = creditorName;
            if (creditorIban) payload.creditor_iban = creditorIban;
            if (paymentReference) payload.payment_reference = paymentReference;

            if (isRecurring) {
                payload.frequency = frequency;
                payload.billing_day = parseInt(billingDay);
            }

            await api.put(`/invoices/${invoiceId}`, payload);

            toast.success('Invoice updated!');
            router.visit(`/invoices/${invoiceId}`);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { errors?: Record<string, string[]> } } };
            if (err.response?.data?.errors) {
                const flatErrors: Record<string, string> = {};
                for (const [key, messages] of Object.entries(
                    err.response.data.errors,
                )) {
                    flatErrors[key] = (messages as string[])[0];
                }
                setErrors(flatErrors);
            } else {
                toast.error('Failed to update invoice');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Edit Invoice" />
                <div className="flex items-center justify-center p-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${invoiceName}`} />
            <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
                <div className="animate-fade-in-up">
                    <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                        Edit Invoice
                    </h1>
                    <p className="text-muted-foreground">
                        Update invoice details
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Invoice Details */}
                    <CardUI className="animate-fade-in-up stagger-1 opacity-0">
                        <CardHeader>
                            <CardTitle>Invoice Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                                    <Input
                                        id="invoiceNumber"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        placeholder="e.g., INV-2024-001"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reference">Reference</Label>
                                    <Input
                                        id="reference"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                    />
                                    {errors.amount && (
                                        <p className="text-sm text-red-500">{errors.amount}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CHF">CHF</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="issueDate">Issue Date *</Label>
                                    <Input
                                        id="issueDate"
                                        type="date"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Creditor Details */}
                    <CardUI className="animate-fade-in-up stagger-2 opacity-0">
                        <CardHeader>
                            <CardTitle>Creditor / Payee</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="creditorName">Creditor Name</Label>
                                <Input
                                    id="creditorName"
                                    value={creditorName}
                                    onChange={(e) => setCreditorName(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="creditorIban">IBAN</Label>
                                    <Input
                                        id="creditorIban"
                                        value={creditorIban}
                                        onChange={(e) => setCreditorIban(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="paymentReference">Payment Reference</Label>
                                    <Input
                                        id="paymentReference"
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Categorization */}
                    <CardUI className="animate-fade-in-up stagger-3 opacity-0">
                        <CardHeader>
                            <CardTitle>Categorization</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="merchant">Merchant</Label>
                                    <Select value={merchantId} onValueChange={setMerchantId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select merchant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {merchants.map((m) => (
                                                <SelectItem key={m.id} value={m.id.toString()}>
                                                    {m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select value={categoryId} onValueChange={setCategoryId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Recurring Settings */}
                    <CardUI className="animate-fade-in-up stagger-4 opacity-0">
                        <CardHeader>
                            <CardTitle>Recurring Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="isRecurring">Recurring Invoice</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable for bills you pay with the same QR code every period
                                    </p>
                                </div>
                                <Switch
                                    id="isRecurring"
                                    checked={isRecurring}
                                    onCheckedChange={setIsRecurring}
                                />
                            </div>

                            {isRecurring && (
                                <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-up">
                                    <div className="space-y-2">
                                        <Label htmlFor="frequency">Frequency</Label>
                                        <Select
                                            value={frequency}
                                            onValueChange={(v) => setFrequency(v as InvoiceFrequency)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {frequencies.map((f) => (
                                                    <SelectItem key={f.value} value={f.value}>
                                                        {f.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="billingDay">Billing Day</Label>
                                        <Input
                                            id="billingDay"
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={billingDay}
                                            onChange={(e) => setBillingDay(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </CardUI>

                    {/* Appearance */}
                    <CardUI className="animate-fade-in-up stagger-5 opacity-0">
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="color"
                                            type="color"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="h-10 w-14 p-1"
                                        />
                                        <Input
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Icon</Label>
                                    <IconPicker value={icon} onChange={setIcon} />
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Actions */}
                    <div className="flex gap-4 animate-fade-in-up stagger-6 opacity-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(`/invoices/${invoiceId}`)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
