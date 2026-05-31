// Icons.jsx — React wrappers for the Stride icon set. Inline SVG so currentColor works.
// All 24×24, 1.75 stroke, rounded caps.

const svg = (body, { fill = false } = {}) => (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'}
       stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {body}
  </svg>
);

// ── Nav (outline + fill) ──
const NavHomeOutline = svg(<><path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9v10.5a1 1 0 0 0 1 1h3.5v-5.5h4v5.5h3.5a1 1 0 0 0 1-1V9"/></>);
const NavHomeFill = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...props}>
    <path d="M5.5 9.2V19.5a1 1 0 0 0 1 1h3.5V15a.9.9 0 0 1 .9-.9h2.2a.9.9 0 0 1 .9.9v5.5h3.5a1 1 0 0 0 1-1V9.2L12 3.8 5.5 9.2Z" fill="currentColor"/>
  </svg>
);
const NavScanOutline = svg(<><rect x="3" y="6.5" width="18" height="13" rx="2.5"/><circle cx="12" cy="13.2" r="3.5"/><path d="M8.5 6.5 9.6 4.5h4.8l1.1 2"/></>);
const NavScanFill = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...props}>
    <path d="M8.5 4.8a1 1 0 0 1 .86-.5h5.28a1 1 0 0 1 .86.5l.9 1.7H20a1.5 1.5 0 0 1 1.5 1.5v10.5A1.5 1.5 0 0 1 20 20H4a1.5 1.5 0 0 1-1.5-1.5V8A1.5 1.5 0 0 1 4 6.5h3.6l.9-1.7Z" fill="currentColor"/>
    <circle cx="12" cy="13.2" r="3.2" fill="#fff"/>
  </svg>
);
const NavEatOutline = svg(<><path d="M3.5 11h17"/><path d="M4.5 11a7.5 7.5 0 0 0 15 0"/><path d="M15.5 7 18 4.5"/><path d="M13 7l1-3"/></>);
const NavEatFill = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4.5 11h15a7.5 7.5 0 0 1-15 0z" fill="currentColor" stroke="none"/>
    <path d="M3.5 11h17"/><path d="M15.5 7 18 4.5"/><path d="M13 7l1-3"/>
  </svg>
);
const NavMoveOutline = svg(<path d="M13.5 3 5.5 13h5.5l-1 8 8-10h-5.5l1-8Z"/>);
const NavMoveFill = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...props}>
    <path d="M13.5 3 5.5 13h5.5l-1 8 8-10h-5.5l1-8Z" fill="currentColor" strokeLinejoin="round"/>
  </svg>
);
const NavMeOutline = svg(<><circle cx="12" cy="8" r="3.75"/><path d="M4.5 20c0-3.8 3.4-6.5 7.5-6.5s7.5 2.7 7.5 6.5"/></>);
const NavMeFill = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="8" r="3.75" fill="currentColor"/>
    <path d="M4.5 20.5c0-3.8 3.4-6.8 7.5-6.8s7.5 3 7.5 6.8" fill="currentColor"/>
  </svg>
);

// ── Features ──
const IconPlus = svg(<><circle cx="12" cy="12" r="8.5"/><path d="M12 8.5v7M8.5 12h7"/></>);
const IconFork = svg(<><path d="M3.5 11h17"/><path d="M4.5 11a7.5 7.5 0 0 0 15 0"/></>);
const IconBolt = svg(<path d="M13.5 3 5.5 13h5.5l-1 8 8-10h-5.5l1-8Z"/>);
const IconWeight = svg(<><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M7.5 8.5a4.5 4.5 0 0 1 9 0"/><path d="M12 8.5v3.5"/></>);
const IconFlame = svg(<><path d="M12 3.5c.5 3 3 4 3 7a3 3 0 0 1-6 0c0-1.2.5-2 1.5-3 0 1 1 2 1.5 2Z"/><path d="M8.5 14.5c-1 1-1.5 2.2-1.5 3.5a5 5 0 0 0 10 0c0-1.6-.7-2.8-2-4"/></>);
const IconReport = svg(<><path d="M6 3.5h8L18 7.5v11.5a1.5 1.5 0 0 1-1.5 1.5h-10.5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5Z"/><path d="M13.5 3.5V7.5H17.5"/><path d="M8 12.5h6M8 15.5h4"/></>);
const IconPinEat = svg(<><path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0c0 5 6.5 11 6.5 11Z"/><path d="M10 6.5v3.5a2 2 0 0 0 4 0V6.5M12 6.5v3.5"/></>);
const IconPinMove = svg(<><path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0c0 5 6.5 11 6.5 11Z"/><path d="M8.5 10h7M9.5 8.5v3M14.5 8.5v3"/></>);

// Utility
const IconChevron = svg(<path d="M9 6l6 6-6 6"/>);
const IconBack = svg(<path d="M15 6l-6 6 6 6"/>);
const IconSearch = svg(<><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></>);
const IconClose = svg(<><path d="M6 6l12 12M18 6L6 18"/></>);
const IconSettings = svg(<><circle cx="12" cy="12" r="3.25"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/></>);
const IconTrend = svg(<path d="M3 17l6-6 4 4 8-9"/>);
const IconCrosshair = svg(<><circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></>);

Object.assign(window, {
  NavHomeOutline, NavHomeFill, NavScanOutline, NavScanFill,
  NavEatOutline, NavEatFill, NavMoveOutline, NavMoveFill, NavMeOutline, NavMeFill,
  IconPlus, IconFork, IconBolt, IconWeight, IconFlame, IconReport,
  IconPinEat, IconPinMove,
  IconChevron, IconBack, IconSearch, IconClose, IconSettings, IconTrend, IconCrosshair,
});
