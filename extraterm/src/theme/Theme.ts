/*
 * Copyright 2014-2021 Simon Edwards <simon@simonzone.com>
 *
 * This source code is licensed under the MIT license which is detailed in the LICENSE.txt file.
 */

export type ThemeType = "terminal" | "terminal-css" | "syntax" | "syntax-css" | "gui";

export interface ThemeInfo {
  name: string;
  id: string;
  type: ThemeType;
  path: string;
  provider: string;
  debug: boolean;
  comment: string;
  loadingBackgroundColor: string;
  loadingForegroundColor: string;
}

export interface ThemeContents {
  cssFiles: { id: string, cssFileName: CssFile, contents: string; }[];
}

export const CSS_MODULE_INTERNAL_GUI = "<gui>";
export const CSS_MODULE_INTERNAL_SYNTAX = "<syntax>";
export const CSS_MODULE_INTERNAL_TERMINAL = "<terminal>";


export type CssFile = string;
export const CssFile = {
  GENERAL_GUI: CSS_MODULE_INTERNAL_GUI + ":" + "general-gui/main.scss",
  TOP_WINDOW: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/top-window.scss",
  MAIN_UI: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/main-ui.scss",
  TERMINAL: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/terminal.scss",
  IMAGE_VIEWER: CSS_MODULE_INTERNAL_GUI + ":" + "viewers/image-viewer.scss",

  TERMINAL_VIEWER: CSS_MODULE_INTERNAL_TERMINAL + ":" + "terminal-viewer.scss",
  TERMINAL_VARS: CSS_MODULE_INTERNAL_TERMINAL + ":" + "terminal-vars.scss",
  TEXT_VIEWER: CSS_MODULE_INTERNAL_SYNTAX + ":" + "text-viewer.scss",

  EMBEDDED_FRAME: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/embedded-frame.scss",
  SETTINGS_TAB: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/settings-tab.scss",
  GUI_MENUITEM: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-menuitem.scss",
  GUI_CONTEXTMENU: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-contextmenu.scss",
  GUI_TABWIDGET: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-tabwidget.scss",
  GUI_STACKEDWIDGET: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-stackedwidget.scss",
  GUI_SCROLLBAR: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-scrollbar.scss",
  KEY_BINDINGS_TAB: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/key-bindings-tab.scss",
  COMMAND_PALETTE: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/command-palette.scss",
  GUI_POP_DOWN_DIALOG: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-popdowndialog.scss",
  GUI_POP_DOWN_LIST_PICKER: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-popdownlistpicker.scss",
  GUI_SEARCHABLE_LIST: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-searchablelist.scss",
  GUI_POP_DOWN_NUMBER_DIALOG: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-popdownnumberdialog.scss",
  GUI_LIST_PICKER: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-listpicker.scss",
  TIP_VIEWER: CSS_MODULE_INTERNAL_GUI + ":" + "viewers/tip-viewer.scss",
  FONT_AWESOME: CSS_MODULE_INTERNAL_GUI + ":" + "fonts/font-awesome.scss",
  VIEWER_TAB: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/viewer-tab.scss",
  GUI_SPLITTER: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-splitter.scss",
  EMPTY_PANE_MENU: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/empty-pane-menu.scss",
  GUI_SNAP_DROP_CONTAINER: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-snap-drop-container.scss",
  THEME_VARS: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/theme-vars.scss",
  GUI_FILE_TRANSFER_PROGRESS: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-file-transfer-progress.scss",
  UPLOAD_PROGRESS_BAR: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/upload-progress-bar.scss",
  GUI_COMPACT_FILE_TRANSFER_PROGRESS: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-compact-file-transfer-progress.scss",
  DOWNLOAD_VIEWER: CSS_MODULE_INTERNAL_GUI + ":" + "viewers/download-viewer.scss",
  VIRTUAL_SCROLL_CANVAS: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/virtual-scroll-canvas.scss",
  TABS: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/tabs.scss",
  EXTRAICONS: CSS_MODULE_INTERNAL_GUI + ":" + "fonts/extraicons.scss",
  GUI_DIVIDER_MENU_ITEM: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-dividermenuitem.scss",
  TERMINAL_CANVAS: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/terminal-canvas.scss",
  GUI_SIDEBAR_LAYOUT: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-sidebar-layout.scss",
  GUI_ON_CURSOR_DIALOG: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-on-cursor-dialog.scss",
  GUI_ON_CURSOR_LIST_PICKER: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-on-cursor-list-picker.scss",
  GUI_ON_CURSOR_SEARCHABLE_LIST: CSS_MODULE_INTERNAL_GUI + ":" + "gui-components/gui-on-cursor-searchable-list.scss",
  EXTENSION_LIST_PICKER: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/extension-list-picker.scss",
  EXTENSION_TAB: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/extension-tab.scss",
  EXTENSION_CONTAINER: CSS_MODULE_INTERNAL_GUI + ":" + "app-components/extension-container.scss",
};

