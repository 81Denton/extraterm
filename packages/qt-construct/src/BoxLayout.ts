/*
 * Copyright 2021 Simon Edwards <simon@simonzone.com>
 *
 * This source code is licensed under the MIT license which is detailed in the LICENSE.txt file.
 */
import { AlignmentFlag, Direction, NodeWidget, QBoxLayout, QWidget } from "@nodegui/nodegui";


export interface BoxLayoutItem {
  widget: QWidget;
  stretch?: number;
  alignment?: AlignmentFlag;
}

export interface BoxLayoutOptions {
  direction: Direction;
  children: (NodeWidget<any> | BoxLayoutItem)[];
  spacing?: number;
  contentsMargins?: [number, number, number, number];
}

export function BoxLayout(options: BoxLayoutOptions): QBoxLayout {
  const { children, contentsMargins, direction, spacing } = options;

  const boxLayout = new QBoxLayout(direction);
  if (spacing !== undefined) {
    boxLayout.setSpacing(spacing);
  }

  if (contentsMargins !== undefined) {
    boxLayout.setContentsMargins(...contentsMargins);
  }

  for (const child of children) {
    if (child instanceof NodeWidget) {
      boxLayout.addWidget(child);
    } else {
      boxLayout.addWidget(child.widget, child.stretch === undefined ? 0 : child.stretch,
        child.alignment === undefined ? 0 : child.alignment);
    }
  }

  return boxLayout;
}
