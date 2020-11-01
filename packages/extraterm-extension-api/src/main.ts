/*
 * Copyright 2020 Simon Edwards <simon@simonzone.com>
 *
 * This source code is licensed under the MIT license which is detailed in the LICENSE.txt file.
 */

import * as Ace from "@extraterm/ace-ts";


/**
 * A resource which can later be freed by calling `dispose()`.
 */
export interface Disposable {
  dispose(): void;
}


/**
 * Function which represents a specific event which you can subscribe to.
 */
export interface Event<T> {
  (listener: (e: T) => any): Disposable;
}


export interface Tab {
  /**
   * Get any terminal contained inside this tab.
   */
  getTerminal(): Terminal;

  /**
   * Show an input box requesting a number.
   *
   * This shows a picker/dialog on this tab where the user can enter a number.
   * The acceptable range of values can be defined in the `options` parameter.
   * `undefined` is returned if the user canceled the picker by pressing
   * escape, for example. The picker appears with in this tab.
   *
   * See `NumberInputOptions` for more details about how to configure this.
   *
   * @return a promise which resolves to the entered number or undefined if
   *          it was canceled.
   */
  showNumberInput(options: NumberInputOptions): Promise<number | undefined>;

  /**
   * Show a list picker requesting an item from the list.
   *
   * This shows the given list of strings and lets the user select one or
   * them or cancel the picker. The index of the item in the list is return
   * if an item is selected. `undefined` is returned if the user canceled the
   * picker by pressing escape, for example. The picker appears with in this
   * tab.
   *
   * See `ListPickerOptions` for more details about how to configure this.
   *
   * @return a promise which resolves to the selected item index or
   *          undefined if it was canceled.
   */
  showListPicker(options: ListPickerOptions): Promise<number | undefined>;

  /**
   * True if this terminal is still open.
   *
   * Once the uesr closes a terminal tab and the tab disappears, then this will return `false`.
   */
  isAlive(): boolean;
}

export const TerminalEnvironment = {
  TERM_TITLE: "term:title",
  TERM_ROWS: "term:rows",
  TERM_COLUMNS: "term:columns",
  EXTRATERM_CURRENT_COMMAND: "extraterm:current_command",
  EXTRATERM_LAST_COMMAND: "extraterm:last_commmand",
  EXTRATERM_CURRENT_COMMAND_LINE: "extraterm:current_command_line",
  EXTRATERM_LAST_COMMAND_LINE: "extraterm:last_commmand_line",
  EXTRATERM_EXIT_CODE: "extraterm:exit_code",
};

export interface TerminalEnvironment {
  get(key: string): string;
  has(key: string): boolean;
  set(key: string, value: string): void;
  setList(list: {key: string, value: string}[]): void;

  [Symbol.iterator](): IterableIterator<[string, string]>;
  entries(): IterableIterator<[string, string]>;

  onChange: Event<string[]>;
}

/**
 * An active terminal with connected TTY.
 */
export interface Terminal {
  /**
   * Type a string of text into the terminal.
   *
   * This is effectively the same as though the user typed into the terminal.
   * Note that the enter key should be represented as `\r`.
   */
  type(text: string): void;

  /**
   * Get a list of viewers inside this terminal.
   */
  getViewers(): Viewer[];

  /**
   * Get the tab which holds this terminal.
   */
  getTab(): Tab;

  /**
   * Get the values of the Extraterm terminal integration cookie specific to
   * this terminal.
   */
  getExtratermCookieValue(): string;

  /**
   * Get the name of the Extraterm terminal integration cookie.
   */
  getExtratermCookieName(): string;

  openTerminalBorderWidget(name: string): any;

  onDidAppendViewer: Event<Viewer>;

  environment: TerminalEnvironment;

  /**
   * The session configuration associated with this terminal.
   *
   * Use `getSessionSettings()` to fetch extension settings.
   */
  sessionConfiguration: SessionConfiguration;

