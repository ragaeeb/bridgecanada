interface MiniCardProps {
    href: string;
    Icon: any;
    subtitle: string;
    title: string;
}

export const MiniCard = ({ href, Icon, subtitle, title }: MiniCardProps) => {
    return (
        <a
            className="group relative w-full overflow-hidden rounded border-[1px] border-slate-300 bg-white p-4 dark:bg-green-950"
            href={href}
        >
            <div className="absolute inset-0 translate-y-[100%] bg-gradient-to-r from-red-600 to-green-600 transition-transform duration-300 group-hover:translate-y-[0%]" />

            <Icon className="-top-12 -right-12 absolute z-10 text-9xl text-slate-100 transition-transform duration-300 group-hover:rotate-12 group-hover:text-violet-400" />
            <Icon className="relative z-10 mb-2 text-2xl text-green-600 transition-colors duration-300 group-hover:text-white" />
            <h3 className="relative z-10 font-medium text-lg text-slate-950 duration-300 group-hover:text-white dark:text-white">
                {title}
            </h3>
            <p className="relative z-10 text-slate-400 duration-300 group-hover:text-white dark:text-slate-300">
                {subtitle}
            </p>
        </a>
    );
};
