/*
 * Copyright 2017-2020 Simon Edwards <simon@simonzone.com>
 *
 * This source code is licensed under the MIT license which is detailed in the LICENSE.txt file.
 */
import { html, render, TemplateResult, parts } from "extraterm-lit-html";
import { DirectiveFn } from "extraterm-lit-html/lib/directive";
import { live } from "extraterm-lit-html/directives/live";
import { repeat } from "extraterm-lit-html/directives/repeat";

import {Disposable} from "@extraterm/extraterm-extension-api";
import { Attribute, Observe, CustomElement } from "extraterm-web-component-decorators";

import {doLater} from "extraterm-later";
import {log, Logger, getLogger} from "extraterm-logging";
import * as ThemeTypes from "../../theme/Theme";
import {PopDownDialog} from "./PopDownDialog";
import { ThemeableElementBase } from "../ThemeableElementBase";
import * as DomUtils from "../DomUtils";
import { disassembleDOMTree } from "../DomUtils";


const ID_FILTER = "ID_FILTER";
const ID_RESULTS = "ID_RESULTS";

interface RenderWork {
  updateContents: boolean;
  scrollToSelected: boolean;
  focusInput: boolean;
}


/**
 * A Pop Down List Picker.
 */
@CustomElement("et-popdownlistpicker")
export class PopDownListPicker<T extends { id: string; }> extends ThemeableElementBase {

  static TAG_NAME = "ET-POPDOWNLISTPICKER";
  static ATTR_DATA_ID = "data-id";
  static CLASS_RESULT_SELECTED = "CLASS_RESULT_SELECTED";
  static CLASS_RESULT_ENTRY = "CLASS_RESULT_ENTRY";

  private _log: Logger = null;
  private _entries: T[] = [];
  private _filterEntries: (entries: T[], filterText: string) => T[];
  private _formatEntries: (filteredEntries: T[], selectedId: string, filterInputValue: string) => DirectiveFn | TemplateResult;
  private _laterHandle: Disposable = null;
  private _extraCssFiles: ThemeTypes.CssFile[] = [];

  private _open = false;

  private _neverRendered = true;
  private _renderWork: RenderWork = null;

  constructor() {
    super();
    this._log = getLogger(PopDownListPicker.TAG_NAME, this);

    this.attachShadow({ mode: "open", delegatesFocus: true });
    this.updateThemeCss();

    this._handleDialogClose = this._handleDialogClose.bind(this);
    this._handleFilterInput = this._handleFilterInput.bind(this);
    this._handleFilterKeyDown = this._handleFilterKeyDown.bind(this);
    this._handleResultClick = this._handleResultClick.bind(this);

    this._filterEntries = (entries: T[], filterText: string): T[] => entries;
    this._formatEntries = (filteredEntries: T[], selectedId: string, filter: string): DirectiveFn | TemplateResult =>
      repeat(filteredEntries, (entry) => entry.id,
        (entry, index) => html`<div data-id=${entry.id}>${entry.id}</div>`);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    parts.set(this.shadowRoot, undefined);
    disassembleDOMTree(this.shadowRoot);
  }

  private _handleDialogClose(): void {
    this._open = false;
    this._scheduleUpdate({updateContents: true});
    this._okId(null);
  }

  private _handleFilterInput(): void {
    const filterInput = <HTMLInputElement> DomUtils.getShadowId(this, ID_FILTER);
    this.filter = filterInput.value;
  }

  private _handleResultClick(ev: Event): void {
    for (const node of ev.path) {
      if (node instanceof HTMLElement) {
        const dataId = node.attributes.getNamedItem(PopDownListPicker.ATTR_DATA_ID);
        if (dataId !== undefined && dataId !== null) {
          this._okId(dataId.value);
        }
      }
    }
  }

  private _scheduleUpdate(renderWork: Partial<RenderWork>, nextFrame=false): void {
    if (this._renderWork == null) {
      this._renderWork = {
        updateContents: false,
        focusInput: false,
        scrollToSelected: false
      };

      if (nextFrame) {
        doLater(() => {
          this._performRenderWork();
        });
      } else {
        window.queueMicrotask(() => {
          this._performRenderWork();
        });
      }
    }

    this._renderWork.focusInput = this._renderWork.focusInput || renderWork.focusInput;
    this._renderWork.scrollToSelected = this._renderWork.scrollToSelected || renderWork.scrollToSelected;
    this._renderWork.updateContents = this._renderWork.updateContents || renderWork.updateContents;
  }