  /**
   * Get the extension settings associated with this terminal.
   *
   * @param name the same `name` passed to `Window.registerSessionSettingsEditor()`.
   */
  getSessionSettings(name: string): Object;

  /**
   * True if this terminal is still open.
   *
   * Once the uesr closes a terminal tab and the tab disappears, then this will return `false`.
   */
  isAlive(): boolean;
}

export interface TerminalBorderWidget {
  getContainerElement(): HTMLElement;
  close(): void;
  isOpen(): boolean;

  onDidOpen: Event<void>;
  onDidClose: Event<void>;
}

export interface TabTitleWidget {
  getContainerElement(): HTMLElement;
}

export interface NumberInputOptions {
  /**
   * The title of the input box.
   */
  title: string;

  /**
   * The default value of the input box.
   */
  value: number;

  /**
   * The minimum acceptable value.
   */
  minimum?: number;

  /**
   * The maximum acceptable value.
   */
  maximum?: number;
}


export interface ListPickerOptions {
  /**
   * The title to display in the list picker.
   */
  title: string;

  /**
   * The list of text items to display.
   */
  items: string[];

  /**
   * The index of the item to select by default.
   */
  selectedItemIndex: number;
}


export interface ViewerBase {
  /**
   * Get the tab which contains this viewer.
   */
  getTab(): Tab;

  /**
   * Get the terminal which contains this viewer.
   *
   * This may be null if the viewer is not inside a terminal.
   */
  getOwningTerminal(): Terminal;
}


export interface FrameViewer extends ViewerBase {
  viewerType: 'frame';

  /**
   * Get the viewer inside this frame.
   */
  getContents(): Viewer;
}

export enum FindStartPosition {
  CURSOR,
  DOCUMENT_START,
  DOCUMENT_END,
}

export interface FindOptions {
    backwards?: boolean;
    startPosition?: FindStartPosition;
}

export interface TerminalOutputViewer extends ViewerBase {

  viewerType: 'terminal-output';

  /**
   * Returns true if this output viewer is connected to a live PTY and emulator.
   *
   * @return true if this output viewer is connected to a live PTY and emulator.
   */
  isLive(): boolean;
  find(needle: string | RegExp, options?: FindOptions): boolean;
  findNext(needle: string | RegExp): boolean;
  findPrevious(needle: string | RegExp): boolean;
  hasSelection(): boolean;
  highlight(needle: string |  RegExp): void;
}


export interface TextViewer extends ViewerBase {
  viewerType: 'text';

  /**
   * Get the configured tab size.
   */
  getTabSize(): number;

  /**
   * Set the tab size.
   */
  setTabSize(size: number): void;

  /**
   * Get the mimetype of the contents of this text viewer.
   */
  getMimeType(): string;

  /**
   * Set the mimetype of the cotnent of this text viewer.
   */
  setMimeType(mimeType: string): void;

  /**
   * Return true if line numbers are being shown in the gutter.
   */
  getShowLineNumbers(): boolean;

  /**
   * Set whether to show line numebrs in the gutter.
   */
  setShowLineNumbers(show: boolean): void;

  /**
   * Set whether long lines should be wrapped.
   */
  setWrapLines(wrap: boolean): void;

  /**
   * Return true if long lines are set to be wrapped.
   */
  getWrapLines(): boolean;

  find(needle: string | RegExp, options?: FindOptions): boolean;
  findNext(needle: string | RegExp): boolean;
  findPrevious(needle: string | RegExp): boolean;
  hasSelection(): boolean;
  highlight(needle: string |  RegExp): void;
}


export type Viewer = FrameViewer | TerminalOutputViewer | TextViewer;

export interface CustomizedCommand {
  title?: string;
  checked?: boolean;
}

export interface Commands {
  /**
   * Register the function to handle a command.
   *
   * @param name the name of the command as specified in the `package.json` contributes/commands section.
   * @param commandFunc the function to execute when the command is selected.
   * @param customizer an optional function to customize the title or state of the command.
   */
  registerCommand(name: string, commandFunc: (args: any) => any, customizer?: () => (CustomizedCommand | null)): void;

