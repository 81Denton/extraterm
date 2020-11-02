/*
 * Copyright 2017 Simon Edwards <simon@simonzone.com>
 *
 * This source code is licensed under the MIT license which is detailed in the LICENSE.txt file.
 */
import * as DomUtils from './DomUtils';
import {Splitter, SplitOrientation} from './gui/Splitter';
import {TabWidget} from './gui/TabWidget';
import {Tab} from './gui/Tab';
import {Logger, getLogger, log} from "extraterm-logging";

interface ElementFactory {
  (previousElement: Element | null): Element;
}

interface TabContentContainerElementFactory {
  (tabWidget: TabWidget, tab: Tab, tabContent: Element): Element;
}

interface SplitterInfoNode {
  type: "splitter";
  children: (TabWidgetInfoNode | SplitterInfoNode)[];

  splitter: Splitter;
  orientation: SplitOrientation;
}

interface TabWidgetInfoNode {
  type: "tabwidget";
  children: TabInfo[];

  tabWidget: TabWidget;

  emptyTab: Tab;
  emptyTabContent: Element
  emptyContainer: Element;

  leftSpaceDefaultElement: Element;
  rightSpaceDefaultElement: Element;
}

interface TabInfo {
  type: "tabinfo";
  tab: Tab;
  content: Element;
  container: Element;
}

type InfoNode = SplitterInfoNode | TabWidgetInfoNode | TabInfo;

type RootInfoNode = SplitterInfoNode | TabWidgetInfoNode;

enum RelativePosition {
  TOP_LEFT,
  TOP_RIGHT,
  TOP_WIDE,
  OTHER
}

interface TabWidgetPosition extends ClientRect {
  tabWidgetInfo: TabWidgetInfoNode;
}

type Point2D = [number, number];
type Matrix2D = [number, number, number, number];

// Used to create new element IDs.
let tabWidgetIdCounter = 0;
let tabIdCounter = 0;

export class SplitLayout {

  private _log: Logger = getLogger("SplitLayout");
  private _rootContainer: Element = null;
  private _tabContainerFactory: TabContentContainerElementFactory = null;
  private _emptySplitFactory: ElementFactory = null;
  private _topLeftElement: Element = null;
  private _topRightElement: Element = null;
  private _leftSpaceDefaultElementFactory: ElementFactory = null;
  private _rightSpaceDefaultElementFactory: ElementFactory = null;
  private _rootInfoNode: RootInfoNode = null;
  private _windowId: string = null;

  constructor() {
    this._tabContainerFactory = this._divTabContainerFactory.bind(this);

    const tabWidget = <TabWidget> document.createElement(TabWidget.TAG_NAME);
    tabWidget.id = this._nextTabWidgetId();
    tabWidget.showFrame = false;
    this._rootInfoNode = {type: "tabwidget", children: [], tabWidget: tabWidget, emptyTab: null,
      emptyTabContent: null, emptyContainer: null, leftSpaceDefaultElement: null, rightSpaceDefaultElement: null};
  }

  private _divTabContainerFactory(): Element {
    return document.createElement("DIV");
  }

  setWindowId(windowId: string): void {
    this._windowId = windowId;
    for (const tabWidget of this.getAllTabWidgets()) {
      tabWidget.windowId = windowId;
    }
  }

  setRootContainer(el: Element): void {
    this._rootContainer = el;
  }

  getRootContainer(): Element {
    return this._rootContainer;
  }

  setTabContainerFactory(factory: TabContentContainerElementFactory): void {
    this._tabContainerFactory = factory;
  }

  getTabContainerFactory(): TabContentContainerElementFactory {
    return this._tabContainerFactory;
  }

  // Set the factory function to use when creating content to fill the situation where there are not tabs.
  setEmptySplitElementFactory(factory: ElementFactory): void {
    this._emptySplitFactory = factory;
  }

  getEmptySplitElementFactory(): ElementFactory {
    return this._emptySplitFactory;
  }

  setTopLeftElement(el: Element): void {
    this._topLeftElement = el;
  }

  getTopLeftElement(): Element {
    return this._topLeftElement;
  }

  setTopRightElement(el: Element): void {
    this._topRightElement = el;
  }

  getTopRightElement(): Element {
    return this._topRightElement;
  }

  setLeftSpaceDefaultElementFactory(el: ElementFactory): void {
    this._leftSpaceDefaultElementFactory = el;
  }

  getLeftSpaceDefaultElementFactory(): ElementFactory {
    return this._leftSpaceDefaultElementFactory;
  }

  setRightSpaceDefaultElementFactory(el: ElementFactory): void {
    this._rightSpaceDefaultElementFactory = el;
  }

  getRightSpaceDefaultElementFactory(): ElementFactory {
    return this._rightSpaceDefaultElementFactory;
  }

