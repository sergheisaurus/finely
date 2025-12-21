import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
    Apple,
    Armchair,
    Baby,
    Banknote,
    Beer,
    Bike,
    Book,
    Briefcase,
    Building2,
    Bus,
    Cable,
    Cake,
    Camera,
    Car,
    CheckCircle,
    Church,
    Cigarette,
    CircleDollarSign,
    Clapperboard,
    Clock,
    Cloud,
    Coffee,
    Coins,
    CreditCard,
    Dog,
    Dumbbell,
    Flame,
    Fuel,
    Gamepad2,
    Gift,
    GraduationCap,
    HandCoins,
    Handshake,
    Heart,
    HeartPulse,
    Home,
    Hotel,
    Landmark,
    Laptop,
    Lightbulb,
    type LucideIcon,
    Megaphone,
    Monitor,
    Mountain,
    Music,
    PaintBucket,
    Palmtree,
    ParkingCircle,
    Phone,
    PiggyBank,
    Pill,
    Pizza,
    Plane,
    Plug,
    Receipt,
    Rocket,
    Scissors,
    Shield,
    Shirt,
    ShoppingBag,
    ShoppingCart,
    Smile,
    Sparkles,
    Stethoscope,
    Store,
    Syringe,
    Ticket,
    Train,
    TrendingUp,
    Trophy,
    Tv,
    Umbrella,
    Utensils,
    Wallet,
    Waves,
    Wifi,
    Wine,
    Wrench,
    Zap,
} from 'lucide-react';
import { createElement, useState } from 'react';

// Icon categories for better organization
const iconCategories = {
    'Food & Drink': [
        { name: 'Utensils', icon: Utensils },
        { name: 'Coffee', icon: Coffee },
        { name: 'Pizza', icon: Pizza },
        { name: 'Apple', icon: Apple },
        { name: 'Cake', icon: Cake },
        { name: 'Wine', icon: Wine },
        { name: 'Beer', icon: Beer },
    ],
    'Shopping': [
        { name: 'ShoppingCart', icon: ShoppingCart },
        { name: 'ShoppingBag', icon: ShoppingBag },
        { name: 'Store', icon: Store },
        { name: 'Shirt', icon: Shirt },
        { name: 'Gift', icon: Gift },
    ],
    'Transport': [
        { name: 'Car', icon: Car },
        { name: 'Bus', icon: Bus },
        { name: 'Train', icon: Train },
        { name: 'Plane', icon: Plane },
        { name: 'Bike', icon: Bike },
        { name: 'Fuel', icon: Fuel },
        { name: 'ParkingCircle', icon: ParkingCircle },
    ],
    'Home & Utilities': [
        { name: 'Home', icon: Home },
        { name: 'Lightbulb', icon: Lightbulb },
        { name: 'Plug', icon: Plug },
        { name: 'Wifi', icon: Wifi },
        { name: 'Flame', icon: Flame },
        { name: 'Zap', icon: Zap },
        { name: 'Cable', icon: Cable },
        { name: 'Armchair', icon: Armchair },
        { name: 'PaintBucket', icon: PaintBucket },
        { name: 'Wrench', icon: Wrench },
    ],
    'Health & Wellness': [
        { name: 'Heart', icon: Heart },
        { name: 'HeartPulse', icon: HeartPulse },
        { name: 'Pill', icon: Pill },
        { name: 'Stethoscope', icon: Stethoscope },
        { name: 'Syringe', icon: Syringe },
        { name: 'Dumbbell', icon: Dumbbell },
    ],
    'Entertainment': [
        { name: 'Tv', icon: Tv },
        { name: 'Music', icon: Music },
        { name: 'Gamepad2', icon: Gamepad2 },
        { name: 'Clapperboard', icon: Clapperboard },
        { name: 'Ticket', icon: Ticket },
        { name: 'Camera', icon: Camera },
    ],
    'Travel & Leisure': [
        { name: 'Palmtree', icon: Palmtree },
        { name: 'Mountain', icon: Mountain },
        { name: 'Hotel', icon: Hotel },
        { name: 'Waves', icon: Waves },
        { name: 'Umbrella', icon: Umbrella },
    ],
    'Finance': [
        { name: 'Wallet', icon: Wallet },
        { name: 'CreditCard', icon: CreditCard },
        { name: 'Banknote', icon: Banknote },
        { name: 'Coins', icon: Coins },
        { name: 'PiggyBank', icon: PiggyBank },
        { name: 'CircleDollarSign', icon: CircleDollarSign },
        { name: 'HandCoins', icon: HandCoins },
        { name: 'TrendingUp', icon: TrendingUp },
        { name: 'Receipt', icon: Receipt },
        { name: 'Landmark', icon: Landmark },
    ],
    'Work & Education': [
        { name: 'Briefcase', icon: Briefcase },
        { name: 'Laptop', icon: Laptop },
        { name: 'Monitor', icon: Monitor },
        { name: 'Phone', icon: Phone },
        { name: 'Book', icon: Book },
        { name: 'GraduationCap', icon: GraduationCap },
    ],
    'Services': [
        { name: 'Scissors', icon: Scissors },
        { name: 'Dog', icon: Dog },
        { name: 'Baby', icon: Baby },
        { name: 'Building2', icon: Building2 },
        { name: 'Handshake', icon: Handshake },
    ],
    'Other': [
        { name: 'Smile', icon: Smile },
        { name: 'Sparkles', icon: Sparkles },
        { name: 'Trophy', icon: Trophy },
        { name: 'Rocket', icon: Rocket },
        { name: 'Shield', icon: Shield },
        { name: 'Church', icon: Church },
        { name: 'Cigarette', icon: Cigarette },
        { name: 'Cloud', icon: Cloud },
        { name: 'Clock', icon: Clock },
        { name: 'CheckCircle', icon: CheckCircle },
        { name: 'Megaphone', icon: Megaphone },
    ],
};

