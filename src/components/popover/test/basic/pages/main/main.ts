import { Component, ViewChild, ElementRef } from '@angular/core';

import { PopoverController } from '../../../../../..';

@Component({
  templateUrl: 'main.html',
  selector: 'e2e-popover-basic'
})
export class E2EPage {
  @ViewChild('popoverContent', {read: ElementRef}) content: ElementRef;
  @ViewChild('popoverText', {read: ElementRef}) text: ElementRef;

  constructor(private popoverCtrl: PopoverController) {}

  presentListPopover(ev: UIEvent) {
    let popover = this.popoverCtrl.create('PopoverListPage');
    popover.present({
      ev: ev
    });
  }

  presentLongListPopover(ev: UIEvent) {
    let popover = this.popoverCtrl.create('PopoverLongListPage', {}, {
      cssClass: 'my-popover popover-class'
    });
    popover.present({
      ev: ev
    });
  }

  presentRadioPopover(ev: UIEvent) {
    let popover = this.popoverCtrl.create('PopoverRadioPage', {
      contentEle: this.content.nativeElement,
      textEle: this.text.nativeElement
    });

    popover.present({
      ev: ev
    });
  }

  presentNoEventPopover() {
    this.popoverCtrl.create('PopoverListPage').present();
  }

}