  /**
   * Add a new tab to a Tab widget.
   *
   * @param tabWidget the tab widget which receives the new tab.
   * @param tab the new tab object.
   * @param tabContent the contents of the new tab.
   */
  appendTab(tabWidget: TabWidget, tab: Tab, tabContent: Element): void {
    const info = findTabWidgetInfoByTabWidget(this._rootInfoNode, tabWidget);
    if (info == null) {
      this._log.severe("Unable to find the info for TabWidget ", tabWidget);
      return;
    }

    info.children.push({type: "tabinfo", tab: tab, content: tabContent, container: null});
  }

  isSplit(): boolean {
    return this._rootInfoNode.type === "splitter";
  }

  /**
   * Remove a tab and its contents.
   *
   * @param tabContent the tab content which is used to find the tab to remove.
   */
  removeTabContent(tabContent: Element): void {
    const info = findTabWidgetInfoByTabContent(this._rootInfoNode, tabContent);
    if (info == null) {
      this._log.severe("Unable to find the info for TabWidget ", tabContent);
      return;
    }

    const {tabWidgetInfo, tabInfo} = info;
    tabWidgetInfo.children = tabWidgetInfo.children.filter( info => info !== tabInfo);
  }

  getAllTabContents(): Element[] {
    return getAllTabContents(this._rootInfoNode);
  }

  getAllTabWidgets(): TabWidget[] {
    return getAllTabWidgets(this._rootInfoNode);
  }

  getTabContentsByTabWidget(tabWidget: TabWidget): Element[] {
    const info = findTabWidgetInfoByTabWidget(this._rootInfoNode, tabWidget);
    if (info == null) {
      this._log.severe("Unable to find the info for TabWidget ", TabWidget);
      return null;
    }

    if (info.children.length === 0) {
      return info.emptyTabContent != null ? [info.emptyTabContent] : [];
    }

    return info.children.map(kid => kid.content);
  }

  /**
   * Get the tab which matches the tab content.
   *
   * @param tabContent the tab content to search by.
   * @return the tab which holds the given tab content or null if it could
   *        not be found.
   */
  getTabByTabContent(tabContent: Element): Tab {
    const info = findTabWidgetInfoByTabContent(this._rootInfoNode, tabContent);
    if (info == null) {
      this._log.severe("Unable to find the info for tab content ", tabContent);
      return null;
    }
    return info.tabInfo.tab;
  }

  /**
   * Get the Tab widget which holds the tab content.
   *
   * @param tabContent the tab content used to find the Tab widget.
   * @return the Tab widget which holds the given tab content, or null if
   *          it could not be found.
   */
  getTabWidgetByTabContent(tabContent: Element): TabWidget {
    const info = findTabWidgetInfoByTabContent(this._rootInfoNode, tabContent);
    if (info == null) {
      this._log.severe("Unable to find the info for tab content ", tabContent);
      return null;
    }
    return info.tabWidgetInfo.tabWidget;
  }

  /**
   * Get the tab content element which is paired with the tab.
   *
   * @param tab the tab object to search by.
   * @return the tab content element or null if it could not be found.
   */
  getTabContentByTab(tab: Tab): Element {
    const info = findTabWidgetInfoByTab(this._rootInfoNode, tab);
    if (info == null) {
      this._log.severe("Unable to find the info for Tab ", tab);
      return null;
    }
    return info.tabInfo != null ? info.tabInfo.content : info.tabWidgetInfo.emptyTabContent;
  }

  getEmptyContentByTabWidget(tabWidget: TabWidget): Element {
    const info = findTabWidgetInfoByTabWidget(this._rootInfoNode, tabWidget);
    if (info == null) {
      this._log.severe("Unable to find the info for TabWidget ", tabWidget);
      return null;
    }
    return info.children.length === 0 ? info.emptyTabContent : null;
  }

  /**
   * Get the first tab widget.
   *
   * @return the first tab widget.
   */
  firstTabWidget(): TabWidget {
    return firstTabWidget(this._rootInfoNode);
  }

  /**
   * Show a tab identified by the given tab content.
   *
   * Selects the tab which is identified by the given tab content.
   *
   * @param tabContent the tab content which identifies the tab to select.
   */
  showTabByTabContent(tabContent: Element): void {
    const info = findTabWidgetInfoByTabContent(this._rootInfoNode, tabContent);
    if (info == null) {
      this._log.severe("Unable to find the info for tab contents ", tabContent);
      return;
    }

    const {tabWidgetInfo, tabInfo} = info;
    tabWidgetInfo.tabWidget.selectedIndex = tabWidgetInfo.children.indexOf(tabInfo);
  }