  /**
   * Execute a command by name.
   *
   * @param name the full name of the command.
   * @param args arguments for the command.
   * @returns an optional return value.
   */
  executeCommand<T>(name: string, args: any): Promise<T> | null;

  /**
   * Get a list of all available commands.
   */
  getCommands(): string[];
}

export interface TerminalBorderWidgetFactory {
  (terminal: Terminal, widget: TerminalBorderWidget): any;
}

export interface TabTitleWidgetFactory {
  (terminal: Terminal, widget: TabTitleWidget): any;
}

export interface Window {
  /**
   * The currently active/focussed terminal.
   *
   * This may be `null`.
   */
  activeTerminal: Terminal;

  activeViewer: Viewer;

  getTerminals(): Terminal[];

  onDidCreateTerminal: Event<Terminal>;
  // onWillDestroyTerminal: Event<Terminal>;

  extensionViewerBaseConstructor: ExtensionViewerBaseConstructor;
  registerViewer(name: string, viewerClass: ExtensionViewerBaseConstructor): void;

  extensionSessionEditorBaseConstructor: ExtensionSessionEditorBaseConstructor;
  registerSessionEditor(type: string, sessionEditorClass: ExtensionSessionEditorBaseConstructor): void;

  registerTabTitleWidget(name: string, factory: TabTitleWidgetFactory): void;
  registerTerminalBorderWidget(name: string, factory: TerminalBorderWidgetFactory): void;

  registerSessionSettingsEditor(id: string, factory: SessionSettingsEditorFactory): void;
}


export interface BulkFileMetadata {
  readonly [index: string]: (string | number | undefined);
}


export enum BulkFileState {
  DOWNLOADING,
  COMPLETED,
  FAILED
}


/**
 * A handle for accessing a bulk file.
 */
export interface BulkFileHandle {

  getState(): BulkFileState;

  /**
   * Get a URL to the file contents.
   */
  getUrl(): string;

  /**
   * The number of bytes of the file which are available.
   *
   * This value can change when a file is being downloaded. See the event
   * `onAvailableSizeChange`.
   */
  getAvailableSize(): number;
  onAvailableSizeChange: Event<number>;

  /**
   * Get the complete size of the file.
   *
   * This may be -1 if the total size is unknown.
   */
  getTotalSize(): number;

  /**
   * Get the metadata associated with the file.
   *
   * The keys are simply strings and are specific to the file type.
   */
  getMetadata(): BulkFileMetadata;

  /**
   * Get the first 1KB of the file contents.
   *
   * @return The first 1KB of file or less if the available size and/or total
   *          size is less than 1024.
   */
  peek1KB(): Buffer;

  /**
   * Reference the file and increment its internal reference count.
   *
   * Files are managed and deleted when unneeded by using a simple reference
   * counting scheme. When a file handle is held it must also be referenced
   * by calling this method. When a file handle is no longer needed, then the
   * matching `deref()` method must be called.
   *
   * When a file's internal reference count transitions to zero, then the file
   * may be cleaned up and removed on the next process tick.
   */
  ref(): void;

  /**
   * Dereference this file.
   *
   * See `ref()` above.
   */
  deref(): void;

  /**
   * This event is fired when the file has been completely downloaded or fails.
   */
  onStateChange: Event<BulkFileState>;
}


export enum ViewerPosture {
  NEUTRAL,
  RUNNING,
  SUCCESS,
  FAILURE,
}

export interface ViewerMetadata {
  title: string;
  icon: string;
  posture: ViewerPosture;
  moveable: boolean;
  deleteable: boolean;
  toolTip: string;
}

export type ViewerMetadataChange = { [K in keyof ViewerMetadata]?: ViewerMetadata[K] };

