import { Injectable, NgZone } from '@angular/core';

interface TopBar {
  bar: HTMLDivElement;
  inner: HTMLDivElement;
  resize: ResizeObserver;
  /** Scroll container whose horizontal position is mirrored by the bar. */
  anchor: HTMLElement;
}

/**
 * Puts every table's horizontal scrollbar on top of the table instead of below it.
 * Finds each horizontally scrollable container that holds a <table>, adds a synced
 * scrollbar above it and hides the container's own bottom scrollbar (see styles.scss).
 * Runs app-wide, so pages need no changes.
 */
@Injectable({ providedIn: 'root' })
export class TopScrollbarService {
  private bars = new Map<HTMLElement, TopBar>();
  private timer: any;
  /** Watches every table and its scroll boxes, so a table that starts overflowing later gets a bar */
  private sizeWatcher!: ResizeObserver;
  private watched = new Set<Element>();

  constructor(private zone: NgZone) {}

  start() {
    // Outside Angular so DOM watching never triggers change detection
    this.zone.runOutsideAngular(() => {
      new MutationObserver(() => this.scheduleScan()).observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
        childList: true,
        characterData: true,
        subtree: true,
      });
      // Style changes (incl. dev reload of CSS) land in <head>, outside the body observer
      new MutationObserver(() => this.scheduleScan()).observe(document.head, { childList: true, subtree: true });
      // Width changes with no DOM change: web font loading, side menu toggle, CSS edits
      this.sizeWatcher = new ResizeObserver(() => this.scheduleScan());
      document.fonts?.ready.then(() => this.scheduleScan());
      window.addEventListener('resize', () => this.scheduleScan());
      this.scheduleScan();
    });
  }

  private scheduleScan() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.scan(), 100);
  }

  private scan() {
    // Drop bars whose table container left the page
    this.bars.forEach((tb, el) => {
      if (!el.isConnected) this.detach(el, tb);
    });
    this.watched.forEach(el => {
      if (el.isConnected) return;
      this.sizeWatcher.unobserve(el);
      this.watched.delete(el);
    });

    document.querySelectorAll('table').forEach(table => {
      this.watchSize(table);
      const container = this.scrollParent(table);
      if (container && !this.bars.has(container)) this.attach(container);
    });

    this.bars.forEach(tb => {
      // Keep the bar with its table when Material moves tab content in and out of the DOM.
      if (tb.bar.parentElement !== tb.anchor.parentElement || tb.bar.nextElementSibling !== tb.anchor) {
        tb.anchor.parentElement?.insertBefore(tb.bar, tb.anchor);
      }
    });
    this.bars.forEach((tb, el) => this.update(el, tb));
  }

  /** Watch the table and every scroll box around it, even ones that don't overflow yet. */
  private watchSize(table: HTMLElement) {
    let node: HTMLElement | null = table;
    while (node && node !== document.body) {
      const overflowX = node === table ? '' : getComputedStyle(node).overflowX;
      if ((node === table || overflowX === 'auto' || overflowX === 'scroll') && !this.watched.has(node)) {
        this.watched.add(node);
        this.sizeWatcher.observe(node);
      }
      node = node.parentElement;
    }
  }

  /** Nearest ancestor that scrolls horizontally. */
  private scrollParent(el: HTMLElement): HTMLElement | null {
    let node = el.parentElement;
    while (node && node !== document.body) {
      const overflowX = getComputedStyle(node).overflowX;
      if ((overflowX === 'auto' || overflowX === 'scroll') && node.scrollWidth > node.clientWidth + 1) return node;
      node = node.parentElement;
    }
    return null;
  }

  private attach(container: HTMLElement) {
    const anchor = container;
    const bar = document.createElement('div');
    bar.className = 'top-scrollbar';
    const inner = document.createElement('div');
    bar.appendChild(inner);
    container.parentElement?.insertBefore(bar, container);
    container.classList.add('has-top-scrollbar');

    let syncing = false;
    const sync = (from: HTMLElement, to: HTMLElement) => () => {
      if (syncing) return;
      syncing = true;
      to.scrollLeft = from.scrollLeft;
      requestAnimationFrame(() => (syncing = false));
    };
    bar.addEventListener('scroll', sync(bar, container));
    container.addEventListener('scroll', sync(container, bar));

    const resize = new ResizeObserver(() => this.scheduleScan());
    resize.observe(container);
    const table = container.querySelector('table');
    if (table) resize.observe(table);

    this.bars.set(container, { bar, inner, resize, anchor });
  }

  private update(container: HTMLElement, { bar, inner }: TopBar) {
    const overflows = container.scrollWidth > container.clientWidth + 1;
    bar.style.display = overflows ? 'block' : 'none';
    if (!overflows) return;
    bar.style.width = `${container.clientWidth}px`;
    inner.style.width = `${container.scrollWidth}px`;
    bar.scrollLeft = container.scrollLeft;
  }

  private detach(container: HTMLElement, { bar, resize }: TopBar) {
    resize.disconnect();
    bar.remove();
    container.classList.remove('has-top-scrollbar');
    this.bars.delete(container);
  }
}