  splitAfterTabWidget(tabWidget: TabWidget, orientation: SplitOrientation): TabWidget {
    const path = findPathToTabWidget(this._rootInfoNode, tabWidget);
    if (path == null) {
      this._log.severe("Unable to find the info for tab widget ", tabWidget);
      return null;
    }

    const len = path.length;
    if (len === 1) {
      // Path must be TabWidget only.
      const tabWidgetInfo = path[0];
      if (tabWidgetInfo.type === "tabwidget") {
        const newRoot = this._splitAfterTabWidgetIntoSplitter(tabWidgetInfo, orientation);
        this._rootInfoNode = newRoot;
        return (<TabWidgetInfoNode> newRoot.children[1]).tabWidget;
      }
    } else {

      const splitterInfo = path[len-2];
      const tabWidgetInfo = path[len-1];
      if (splitterInfo.type === "splitter" && tabWidgetInfo.type === "tabwidget") {
        if (splitterInfo.orientation === orientation) {
          const newTabWidgetInfo = this._createTabWidgetInfo([]);
          splitterInfo.children.splice(splitterInfo.children.indexOf(tabWidgetInfo)+1,0, newTabWidgetInfo);
          return newTabWidgetInfo.tabWidget;
        } else {

          const newSplitter = this._splitAfterTabWidgetIntoSplitter(tabWidgetInfo, orientation);
          const tabWidgetInfoIndex = splitterInfo.children.indexOf(tabWidgetInfo);
          splitterInfo.children.splice(tabWidgetInfoIndex, 1, newSplitter);
          return (<TabWidgetInfoNode> newSplitter.children[1]).tabWidget;
        }
      }
    }
    return null;
  }

  splitBeforeTabWidget(tabWidget: TabWidget, orientation: SplitOrientation): TabWidget {
    const newTabWidget = this.splitAfterTabWidget(tabWidget, orientation);

    const newTabWidgetPath = findPathToTabWidget(this._rootInfoNode, newTabWidget);
    const splitterInfo = newTabWidgetPath[newTabWidgetPath.length-2];
    const newTabWidgetInfo = newTabWidgetPath[newTabWidgetPath.length-1];

    if (splitterInfo.type === "splitter" && newTabWidgetInfo.type === "tabwidget") {

      const tabWidgetPath = findPathToTabWidget(splitterInfo, tabWidget);
      const tabWidgetInfo = tabWidgetPath[tabWidgetPath.length-1];
      if (tabWidgetInfo.type === "tabwidget") {
        splitterInfo.children = swapArrayItems(splitterInfo.children, newTabWidgetInfo, tabWidgetInfo);
      }
    }
    return newTabWidget;
  }

  splitAfterTabContent(tabContent: Element, orientation: SplitOrientation): TabWidget {
    const path = findPathToTabContent(this._rootInfoNode, tabContent);
    if (path == null) {
      this._log.severe("Unable to find the info for tab contents ", tabContent);
      return null;
    }

    const pathLen = path.length;
    if (pathLen === 1) {
      const tabWidgetInfo = path[0];
      if (tabWidgetInfo.type === "tabwidget") {
        return this.splitAfterTabWidget(tabWidgetInfo.tabWidget, orientation);
      }
    }

    if (pathLen === 2) {

      // Path could be ;TabWidget, TabInfo].
      const tabWidgetInfo = path[0];
      const tabInfo = path[1];
      if (tabWidgetInfo.type === "tabwidget" && tabInfo.type === "tabinfo") {
        const newSplitterNode = this._splitTabWidgetAtTabContentIntoSplitter(tabWidgetInfo, tabContent, orientation);
        this._rootInfoNode = newSplitterNode;
        return (<TabWidgetInfoNode> newSplitterNode.children[1]).tabWidget;
      } else {

        const splitterInfo = path[0];
        const tabWidgetInfo = path[1];
        if (splitterInfo.type === "splitter" && tabWidgetInfo.type === "tabwidget") {
          return this.splitAfterTabWidget(tabWidgetInfo.tabWidget, orientation);
        }
      }

    } else {
      if (pathLen >= 3) {

        const lastItem = path[pathLen-1];
        if (lastItem.type === "tabinfo") {
          const splitterInfo = path[pathLen-3];
          const tabWidgetInfo = path[pathLen-2];
          const tabInfo = lastItem;

          if (splitterInfo.type === "splitter" && tabWidgetInfo.type === "tabwidget") {
            if (splitterInfo.orientation === orientation) {
              const newTabWidgetInfo = this._splitTabWidgetAtTabContent(tabWidgetInfo, tabContent)[1];
              const tabWidgetIndex = splitterInfo.children.indexOf(tabWidgetInfo);
              splitterInfo.children.splice(tabWidgetIndex+1,0, newTabWidgetInfo);
              return newTabWidgetInfo.tabWidget;
            } else {
              // Different orientation needed
              const newSplitterNode = this._splitTabWidgetAtTabContentIntoSplitter(tabWidgetInfo, tabContent, orientation);
              splitterInfo.children.splice(splitterInfo.children.indexOf(tabWidgetInfo), 1, newSplitterNode);
              return (<TabWidgetInfoNode> newSplitterNode.children[1]).tabWidget;
            }
          }

        } else {

          const splitterInfo = path[pathLen-2];
          const tabWidgetInfo = path[pathLen-1];
          if (splitterInfo.type === "splitter" && tabWidgetInfo.type === "tabwidget") {
            return this.splitAfterTabWidget(tabWidgetInfo.tabWidget, orientation);
          }
        }
      }
    }
    return null;
  }