  private _performRenderWork(): void {
    const renderWork = this._renderWork;
    this._renderWork = null;

    // Do a very fast and empty render first.
    if (this._neverRendered) {
      this._render(true);
      this._neverRendered = false;
      this._scheduleUpdate(renderWork, true);
      return;
    }

    if (renderWork.updateContents) {
      this._render();
    }
    if (renderWork.scrollToSelected) {
      this._scrollToSelected();
    }
    if (renderWork.focusInput) {
      const filterInput = <HTMLInputElement> DomUtils.getShadowId(this, ID_FILTER);
      filterInput.focus();
    }
  }

  private _render(fast = false): void {
    const filterKeyDown = {
      handleEvent: this._handleFilterKeyDown,
      capture: true
    };

    let formattedEntries: DirectiveFn | TemplateResult = html``;
    if ( ! fast) {
      const filteredEntries = this._filterEntries(this._entries, this.filter);
      if (filteredEntries.length === 0) {
        this._setSelected(null);
      } else {
        const newSelectedIndex = filteredEntries.findIndex( (entry) => entry.id === this.selected);
        const newSelected = filteredEntries[Math.max(0, newSelectedIndex)].id;
        if (newSelected !== this.selected) {
          this._setSelected(newSelected);
        }
      }
      formattedEntries = this._formatEntries(filteredEntries, this.selected, this.filter);
    }

    const template = html`${this._styleTag()}
      <et-pop-down-dialog
          id="ID_DIALOG"
          title-primary=${this.titlePrimary}
          title-secondary=${this.titleSecondary}
          open="${this._open}"
          @ET-POP-DOWN-DIALOG-CLOSE_REQUEST=${this._handleDialogClose}>
        <div id="ID_RESULTS_CONTAINER">
          <div class="gui-packed-row">
            <input
              class="expand"
              type="text"
              id="ID_FILTER"
              spellcheck="false"
              @input=${this._handleFilterInput}
              @keydown=${filterKeyDown}
              .value=${live(this.filter)}
            />
          </div>
          <div
            id="ID_RESULTS"
            @click=${this._handleResultClick}>${formattedEntries}</div>
        </div>
      </et-pop-down-dialog>
      `;

    render(template, this.shadowRoot);
    this.installThemeCss();

    const resultsDiv = DomUtils.getShadowId(this, ID_RESULTS);
    const dialog = <PopDownDialog> DomUtils.getShadowId(this, "ID_DIALOG");
    const rect = dialog.getBoundingClientRect();
    resultsDiv.style.maxHeight = `${Math.floor(rect.height * 0.75)}px`;
  }

  protected _themeCssFiles(): ThemeTypes.CssFile[] {
    const extraCssFiles = this._extraCssFiles == null? [] : this._extraCssFiles;
    return [ThemeTypes.CssFile.GENERAL_GUI, ThemeTypes.CssFile.FONT_AWESOME, ThemeTypes.CssFile.EXTRAICONS,
      ThemeTypes.CssFile.GUI_POP_DOWN_LIST_PICKER, ...extraCssFiles];
  }

  private _programmaticSet = false;

  @Attribute selected: string = null;

  @Observe("selected")
  private _updateSelected(target: string): void {
    if (this._programmaticSet) {
      return;
    }
    this._scheduleUpdate({ updateContents: true, scrollToSelected: true });
  }

  private _setSelected(id: string): void {
    this._programmaticSet = true;
    this.selected = id;
    this._programmaticSet = false;
  }

  setEntries(entries: T[]): void {
    this._entries = entries;
    this.selected = null;
    this.filter = "";

    this._scheduleUpdate({ updateContents: true });
  }

  getEntries(): T[] {
    return this._entries;
  }

  @Attribute titlePrimary = "";
  @Attribute titleSecondary = "";

  @Observe("titlePrimary", "titleSecondary")
  private _observe(target: string): void {
    this._scheduleUpdate({ updateContents: true });
  }

  @Attribute filter = "";

  @Observe("filter")
  private _observeFilter(target: string): void {
    this._scheduleUpdate({ updateContents: true, scrollToSelected: true });
  }

