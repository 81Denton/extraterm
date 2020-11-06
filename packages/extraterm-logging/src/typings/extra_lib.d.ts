/**************************************************************************
 * Extra Chrome specific features and new APIs which need to be mixed in.
 * 
 * The contents of this file is appending to lib.d.ts *before* processing.
 */

// ---- Shadow DOM v1

interface ShadowRootInit {
    mode: ShadowRootMode;
    delegatesFocus?: boolean;
}

interface CaretPosition {
    getClientRect(): ClientRect;
}

interface DocumentOrShadowRoot {
    caretPositionFromPoint(x: number, y: number): CaretPosition | null;
}

interface Document extends DocumentOrShadowRoot {}

interface AssignedNodesOptions {
    flatten?: boolean;
}

interface HTMLSlotElement extends HTMLElement {
    name: string;
    assignedNodes(options?: AssignedNodesOptions): NodeList;
}

interface Event {
  composedPath(): Node[];
}

//----

interface Element {

  remove(): void; // FF and Chrome specific.

  // Shadow DOM
  createShadowRoot(): ShadowRoot;
  
  webkitCreateShadowRoot(): ShadowRoot;
  
  getDestinationInsertionPoints(): NodeList;
  webkitShadowRoot: ShadowRoot;

}

// Shadow DOM v0
interface ShadowRoot extends DocumentFragment {
  getElementById(elementId: string ): HTMLElement;
  getElementsByClassName(className: string): NodeList;
  getElementsByTagName(tagName: string): NodeList;
  getElementsByTagNameNS(namespace: string, localName: string): NodeList;
  getSelection(): Selection;
  elementFromPoint(x: number, y: number): Element;
  
  activeElement: Element;
  olderShadowRoot: ShadowRoot;
  innerHTML: string;
  styleSheets: StyleSheetList;
}

// HTML Template and custom element related.
interface HTMLContentElement extends HTMLElement {
  select: string;
  getDistributedNodes(): NodeList;
}

interface HTMLDialogElement extends HTMLElement {
  open: boolean;
  returnValue: string;
  show(anchor?: Element): void;
  show(anchor?: MouseEvent): void;
  showModal(anchor?: Element): void;
  showModal(anchor?: MouseEvent): void;
  close(returnValue?: string): void;
}

interface Document {
  createElement(tagName: "template"): HTMLTemplateElement;
}

interface KeyboardEventInit {
  code?: string;
  charCode?: number;
  keyCode?: number;
  which?: number;
}

interface Event {
  path: Node[]; // <- obsolete. Removed from later the Shadow DOM spec.
  encapsulated: boolean;
}

interface EventInit {
    composed?: boolean;
}

interface Console {
  timeStamp(label: string): void;
}

interface FontFace {
  family: string;
  style: string;
  weight: string;
  stretch: string;
  unicodeRange: string;
  variant: string;
  featureSettings: string;

  status: string;

  load(): Promise<FontFace>;
  
  loaded: Promise<FontFace>;
}

interface FontFaceSet extends Set<FontFace> {
  onloading: (ev: Event) => any;
  onloadingdone: (ev: Event) => any;
  onloadingerror: (ev: Event) => any;
  
  // check and start loads if appropriate
  // and fulfill promise when all loads complete
  load(font: string, text?: string): Promise< ArrayLike<FontFace> >;
  
  // return whether all fonts in the fontlist are loaded
  // (does not initiate load if not available)
  check(font: string, text?: string): boolean;
  
  // async notification that font loading and layout operations are done
  ready: Promise<FontFaceSet>;
  
  // loading state, "loading" while one or more fonts loading, "loaded" otherwise
  status: string;
}

interface Document {
  fonts: FontFaceSet;
}

interface HTMLIFrameElement {
  srcdoc: string;
}

interface ResizeObserverEntry {
  readonly target: Element;
  readonly contentRect: DOMRectReadOnly;
}

interface ResizeObserverCallback {
  (entires: ResizeObserverEntry[], observer: ResizeObserver): void;
}

interface ResizeObserver {
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void
}

declare const ResizeObserver: {
  new(callback: ResizeObserverCallback): ResizeObserver;
};

interface FinalizationRegistry {
 register(obj: any, heldValue: any, token?: any): void;
 unregister(token: any): void;
}

declare const FinalizationRegistry: {
  new(callback: (heldValue: any) => void): FinalizationRegistry;
}