  moveTabToTabWidget(tabElement: Tab, targetTabWidget: TabWidget, tabIndex: number): void {
    const {tabWidgetInfo: sourceTabWidgetInfo, tabInfo} = findTabWidgetInfoByTab(this._rootInfoNode, tabElement);
    const targetTabWidgetInfo = findTabWidgetInfoByTabWidget(this._rootInfoNode, targetTabWidget);

    tabIndex = Math.min(tabIndex, targetTabWidgetInfo.children.length);

    if (sourceTabWidgetInfo === targetTabWidgetInfo) {
      const frontList = sourceTabWidgetInfo.children.slice(0, tabIndex).filter(kid => kid !== tabInfo);
      const tailList = sourceTabWidgetInfo.children.slice(tabIndex).filter(kid => kid !== tabInfo);
      sourceTabWidgetInfo.children = [...frontList, tabInfo, ...tailList];
    } else {
      sourceTabWidgetInfo.children = sourceTabWidgetInfo.children.filter(kid => kid !== tabInfo);
      const frontList = targetTabWidgetInfo.children.slice(0, tabIndex);
      const tailList = targetTabWidgetInfo.children.slice(tabIndex);
      targetTabWidgetInfo.children = [...frontList, tabInfo, ...tailList];
    }
  }

  private _splitTabWidgetAtTabContentIntoSplitter(tabWidgetInfo: TabWidgetInfoNode, tabContent: Element,
      orientation: SplitOrientation): SplitterInfoNode {

    const tabWidgetPair = this._splitTabWidgetAtTabContent(tabWidgetInfo, tabContent);

    // Insert a Splitter at the root.
    const newRoot: SplitterInfoNode = {
      type: "splitter",
      children: tabWidgetPair,
      orientation: orientation,
      splitter: null
    };

    return newRoot;
  }

  private _splitTabWidgetAtTabContent(tabWidgetInfo: TabWidgetInfoNode, tabContent: Element):
      [TabWidgetInfoNode, TabWidgetInfoNode] {

    const splitIndex = tabWidgetInfo.children.map(c => c.content).indexOf(tabContent) + 1;
    const newTabWidgetInfo = this._createTabWidgetInfo(tabWidgetInfo.children.slice(splitIndex));

    tabWidgetInfo.children = tabWidgetInfo.children.slice(0, splitIndex);
    return [tabWidgetInfo, newTabWidgetInfo];
  }

  private _splitAfterTabWidgetIntoSplitter(tabWidgetInfo: TabWidgetInfoNode, orientation: SplitOrientation): SplitterInfoNode {
    const newTabWidgetInfo = this._createTabWidgetInfo([]);

    // Insert a Splitter at the root.
    const newRoot: SplitterInfoNode = {
      type: "splitter",
      children: [tabWidgetInfo, newTabWidgetInfo],
      orientation: orientation,
      splitter: null
    };
    return newRoot;
  }

  private _createTabWidgetInfo(children: TabInfo[]): TabWidgetInfoNode {
    // Create a new TabWidget
    const newTabWidget = <TabWidget> document.createElement(TabWidget.TAG_NAME);
    newTabWidget.id = this._nextTabWidgetId();
    newTabWidget.showFrame = false;
    newTabWidget.windowId = this._windowId;
    const newTabWidgetInfo: TabWidgetInfoNode = {
      type: "tabwidget",
      children: children,
      tabWidget: newTabWidget,
      emptyTab: null,
      emptyTabContent: null,
      emptyContainer: null,
      leftSpaceDefaultElement: null,
      rightSpaceDefaultElement: null
    };
    return newTabWidgetInfo;
  }

  private _nextTabWidgetId(): string {
    tabWidgetIdCounter++;
    return "tabwidget_" + tabWidgetIdCounter;
  }

  private _nextTabId(): string {
    tabIdCounter++;
    return "tab_" + tabIdCounter;
  }

