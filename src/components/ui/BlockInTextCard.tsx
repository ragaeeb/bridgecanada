import { motion } from 'framer-motion';
import React, { ReactNode, useEffect, useState } from 'react';

export const BlockInTextCard = ({
    examples,
    onTagClick,
    tag,
    text,
}: {
    examples: string[];
    onTagClick: () => void;
    tag: string;
    text: ReactNode;
}) => {
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
            <button
                className="w-full rounded-full border border-neutral-950 py-2 text-sm font-medium transition-colors hover:bg-neutral-950 hover:text-neutral-100"
                onClick={onTagClick}
            >
                Contact Us
            </button>
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
