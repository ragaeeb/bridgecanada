'use client';
import { motion } from 'motion/react';
import React from 'react';

const colors = ['rgb(131, 179, 32)', 'rgb(47, 195, 106)', 'rgb(22, 127, 57)', 'rgb(180, 239, 171)', 'rgb(255, 0, 0)'];

export function ColourfulText({ text }: { text: string }) {
    const [currentColors, setCurrentColors] = React.useState(colors);
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            const shuffled = [...colors].sort(() => Math.random() - 0.5);
            setCurrentColors(shuffled);
            setCount((prev) => prev + 1);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return text.split('').map((char, index) => (
        <motion.span
            animate={{
                color: currentColors[index % currentColors.length],
                filter: ['blur(0px)', `blur(5px)`, 'blur(0px)'],
                opacity: [1, 0.8, 1],
                scale: [1, 1.01, 1],
                y: [0, -3, 0],
            }}
            className="inline-block whitespace-pre font-sans tracking-tight"
            initial={{
                y: 0,
            }}
            key={`${char}-${count}-${index}`}
            transition={{
                delay: index * 0.05,
                duration: 0.5,
            }}
        >
            {char}
        </motion.span>
    ));
}
