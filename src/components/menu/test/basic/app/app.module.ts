import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule } from '../../../../..';

import { E2EApp } from './app.component';

@NgModule({
  declarations: [
    E2EApp,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(E2EApp, {}, {
      links: [
        { loadChildren: '../pages/main/main.module#E2EPageModule', name: 'E2EPage' },
        { loadChildren: '../pages/page1/page1.module#Page1Module', name: 'Page1' },
        { loadChildren: '../pages/page2/page2.module#Page2Module', name: 'Page2' },
        { loadChildren: '../pages/page3/page3.module#Page3Module', name: 'Page3' },
        { loadChildren: '../components/modal/modal.module#ModalModule', name: 'Modal' },
      ]
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    E2EApp,
  ]
})
export class AppModule { }
