import ImageCropperDialog, {
    type CropSettings,
} from '@/components/image-cropper-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    Crop,
    ExternalLink,
    ImagePlus,
    Package,
    Search,
    Trash2,
} from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type InventoryItem = {
    id: number;
    order_id: number;
    name: string;
    quantity: number;
    unit_price?: number | null;
    amount?: number | null;
    product_url?: string | null;
    image_url?: string | null;
    image_thumbnail_url?: string | null;
    cover_image_id?: number | null;
    cover_image_settings?: CropSettings | null;
    image_gallery?: {
        id: number;
        url?: string | null;
        thumbnail_url?: string | null;
        name?: string | null;
    }[];
    status: string;
    ordered_at?: string | null;
    delivered_at?: string | null;
    order: {
        id: number;
        provider?: string | null;
        order_number?: string | null;
        ordered_at?: string | null;
        amount?: number | null;
        currency?: string | null;
        fx_rate?: number | null;
        source_currency?: string | null;
        merchant?: { id: number; name: string } | null;
    };
    computed?: {
        order_currency: string;
        base_currency?: string | null;
        fx_rate?: number | null;
        converted_subtotal: number;
        fee_allocated: number;
        total_charged_subtotal: number;
        unit_cost_charged: number;
    } | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Inventory', href: '/inventory' },
];

