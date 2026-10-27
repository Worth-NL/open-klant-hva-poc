// Kleine decoratieve iconen (aria-hidden): de betekenis staat altijd ook in tekst.
type IconProps = { className?: string };

const basis = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
};

export function ZoekIcoon({ className }: IconProps) {
    return (
        <svg {...basis} className={className}>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
        </svg>
    );
}

export function MenuIcoon({ className }: IconProps) {
    return (
        <svg {...basis} className={className}>
            <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

export function ChatIcoon({ className }: IconProps) {
    return (
        <svg {...basis} className={className}>
            <path d="M4 5h16v11H9l-5 4V5z" />
        </svg>
    );
}

export function MailIcoon({ className }: IconProps) {
    return (
        <svg {...basis} className={className}>
            <rect x="3" y="5" width="18" height="14" />
            <path d="M3 6l9 7 9-7" />
        </svg>
    );
}

export function LoketIcoon({ className }: IconProps) {
    return (
        <svg {...basis} className={className}>
            <path d="M3 10l9-6 9 6M5 10v9M19 10v9M9 19v-6M15 19v-6M3 19h18" />
        </svg>
    );
}
