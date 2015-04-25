import {Component, View as NgView, Parent} from 'angular2/angular2'
import {NavViewport} from 'ionic/components'
import {View} from 'ionic/components/view/view'

@Component({
  selector: 'second-page'
})
@NgView({
  templateUrl: 'pages/second-page.html',
  directives: [View]
})
export class SecondPage {
  constructor(
    @Parent() viewport: NavViewport
  ) {
    this.viewport = viewport
  }
  pop() {
    this.viewport.pop()
  }
}
