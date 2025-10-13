'use client';
import { ClockIcon, Link2Icon, UsersIcon } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import { BlockInTextCard } from '@/components/ui/BlockInTextCard';
import { ColourfulText } from '@/components/ui/ColourfulText';
import { type CardProps, FocusCards } from '@/components/ui/FocusCards';
import { MiniCard } from '@/components/ui/MiniCard';
import { TextParallaxContent } from '@/components/ui/TextParallaxContent';
import { WobbleCard } from '@/components/ui/WobbleCard';

const cards: CardProps[] = [
    {
        description: 'In April 2016, we hosted a tour ranging from several cities across Canada and USA.',
        src: '/industries-montreal.png',
        title: 'Government of Bangladesh - Ministry of Industries',
    },
    {
        description: 'We hosted training seminars, tourism packages as well as business meetings.',
        src: '/education-toronto.png',
        title: 'Government of Bangladesh - Ministry of Education',
    },
    {
        description: 'We hosted the Government of Bangladesh delegation.',
        src: '/housing-toronto.jpg',
        title: 'August 2017 - Ministry of Housing and Public Works',
    },
    {
        description: 'As soon as you land our team will be standing by waiting to pick you up.',
        src: '/airport.jpg',
        title: 'Waiting for You',
    },
    {
        description:
            'We provide our guests SIM cards so they can stay in touch with their loved ones they left behind.',
        src: '/sim.jpg',
        title: 'International SIM Cards',
    },
    {
        description:
            'We arrange your accomodation at the most comfortable and luxurious of hotels to make your stay feel like a vacation.',
        src: '/hotels.webp',
        title: 'Accomodation',
    },
    {
        description: 'We will coordinate all of your business meetings and follow-up on whatever is necessary.',
        src: '/meetings.jpg',
        title: 'Business Meetings',
    },
    {
        description:
            'Our vehicle is fully equipped with snacks and refreshments to keep you energized through your journey.',
        src: '/water.jpg',
        title: 'Refreshments',
    },
    {
        description: 'Throughout the day we keep you fueled with snacks and coffee breaks between your meetings.',
        src: '/coffee.jpg',
        title: 'Coffee and Snacks',
    },
    {
        description: 'We know that you want to bring back souvenirs, so we take you to the best shopping complexes.',
        src: '/shopping.jpg',
        title: 'Shopping',
    },
    {
        description:
            'We do not want you leaving empty-handed, we always arrange gifts for our guests to remember us by.',
        src: '/gift.jpg',
        title: 'Gifts',
    },
    {
        description: 'At the end of our trip we bring you back to the airport to wish you safe travels.',
        src: '/conclusion.jpg',
        title: 'Goodbyes',
    },
];