  closeSplitAtTabContent(tabContent: Element): void {
    const path = findPathToTabContent(this._rootInfoNode, tabContent);
    if (path == null) {
      this._log.severe("Unable to find the info for tab contents ", tabContent);
      return;
    }

    let tabWidgetInfo: TabWidgetInfoNode = null;
    let splitterInfo: SplitterInfoNode = null;

    if (path.length >= 2) {
      const lastPart = path[path.length-1];
      if (lastPart.type === "tabinfo") {
        tabWidgetInfo = <TabWidgetInfoNode> path[path.length-2];
        splitterInfo = <SplitterInfoNode> path[path.length-3];

      } else if (lastPart.type === "tabwidget") {
        tabWidgetInfo = lastPart;
        splitterInfo = <SplitterInfoNode> path[path.length-2];
      }
    }

    if (tabWidgetInfo != null) {
      // We merge two adjacent TabWidgets together by merging the indicated
      // Tab Widget with its neighbour to the right. If there is nothing to
      // the right, then merge to the left.
      let index = splitterInfo.children.indexOf(tabWidgetInfo);
      if (index === splitterInfo.children.length-1) {
        index = splitterInfo.children.length-2;
      }

      const leftInfo = splitterInfo.children[index];
      const rightInfo = splitterInfo.children[index+1];
      if (leftInfo.type === "tabwidget" && rightInfo.type === "tabwidget") {
        leftInfo.children = [...leftInfo.children, ...rightInfo.children];
        splitterInfo.children = splitterInfo.children.filter( kid => kid !== rightInfo);

        this._removeRedundantSplitters();
      } else {
        // It is a mix of tab widgets and splitters.
        if (leftInfo.type === "tabwidget" && rightInfo.type === "splitter") {
          this._closeTabWidgetSplitterSplit(splitterInfo, leftInfo, rightInfo);
        } else if (leftInfo.type === "splitter" && rightInfo.type === "tabwidget") {
          this._closeTabWidgetSplitterSplit(splitterInfo, rightInfo, leftInfo);
        }
      }
    }
  }

  private _closeTabWidgetSplitterSplit(parentSplitterInfo: SplitterInfoNode, tabWidgetInfo: TabWidgetInfoNode,
      splitterInfo: SplitterInfoNode): void {

    const destinationTabWidgetInfo = firstTabWidgetInfo(splitterInfo);
    destinationTabWidgetInfo.children = [...destinationTabWidgetInfo.children, ...tabWidgetInfo.children];

    parentSplitterInfo.children = parentSplitterInfo.children.filter( kid => kid !== tabWidgetInfo);
    this._removeRedundantSplitters();
  }

  private _removeRedundantSplitters(): void {
    if (this._rootInfoNode.type === "splitter") {
      if (this._rootInfoNode.children.length === 1) {
        this._rootInfoNode = this._rootInfoNode.children[0];
      } else {
        this._removeRedundantSplittersFromParent(this._rootInfoNode);
      }
    }
  }

  _removeRedundantSplittersFromParent(nodeInfo: RootInfoNode): void {
    if (nodeInfo.type === "splitter") {
      for (let i=0; i<nodeInfo.children.length; i++) {
        const kid = nodeInfo.children[i];
        if (kid.type === "splitter") {
          if (kid.children.length === 1) {
            nodeInfo.children.splice(i, 1, kid.children[0]);
          }
          this._removeRedundantSplittersFromParent(kid);
        }
      }
    }
  }

  getTabWidgetToLeft(tabWidget: TabWidget): TabWidget {
    return this._getTabWidgetInDirection(tabWidget, [-1,0,0,1]);
  }

  getTabWidgetToRight(tabWidget: TabWidget): TabWidget {
    return this._getTabWidgetInDirection(tabWidget, [1,0,0,1]);
  }

  getTabWidgetAbove(tabWidget: TabWidget): TabWidget {
    return this._getTabWidgetInDirection(tabWidget, [0,1,-1,0]);
  }

  getTabWidgetBelow(tabWidget: TabWidget): TabWidget {
    return this._getTabWidgetInDirection(tabWidget, [0,-1,1,0]);
  }

  private _getTabWidgetInDirection(tabWidget: TabWidget, transformMatrix: Matrix2D): TabWidget {
    const rawPositions = getPanePositions(this._rootInfoNode);
    const positions = rawPositions.map(pos => transformTabWidgetPosition(pos, transformMatrix));

    const startPosition = positions.filter(pos => pos.tabWidgetInfo.tabWidget === tabWidget)[0];
    const startCenterX = (startPosition.left + startPosition.right) / 2;
    const startCenterY = (startPosition.top + startPosition.bottom) / 2;

    const hitPositions = positions.filter(pos => {
      return pos.left > startCenterX && pos.bottom > startCenterY && pos.top <= startCenterY;
    });

    hitPositions.sort( (a,b) => {
      if (a.left < b.left) {
        return -1;
      }
      return a.left === b.left ? 0 : 1;
    });

    if (hitPositions.length !== 0) {
      return hitPositions[0].tabWidgetInfo.tabWidget;
    } else {
      return null;
    }
  }

  /**
   * Update the DOM to match the desired new state.
   *
   * This should be called after mutation methods to update the DOM with the new changes.
   */
  update(): void {
    this._update(this._rootContainer, this._rootInfoNode, RelativePosition.TOP_WIDE);
  }

