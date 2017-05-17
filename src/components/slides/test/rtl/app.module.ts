import { Component, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicApp, IonicModule } from  '../../../..';


@Component({
  templateUrl: 'main.html'
})
export class E2EPage {
  slider: any;

  onSlideWillChange(s: any) {
    console.log(`onSlideWillChange: ${s}`);
  }

  onSlideDidChange(s: any) {
    console.log(`onSlideDidChange: ${s}`);
  }

  onSlideDrag(s: any) {
    console.log(`onSlideDrag: ${s}`);
  }

}

@Component({
  template: '<ion-nav [root]="root"></ion-nav>'
})
export class E2EApp {
  root = E2EPage;
}

@NgModule({
  declarations: [
    E2EApp,
    E2EPage
  ],
  imports: [
    IonicModule.forRoot(E2EApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    E2EApp,
    E2EPage
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class AppModule { }
