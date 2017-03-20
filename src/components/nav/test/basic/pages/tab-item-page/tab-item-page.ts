import { Component } from '@angular/core';
import { App, IonicPage, Tabs} from '../../../../../..';

@IonicPage({
  name: 'tab-item-page'
})
@Component({
  template: `
    <ion-header>
      <ion-navbar>
        <ion-title>Tab Item</ion-title>
      </ion-navbar>
    </ion-header>

    <ion-content>
      <h2>Hello moto</h2>
    </ion-content>
    `
})
export class TabItemPage {
  items: any[] = [];

  constructor(private tabs: Tabs, private app: App) {
  }
}