export default function Home() {
    return (
        <div className="w-full items-center justify-center bg-black">
            <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black">
                <motion.img
                    animate={{ opacity: 0.5 }}
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover [mask-image:radial-gradient(circle,transparent,black_80%)]"
                    initial={{ opacity: 0 }}
                    src="/splash.jpg"
                    transition={{ duration: 1 }}
                />
                <h1 className="relative z-2 text-center font-bold font-sans text-2xl text-white md:text-5xl lg:text-7xl">
                    Bridge Canada <br />
                    <br />
                    Connecting <ColourfulText text="Continents" />
                </h1>
            </div>
            <div className="grid place-content-center bg-emerald-950 px-4 py-24">
                <h1 className="w-full text-center text-5xl leading-snug">
                    We have been helping connect entities to their international interests for{' '}
                    <span className="relative">
                        years!
                        <svg
                            className="-left-2 -right-2 -top-2 absolute bottom-0 translate-y-1"
                            fill="none"
                            viewBox="0 0 286 73"
                        >
                            <motion.path
                                d="M142.293 1C106.854 16.8908 6.08202 7.17705 1.23654 43.3756C-2.10604 68.3466 29.5633 73.2652 122.688 71.7518C215.814 70.2384 316.298 70.689 275.761 38.0785C230.14 1.37835 97.0503 24.4575 52.9384 1"
                                initial={{ pathLength: 0 }}
                                stroke="#FACC15"
                                strokeWidth="3"
                                transition={{ duration: 1.25, ease: 'easeInOut' }}
                                whileInView={{ pathLength: 1 }}
                            />
                        </svg>
                    </span>
                </h1>
            </div>
            <div className="p-4">
                <p className="mb-2 text-center font-semibold text-xl">About Us</p>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                    <MiniCard
                        href="#"
                        Icon={UsersIcon}
                        subtitle="We have contacts with some of the top companies in Canada and are able to arrange meetings with nearly any entity."
                        title="We're Resourceful"
                    />
                    <MiniCard
                        href="#"
                        Icon={Link2Icon}
                        subtitle="We have connections with some of the top hotels in the country to make your stay in Canada a comfortable and memorable one."
                        title="We're Connected"
                    />
                    <MiniCard
                        href="#"
                        Icon={ClockIcon}
                        subtitle="We have been in this business for a long time and are able to achieve your business goals without hiccups."
                        title="We're Experienced"
                    />
                </div>
            </div>
            <TextParallaxContent
                heading="Our Clients Are Our Primary Focus"
                imgUrl="/mockup.webp"
                subheading="From the moment you land we consider you our most valuable guests and thus our primary goal is to ensure your business trip goes beyond what your expectations are."
            />
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-3">
                <WobbleCard containerClassName="col-span-1 lg:col-span-2 h-full bg-green-800 min-h-[500px] lg:min-h-[300px]">
                    <div className="max-w-xs">
                        <h2 className="text-balance text-left font-semibold text-base text-white tracking-[-0.015em] md:text-xl lg:text-3xl">
                            VISA and Travel Bookings
                        </h2>
                        <p className="mt-4 text-left text-base/6 text-neutral-200">
                            We take care of following-up with the appropriate agencies to ensure your visa gets approved
                            by way of our letters.
                        </p>
                    </div>
                    <Image
                        alt="Passport"
                        className="-right-4 lg:-right-[20%] -bottom-10 absolute rounded-2xl object-contain"
                        height={500}
                        src="/passport.webp"
                        width={500}
                    />
                </WobbleCard>
                <WobbleCard containerClassName="col-span-1 min-h-[300px]">
                    <h2 className="max-w-80 text-balance text-left font-semibold text-base text-white tracking-[-0.015em] md:text-xl lg:text-3xl">
                        Business Meetings
                    </h2>
                    <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
                        This is what you came here for! We arrange every aspect of your business meetings so you do not
                        have to worry about any of it. We follow-up in case any changes are required and ensure you get
                        to all your meetings on time.
                    </p>
                </WobbleCard>
                <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-green-950 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]">
                    <div className="max-w-sm">
                        <h2 className="max-w-sm text-balance text-left font-semibold text-base text-white tracking-[-0.015em] md:max-w-lg md:text-xl lg:text-3xl">
                            Transportation
                        </h2>
                        <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
                            We pick you up and take you to and from your destinations in a comfortable, top of the line
                            roomy ride.
                        </p>
                    </div>
                    <Image
                        alt="Transportation"
                        className="-right-10 md:-right-[40%] lg:-right-[10%] -bottom-10 absolute rounded-2xl object-contain"
                        height={500}
                        src="/business-cards.jpg"
                        width={500}
                    />
                </WobbleCard>
                <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-red-900 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]">
                    <div className="max-w-sm">
                        <h2 className="max-w-sm text-balance text-left font-semibold text-base text-white tracking-[-0.015em] md:max-w-lg md:text-xl lg:text-3xl">
                            Dining
                        </h2>
                        <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
                            We arrange all food and dining by taking you to the top restaurants in the city or your
                            choice of food-style you enjoy.
                        </p>
                    </div>
                    <Image
                        alt="Dining"
                        className="-right-0 -bottom-25 absolute rounded-2xl object-contain"
                        height={500}
                        src="/food.webp"
                        width={500}
                    />
                </WobbleCard>
                <WobbleCard
                    className=""
                    containerClassName="col-span-1 lg:col-span-2 h-full bg-emerald-800 min-h-[500px] lg:min-h-[300px]"
                >
                    <div className="max-w-xs">
                        <h2 className="text-balance text-left font-semibold text-base text-white tracking-[-0.015em] md:text-xl lg:text-3xl">
                            Accomodations
                        </h2>
                        <p className="mt-4 text-left text-base/6 text-neutral-200">
                            We book and arrange your hotels to fit your budget. From 5-star choices to treat you like
                            the VIP you are.
                        </p>
                    </div>
                    <Image
                        alt="Hotel Tag"
                        className="-right-4 lg:-right-[0%] -bottom-10 absolute rounded-2xl object-contain"
                        height={300}
                        src="/hotel_tag.webp"
                        width={200}
                    />
                </WobbleCard>
                <WobbleCard containerClassName="col-span-1 min-h-[300px]">
                    <h2 className="max-w-80 text-balance text-left font-semibold text-base text-white tracking-[-0.015em] md:text-xl lg:text-3xl">
                        Tourism
                    </h2>
                    <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
                        We arrange sight-seeing, shopping and tourism experiences in the city you will be staying in to
                        ensure you have a memorable time.
                    </p>
                </WobbleCard>
            </div>
            <FocusCards cards={cards} />
            <div className="flex items-center justify-center bg-emerald-500 px-8 py-24 text-neutral-800">
                <BlockInTextCard
                    examples={[
                        'I want to study in Canada, can you help?',
                        'I would like a comprehensive tour package set up.',
                        'I would like to set up importing or exporting for trade goods with Canada.',
                        'We would like to set up an educational seminar for my team',
                    ]}
                    onTagClick={() => {
                        console.log('LFJKDS');
                        window.location.href = 'mailto:info@bridgecanada.ca';
                    }}
                    tag="Contact Us"
                    text={
                        <>
                            <strong>Office Address: 1390 Prince of Wales, Unit 508</strong>
                            <br />
                            <br />
                            If you are interested in letting us arrange your visits, please do reach out to us and we
                            will get back to you as soon as possible.
                        </>
                    }
                />
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-5 border-gray-900/5 border-t px-5 py-5 pt-8 sm:flex-row dark:border-white/5">
                <p className="text-gray-600 text-xs dark:text-gray-100">
                    Copyright © 2021-{new Date().getFullYear()}{' '}
                    <a className="text-red-500 underline hover:text-red-500" href="https://bridgecanada.ca">
                        Bridge Canada N World
                    </a>
                </p>
            </div>
        </div>
    );
}
