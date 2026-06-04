// screen-search.jsx

function SearchScreen() {
  const D = window.STRIDE_DATA;
  const [tab, setTab] = React.useState('Meals');
  const [sort, setSort] = React.useState('Protein / $');
  const tabs = ['Meals', 'Restaurants', 'Recipes'];
  const sorts = [
    { k: 'Best Match', icon: 'target' },
    { k: 'Protein / $', icon: 'bolt' },
    { k: 'Price', icon: null },
    { k: 'Calories', icon: null },
  ];

  let rows = [...D.meals];
  if (sort === 'Protein / $') rows.sort((a, b) => b.value - a.value);
  if (sort === 'Price') rows.sort((a, b) => a.price - b.price);
  if (sort === 'Calories') rows.sort((a, b) => a.cal - b.cal);

  return (
    <div className="screen-scroll">
      {/* search field */}
      <div className="pad screen-top" style={{ marginBottom: 14 }}>
        <div className="search">
          <Icon name="search" size={20} stroke={2.2} color="var(--muted)" />
          Search meals, restaurants, recipes…
        </div>
      </div>

      {/* tabs */}
      <div className="pad" style={{ marginBottom: 16 }}>
        <div className="row" style={{ gap: 0, borderBottom: '1px solid var(--line)' }}>
          {tabs.map(tb => (
            <button key={tb} onClick={() => setTab(tb)} style={{
              flex: 1, padding: '0 0 12px', position: 'relative',
              fontSize: 15, fontWeight: 600, color: tab === tb ? 'var(--ink)' : 'var(--muted)' }}>
              {tb}
              {tab === tb && <span style={{ position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                width: 38, height: 3, borderRadius: 3, background: 'var(--green)' }} />}
            </button>
          ))}
          <button style={{ flex: '0 0 auto', paddingLeft: 14, paddingBottom: 12 }}>
            <Icon name="map" size={22} stroke={2} color="var(--muted)" />
          </button>
        </div>
      </div>

      {/* location + filter */}
      <div className="pad between" style={{ marginBottom: 14 }}>
        <button className="row" style={{ gap: 6, height: 36, padding: '0 13px', borderRadius: 999,
          background: 'var(--surface)', border: '1px solid var(--line)', fontSize: 13.5, fontWeight: 600, color: 'var(--ink-2)' }}>
          <Icon name="pin" size={15} stroke={2.2} color="var(--green)" /> Singapore <Icon name="chevD" size={14} stroke={2.4} color="var(--muted)" />
        </button>
        <button className="row" style={{ gap: 6, height: 36, padding: '0 13px', borderRadius: 999,
          background: 'var(--ink)', color: '#fff', fontSize: 13.5, fontWeight: 600 }}>
          <Icon name="sliders" size={15} stroke={2.2} /> Filter & Sort
        </button>
      </div>

      {/* sort chips */}
      <div className="chip-row" style={{ marginBottom: 16 }}>
        {sorts.map(s => (
          <button key={s.k} className={'sort' + (sort === s.k ? ' is-active' : '')} onClick={() => setSort(s.k)}>
            {s.icon && <Icon name={s.icon} size={13} stroke={2.4} />}
            {s.k}
          </button>
        ))}
      </div>

      {/* count */}
      <div className="pad row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
          <span className="num" style={{ color: 'var(--ink-2)' }}>{rows.length * 62}</span> meals
        </span>
        {sort === 'Protein / $' && <span className="row" style={{ gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>
          <Icon name="bolt" size={13} stroke={2.4} /> Sorted by best value</span>}
      </div>

      {/* results */}
      <div className="pad col" style={{ gap: 11 }}>
        {rows.map((m, i) => (
          <div key={m.id} className="card pop" style={{ padding: '4px 16px', animationDelay: (i * 0.03) + 's' }}>
            <MealRow meal={m} />
          </div>
        ))}
      </div>
    </div>
  );
}

window.SearchScreen = SearchScreen;
