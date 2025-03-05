'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import React, { useRef } from 'react';

const IMG_PADDING = 12;

export const TextParallaxContent = ({ heading, imgUrl, subheading }) => {
    return (
        <div
            style={{
                paddingLeft: IMG_PADDING,
                paddingRight: IMG_PADDING,
            }}
        >
            <div className="relative h-[150vh]">
                <StickyImage imgUrl={imgUrl} />
                <OverlayCopy heading={heading} subheading={subheading} />
            </div>
        </div>
    );
};

const StickyImage = ({ imgUrl }) => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        offset: ['end end', 'end start'],
        target: targetRef,
    });

    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

    return (
        <motion.div
            className="sticky z-0 overflow-hidden rounded-3xl"
            ref={targetRef}
            style={{
                backgroundImage: `url(${imgUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                height: `calc(100vh - ${IMG_PADDING * 2}px)`,
                scale,
                top: IMG_PADDING,
            }}
        >
            <motion.div
                className="absolute inset-0 bg-neutral-950/70"
                style={{
                    opacity,
                }}
            />
        </motion.div>
    );
};

const OverlayCopy = ({ heading, subheading }) => {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        offset: ['start end', 'end start'],
        target: targetRef,
    });

    const y = useTransform(scrollYProgress, [0, 1], [250, -250]);
    const opacity = useTransform(scrollYProgress, [0.25, 0.5, 0.75], [0, 1, 0]);

    return (
        <motion.div
            className="absolute left-0 top-0 flex h-screen w-full flex-col items-center justify-center text-white"
            ref={targetRef}
            style={{
                opacity,
                y,
            }}
        >
            <p className="text-center text-4xl font-bold md:text-7xl">{heading}</p>
            <p className="mb-2 p-4 text-center text-xl md:mb-4 md:text-3xl">{subheading}</p>
        </motion.div>
    );
};
