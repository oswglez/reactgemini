// Utility to remove sort instruction text from table headers
export const removeSortInstructions = () => {
  // Function to remove text nodes containing sort instructions
  const removeTextNodes = (element) => {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodesToRemove = [];
    let node;
    while ((node = walker.nextNode()) !== null) {
      const text = node.textContent.trim();
      if (text.includes('Click to sort') || 
          text.includes('header in ascending order') ||
          text.includes('header in descending order') ||
          text.includes('sort rows by') ||
          text.includes('[object Object]')) {
        textNodesToRemove.push(node);
      }
    }

    // Remove the problematic text nodes
    textNodesToRemove.forEach(node => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
  };

  // Remove from all table headers
  const selectors = [
    '.bx--data-table .bx--table-header',
    '.bx--data-table .bx--table-header-label',
    '.table-header',
    'th',
    'thead th',
    '.room-units-list-container .bx--data-table .bx--table-header',
    '.hotel-list-container .bx--data-table .bx--table-header',
    '.user-list-container .bx--data-table .bx--table-header',
    '.amenity-list-container .bx--data-table .bx--table-header'
  ];

  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      removeTextNodes(element);
    });
  });
};

// Auto-execute when DOM is ready
if (typeof window !== 'undefined') {
  // Run immediately
  removeSortInstructions();
  
  // Run after a short delay to catch dynamically loaded content
  setTimeout(removeSortInstructions, 100);
  setTimeout(removeSortInstructions, 500);
  setTimeout(removeSortInstructions, 1000);
  
  // Run when DOM changes (for dynamic content)
  const observer = new MutationObserver(() => {
    removeSortInstructions();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
} 