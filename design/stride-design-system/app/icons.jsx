// icons.jsx — Lucide-style stroke icons for Stride.
// <Icon name="home" size={24} stroke={2} color="currentColor" filled={false}/>

const ICON_PATHS = {
  home:   <><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
  clock:  <><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/></>,
  user:   <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6"/></>,
  plus:   <><path d="M12 5v14M5 12h14"/></>,
  flame:  <><path d="M12 3c1 3 4 4.2 4 8a4 4 0 1 1-8 0c0-1.6.7-2.6 1.4-3.4C10 8.4 10.5 7 10 5.5c2 .8 2.6 2 2.6 2"/></>,
  scale:  <><path d="M12 4v16"/><path d="M7 8h10"/><path d="M7 8l-3 6a3 3 0 0 0 6 0L7 8z"/><path d="M17 8l-3 6a3 3 0 0 0 6 0l-3-6z"/></>,
  bolt:   <><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4"/></>,
  map:    <><path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z"/><path d="M9 4v13M15 6.5v13"/></>,
  list:   <><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></>,
  chevR:  <><path d="M9 6l6 6-6 6"/></>,
  chevD:  <><path d="M6 9l6 6 6-6"/></>,
  arrowR: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  scan:   <><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M4 12h16"/></>,
  pencil: <><path d="M4 20l4-1L19 8l-3-3L5 16l-1 4z"/><path d="M14.5 6.5l3 3"/></>,
  info:   <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/></>,
  check:  <><path d="M5 12.5l4.5 4.5L19 7"/></>,
  pin:    <><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></>,
  bowl:   <><path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M5.5 11c0-3 2.9-5 6.5-5s6.5 2 6.5 5"/><path d="M12 3v1.5"/></>,
  trend:  <><path d="M3 17l5-5 4 3 8-8"/><path d="M16 7h4v4"/></>,
  egg:    <><path d="M12 3c3.5 0 6 5 6 9a6 6 0 1 1-12 0c0-4 2.5-9 6-9z"/></>,
  star:   <><path d="M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.3 6.8 19l1-5.8-4.2-4.1 5.8-.8L12 3z"/></>,
  sliders:<><path d="M4 7h11M19 7h1M4 17h1M9 17h11"/><circle cx="16" cy="7" r="2"/><circle cx="7" cy="17" r="2"/></>,
  dumbbell:<><path d="M6.5 7v10M3.5 9v6M17.5 7v10M20.5 9v6M6.5 12h11"/></>,
  cog:    <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></>,
  bell:   <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/></>,
};

function Icon({ name, size = 24, stroke = 2, color = 'currentColor', style }) {
  const d = ICON_PATHS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style}>
      {d}
    </svg>
  );
}

window.Icon = Icon;