  private _update(container: Element, infoNode: RootInfoNode, position: RelativePosition): void {
    if (infoNode.type === "splitter") {
      this._updateSplitter(infoNode, position);

      // Remove the unneeded children, and insert the Splitter.
      removeAllChildrenExceptOne(container, infoNode.splitter);
      if (container.children.length === 0) {
        container.appendChild(infoNode.splitter);
      }

    } else {
      this._updateTabWidget(infoNode, position);

      // TabWidget
      removeAllChildrenExceptOne(container, infoNode.tabWidget);
      if (container.children.length === 0) {
        container.appendChild(infoNode.tabWidget);
      }

    }
  }

  private _updateSplitter(infoNode: SplitterInfoNode, position: RelativePosition): void {
    if (infoNode.splitter  == null) {
      infoNode.splitter = <Splitter> document.createElement(Splitter.TAG_NAME);
      infoNode.splitter.setSplitOrientation(infoNode.orientation);
    }

    const targetChildrenList: Element[] = [];
    const len = infoNode.children.length;
    for (let i=0; i<len; i++) {
      const kidInfo = infoNode.children[i];
      const newPosition = infoNode.orientation === SplitOrientation.VERTICAL ?
                          this._computeNewPositionForVerticalSplits(position, i, len) :
                          this._computeNewPositionForHorizontalSplits(position, i, len);

      if (kidInfo.type === "splitter") {
        this._updateSplitter(kidInfo, newPosition);
        targetChildrenList.push(kidInfo.splitter);
      } else {
        // Tab widget
        this._updateTabWidget(kidInfo, newPosition);
        targetChildrenList.push(kidInfo.tabWidget);
      }
    }

    DomUtils.setElementChildren(infoNode.splitter, targetChildrenList);
    infoNode.splitter.update();
  }

  private _computeNewPositionForVerticalSplits(oldPosition: RelativePosition, index: number, length: number): RelativePosition {
    switch (oldPosition) {
      case RelativePosition.TOP_WIDE:
        if (length === 1) {
          return RelativePosition.TOP_WIDE;
        } else {
          if (index === 0) {
            return RelativePosition.TOP_LEFT;
          } else if (index === length-1) {
            return RelativePosition.TOP_RIGHT;
          } else {
            return RelativePosition.OTHER;
          }
        }

      case RelativePosition.TOP_LEFT:
        return index === 0 ? RelativePosition.TOP_LEFT : RelativePosition.OTHER;

      case RelativePosition.TOP_RIGHT:
        return index === length-1 ? RelativePosition.TOP_RIGHT : RelativePosition.OTHER;

      default:
        return RelativePosition.OTHER;
    }
  }

  private _computeNewPositionForHorizontalSplits(oldPosition: RelativePosition, index: number, length: number): RelativePosition {
    switch (oldPosition) {
      case RelativePosition.TOP_WIDE:
        if (length === 1) {
          return RelativePosition.TOP_WIDE;
        } else {
          if (index === 0) {
            return RelativePosition.TOP_WIDE;
          } else {
            return RelativePosition.OTHER;
          }
        }

      case RelativePosition.TOP_LEFT:
        return index === 0 ? RelativePosition.TOP_LEFT : RelativePosition.OTHER;

      case RelativePosition.TOP_RIGHT:
        return index === 0 ? RelativePosition.TOP_RIGHT : RelativePosition.OTHER;

      default:
        return RelativePosition.OTHER;
    }
  }