/**
 * Extensions which implement Viewer must subclass this.
 *
 * Note that TypeScript subclasses should not provide a constructor. Pure
 * JavaScript subclasses can have a constructor but it must pass all of
 * its arguments to the super class.
 */
export interface ExtensionViewerBase {

  /**
   * Extension writers can override method to perform set up and
   * initialisation after construction.
   */
  created(): void;

  /**
   * Get the container element under which this Viewer's contents can be placed.
   */
  getContainerElement(): HTMLElement;

  /**
   * Get the metadata describing this viewer.
   */
  getMetadata(): ViewerMetadata;

  /**
   * Change fields in the metadata.
   *
   * @param changes object containing the fields to change
   */
  updateMetadata(changes: ViewerMetadataChange): void;

  /**
   * Get a BulkFileHandle with the contents of this viewer.
   */
  getBulkFileHandle(): BulkFileHandle;

  /**
   *
   */
  setBulkFileHandle(handle: BulkFileHandle): Promise<void>;
}


export interface ExtensionViewerBaseConstructor {
  new(...any: any[]): ExtensionViewerBase;
}

/**
 * A user defined configuration for a terminal session.
 *
 * This is represented in the UI as a session block in the Settings ->
 * "Session Types" tab. All of the different types of sessions have
 * these fields in common.
 */
export interface SessionConfiguration {
  /**
   * Unique identifier for this session type.
   */
  uuid: string;

  /**
   * Human readable name for this session type.
   */
  name: string;

  /**
   * Identifies this type of session and the back-end needed to run it.
   *
   * The value here matches that defined in the `contributes` ->
   * `sessionEditors` -> `type` field in the corresponding extension's
   * `package.json` file.
   */
  type?: string;

  /**
   * Command line arguments to be passed to shell command.
   */
  args?: string;

  /**
   * The initial directory in which to start the shell command.
   */
  initialDirectory?: string;

  /**
   * This is where the data for any extensions which is associated with this
   * session type are kept.
   *
   * Don not touch this.
   */
  extensions?: any;
}

/**
 * Extensions which implement Session Editor must subclass this.
 *
 * Note that TypeScript subclasses should not provide a constructor. Pure
 * JavaScript subclasses can have a constructor but it must pass all of
 * its arguments to the super class.
 */
export interface ExtensionSessionEditorBase {
  /**
   * Extension writers can override method to perform set up and
   * initialisation after construction.
   */
  created(): void;

  /**
   * Get the container element under which this Viewer's contents can be placed.
   */
  getContainerElement(): HTMLElement;

  setSessionConfiguration(sessionConfiguration: SessionConfiguration): void;

  getSessionConfiguration(): SessionConfiguration;

  updateSessionConfiguration(sessionConfigurationChange: object): void;
}

export interface ExtensionSessionEditorBaseConstructor {
  new(...any: any[]): ExtensionSessionEditorBase;
}

/**
 * Simple object based string key to string value map used to hold environment variables.
 */
export interface EnvironmentMap {
  [key: string]: string;
}

/**
 * This interface defines the methods required from every session back-end.
 */
export interface SessionBackend {
  /**
   * Create some reasonable default session configurations for this back-end
   */
  defaultSessionConfigurations(): SessionConfiguration[];

  /**
   * Create a new live session
   */
  createSession(sessionConfiguration: SessionConfiguration, options: CreateSessionOptions): Pty;
}

/**
 * Extra options passed during session creation.
 */
export interface CreateSessionOptions {
  /**
   * Extra environment variables to set in the new terminal session.
   */
  extraEnv: EnvironmentMap;

  /**
   * The initial number of columns this terminal has.
   */
  cols: number;

  /**
   * The inital number of rows this terminal has.
   */
  rows: number;

  /**
   * A suggested directory in which this terminal session should start in.
   */
  workingDirectory?: string;
}

export interface BufferSizeChange {
  totalBufferSize: number;  // Sizes here are in 16bit characters.
  availableDelta: number;
}


/**
 * Represents a PTY.
 */
