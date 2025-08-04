/**
 * Generates a unique CSS selector for a given DOM element
 */
export function generateCSSSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();
    
    if (element.className) {
      const classes = element.className.trim().split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        child => child.nodeName === element.nodeName
      );
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        selector += `:nth-child(${index})`;
      }
    }
    
    path.unshift(selector);
    element = parent as Element;
  }
  
  return path.join(' > ');
}

/**
 * Generates multiple selector options for an element
 */
export function generateSelectorOptions(element: Element): string[] {
  const selectors: string[] = [];
  
  // ID selector (highest priority)
  if (element.id) {
    selectors.push(`#${element.id}`);
  }
  
  // Class selector
  if (element.className) {
    const classes = element.className.trim().split(/\s+/).filter(Boolean);
    if (classes.length > 0) {
      selectors.push(`.${classes.join('.')}`);
    }
  }
  
  // Data attribute selectors
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('data-')) {
      selectors.push(`[${attr.name}="${attr.value}"]`);
    }
  });
  
  // Full path selector
  selectors.push(generateCSSSelector(element));
  
  return [...new Set(selectors)]; // Remove duplicates
}