  private _updateTabWidget(infoNode: TabWidgetInfoNode, position: RelativePosition): void {
    if (infoNode.tabWidget  == null) {
      infoNode.tabWidget = <TabWidget> document.createElement(TabWidget.TAG_NAME);
      infoNode.tabWidget.id = this._nextTabWidgetId();
      infoNode.tabWidget.showFrame = false;
      infoNode.tabWidget.windowId = this._windowId;
    }
    const tabWidget = infoNode.tabWidget;

    // Compute the correct thing to place on the left side.
    let leftSpaceElement = infoNode.leftSpaceDefaultElement;
    if ((position === RelativePosition.TOP_LEFT || position === RelativePosition.TOP_WIDE) && this._topLeftElement != null) {
      leftSpaceElement = this._topLeftElement;
    } else {
      if (this._leftSpaceDefaultElementFactory != null && infoNode.leftSpaceDefaultElement == null) {
        infoNode.leftSpaceDefaultElement = this._leftSpaceDefaultElementFactory(null);
        leftSpaceElement = infoNode.leftSpaceDefaultElement;
      }
    }

    // Compute the correct thing to place on the right side.
    let rightSpaceElement = infoNode.rightSpaceDefaultElement;
    if ((position === RelativePosition.TOP_RIGHT || position === RelativePosition.TOP_WIDE) && this._topRightElement != null) {
      rightSpaceElement = this._topRightElement;
    } else {
      if (this._rightSpaceDefaultElementFactory != null && infoNode.rightSpaceDefaultElement == null) {
        infoNode.rightSpaceDefaultElement = this._rightSpaceDefaultElementFactory(null);
        rightSpaceElement = infoNode.rightSpaceDefaultElement;
      }
    }

    // Build the list of desired children nodes in order.
    const targetChildrenList: Element[] = [];
    if (leftSpaceElement != null) {
      targetChildrenList.push(leftSpaceElement);
    }

    if (infoNode.children.length !== 0) {
      for (const kidInfo of infoNode.children) {
        targetChildrenList.push(kidInfo.tab);

        if (kidInfo.container == null) {
          kidInfo.container = this._tabContainerFactory(tabWidget, kidInfo.tab, kidInfo.content);
          kidInfo.container.appendChild(kidInfo.content);
        }
        targetChildrenList.push(kidInfo.container);
      }
    } else if (this._emptySplitFactory != null) {
      if (infoNode.emptyTab == null) {
        infoNode.emptyTab = <Tab> document.createElement(Tab.TAG_NAME);
        infoNode.emptyTab.id = this._nextTabId();
      }

      if (infoNode.emptyTabContent == null) {
        infoNode.emptyTabContent = this._emptySplitFactory(null);
        infoNode.emptyContainer = this._tabContainerFactory(tabWidget, infoNode.emptyTab, infoNode.emptyTabContent);
        infoNode.emptyContainer.appendChild(infoNode.emptyTabContent);
      } else {
        infoNode.emptyTabContent = this._emptySplitFactory(infoNode.emptyTabContent);
      }

      targetChildrenList.push(infoNode.emptyTab);
      targetChildrenList.push(infoNode.emptyContainer);
    }

    if (rightSpaceElement != null) {
      targetChildrenList.push(rightSpaceElement);
    }

    DomUtils.setElementChildren(tabWidget, targetChildrenList);
    tabWidget.showTabs = infoNode.children.length !== 0;
  }
}

function findTabWidgetInfoByTabWidget(root: RootInfoNode, tabWidget: TabWidget): TabWidgetInfoNode {
  if (root.type === "splitter") {
    for (const kid of root.children) {
      const info = findTabWidgetInfoByTabWidget(kid, tabWidget);
      if (info != null) {
        return info;
      }
    }
  } else {
    if (root.tabWidget === tabWidget) {
      return root;
    }
  }
  return null;
}

function removeAllChildrenExceptOne(container: Element, chosenOne: Element): void {
  DomUtils.toArray(container.children).forEach( (kid) => {
    if (kid !== chosenOne) {
      container.removeChild(kid);
    }
  });
}

function firstTabWidget(infoNode: RootInfoNode): TabWidget {
  const tabWidgetInfo = firstTabWidgetInfo(infoNode);
  return tabWidgetInfo == null ? null : tabWidgetInfo.tabWidget;
}

function firstTabWidgetInfo(infoNode: RootInfoNode): TabWidgetInfoNode {
  if (infoNode.type === "tabwidget") {
    return infoNode;
  } else {
    for (const kidInfo of infoNode.children) {
      const tabWidgetInfo = firstTabWidgetInfo(kidInfo);
      if (tabWidgetInfo != null) {
        return tabWidgetInfo;
      }
    }
    return null;
  }
}

function findTabWidgetInfoByTabContent(infoNode: RootInfoNode, tabContent: Element): {tabWidgetInfo: TabWidgetInfoNode, tabInfo: TabInfo} {
  if (infoNode.type === "splitter") {
    for (const kid of infoNode.children) {
      const info = findTabWidgetInfoByTabContent(kid, tabContent);
      if (info != null) {
        return info;
      }
    }
  } else {
    // Tab widget
    if (infoNode.emptyTabContent === tabContent) {
      return { tabWidgetInfo: infoNode, tabInfo: null };
    }

    for (const tabInfo of infoNode.children) {
      if (tabInfo.content === tabContent) {
        return { tabWidgetInfo: infoNode, tabInfo };
      }
    }
  }
  return null;
}

function findTabWidgetInfoByTab(infoNode: RootInfoNode, tab: Tab): {tabWidgetInfo: TabWidgetInfoNode, tabInfo: TabInfo} {
  if (infoNode.type === "splitter") {
    for (const kid of infoNode.children) {
      const info = findTabWidgetInfoByTab(kid, tab);
      if (info != null) {
        return info;
      }
    }
  } else {

    if (infoNode.children.length === 0) {
      if (infoNode.emptyTab === tab) {
        return { tabWidgetInfo: infoNode, tabInfo: null };
      }
    } else {

      // Tab widget
      for (const tabInfo of infoNode.children) {
        if (tabInfo.tab === tab) {
          return { tabWidgetInfo: infoNode, tabInfo };
        }
      }
    }
  }
  return null;
}

