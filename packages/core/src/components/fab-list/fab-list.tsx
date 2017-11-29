import { Component, Element, Prop, PropDidChange } from '@stencil/core';


@Component({
  tag: 'ion-fab-list',
})
export class FabList {
  @Element() private el: HTMLIonFabElement;

  @Prop() activated: boolean = false;

  @PropDidChange('activated')
  protected activatedChanged(activated: boolean) {
    const fabs = this.el.querySelectorAll('ion-fab-button');

    // if showing the fabs add a timeout, else show immediately
    var timeout = activated ? 30 : 0;
    for (var i = 0; i < fabs.length; i++) {
      const fab = fabs[i];
      setTimeout(() => fab.show = activated, i * timeout);
    }
  }

  hostData() {
    return {
      class: {
        'fab-list-active': this.activated
      }
    };
  }

  render() {
    return (
      <slot></slot>
    );
  }
}