  setFilterAndRankEntriesFunc(func: (entries: T[], filterText: string) => T[]): void {
    this._filterEntries = func;
  }

  setFormatEntriesFunc(func: (filteredEntries: T[], selectedId: string, filter: string) => DirectiveFn | TemplateResult): void {
    this._formatEntries = func;
  }

  /**
   * Specify extra Css files to load into this element.
   *
   * @param extraCssFiles extra Css files which should be loaded along side the default set.
   */
  addExtraCss(extraCssFiles: ThemeTypes.CssFile[]): void {
    this._extraCssFiles = [...this._extraCssFiles, ...extraCssFiles];
    this.updateThemeCss();
  }

  private _scrollToSelected(): void {
    const resultsDiv = DomUtils.getShadowId(this, ID_RESULTS);
    const selectedElement = <HTMLElement> resultsDiv.querySelector("." + PopDownListPicker.CLASS_RESULT_SELECTED);
    if (selectedElement == null) {
      return;
    }
    const selectedRelativeTop = selectedElement.offsetTop - resultsDiv.offsetTop;
    const top = resultsDiv.scrollTop;
    if (top > selectedRelativeTop) {
      resultsDiv.scrollTop = selectedRelativeTop;
    } else {
      const selectedElementDimensions = selectedElement.getBoundingClientRect();
      if (selectedRelativeTop + selectedElementDimensions.height > top + resultsDiv.clientHeight) {
        resultsDiv.scrollTop = selectedRelativeTop + selectedElementDimensions.height - resultsDiv.clientHeight;
      }
    }
  }

  private _handleFilterKeyDown(ev: KeyboardEvent): void {
    if (ev.key === "Escape") {
      this._okId(null);
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    if (ev.key === "Tab") {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    const isPageKey = ev.key === "PageUp" || ev.key === "PageDown";
    const hasMeta = ev.altKey || ev.shiftKey || ev.ctrlKey;

    const isUp = ev.key === "PageUp" || ev.key === "ArrowUp" || (ev.key === "Home" && ! hasMeta);

    if (isPageKey || isUp || ev.key === "ArrowDown" || (ev.key === "End" && ! hasMeta) || ev.key === "Enter") {
      ev.preventDefault();
      ev.stopPropagation();

      const filteredEntries = this._filterEntries(this._entries, this.filter);
      if (filteredEntries.length === 0) {
        return;
      }

      const selectedIndex = filteredEntries.findIndex( (entry) => entry.id === this.selected);

      if (ev.key === "Enter") {
        // Enter
        if (this.selected !== null) {
          this._okId(this.selected);
        }
      } else {

        const resultsDiv = DomUtils.getShadowId(this, ID_RESULTS);

        // Determine the step size.
        let stepSize = 1;
        if (isPageKey) {
          const selectedElement = <HTMLElement> resultsDiv.querySelector("." + PopDownListPicker.CLASS_RESULT_SELECTED);
          const selectedElementDimensions = selectedElement.getBoundingClientRect();

          stepSize = Math.floor(resultsDiv.clientHeight / selectedElementDimensions.height);
        }

        if (isUp) {
          if (ev.key === "Home") {
            this._setSelected(filteredEntries[0].id);
          } else {
            this._setSelected(filteredEntries[Math.max(0, selectedIndex-stepSize)].id);
          }
        } else {
          if (ev.key === "End") {
            this._setSelected(filteredEntries[filteredEntries.length-1].id);
          } else {
            this._setSelected(filteredEntries[Math.min(filteredEntries.length-1, selectedIndex+stepSize)].id);
          }
        }

        this._scheduleUpdate({ updateContents: true, scrollToSelected: true });
      }
    }
  }

  open(): void {
    this._open = true;
    this.filter = "";
    this._scheduleUpdate({ updateContents: true, scrollToSelected: true, focusInput: true });
  }

  close(): void {
    this._open = false;
    this._scheduleUpdate({ updateContents: true });
  }

  isOpen(): boolean {
    return this._open;
  }

  private _okId(selectedId: string): void {
    if (this._laterHandle === null) {
      this._laterHandle = doLater( () => {
        this.close();
        this._laterHandle = null;
        const event = new CustomEvent("selected", { detail: {selected: selectedId } });
        this.dispatchEvent(event);
      });
    }
  }
}
