import {Component, View, bootstrap} from 'angular2/angular2';


@Component({ selector: '[ion-app]' })
@View({
  templateUrl: 'main.html',
  directives: []
})
class IonicApp {
  constructor() {
    console.log('IonicApp Start')
  }
}

bootstrap(IonicApp)
