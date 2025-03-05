'use client';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import React, { useState } from 'react';

export const Card = React.memo(
    ({
        card,
        hovered,
        index,
        setHovered,
    }: {
        card: CardProps;
        hovered: null | number;
        index: number;
        setHovered: React.Dispatch<React.SetStateAction<null | number>>;
    }) => (
        <div
            className={cn(
                'rounded-lg relative bg-gray-100 dark:bg-neutral-900 overflow-hidden h-60 md:h-96 w-full transition-all duration-300 ease-out',
                hovered !== null && hovered !== index && 'blur-sm scale-[0.98]',
            )}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
        >
            <Image alt={card.title} className="object-cover absolute inset-0" fill src={card.src} />
            {card.description && (
                <div
                    className={cn(
                        'absolute inset-0 bg-black/50 flex py-8 px-4 transition-opacity duration-300',
                        hovered === index ? 'opacity-100' : 'opacity-0',
                    )}
                >
                    <div className="text-xl md:text-sm font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200">
                        {card.description}
                    </div>
                </div>
            )}
            <div
                className={cn(
                    'absolute inset-0 bg-black/50 flex items-end py-8 px-4 transition-opacity duration-300',
                    hovered === index ? 'opacity-100' : 'opacity-0',
                )}
            >
                <div className="text-xl md:text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200">
                    {card.title}
                </div>
            </div>
        </div>
    ),
);

Card.displayName = 'Card';

export type CardProps = {
    description?: string;
    src: string;
    title: string;
};

export function FocusCards({ cards }: { cards: CardProps[] }) {
    const [hovered, setHovered] = useState<null | number>(null);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 py-4 gap-10 max-w-7xl mx-auto md:px-8 w-full">
            {cards.map((card, index) => (
                <Card card={card} hovered={hovered} index={index} key={card.title} setHovered={setHovered} />
            ))}
        </div>
    );
}
