  // Query the tablist, tabs, and panels
  const tablist = document.querySelector('.tabs[role="tablist"]');
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));

  function setActiveTab(nextIndex, { focus = true } = {}) {
    tabs.forEach((tab, i) => {
      const selected = i === nextIndex;
      tab.setAttribute('aria-selected', String(selected));
      tab.setAttribute('tabindex', selected ? '0' : '-1');
      panels[i].setAttribute('aria-hidden', String(!selected));
    });
    if (focus) tabs[nextIndex].focus();
  }

  // Click to activate
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => setActiveTab(i));
  });

  // Keyboard navigation per WAI-ARIA Authoring Practices
  tablist.addEventListener('keydown', (e) => {
    const currentIndex = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
      case 'Left': // legacy
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        e.preventDefault();
        setActiveTab(nextIndex);
        break;
      case 'ArrowRight':
      case 'Right': // legacy
        nextIndex = (currentIndex + 1) % tabs.length;
        e.preventDefault();
        setActiveTab(nextIndex);
        break;
      case 'Home':
        e.preventDefault();
        setActiveTab(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveTab(tabs.length - 1);
        break;
      case 'Enter':
      case ' ':
        // Enter/Space typically activate; since we switch on click, no-op is fine
        // but prevent page scroll on Space when focused on a tab
        if (e.key === ' ') e.preventDefault();
        break;
    }
  });

  // Ensure initial selected tab has tabindex=0 and others -1
  // Assumes exactly one tab has aria-selected="true" in the HTML
  (function init() {
    const selectedIndex = Math.max(0, tabs.findIndex(t => t.getAttribute('aria-selected') === 'true'));
    tabs.forEach((t, i) => t.setAttribute('tabindex', i === selectedIndex ? '0' : '-1'));
    panels.forEach((p, i) => p.setAttribute('aria-hidden', String(i !== selectedIndex)));
  })();
