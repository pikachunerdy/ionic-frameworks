import { StencilElement } from '..';

export function clamp(min: number, n: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

export function isDef(v: any): boolean { return v !== undefined && v !== null; }

export function isUndef(v: any): boolean { return v === undefined || v === null; }

export function isArray(v: any): v is Array<any> { return Array.isArray(v); }

export function isObject(v: any): v is Object { return v !== null && typeof v === 'object'; }

export function isBoolean(v: any): v is (boolean) { return typeof v === 'boolean'; }

export function isString(v: any): v is (string) { return typeof v === 'string'; }

export function isNumber(v: any): v is (number) { return typeof v === 'number'; }

export function isFunction(v: any): v is (Function) { return typeof v === 'function'; }

export function isStringOrNumber(v: any): v is (string | number) { return isString(v) || isNumber(v); }

export function assert(bool: boolean, msg: string) {
  if (!bool) {
    console.error(msg);
  }
};

export function toDashCase(str: string) {
  return str.replace(/([A-Z])/g, (g) => '-' + g[0].toLowerCase());
}

export function noop() {}

export function pointerCoordX(ev: any): number {
  // get X coordinates for either a mouse click
  // or a touch depending on the given event
  if (ev) {
    var changedTouches = ev.changedTouches;
    if (changedTouches && changedTouches.length > 0) {
      return changedTouches[0].clientX;
    }
    if (ev.pageX !== undefined) {
      return ev.pageX;
    }
  }
  return 0;
}

export function pointerCoordY(ev: any): number {
  // get Y coordinates for either a mouse click
  // or a touch depending on the given event
  if (ev) {
    var changedTouches = ev.changedTouches;
    if (changedTouches && changedTouches.length > 0) {
      return changedTouches[0].clientY;
    }
    if (ev.pageY !== undefined) {
      return ev.pageY;
    }
  }
  return 0;
}

export function getElementReference(elm: any, ref: string) {
  if (ref === 'child') {
    return elm.firstElementChild;
  }
  if (ref === 'parent') {
    return getParentElement(elm) || elm;
  }
  if (ref === 'body') {
    return elm.ownerDocument.body;
  }
  if (ref === 'document') {
    return elm.ownerDocument;
  }
  if (ref === 'window') {
    return elm.ownerDocument.defaultView;
  }
  return elm;
}

export function getParentElement(elm: any) {
  if (elm.parentElement ) {
    // normal element with a parent element
    return elm.parentElement;
  }
  if (elm.parentNode && elm.parentNode.host) {
    // shadow dom's document fragment
    return elm.parentNode.host;
  }
  return null;
}

export function applyStyles(elm: HTMLElement, styles: {[styleProp: string]: string|number}) {
  const styleProps = Object.keys(styles);

  if (elm) {
    for (var i = 0; i < styleProps.length; i++) {
      (<any>elm.style)[styleProps[i]] = styles[styleProps[i]];
    }
  }
}

export function getToolbarHeight(toolbarTagName: string, pageChildren: HTMLElement[], mode: string, iosHeight: string, defaultHeight: string) {
  for (var i = 0; i < pageChildren.length; i++) {
    if (pageChildren[i].tagName === toolbarTagName) {
      var headerHeight = pageChildren[i].getAttribute(`${mode}-height`);
      if (headerHeight) {
        return headerHeight;
      }

      if (mode === 'ios') {
        return iosHeight;
      }

      return defaultHeight;
    }
  }

  return '';
}

/** @hidden */
export type Side = 'left' | 'right' | 'start' | 'end';

/**
 * @hidden
 * Given a side, return if it should be on the right
 * based on the value of dir
 * @param side the side
 * @param isRTL whether the application dir is rtl
 * @param defaultRight whether the default side is right
 */
export function isRightSide(side: Side, isRTL: boolean, defaultRight: boolean = false): boolean {
  switch (side) {
    case 'right': return true;
    case 'left': return false;
    case 'end': return !isRTL;
    case 'start': return isRTL;
    default: return defaultRight ? !isRTL : isRTL;
  }
}

/** @hidden */
export function swipeShouldReset(isResetDirection: boolean, isMovingFast: boolean, isOnResetZone: boolean): boolean {
  // The logic required to know when the sliding item should close (openAmount=0)
  // depends on three booleans (isCloseDirection, isMovingFast, isOnCloseZone)
  // and it ended up being too complicated to be written manually without errors
  // so the truth table is attached below: (0=false, 1=true)
  // isCloseDirection | isMovingFast | isOnCloseZone || shouldClose
  //         0        |       0      |       0       ||    0
  //         0        |       0      |       1       ||    1
  //         0        |       1      |       0       ||    0
  //         0        |       1      |       1       ||    0
  //         1        |       0      |       0       ||    0
  //         1        |       0      |       1       ||    1
  //         1        |       1      |       0       ||    1
  //         1        |       1      |       1       ||    1
  // The resulting expression was generated by resolving the K-map (Karnaugh map):
  return (!isMovingFast && isOnResetZone) || (isResetDirection && isMovingFast);
}

export function isReady(element: HTMLElement) {
  return new Promise((resolve) => {
    (element as StencilElement).componentOnReady((elm: HTMLElement) => {
      resolve(elm);
    });
  });
}

/** @hidden */
export function deepCopy(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}
