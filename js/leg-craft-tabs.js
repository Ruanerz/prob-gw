// js/leg-craft-tabs.js
// Handles tab switching and lazy loading of legendary crafting modules

const loaded = {
  first: false,
  third: false
};

async function loadFirstGen() {
  if (loaded.first) return;
  loaded.first = true;
  await import('./legendaryCrafting1gen.js');
}

async function loadThirdGen() {
  if (loaded.third) return;
  loaded.third = true;
  await import('./legendaryCrafting3gen.js');
}

function switchTab(tabId) {
  document.querySelectorAll('.container-first, .container-third').forEach(tab => {
    tab.style.display = 'none';
  });
  document.querySelectorAll('.item-tab-btn').forEach(btn => btn.classList.remove('active'));

  const target = document.getElementById(tabId);
  const button = document.querySelector(`.item-tab-btn[data-tab="${tabId}"]`);
  if (target) target.style.display = 'block';
  if (button) button.classList.add('active');

  if (tabId === 'tab-first-gen') loadFirstGen();
  else if (tabId === 'tab-third-gen') loadThirdGen();
}

document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.item-tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
});
