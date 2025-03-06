import { type Icon } from '@tabler/icons-react';

interface MiniCardProps {
    href: string;
    Icon: Icon;
    subtitle: string;
    title: string;
}

export const MiniCard = ({ href, Icon, subtitle, title }: MiniCardProps) => {
    return (
        <a
            className="w-full p-4 rounded border-[1px] border-slate-300 relative overflow-hidden group bg-white dark:bg-green-950"
            href={href}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-green-600 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300" />

            <Icon className="absolute z-10 -top-12 -right-12 text-9xl text-slate-100 group-hover:text-violet-400 group-hover:rotate-12 transition-transform duration-300" />
            <Icon className="mb-2 text-2xl text-green-600 group-hover:text-white transition-colors relative z-10 duration-300" />
            <h3 className="font-medium text-lg text-slate-950 dark:text-white group-hover:text-white relative z-10 duration-300">
                {title}
            </h3>
            <p className="text-slate-400 dark:text-slate-300 group-hover:text-white relative z-10 duration-300">
                {subtitle}
            </p>
        </a>
    );
};
