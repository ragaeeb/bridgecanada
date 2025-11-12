'use client';

import { motion } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';

interface BlockInTextCardProps {
    examples: string[];
    tag: string;
    text: ReactNode;
    ctaHref?: string;
    ctaLabel?: string;
    onTagClick?: () => void;
}

export const BlockInTextCard = ({ examples, tag, text, ctaHref, ctaLabel = 'Contact Us', onTagClick }: BlockInTextCardProps) => {
    const ctaClassName =
        'inline-flex w-fit items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg ring-1 ring-inset ring-white/60 transition hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

    return (
        <div className="w-full max-w-7xl space-y-6">
            <div>
                <p className="mb-1.5 text-sm font-light uppercase">{tag}</p>
                <hr className="border-neutral-700" />
            </div>
            <p className="max-w-5xl text-xl leading-relaxed">{text}</p>
            <div>
                <Typewrite examples={examples} />
                <hr className="border-neutral-300" />
            </div>
            {ctaHref ? (
                <a className={ctaClassName} href={ctaHref} rel="noopener noreferrer">
                    {ctaLabel}
                </a>
            ) : (
                <button className={ctaClassName} onClick={onTagClick} type="button">
                    {ctaLabel}
                </button>
            )}
        </div>
    );
};

const LETTER_DELAY = 0.025;
const BOX_FADE_DURATION = 0.125;

const FADE_DELAY = 5;
const MAIN_FADE_DURATION = 0.25;

const SWAP_DELAY_IN_MS = 5500;

const Typewrite = ({ examples }: { examples: string[] }) => {
    const [exampleIndex, setExampleIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setExampleIndex((pv) => (pv + 1) % examples.length);
        }, SWAP_DELAY_IN_MS);

        return () => clearInterval(intervalId);
    }, [examples.length]);

    return (
        <p className="mb-2.5 text-sm font-light uppercase">
            <span className="inline-block size-2 bg-neutral-950" />
            <span className="ml-3">
                EXAMPLE:{' '}
                {examples[exampleIndex].split('').map((l, i) => (
                    <motion.span
                        animate={{
                            opacity: 0,
                        }}
                        className="relative"
                        initial={{
                            opacity: 1,
                        }}
                        key={`${exampleIndex}-${i}`}
                        transition={{
                            delay: FADE_DELAY,
                            duration: MAIN_FADE_DURATION,
                            ease: 'easeInOut',
                        }}
                    >
                        <motion.span
                            animate={{
                                opacity: 1,
                            }}
                            initial={{
                                opacity: 0,
                            }}
                            transition={{
                                delay: i * LETTER_DELAY,
                                duration: 0,
                            }}
                        >
                            {l}
                        </motion.span>
                        <motion.span
                            animate={{
                                opacity: [0, 1, 0],
                            }}
                            className="absolute bottom-[3px] left-[1px] right-0 top-[3px] bg-neutral-950"
                            initial={{
                                opacity: 0,
                            }}
                            transition={{
                                delay: i * LETTER_DELAY,
                                duration: BOX_FADE_DURATION,
                                ease: 'easeInOut',
                                times: [0, 0.1, 1],
                            }}
                        />
                    </motion.span>
                ))}
            </span>
        </p>
    );
};
