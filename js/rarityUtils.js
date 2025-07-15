const rarityClasses = {
  Basic: 'rarity-basic',
  Fine: 'rarity-fine',
  Masterwork: 'rarity-masterwork',
  Rare: 'rarity-rare',
  Exotic: 'rarity-exotic',
  Ascended: 'rarity-ascended',
  Legendary: 'rarity-legendary'
};

window.getRarityClass = function(rarity) {
  return rarityClasses[rarity] || '';
};