export interface Pty {
  /**
   * Write data to the pty
   *
   * @param data data to write.
   */
  write(data: string): void;

  getAvailableWriteBufferSize(): number;

  onAvailableWriteBufferSizeChange: Event<BufferSizeChange>;

  /**
   * Tell the pty that the size of the terminal has changed
   *
   * @param cols number of columns in ther terminal.
   * @param rows number of rows in the terminal.
   */
  resize(cols: number, rows: number): void;

  permittedDataSize(size: number): void;

  /**
   * Destroy the pty and shut down the attached process
   */
  destroy(): void;

  onData: Event<string>;

  onExit: Event<void>;

  /**
   * Get the working directory of the process on the other side of this PTY.
   *
   * @return The working directory or null if it could not be determined.
   */
  getWorkingDirectory(): Promise<string | null>;
}

/**
 *
 */
export interface SessionSettingsEditorBase {
  /**
   * Get the container element under which this Viewer's contents can be placed.
   */
  getContainerElement(): HTMLElement;

  setSettings(settings: Object): void;

  getSettings(): Object;
}

export interface SessionSettingsEditorFactory {
  (sessionSettingsEditorBase: SessionSettingsEditorBase): void;
}

/**
 * A Terminal Theme Provider supplies terminal themes to Extraterm.
 *
 * It exposes its list of terminal themes and a method to fetch the contents
 * of a requested theme..
 */
export interface TerminalThemeProvider {
  /**
   * Scan for themes and return a list.
   *
   * @param paths a list of directories which may be used to scan for themes.
   * @return the list of themes found which this provider can also read.
   */
  scanThemes(paths: string[]): TerminalThemeInfo[];

  /**
   * Read in the contents of request theme.
   *
   * @param paths a list of directories which may contain themes. This is the same list as in `scanThemes()`
   * @return the theme contents.
   */
  readTheme(paths: string[], id: string): TerminalTheme;
}

/**
 * Describes a terminal theme.
 */
export interface TerminalThemeInfo {
  /** Unique (for this provider) ID of the theme. */
  id: string;

  /**
   * Human readable name of the theme.
   */
  name: string;

  /**
   * Human readable comment regarding this theme.
   */
  comment: string;
}

export interface TerminalTheme {
  foregroundColor?: string;
  backgroundColor?: string;
  cursorForegroundColor?: string;
  cursorBackgroundColor?: string;
  selectionBackgroundColor?: string;
  findHighlightBackgroundColor?: string;

  [colorIndex: number]: string;
  // selectionunfocused-background-color: #404040;
}

/**
 * A Syntax Theme Provider supplies syntax themes to Extraterm.
 *
 * It exposes its list of syntax themes and a method to fetch the contents
 * of a requested theme..
 */
export interface SyntaxThemeProvider {
  /**
   * Scan for themes and return a list.
   *
   * @param paths a list of directories which may be used to scan for themes.
   * @return the list of themes found which this provider can also read.
   */
  scanThemes(paths: string[]): SyntaxThemeInfo[];

  /**
   * Read in the contents of request theme.
   *
   * @param paths a list of directories which may contain themes. This is the same list as in `scanThemes()`
   * @return the theme contents.
   */
  readTheme(paths: string[], id: string): SyntaxTheme;
}

export interface SyntaxThemeInfo extends TerminalThemeInfo {

}

/**
 * The contents of a syntax theme.
 *
 * Note: All color strings must be of the form #RRGGBB.
 */
export interface SyntaxTheme {
  /**
   * Default text foreground color.
   */
  foreground: string;

  /**
   * Default text background color.
   */
  background: string;

  /**
   * Color of the cursor.
   */
  cursor: string;

  /**
   * Color to show whitespace characters (when enabled).
   */
  invisibles: string;

  /**
   * Color of the line highlight.
   */
  lineHighlight: string;

  /**
   * Selection color.
   */
  selection: string;

  /**
   * List of token coloring rules.
   */
  syntaxTokenRule: SyntaxTokenRule[];
}