export default function InventoryIndex() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingById, setUploadingById] = useState<Record<number, boolean>>(
        {},
    );
    const [galleryItem, setGalleryItem] = useState<InventoryItem | null>(null);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [cropperImageSrc, setCropperImageSrc] = useState('');
    const [cropperItem, setCropperItem] = useState<InventoryItem | null>(null);
    const [cropperAssetId, setCropperAssetId] = useState<number | null>(null);
    const [deletingAssetId, setDeletingAssetId] = useState<number | null>(null);
    const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(
        null,
    );

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/inventory/items', {
                params: { per_page: 200 },
            });
            setItems(res.data.data || []);
        } catch (error) {
            console.error('Failed to load inventory:', error);
            toast.error('Failed to load inventory');
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter((it) => {
            const hay = [
                it.name,
                it.order?.merchant?.name,
                it.order?.provider,
                it.order?.order_number,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return hay.includes(q);
        });
    }, [items, search]);

    const startUpload = (item: InventoryItem, file?: File | null) => {
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setCropperImageSrc(reader.result?.toString() || '');
            setCropperItem(item);
            setCropperAssetId(null);
            setPendingUploadFile(file);
            setCropperOpen(true);
        });
        reader.readAsDataURL(file);
    };

    const startCropExisting = (
        item: InventoryItem,
        imageUrl: string,
        assetId: number,
    ) => {
        setCropperImageSrc(imageUrl);
        setCropperItem(item);
        setCropperAssetId(assetId);
        setPendingUploadFile(null); // No new file, we are cropping an existing one
        setCropperOpen(true);
    };

    const handleUploadImage = async (
        item: InventoryItem,
        file?: File | null,
    ): Promise<InventoryItem | null> => {
        if (!file) return null;

        setUploadingById((prev) => ({ ...prev, [item.id]: true }));

        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await api.post(
                `/inventory/items/${item.id}/image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                },
            );

            const updated = res.data?.data as InventoryItem | undefined;
            if (updated) {
                setItems((prev) =>
                    prev.map((it) =>
                        it.id === item.id ? { ...it, ...updated } : it,
                    ),
                );

                if (galleryItem?.id === item.id) {
                    setGalleryItem({ ...item, ...updated });
                    setGalleryIndex(0);
                }
            }

            return updated ?? null;

            // We don't toast here if it's part of a crop flow, or we do?
            // The user will see the update.
        } catch (error) {
            console.error('Failed to upload item image:', error);
            const message =
                (error as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message || 'Failed to upload item image';
            toast.error(message);
            throw error; // Rethrow to stop the chain
        } finally {
            setUploadingById((prev) => ({ ...prev, [item.id]: false }));
        }
    };

    const handleCropComplete = async (crop: CropSettings) => {
        if (!cropperItem) return;

        try {
            let coverAssetId = cropperAssetId;

            // For new uploads, upload once and use that new file as cover.
            if (pendingUploadFile) {
                const uploaded = await handleUploadImage(
                    cropperItem,
                    pendingUploadFile,
                );
                coverAssetId = uploaded?.image_gallery?.[0]?.id ?? null;
            }

            if (coverAssetId) {
                await handleSetCoverImage(cropperItem, coverAssetId, crop);
            }

            toast.success('Cover image updated');
            await fetchItems();
        } catch (error) {
            console.error(error);
            const message =
                (error as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message || 'Failed to process image';
            toast.error(message);
        } finally {
            setPendingUploadFile(null);
            setCropperItem(null);
            setCropperAssetId(null);
        }
    };

    const handleSetCoverImage = async (
        item: InventoryItem,
        assetId: number,
        crop?: CropSettings,
    ) => {
        try {
            const res = await api.post(
                `/inventory/items/${item.id}/cover-image`,
                {
                    asset_id: assetId,
                    crop,
                },
            );

            const updated = res.data?.data as InventoryItem | undefined;
            if (updated) {
                setItems((prev) =>
                    prev.map((it) =>
                        it.id === item.id ? { ...it, ...updated } : it,
                    ),
                );

                if (galleryItem?.id === item.id) {
                    setGalleryItem({ ...item, ...updated });
                }
            }

            toast.success('Cover image updated');
        } catch (error) {
            console.error('Failed to set cover image:', error);
            toast.error('Failed to set cover image');
        }
    };

    const handleDeleteImage = async (item: InventoryItem, assetId: number) => {
        const confirmed = window.confirm(
            'Delete this image from the gallery? This cannot be undone.',
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingAssetId(assetId);

            const res = await api.delete(
                `/inventory/items/${item.id}/image/${assetId}`,
            );

            const updated = res.data?.data as InventoryItem | undefined;
            if (updated) {
                setItems((prev) =>
                    prev.map((it) =>
                        it.id === item.id ? { ...it, ...updated } : it,
                    ),
                );

                if (galleryItem?.id === item.id) {
                    const nextItem = { ...item, ...updated };
                    setGalleryItem(nextItem);

                    const maxIndex = Math.max(
                        0,
                        (nextItem.image_gallery?.length ?? 1) - 1,
                    );
                    setGalleryIndex((prev) => Math.min(prev, maxIndex));
                }
            }

            toast.success('Image deleted');
        } catch (error) {
            console.error('Failed to delete image:', error);
            toast.error('Failed to delete image');
        } finally {
            setDeletingAssetId(null);
        }
    };

    const openGallery = (item: InventoryItem, initialIndex = 0) => {
        if (!item.image_gallery?.length) {
            return;
        }

        setGalleryItem(item);
        setGalleryIndex(initialIndex);
    };

    const galleryImages = galleryItem?.image_gallery || [];
    const activeGalleryImage = galleryImages[galleryIndex];
    const activeGalleryImageUrl =
        activeGalleryImage?.url || activeGalleryImage?.thumbnail_url || null;

    const getCoverStyle = (item: InventoryItem): CSSProperties | undefined => {
        const crop = item.cover_image_settings;
        const imageUrl = item.image_thumbnail_url || item.image_url;
        if (!crop || !imageUrl) return undefined;

        const width = Math.max(0.1, Math.min(100, crop.width));
        const height = Math.max(0.1, Math.min(100, crop.height));
        const x = Math.max(0, Math.min(100 - width, crop.x));
        const y = Math.max(0, Math.min(100 - height, crop.y));

        const sizeX = (100 / width) * 100;
        const sizeY = (100 / height) * 100;

        const xRange = 100 - width;
        const yRange = 100 - height;
        const posX = xRange > 0 ? (x / xRange) * 100 : 50;
        const posY = yRange > 0 ? (y / yRange) * 100 : 50;

        return {
            backgroundImage: `url("${imageUrl}")`,
            backgroundSize: `${sizeX}% ${sizeY}%`,
            backgroundPosition: `${posX}% ${posY}%`,
            backgroundRepeat: 'no-repeat',
        };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Inventory</h1>
                        <p className="text-muted-foreground">
                            Items you have bought (costs in charged currency)
                        </p>
                    </div>

                    <div className="relative w-full sm:w-80">
                        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search items, merchants, order number..."
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">
                        Items
                    </h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchItems}
                        disabled={isLoading}
                    >
                        Refresh
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {isLoading ? (
                        <div className="col-span-full p-6 text-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full flex items-center justify-center gap-3 rounded-lg border border-dashed p-8">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium">No items found</p>
                                <p className="text-sm text-muted-foreground">
                                    Create an order and add items.
                                </p>
                            </div>
                        </div>
                    ) : (
                        filtered.map((it) => (
                            <Card
                                key={it.id}
                                className="flex h-full min-w-0 flex-col overflow-hidden transition-all hover:shadow-md"
                            >
                                <div className="group relative aspect-square w-full shrink-0 bg-muted">
                                    {it.image_thumbnail_url || it.image_url ? (
                                        it.cover_image_settings ? (
                                            <div
                                                className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
                                                style={getCoverStyle(it)}
                                                onClick={() => openGallery(it)}
                                            />
                                        ) : (
                                            <img
                                                src={
                                                    it.image_thumbnail_url ||
                                                    it.image_url ||
                                                    undefined
                                                }
                                                alt={it.name}
                                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                onClick={() => openGallery(it)}
                                            />
                                        )
                                    ) : (
                                        <div
                                            className="absolute inset-0 flex h-full w-full items-center justify-center text-muted-foreground"
                                            onClick={() => openGallery(it)}
                                        >
                                            <Package className="h-8 w-8 opacity-50" />
                                        </div>
                                    )}

                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        {it.product_url && (
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8 rounded-full shadow-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(
                                                        it.product_url!,
                                                        '_blank',
                                                    );
                                                }}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <label
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={uploadingById[it.id]}
                                                onChange={(e) => {
                                                    const file =
                                                        e.target.files?.[0];
                                                    startUpload(it, file);
                                                    e.currentTarget.value = '';
                                                }}
                                            />
                                            <div
                                                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-secondary shadow-sm hover:bg-secondary/80 ${uploadingById[it.id] ? 'opacity-50' : ''}`}
                                            >
                                                <ImagePlus className="h-4 w-4" />
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col p-3">
                                    <div
                                        className="mb-1 cursor-pointer truncate font-medium hover:underline"
                                        onClick={() =>
                                            router.visit(
                                                `/orders/${it.order_id}`,
                                            )
                                        }
                                        title={it.name}
                                    >
                                        {it.name}
                                    </div>
                                    <div className="flex-1 text-xs text-muted-foreground">
                                        {it.computed ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium text-foreground">
                                                    {
                                                        it.computed
                                                            .unit_cost_charged
                                                    }{' '}
                                                    {it.computed.order_currency}
                                                </span>
                                                <span>
                                                    Qty: {it.quantity} • Total:{' '}
                                                    {
                                                        it.computed
                                                            .total_charged_subtotal
                                                    }{' '}
                                                    {it.computed.order_currency}
                                                </span>
                                            </div>
                                        ) : (
                                            <span>Qty: {it.quantity}</span>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                        <span
                                            className="max-w-[100px] truncate"
                                            title={
                                                it.order?.merchant?.name || ''
                                            }
                                        >
                                            {it.order?.merchant?.name}
                                        </span>
                                        <span>
                                            {it.order?.ordered_at || ''}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <Dialog
                open={Boolean(galleryItem)}
                onOpenChange={(open) => {
                    if (!open) {
                        setGalleryItem(null);
                        setGalleryIndex(0);
                    }
                }}
            >
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            {galleryItem?.name || 'Item gallery'}
                        </DialogTitle>
                        <DialogDescription>
                            Browse all uploaded images for this inventory item.
                        </DialogDescription>
                    </DialogHeader>

                    {galleryImages.length > 0 ? (
                        <div className="space-y-4">
                            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/50">
                                {activeGalleryImageUrl && (
                                    <img
                                        src={activeGalleryImageUrl}
                                        alt={galleryItem?.name || 'Item image'}
                                        className="h-full w-full object-contain"
                                    />
                                )}

                                {activeGalleryImage && (
                                    <div className="absolute right-4 bottom-4 flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() =>
                                                activeGalleryImageUrl &&
                                                galleryItem &&
                                                startCropExisting(
                                                    galleryItem,
                                                    activeGalleryImageUrl,
                                                    activeGalleryImage.id,
                                                )
                                            }
                                        >
                                            <Crop className="mr-2 h-4 w-4" />
                                            Crop & Set
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant={
                                                galleryItem?.cover_image_id ===
                                                activeGalleryImage.id
                                                    ? 'secondary'
                                                    : 'default'
                                            }
                                            onClick={() =>
                                                galleryItem &&
                                                handleSetCoverImage(
                                                    galleryItem,
                                                    activeGalleryImage.id,
                                                )
                                            }
                                            disabled={
                                                galleryItem?.cover_image_id ===
                                                activeGalleryImage.id
                                            }
                                        >
                                            {galleryItem?.cover_image_id ===
                                            activeGalleryImage.id
                                                ? 'Current Cover'
                                                : 'Set as Cover'}
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                galleryItem &&
                                                handleDeleteImage(
                                                    galleryItem,
                                                    activeGalleryImage.id,
                                                )
                                            }
                                            disabled={
                                                deletingAssetId ===
                                                activeGalleryImage.id
                                            }
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {deletingAssetId ===
                                            activeGalleryImage.id
                                                ? 'Deleting...'
                                                : 'Delete'}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
                                {galleryImages.map((image, index) => (
                                    <button
                                        key={image.id}
                                        type="button"
                                        className={`aspect-square overflow-hidden rounded-md border transition-all ${
                                            index === galleryIndex
                                                ? 'ring-2 ring-primary ring-offset-2'
                                                : 'opacity-70 hover:opacity-100'
                                        }`}
                                        onClick={() => setGalleryIndex(index)}
                                    >
                                        <img
                                            src={
                                                image.thumbnail_url ||
                                                image.url ||
                                                undefined
                                            }
                                            alt={`Thumbnail ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex aspect-video flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                            <ImagePlus className="mb-2 h-10 w-10 opacity-20" />
                            <p>No images available.</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ImageCropperDialog
                isOpen={cropperOpen}
                onClose={() => setCropperOpen(false)}
                imageSrc={cropperImageSrc}
                onCropComplete={handleCropComplete}
            />
        </AppLayout>
    );
}
