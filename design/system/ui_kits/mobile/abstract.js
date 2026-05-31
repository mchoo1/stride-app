function abstractTile(seed = 1, size = 48) {
  const hues = [
    ['#F3E8D5', '#D9B677'], // warm sand
    ['#E3EEE0', '#9CC49B'], // mint
    ['#DFE8F3', '#8AA9CB'], // sky
    ['#EDE3F0', '#B499C2'], // lilac
    ['#F1DCD4', '#D49A83'], // salmon
  ];
  const [a, b] = hues[seed % hues.length];
  return {
    width: size, height: size, borderRadius: 12,
    background: 'linear-gradient(135deg, ' + a + ' 0%, ' + b + ' 100%)',
    position: 'relative', overflow: 'hidden', flexShrink: 0,
  };
}
window.abstractTile = abstractTile;