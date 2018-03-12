import { Component, Listen, Method } from '@stencil/core';
import { OverlayController, PickerOptions } from '../../index';
import { createOverlay, dismissOverlay, getTopOverlay, removeLastOverlay } from '../../utils/overlays';


@Component({
  tag: 'ion-picker-controller'
})
export class PickerController implements OverlayController {

  private pickers = new Map<number, HTMLIonPickerElement>();

  @Listen('body:ionPickerWillPresent')
  protected pickerWillPresent(ev: any) {
    this.pickers.set(ev.target.overlayId, ev.target);
  }

  @Listen('body:ionPickerWillDismiss')
  @Listen('body:ionPickerDidUnload')
  protected pickerWillDismiss(ev: any) {
    this.pickers.delete(ev.target.overlayId);
  }

  @Listen('body:keyup.escape')
  protected escapeKeyUp() {
    removeLastOverlay(this.pickers);
  }

  /*
   * Create a picker overlay with picker options.
   */
  @Method()
  create(opts?: PickerOptions): Promise<HTMLIonPickerElement> {
    return createOverlay(document.createElement('ion-picker'), opts);
  }

  /*
   * Dismiss the open picker overlay.
   */
  @Method()
  dismiss(data?: any, role?: string, pickerId = -1) {
    return dismissOverlay(data, role, this.pickers, pickerId);
  }

  /*
   * Get the most recently opened picker overlay.
   */
  @Method()
  getTop(): HTMLIonPickerElement {
    return getTopOverlay(this.pickers);
  }
}
