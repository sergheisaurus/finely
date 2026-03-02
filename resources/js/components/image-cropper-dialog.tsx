import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

export type CropSettings = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    onCropComplete: (settings: CropSettings) => Promise<void>;
};

export default function ImageCropperDialog({
    isOpen,
    onClose,
    imageSrc,
    onCropComplete,
}: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedArea, setCroppedArea] = useState<Area | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedArea(null);
        }
    }, [isOpen, imageSrc]);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((nextCroppedArea: Area) => {
        setCroppedArea(nextCroppedArea);
    }, []);

    const handleSave = async () => {
        if (!croppedArea) return;

        setIsSaving(true);
        try {
            await onCropComplete({
                x: croppedArea.x,
                y: croppedArea.y,
                width: croppedArea.width,
                height: croppedArea.height,
            });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Crop Image</DialogTitle>
                    <DialogDescription>
                        Adjust the image to select the area for the thumbnail.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative h-80 w-full overflow-hidden rounded-md bg-muted">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="flex items-center gap-4 py-2">
                    <span className="text-sm font-medium">Zoom</span>
                    <Slider
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={(value) => setZoom(value[0])}
                        className="flex-1"
                    />
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Cover
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
