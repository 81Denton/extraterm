/*
 * Copyright 2019 Simon Edwards <simon@simonzone.com>
 *
 * This source code is licensed under the MIT license which is detailed in the LICENSE.txt file.
 */
import {BulkFileHandle, Disposable, Event, ViewerMetadata, ViewerPosture} from '@extraterm/extraterm-extension-api';
import {ThemeableElementBase} from '../ThemeableElementBase';
import {VirtualScrollable, SetterState} from '../VirtualScrollArea';
import {Mode, VisualState, CursorMoveDetail, RefreshLevel} from './ViewerElementTypes';
import { EventEmitter } from 'extraterm-event-emitter';


export abstract class ViewerElement extends ThemeableElementBase implements VirtualScrollable, Disposable {
  
  static EVENT_BEFORE_SELECTION_CHANGE = "before-selection-change"
  static EVENT_CURSOR_MOVE = "cursor-move";
  static EVENT_CURSOR_EDGE = "cursor-edge";
  static EVENT_METADATA_CHANGE = "metadata-change";
  
  onDispose: Event<void>;
  _onDisposeEventEmitter = new EventEmitter<void>();

  /**
   * Type guard for detecting a ViewerElement instance.
   * 
   * @param  node the node to test
   * @return      True if the node is a ViewerElement
   */
  static isViewerElement(node: Node): node is ViewerElement {
    return node !== null && node !== undefined && node instanceof ViewerElement;
  }

  constructor() {
    super();
    this.onDispose = this._onDisposeEventEmitter.event; 
  }

  getMetadata(): ViewerMetadata {
    return {
      title: "ViewerElement",
      icon: "fa fa-desktop",
      posture: ViewerPosture.NEUTRAL,
      moveable: true,
      deleteable: true,
      toolTip: null
    };
  }
  
  hasFocus(): boolean {
    return false;
  }
  
  /**
   * Gets the selected text.
   *
   * @return the selected text or null if there is no selection.
   */
  getSelectionText(): string {
    return null;
  }

  hasSelection(): boolean {
    return false;
  }

  clearSelection(): void {
  }
 
  isFocusable(): boolean {
    return false;
  }
  
  setFocusable(value: boolean) {
  }
  
  getVisualState(): VisualState {
    return VisualState.AUTO;
  }

  setVisualState(state: VisualState): void {
  }

  getMode(): Mode {
    return Mode.DEFAULT;
  }
  
  setMode(mode: Mode): void {
  }

  getMimeType(): string {
    return null;
  }
  
  setMimeType(mimetype: string): void {
  }

  getEditable(): boolean {
    return false;
  }

  setEditable(editable: boolean): void {
  }
    
  // VirtualScrollable
  getMinHeight(): number {
    return 0;
  }

  // VirtualScrollable
  getVirtualHeight(containerHeight: number): number {
    return 0;
  }
  
  // VirtualScrollable
  getReserveViewportHeight(containerHeight: number): number {
    return 0;
  }
  
  // VirtualScrollable
  setDimensionsAndScroll(setterState: SetterState): void {
  }

  markVisible(visible: boolean): void {
  }

  getCursorPosition(): CursorMoveDetail {
    return {
      left: 0,
      top: 0,
      bottom: 0,
      viewPortTop: 0
    };
  }
   
  setCursorPositionBottom(x: number): boolean {
    return false;
  }
  
  setCursorPositionTop(x: number): boolean {
    return false;
  }

  /**
   * Set the bulk file to display in the viewer.
   * 
   * @param handle the file to load and display
   * @return A promise which is resolved once the file data has been loaded.
   */
  setBulkFileHandle(handle: BulkFileHandle): Promise<void> {
    throw Error("Not implemented.");
  }

  getBulkFileHandle(): BulkFileHandle {
    return null;
  }

  dispose(): void {
    this._onDisposeEventEmitter.fire();
  }

  refresh(level: RefreshLevel): void {
    
  }
}