export function cssFileToFilename(cssFile: CssFile): string {
  const parts = cssFile.split(":");
  return parts[1];
}

export function cssFileToExtension(cssFile: CssFile): string {
  const parts = cssFile.split(":");
  return parts[0];
}

export const cssFileEnumItems: CssFile[] = [
  CssFile.GENERAL_GUI,
  CssFile.TOP_WINDOW,
  CssFile.MAIN_UI,
  CssFile.TERMINAL,
  CssFile.IMAGE_VIEWER,
  CssFile.TERMINAL_VIEWER,
  CssFile.TEXT_VIEWER,
  CssFile.EMBEDDED_FRAME,
  CssFile.SETTINGS_TAB,
  CssFile.GUI_MENUITEM,
  CssFile.GUI_CONTEXTMENU,
  CssFile.GUI_TABWIDGET,
  CssFile.GUI_STACKEDWIDGET,
  CssFile.GUI_SCROLLBAR,
  CssFile.KEY_BINDINGS_TAB,
  CssFile.COMMAND_PALETTE,
  CssFile.GUI_POP_DOWN_DIALOG,
  CssFile.GUI_POP_DOWN_LIST_PICKER,
  CssFile.GUI_SEARCHABLE_LIST,
  CssFile.GUI_POP_DOWN_NUMBER_DIALOG,
  CssFile.GUI_LIST_PICKER,
  CssFile.TIP_VIEWER,
  CssFile.FONT_AWESOME,
  CssFile.TERMINAL_VARS,
  CssFile.VIEWER_TAB,
  CssFile.GUI_SPLITTER,
  CssFile.EMPTY_PANE_MENU,
  CssFile.GUI_SNAP_DROP_CONTAINER,
  CssFile.THEME_VARS,
  CssFile.GUI_FILE_TRANSFER_PROGRESS,
  CssFile.UPLOAD_PROGRESS_BAR,
  CssFile.GUI_COMPACT_FILE_TRANSFER_PROGRESS,
  CssFile.DOWNLOAD_VIEWER,
  CssFile.VIRTUAL_SCROLL_CANVAS,
  CssFile.TABS,
  CssFile.EXTRAICONS,
  CssFile.GUI_DIVIDER_MENU_ITEM,
  CssFile.TERMINAL_CANVAS,
  CssFile.GUI_SIDEBAR_LAYOUT,
  CssFile.GUI_ON_CURSOR_DIALOG,
  CssFile.GUI_ON_CURSOR_LIST_PICKER,
  CssFile.GUI_ON_CURSOR_SEARCHABLE_LIST,
  CssFile.EXTENSION_LIST_PICKER,
  CssFile.EXTENSION_TAB,
  CssFile.EXTENSION_CONTAINER,
];

export class CssFileMap extends Map<CssFile, string> {
}

export interface Themeable {
  setThemeCssMap(cssFileMap: CssFileMap, themeTimeStamp: number): void;
}

export const FALLBACK_TERMINAL_THEME = "itermcolors-terminal-theme-provider:Two Dark.itermcolors";
export const FALLBACK_SYNTAX_THEME = "textmate-syntax-theme-provider:Two Dark.tmTheme";
export const FALLBACK_UI_THEME = "default";
export const SYNTAX_CSS_THEME = "default-syntax";
export const TERMINAL_CSS_THEME = "default-terminal";