// Flatten icons for search
const allIcons = Object.values(iconCategories).flat();

// Map of icon names to components for lookup
const iconMap: Record<string, LucideIcon> = Object.fromEntries(
    allIcons.map((item) => [item.name, item.icon])
);

export function getIconByName(name: string): LucideIcon | null {
    return iconMap[name] || null;
}

interface IconPickerProps {
    value?: string;
    onChange?: (iconName: string) => void;
    color?: string;
}

export function IconPicker({ value, onChange, color = '#3b82f6' }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selectedIcon = value ? getIconByName(value) : null;

    const filteredCategories = search
        ? {
              Results: allIcons.filter((item) =>
                  item.name.toLowerCase().includes(search.toLowerCase())
              ),
          }
        : iconCategories;

    const handleSelect = (iconName: string) => {
        onChange?.(iconName);
        setOpen(false);
        setSearch('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'h-20 w-20 p-0',
                        !value && 'text-muted-foreground'
                    )}
                >
                    {selectedIcon ? (
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg"
                            style={{ backgroundColor: color }}
                        >
                            {createElement(selectedIcon, { className: 'h-6 w-6 text-white' })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1">
                            <Sparkles className="h-6 w-6" />
                            <span className="text-xs">Pick Icon</span>
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                    <Input
                        placeholder="Search icons..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8"
                    />
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                    {Object.entries(filteredCategories).map(([category, icons]) => (
                        <div key={category} className="mb-3">
                            {icons.length > 0 && (
                                <>
                                    <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">
                                        {category}
                                    </p>
                                    <div className="grid grid-cols-6 gap-1">
                                        {icons.map((item) => {
                                            const Icon = item.icon;
                                            const isSelected = value === item.name;
                                            return (
                                                <button
                                                    key={item.name}
                                                    type="button"
                                                    onClick={() => handleSelect(item.name)}
                                                    className={cn(
                                                        'flex h-10 w-10 items-center justify-center rounded-md transition-colors hover:bg-muted',
                                                        isSelected && 'bg-primary text-primary-foreground hover:bg-primary'
                                                    )}
                                                    title={item.name}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {search && Object.values(filteredCategories).flat().length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            No icons found
                        </p>
                    )}
                </div>
                {value && (
                    <div className="border-t p-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                                onChange?.('');
                                setOpen(false);
                            }}
                        >
                            Clear Icon
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