export interface SyntaxTokenRule {
  /**
   * Scope of the rule.
   *
   * This string follows the naming convention for syntax token as described
   * in https://www.sublimetext.com/docs/3/scope_naming.html
   * Note that only one scope rule can be put in this field.
   */
  scope: string;

  /**
   * The text style to apply to this token.
   */
  textStyle: TextStyle;
}

/**
 * Describes a text style.
 */
export interface TextStyle {
  /**
   * Optional foreground color. Format is CSS sstyle #RRGGBB.
   */
  foregroundColor?: string;

  /**
   * Optional background color. Format is CSS sstyle #RRGGBB.
   */
  backgroundColor?: string;

  /**
   * Show as bold text.
   */
  bold?: boolean;

  /**
   * Show as italic text.
   */
  italic?: boolean;

  /**
   * Show as underline text.
   */
  underline?: boolean;
}

/**
 * Extension API for extensions which need to operate in the back end process.
 */
export interface Backend {
  registerSessionBackend(name: string, backend: SessionBackend): void;
  registerSyntaxThemeProvider(name: string, provider: SyntaxThemeProvider): void;
  registerTerminalThemeProvider(name: string, provider: TerminalThemeProvider): void;
}

/**
 * Access to the Extraterm extension API
 *
 * This provides extensions access to the whole Extraterm extension API, as
 * well as some convenience classes and objects.
 *
 * An instance of this is passed to each extension's `activate()` function.
 */
export interface ExtensionContext {

  readonly commands: Commands;

  /**
   * Extension APIs which can be used from a front-end render process.
   */
  readonly window: Window;

  /**
   * Access to Extraterm's own Ace module.
   */
  readonly aceModule: typeof Ace;

  /**
   * True if this process is the backend process. False if it is a render process.
   */
  readonly isBackendProcess: boolean;

  /**
   * Extension APIs which may only be used from the backend process.
   */
  readonly backend: Backend;

  /**
   * Logger object which the extension can use.
   */
  readonly logger: Logger;

  /**
   * Absolute path to where this extension is located on the file system.
   */
  readonly extensionPath: string;
}

/**
 * Logging facility
 *
 * A simple text logging facility, much like the browser `console.log()` API
 * and friends. An instance of this interface is available to a extension via
 * the `ExtensionContext` object passed to each extension's `activate()`
 * function.
 */
export interface Logger {
  /**
   * Log a debug message.
   *
   * @param msg     the log message
   * @param ...opts extra values to log with the message
   */
  debug(msg: any, ...opts: any[]): void;

  /**
   * Log an info message.
   *
   * @param msg     the log message
   * @param ...opts extra values to log with the message
   */
  info(msg: any, ...opts: any[]): void;

  /**
   * Log a warning message.
   *
   * @param msg     the log message
   * @param ...opts extra values to log with the message
   */
  warn(msg: any, ...opts: any[]): void;

  /**
   * Log a severe message.
   *
   * @param msg     the log message
   * @param ...opts extra values to log with the message
   */
  severe(msg: any, ...opts: any[]): void;

  /**
   * Starts timing.
   *
   * See endTime().
   *
   * @param label identifying label for this timer
   */
  startTime(label: string): void;

  /**
   * Ends timing.
   *
   * Prints the timing result to the log. Label should be the same as the label given to startTime().
   *
   * @param label identifying label for the timer to end
   */
  endTime(label: string): void;
}


/**
 * An extension module as viewed from Extraterm.
 */
export interface ExtensionModule {

  /**
   * Each extension module must export a function called `activate()` with the signature below.
   *
   * @param context The extension context which this extension is running in.
   * @return The public API of this extension, or null or undefined.
   */
  activate(context: ExtensionContext): any;

  /**
   * Option function which is called if the extension is disabled or the application shutdown.
   *
   * @param manual True if the user manually disabled the extension.
   */
  deactivate?(manual: boolean): void;
}