function findPathToTabContent(infoNode: RootInfoNode, tabContent: Element): InfoNode[] {
  if (infoNode.type === "splitter") {
    for (const kid of infoNode.children) {
      const path = findPathToTabContent(kid, tabContent);
      if (path != null) {
        return [infoNode, ...path];
      }
    }
    return null;

  } else {
    if (infoNode.emptyTabContent === tabContent) {
      return [infoNode];
    }

    // Tab widget
    for (const kid of infoNode.children) {
      if (kid.content === tabContent) {
        return [infoNode, kid];
      }
    }
    return null;
  }
}

function findPathToTabWidget(infoNode: RootInfoNode, tabWidget: TabWidget): InfoNode[] {
  if (infoNode.type === "splitter") {
    for (const kid of infoNode.children) {
      const path = findPathToTabWidget(kid, tabWidget);
      if (path != null) {
        return [infoNode, ...path];
      }
    }
    return null;

  } else {
    if (infoNode.tabWidget === tabWidget) {
      return [infoNode];
    }
    return null;
  }
}


function getAllTabContents(infoNode: RootInfoNode): Element[] {
  if (infoNode.type === "splitter") {
    return infoNode.children.map(getAllTabContents).reduce( (accu,list) => [...accu, ...list], []);
  } else {
    return infoNode.children.map(kidInfo => kidInfo.content);
  }
}

function getAllTabWidgets(infoNode: RootInfoNode): TabWidget[] {
  if (infoNode.type === "splitter") {
    return infoNode.children.map(getAllTabWidgets).reduce( (accu,list) => [...accu, ...list], []);
  } else if (infoNode.type === "tabwidget") {
    return [infoNode.tabWidget];
  } else {
    return [];
  }
}

function getPanePositions(rootNode: RootInfoNode): TabWidgetPosition[] {
  if (rootNode.type === "tabwidget") {
    const bounds = rootNode.tabWidget.getBoundingClientRect();
    return [{
      tabWidgetInfo: rootNode,
      top: bounds.top,
      bottom: bounds.bottom,
      left: bounds.left,
      right: bounds.right,
      width: bounds.width,
      height: bounds.height,
    }];
  } else {
    const bounds = rootNode.splitter.getBoundingClientRect();
    return getSplitterPanePositions(rootNode, bounds);
  }
}

function getSplitterPanePositions(splitterNode: SplitterInfoNode, bounds: ClientRect): TabWidgetPosition[] {
  let result: TabWidgetPosition[] = [];

  const splitter = splitterNode.splitter;
  const dividerSize = splitter.getDividerSize();
  const sizes = splitter.getPaneSizes();

  let edgePosition = 0;
  for (let i=0; i<splitterNode.children.length; i++) {
    const size = sizes[i] + (i !== splitterNode.children.length-1 ? dividerSize : 0);

    let childBounds: TabWidgetPosition;
    if (splitterNode.orientation === SplitOrientation.VERTICAL) {
      childBounds = {
        top: bounds.top,
        bottom: bounds.bottom,
        height: bounds.height,
        left: bounds.left + edgePosition,
        right: bounds.left + edgePosition + size,
        width: size,
        tabWidgetInfo: null
      };
    } else {
      childBounds = {
        left: bounds.left,
        right: bounds.right,
        width: bounds.width,

        top: bounds.top + edgePosition,
        bottom: bounds.top + edgePosition + size,
        height: size,
        tabWidgetInfo: null
      };
    }

    const childInfo = splitterNode.children[i];
    if (childInfo.type === "splitter") {
      result = [...result, ...getSplitterPanePositions(childInfo, childBounds)];
    } else {
      childBounds.tabWidgetInfo = childInfo;
      result.push(childBounds);
    }
    edgePosition += size;
  }

  return result;
}

function transformTabWidgetPosition(position: TabWidgetPosition, matrix: Matrix2D): TabWidgetPosition {
  const topLeft = transform2dPoint([position.left, position.top], matrix);
  const bottomRight = transform2dPoint([position.right, position.bottom], matrix);
  const left = Math.min(topLeft[0], bottomRight[0]);
  const top = Math.min(topLeft[1], bottomRight[1]);
  const bottom = Math.max(topLeft[1], bottomRight[1]);
  const right = Math.max(topLeft[0], bottomRight[0]);

  return {
    left,
    top,
    bottom,
    right,
    width: right-left,
    height: bottom-top,
    tabWidgetInfo: position.tabWidgetInfo
  };
}

function transform2dPoint(point: Point2D, matrix: Matrix2D): Point2D {
  const x = point[0] * matrix[0] + point[1] * matrix[2];
  const y = point[0] * matrix[1] + point[1] * matrix[3];
  return [x ,y];
}

function swapArrayItems<T>(array: Array<T>, item1: T, item2: T): Array<T> {
  const newArray: Array<T> = [];

  for (const item of array) {
    if (item === item1) {
      newArray.push(item2);
    } else if (item === item2) {
      newArray.push(item1);
    } else {
      newArray.push(item);
    }
  }

  return newArray;
}
