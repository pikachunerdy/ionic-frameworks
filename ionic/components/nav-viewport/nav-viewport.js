import {Component, View as NgView, For, NgElement, bind} from 'angular2/angular2'
import {NavPane} from 'ionic/components/nav-pane/nav-pane'
import * as util from 'ionic/util'

class NavStack {
  constructor(navViewport: NavViewport) {
    this._viewport = navViewport
  }
  push(Class, opts = {}) {
    return this._viewport.push(Class, opts)
  }
  pop(opts = {}) {
    return this._viewport.pop(Class, opts)
  }
  popTo(index, opts = {}) {
    return this._viewport.popTo(index, opts)
  }
  size()  {
    return this._viewport._stack.length
  }
}

@Component({
  selector: 'ion-nav-viewport',
  bind: {
    initial: 'initial'
  },
  services: [
    NavStack
  ]
})
@NgView({
  template: `
  <header class="toolbar-container">
    <!-- COLLECTION OF TOOLBARS FOR EACH OF ITS VIEWS WITHIN THIS NAV-VIEWPORT -->
    <!-- TOOLBARS FOR EACH VIEW SHOULD HAVE THE SAME CONTEXT AS ITS VIEW -->
  </header>

  <div class="nav-pane-container">
    <!-- COLLECTION OF PANES WITHIN THIS NAV-VIEWPORT, EACH PANE AS ONE VIEW -->
    <!-- EACH VIEW HAS A TOOLBAR WHICH NEEDS TO HAVE THE SAME CONTEXT -->
    <section class="nav-pane" *for="#item of _ngForLoopArray" [item]="item"></section>
  </div>
  `,
  directives: [NavPane, For]
})
export class NavViewport {
  constructor(
    element: NgElement
  ) {
    this.domElement = element.domElement
    this.domElement.classList.add('nav-viewport')

    // this is our sane stack of items. This is synchronous and says an item
    // is removed even if it's still animating out.
    this._stack = []

    // _ngForLoopArray is actually adds/removes components from the dom. It won't
    // remove a component until it's done animating out.
    this._ngForLoopArray = []
  }

  containsClass(Class) {
    for (let i = 0; i < this._stack.length; i++) {
      if (this._stack[i].Class === Class) {
        return true
      }
    }
    return false
  }

  set initial(Class) {
    if (!this.initialized) {
      this.initialized = true
      this.push(Class)
    }
  }
  //TODO let the view handle enter/leave so splitview can override

  /**
   * Push a new view into the history stack.
   *
   * @param view the new view
   * @param shouldAnimate whether to animate
   */
  // TODO don't push same component twice if one is already pushing
  // TODO only animate if state hasn't changed
  // TODO make sure the timing is together
  // TODO allow starting an animation in the middle (eg gestures). Leave
  // most of this up to the animation's implementation.
  push(Class: Function, data = {}, opts = {}) {
    util.defaults(opts, {
      sync: this._stack.length === 0
    })

    let pushedItem = new NavItem(Class, data)
    this._stack.push(pushedItem)
    this._ngForLoopArray.push(pushedItem)

    return pushedItem.waitForSetup().then(() => {
      let current = this._getPrevious(pushedItem)
      current && current.leaveReverse(opts)
      return pushedItem.enter(opts)
    })
  }

  /**
   * Pop a view off the history
   *
   * @param shouldAnimate whether to animate
   */
  pop(opts = {}) {
    util.defaults(opts, {
      sync: false
    })
    let current = this._stack.pop()
    let dest = this.peek()

    dest && dest.enterReverse(opts)
    return current && current.leave(opts).then(() => this._destroy(current))
  }

  peek() {
    return this._stack[this._stack.length - 1]
  }

  popAll() {
    while (this._stack.length) {
      const item = this._stack.pop()
      this._destroy(item)
    }
  }

  // Pop from the current item to the item at the specified index.
  // Removes every item in the stack between the current and the given index,
  // then performs a normal pop.
  popTo(index, opts = {}) {
    // Abort if we're already here.
    if (this._stack.length <= index + 1) {
      return Promise.resolve()
    }

    // Save the current navItem, and remove all the other ones in front of our
    // target nav item.
    const current = this._stack.pop()
    while (this._stack.length > index + 1) {
      const item = this._stack.pop()
      this._destroy(item)
    }

    // Now put the current navItem back on the stack and run a normal pop animation.
    this._stack.push(current)
    return this.pop(opts)
  }

  setStack(stack) {
    this._stack = stack.slice()
    this._ngForLoopArray = stack.slice()
  }

  remove(index) {
    const item = this._stack[index]
    this._stack.splice(index, 1)
    this._destroy(item)
  }

  _destroy(navItem) {
    console.warn(
`Component "${navItem.Class.name}" was popped from the nav stack, But were keeping its element in the DOM for now because of an ng2 bug.`
    );
    //util.array.remove(this._ngForLoopArray, navItem)
  }

  _getPrevious(item) {
    return this._stack[ this._stack.indexOf(item) - 1 ]
  }
}

class NavItem {
  constructor(ComponentClass, data = {}) {
    this.Class = ComponentClass
    this.data = data
    this._setupPromise = new Promise((resolve) => {
      this._resolveSetupPromise = resolve
    })
  }
  waitForSetup() {
    return this._setupPromise
  }
  finishSetup(navPane, componentInstance) {
    this.navPane = navPane
    this.instance = componentInstance
    this._resolveSetupPromise()
  }
  setAnimation(state) {
    if (!state) {
      this.navPane.domElement.removeAttribute('animate')
      this.navPane.domElement.classList.remove('start')
    } else {
      this.navPane.domElement.setAttribute('animate', state)
    }
  }
  setShown(isShown) {
    this.navPane.domElement.classList[isShown?'add':'remove']('shown')
  }
  startAnimation() {
    this.navPane.domElement.classList.add('start')
  }
  _animate({ isShown, animation }) {
    this.setAnimation(animation)
    this.setShown(isShown)
    if (animation) {
      // We have to wait two rafs for the element to show. Yawn.
      return util.dom.rafPromise().then(util.dom.rafPromise).then(() => {
        this.startAnimation()
        return util.dom.transitionEndPromise(this.navPane.domElement).then(() => {
          this.setAnimation(null)
        })
      })
    } else {
      return Promise.resolve()
    }
  }
  enterReverse(opts) {
    return this.enter( util.extend({reverse: true}, opts) )
  }
  enter({ reverse = false, sync = false } = {}) {
    return this._animate({
      isShown: true,
      animation: sync ? null : (reverse ? 'enter-reverse' : 'enter')
    })
  }
  leave({ reverse = false, sync = false } = {}) {
    return this._animate({
      isShown: false,
      animation: sync ? null : (reverse ? 'leave-reverse' : 'leave')
    })
  }
  leaveReverse(opts) {
    return this.leave( util.extend({reverse: true}, opts) )
  }
}
