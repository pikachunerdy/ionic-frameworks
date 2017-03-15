import { NgModule, ModuleWithProviders } from '@angular/core';

import { Scroll } from './scroll';

@NgModule({
  declarations: [
    Scroll
  ],
  exports: [
    Scroll
  ]
})
export class ScrollModule {
  public static forRoot(): ModuleWithProviders {
    return {
      ngModule: ScrollModule, providers: []
    };
  }
}
