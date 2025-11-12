import { HomeContent } from '@/components/home/HomeContent';
import type { CardProps } from '@/components/ui/FocusCards';

export const dynamic = 'force-dynamic';

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
        description: 'We provide our guests SIM cards so they can stay in touch with their loved ones they left behind.',
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
        description: 'Our vehicle is fully equipped with snacks and refreshments to keep you energized through your journey.',
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
        description: 'We do not want you leaving empty-handed, we always arrange gifts for our guests to remember us by.',
        src: '/gift.jpg',
        title: 'Gifts',
    },
    {
        description: 'At the end of our trip we bring you back to the airport to wish you safe travels.',
        src: '/conclusion.jpg',
        title: 'Goodbyes',
    },
];

const CONTACT_EMAIL = 'info@bridgecanada.ca';

export default function HomePage() {
    return <HomeContent cards={cards} contactEmail={CONTACT_EMAIL} />;
}
