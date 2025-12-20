import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {/* Finely logo - stylized F with chart line */}
            <path
                d="M4 4h10v2H6v4h7v2H6v8H4V4z"
                fill="currentColor"
            />
            <path
                d="M10 14l3-3 2 2 5-5v2.5l-5 5-2-2-3 3V14z"
                fill="currentColor"
                opacity="0.8"
            />
            <circle cx="19" cy="8" r="1.5" fill="currentColor" />
        </svg>
    );
}
