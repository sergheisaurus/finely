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
import type { Category, InvoiceFrequency, Merchant, SwissQrData } from '@/types/finance';
import { Head, router } from '@inertiajs/react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Invoices',
        href: '/invoices',
    },
    {
        title: 'Create',
        href: '/invoices/create',
    },
];

const frequencies: { value: InvoiceFrequency; label: string }[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
];

export default function InvoiceCreate() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Data for selects
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form fields
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [reference, setReference] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('CHF');
    const [issueDate, setIssueDate] = useState(
        new Date().toISOString().split('T')[0],
    );
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

    // QR data
    const [qrText, setQrText] = useState('');
    const [qrData, setQrData] = useState<SwissQrData | null>(null);
    const [qrRawText, setQrRawText] = useState(''); // Raw QR text to save to DB
    const [creditorName, setCreditorName] = useState('');
    const [creditorIban, setCreditorIban] = useState('');
    const [paymentReference, setPaymentReference] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [merchantsRes, categoriesRes] = await Promise.all([
                api.get('/merchants'),
                api.get('/categories'),
            ]);
            setMerchants(merchantsRes.data.data);
            setCategories(
                categoriesRes.data.data.filter(
                    (c: Category) => c.type === 'expense',
                ),
            );
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const handleParseQr = async () => {
        if (!qrText.trim()) {
            toast.error('Please enter QR code data');
            return;
        }

        setIsParsing(true);
        try {
            const response = await api.post('/invoices/parse-qr', {
                qr_text: qrText,
            });

            const data = response.data.data as SwissQrData;
            const rawText = response.data.raw_text as string;

            setQrData(data);
            setQrRawText(rawText); // Save raw text for DB

            // Auto-fill form fields
            if (data.amount) setAmount(data.amount.toString());
            if (data.currency) setCurrency(data.currency);
            if (data.creditor_name) setCreditorName(data.creditor_name);
            if (data.iban) setCreditorIban(data.iban);
            if (data.reference) setPaymentReference(data.reference);

            toast.success('QR code parsed successfully!');
        } catch (error: unknown) {
            console.error('Failed to parse QR:', error);
            const err = error as { response?: { data?: { message?: string } } };
            const message = err.response?.data?.message || 'Failed to parse QR code';
            toast.error(message);
        } finally {
            setIsParsing(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('File is too large. Maximum size is 2MB.');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        setIsParsing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/invoices/parse-qr', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data.data as SwissQrData;
            const rawText = response.data.raw_text as string;

            setQrData(data);
            setQrRawText(rawText); // Save raw text for DB

            // Auto-fill form fields
            if (data.amount) setAmount(data.amount.toString());
            if (data.currency) setCurrency(data.currency);
            if (data.creditor_name) setCreditorName(data.creditor_name);
            if (data.iban) setCreditorIban(data.iban);
            if (data.reference) setPaymentReference(data.reference);

            toast.success('QR code extracted and parsed successfully!');
        } catch (error: unknown) {
            console.error('Failed to extract QR from file:', error);
            const err = error as { response?: { data?: { message?: string } } };
            const message = err.response?.data?.message || 'Failed to extract QR code from file. Try a smaller image or paste the QR text instead.';
            toast.error(message);
        } finally {
            setIsParsing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const payload: Record<string, unknown> = {
                amount: parseFloat(amount),
                currency,
                issue_date: issueDate,
                status: 'pending',
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
            if (qrData) payload.qr_data = qrData;
            if (qrRawText) payload.qr_raw_text = qrRawText;

            if (isRecurring) {
                payload.frequency = frequency;
                payload.billing_day = parseInt(billingDay);
            }

            await api.post('/invoices', payload);

            toast.success('Invoice created!', {
                description: 'The invoice has been added.',
            });

            router.visit('/invoices');
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
                toast.error('Failed to create invoice', {
                    description: 'Please try again.',
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Invoice" />
            <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
                <div className="animate-fade-in-up">
                    <h1 className="text-2xl font-bold md:text-3xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-400">
                        Add Invoice
                    </h1>
                    <p className="text-muted-foreground">
                        Track a new bill or invoice
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* QR Code Import */}
                    <CardUI className="animate-fade-in-up stagger-1 opacity-0">
                        <CardHeader>
                            <CardTitle>Swiss QR-Invoice Import</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="qrText">
                                    Paste QR Code Data
                                </Label>
                                <Textarea
                                    id="qrText"
                                    value={qrText}
                                    onChange={(e) => setQrText(e.target.value)}
                                    placeholder="Paste the Swiss QR-Invoice data here (starts with SPC)"
                                    rows={5}
                                    className="font-mono text-sm"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleParseQr}
                                    disabled={isParsing || !qrText.trim()}
                                >
                                    {isParsing ? 'Parsing...' : 'Parse QR Code'}
                                </Button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="qrFile">
                                    Upload Invoice Image
                                </Label>
                                <input
                                    ref={fileInputRef}
                                    id="qrFile"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={isParsing}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isParsing}
                                    className="w-full"
                                >
                                    {isParsing ? 'Extracting...' : 'Upload & Extract QR Code'}
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Upload an image containing a Swiss QR-Invoice (max 2MB)
                                </p>
                            </div>

                            {qrData && (
                                <div className="mt-4 rounded-lg bg-muted p-4">
                                    <div className="flex items-start gap-4">
                                        {qrText && (
                                            <QRCodeSVG
                                                value={qrText}
                                                size={120}
                                                className="flex-shrink-0"
                                            />
                                        )}
                                        <div className="text-sm space-y-1 flex-1">
                                            <p className="font-semibold text-green-600 dark:text-green-400 mb-2">
                                                ✓ QR Code Parsed Successfully
                                            </p>
                                            <p><strong>Creditor:</strong> {qrData.creditor_name || 'Not specified'}</p>
                                            <p><strong>IBAN:</strong> {qrData.iban || 'Not specified'}</p>
                                            <p>
                                                <strong>Amount:</strong>{' '}
                                                {qrData.amount
                                                    ? `${qrData.amount} ${qrData.currency}`
                                                    : `Not specified (${qrData.currency})`}
                                            </p>
                                            {qrData.reference && (
                                                <p><strong>Reference:</strong> {qrData.reference}</p>
                                            )}
                                            {qrData.message && (
                                                <p><strong>Message:</strong> {qrData.message}</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3">
                                        Form fields have been auto-filled with the extracted data.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </CardUI>

                    {/* Invoice Details */}
                    <CardUI className="animate-fade-in-up stagger-2 opacity-0">
                        <CardHeader>
                            <CardTitle>Invoice Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="invoiceNumber">
                                        Invoice Number
                                    </Label>
                                    <Input
                                        id="invoiceNumber"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        placeholder="e.g., INV-2024-001"
                                    />
                                    {errors.invoice_number && (
                                        <p className="text-sm text-red-500">{errors.invoice_number}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reference">Reference</Label>
                                    <Input
                                        id="reference"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        placeholder="External reference"
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
                                        placeholder="0.00"
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
                                    placeholder="Additional notes..."
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Creditor Details */}
                    <CardUI className="animate-fade-in-up stagger-3 opacity-0">
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
                                    placeholder="Company or person name"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="creditorIban">IBAN</Label>
                                    <Input
                                        id="creditorIban"
                                        value={creditorIban}
                                        onChange={(e) => setCreditorIban(e.target.value)}
                                        placeholder="CH..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="paymentReference">Payment Reference</Label>
                                    <Input
                                        id="paymentReference"
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                        placeholder="QR reference"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </CardUI>

                    {/* Categorization */}
                    <CardUI className="animate-fade-in-up stagger-4 opacity-0">
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
                    <CardUI className="animate-fade-in-up stagger-5 opacity-0">
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
                    <CardUI className="animate-fade-in-up stagger-6 opacity-0">
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
                    <div className="flex gap-4 animate-fade-in-up stagger-7 opacity-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/invoices')}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Invoice'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
