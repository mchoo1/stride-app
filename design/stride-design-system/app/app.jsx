// app.jsx — Stride shell: screen switching, bottom nav, iOS frame mount

function StrideApp() {
  const [screen, setScreen] = React.useState(() => localStorage.getItem('stride.screen') || 'home');
  const scrollRef = React.useRef(null);

  const nav = (k) => {
    setScreen(k);
    localStorage.setItem('stride.screen', k);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const screens = {
    home: <HomeScreen onNav={nav} />,
    search: <SearchScreen />,
    log: <LogScreen />,
    profile: <ProfileScreen />,
  };

  return (
    <div className="stride">
      <div ref={scrollRef} key={screen} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {screens[screen]}
      </div>
      <BottomNav active={screen} onNav={nav} />
    </div>
  );
}

function Root() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px', background: 'radial-gradient(circle at 50% 0%, #e7eee6, #dfe6dd)' }}>
      <IOSDevice>
        <StrideApp />
      </IOSDevice>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
