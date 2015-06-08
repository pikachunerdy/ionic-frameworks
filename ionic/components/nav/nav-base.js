import {Parent} from 'angular2/src/core/annotations_impl/visibility';
import {Component, Directive, onInit} from 'angular2/src/core/annotations_impl/annotations';
import {Optional} from 'angular2/src/di/annotations_impl'
import {View} from 'angular2/src/core/annotations_impl/view';
import {ElementRef} from 'angular2/src/core/compiler/element_ref';
import {DynamicComponentLoader} from 'angular2/src/core/compiler/dynamic_component_loader';
import {Injector} from 'angular2/di';
import {ViewContainerRef} from 'angular2/src/core/compiler/view_container_ref';
import {Compiler} from 'angular2/angular2';
import {bind} from 'angular2/di';

import {NavController} from './nav-controller';
import {NavItem, NavParams} from './nav-item';
import {Pane, NavBarContainer} from './pane';
import {Transition} from '../../transitions/transition';
import {ClickBlock} from '../../util/click-block';
import * as util from 'ionic/util';


export class NavBase {

  constructor(
    parent: NavBase,
    compiler: Compiler,
    elementRef: ElementRef,
    loader: DynamicComponentLoader,
    injector: Injector
  ) {

    this.parent = parent;
    this.compiler = compiler;
    this.elementRef = elementRef;
    this.domElement = elementRef.domElement;
    this.loader = loader;
    this.injector = injector;

    this.items = [];
    this.navCtrl = new NavController(this);
    this.sbTransition = null;
    this.sbActive = false;
    this.panes = {};

    this.id = ++itemIds;
    this.childIds = -1;
  }

  setPaneAnchor(elementRef) {
    this.anchorElementRef = elementRef;
  }

  getPane(itemStructure, callback) {
    // this gets or creates the Pane which similar nav items live in
    // Nav items with just a navbar/content would all use the same Pane
    // Tabs and view's without a navbar would get a different Panes

    if (this.panes[itemStructure.key]) {
      // nav pane which the entering component already exists
      callback(this.panes[itemStructure.key]);

    } else {
      // create a new nav pane
      this.panes[itemStructure.key] = null;

      let injector = this.injector.resolveAndCreateChild([
        bind(NavBase).toValue(this)
      ]);

      // add a Pane element
      // when the Pane is added, it'll also add its reference to the panes object
      this.loader.loadNextToExistingLocation(Pane, this.anchorElementRef, injector).then(() => {

        // get the pane reference by name
        let pane = this.panes[itemStructure.key];

        // get the element inside the Pane to add sections to
        let sectionViewContainerRef = pane.sectionAnchorElementRef;
        let promises = [];
        let sectionsToAdd = []

        // decide which sections should be added to this Pane, ie: nav bars, tab bars, etc.
        // add only the sections it needs
        if (itemStructure.navbar) {
          sectionsToAdd.push(NavBarContainer);
        }

        // add the sections which this type of Pane requires
        sectionsToAdd.forEach(SectionClass => {
          // as each section is compiled and added to the Pane
          // the section will add a reference to itself in the Pane's sections object
          promises.push( this.loader.loadNextToExistingLocation(SectionClass, sectionViewContainerRef, null) );
        });

        // wait for all of the sections to resolve
        Promise.all(promises).then(() => {
          callback(pane);
        });

      });

    }
  }

  addPane(pane) {
    for (let np in this.panes) {
      if (this.panes[np] === null) {
        this.panes[np] = pane;
        return;
      }
    }
  }

  push(ComponentClass, params = {}, opts = {}) {
    if (!ComponentClass || this.isTransitioning()) {
      return Promise.reject();
    }

    let resolve;
    let promise = new Promise(res => { resolve = res; });

    // default the direction to "forward"
    opts.direction = opts.direction || 'forward';

    if(opts.animate === false) {
      opts.animation = 'none';
    }

    // do not animate if this is the first in the stack
    if (!this.items.length) {
      opts.animation = 'none';
    }

    // the active item is going to be the leaving one (if one exists)
    let leavingItem = this.getActive() || new NavItem();
    leavingItem.shouldDestroy = false;
    leavingItem.shouldCache = true;
    leavingItem.willCache();

    // create a new NavStackItem
    let enteringItem = new NavItem(this, ComponentClass, params);

    // add the item to the stack
    this.add(enteringItem);

    // start the transition
    this.transition(enteringItem, leavingItem, opts, () => {
      resolve();
    });

    return promise;
  }

  pop(opts = {}) {
    if (this.isTransitioning() || this.items.length < 1) {
      return Promise.reject();
    }

    if(opts.animate === false) {
      opts.animation = 'none';
    }

    let resolve;
    let promise = new Promise(res => { resolve = res; });

    // default the direction to "back"
    opts.direction = opts.direction || 'back';

    // get the active item and set that it is staged to be leaving
    // was probably the one popped from the stack
    let leavingItem = this.getActive() || new NavItem();
    leavingItem.shouldDestroy = true;
    leavingItem.shouldCache = false;
    leavingItem.willUnload();

    // the entering item is now the new last item
    // Note: we might not have an entering item if this is the only
    // item on the history stack.
    let enteringItem = this.getPrevious(leavingItem);
    if(enteringItem) {
      // start the transition
      this.transition(enteringItem, leavingItem, opts, () => {
        // transition completed, destroy the leaving item
        resolve();
      });

    } else {
      this.transitionComplete();
      resolve();
    }

    return promise;
  }

  transition(enteringItem, leavingItem, opts, callback) {
    if (!enteringItem || enteringItem === leavingItem) {
      return callback();
    }

    opts.isAnimated = (opts.animation !== 'none');

    this.transitionStart(opts);

    // wait for the new item to complete setup
    enteringItem.stage(() => {

      enteringItem.shouldDestroy = false;
      enteringItem.shouldCache = false;
      enteringItem.willEnter();
      leavingItem.willLeave();

      // set that the leaving item is stage to be leaving
      leavingItem.state = STAGED_LEAVING_STATE;

      // set that the new item pushed on the stack is staged to be entering
      // setting staged state is important for the transition logic to find the correct item
      enteringItem.state = STAGED_ENTERING_STATE;

      // init the transition animation
      let transAnimation = Transition.create(this, opts);

      // wait for the items to be fully staged
      transAnimation.stage(() => {

        // update the state that the items are actively entering/leaving
        enteringItem.state = ACTIVELY_ENTERING_STATE;
        leavingItem.state = ACTIVELY_LEAVING_STATE;

        // start the transition
        transAnimation.play().then(() => {

          // transition has completed, update each item's state
          enteringItem.state = ACTIVE_STATE;
          leavingItem.state = CACHED_STATE;

          // dispose any items that shouldn't stay around
          transAnimation.dispose();

          enteringItem.didEnter();
          leavingItem.didLeave();

          // all done!
          this.transitionComplete();

          callback();
        });

      });

    });
  }

  swipeBackStart() {
    if (this.isTransitioning() || this.items.length < 2) {
      return;
    }

    this.sbActive = true;
    this.sbResolve = null;

    // default the direction to "back"
    let opts = {
      direction: 'back'
    };

    // get the active item and set that it is staged to be leaving
    // was probably the one popped from the stack
    let leavingItem = this.getActive() || new NavItem();
    leavingItem.shouldDestroy = true;
    leavingItem.shouldCache = false;
    leavingItem.willLeave();
    leavingItem.willUnload();

    // the entering item is now the new last item
    let enteringItem = this.getPrevious(leavingItem);
    enteringItem.shouldDestroy = false;
    enteringItem.shouldCache = false;
    enteringItem.willEnter();

    // start the transition
    this.transitionStart({ isAnimated: true });

    // wait for the new item to complete setup
    enteringItem.stage(() => {

      // set that the leaving item is stage to be leaving
      leavingItem.state = STAGED_LEAVING_STATE;

      // set that the new item pushed on the stack is staged to be entering
      // setting staged state is important for the transition logic to find the correct item
      enteringItem.state = STAGED_ENTERING_STATE;

      // init the transition animation
      this.sbTransition = Transition.create(this, opts);
      this.sbTransition.easing('linear');

      // wait for the items to be fully staged
      this.sbTransition.stage(() => {

        // update the state that the items are actively entering/leaving
        enteringItem.state = ACTIVELY_ENTERING_STATE;
        leavingItem.state = ACTIVELY_LEAVING_STATE;

        let swipeBackPromise = new Promise(res => { this.sbResolve = res; });

        swipeBackPromise.then((completeSwipeBack) => {

          if (completeSwipeBack) {
            // swipe back has completed, update each item's state
            enteringItem.state = ACTIVE_STATE;
            leavingItem.state = CACHED_STATE;

            enteringItem.didEnter();
            leavingItem.didLeave();

          } else {
            // cancelled the swipe back, return items to original state
            leavingItem.state = ACTIVE_STATE;
            enteringItem.state = CACHED_STATE;

            leavingItem.willEnter();
            leavingItem.didEnter();
            enteringItem.didLeave();

            leavingItem.shouldDestroy = false;
            enteringItem.shouldDestroy = false;
          }

          // all done!
          this.transitionComplete();

        });

      });

    });

  }

  swipeBackEnd(completeSwipeBack, progress, playbackRate) {
    // to reverse the animation use a negative playbackRate
    if (this.sbTransition && this.sbActive) {
      this.sbActive = false;

      if (progress <= 0) {
        this.swipeBackProgress(0.0001);
      } else if (progress >= 1) {
        this.swipeBackProgress(0.9999);
      }

      if (!completeSwipeBack) {
        playbackRate = playbackRate * -1;
      }

      this.sbTransition.playbackRate(playbackRate);

      this.sbTransition.play().then(() => {
        this.sbResolve && this.sbResolve(completeSwipeBack);
        this.sbTransition && this.sbTransition.dispose();
        this.sbResolve = this.sbTransition = null;
      });
    }
  }

  swipeBackProgress(progress) {
    if (this.sbTransition) {
      ClickBlock(true, 4000);
      this.sbTransition.progress( Math.min(1, Math.max(0, progress)) );
    }
  }

  swipeBackEnabled() {
    if (this.items.length > 1) {
      let activeItem = this.getActive();
      if (activeItem) {
        return activeItem.enableBack;
      }
    }
    return false;
  }

  transitionStart(opts) {
    if (opts.isAnimated) {
      // block possible clicks during transition
      ClickBlock(true, 520);
      this.getNavElement().classList.add('transitioning');
    }
  }

  transitionComplete() {

    this.items.forEach((item) => {
      if (item) {
        if (item.shouldDestroy) {
          this.remove(item);
          item.destroy();

        } else if (item.state === CACHED_STATE && item.shouldCache) {
          item.cache();
          item.shouldCache = false;
        }
      }
    });

    this.getNavElement().classList.remove('transitioning');

    // allow clicks again
    ClickBlock(false);
  }

  isTransitioning() {
    let state;
    for (let i = 0, ii = this.items.length; i < ii; i++) {
      state = this.items[i].state;
      if (state === ACTIVELY_ENTERING_STATE ||
          state === ACTIVELY_LEAVING_STATE ||
          state === STAGED_ENTERING_STATE ||
          state === STAGED_LEAVING_STATE) {
        return true;
      }
    }
    return false;
  }

  getActive() {
    for (let i = 0, ii = this.items.length; i < ii; i++) {
      if (this.items[i].state === ACTIVE_STATE) {
        return this.items[i];
      }
    }
    return null;
  }

  getByInstance(instance) {
    if (instance) {
      for (let i = 0, ii = this.items.length; i < ii; i++) {
        if (this.items[i].instance === instance) {
          return this.items[i];
        }
      }
    }
    return null;
  }

  getByIndex(index) {
    if (index < this.items.length && index > -1) {
      return this.items[index];
    }
    return null;
  }

  getPrevious(item) {
    if (item) {
      return this.items[ this.items.indexOf(item) - 1 ];
    }
    return null;
  }

  getStagedEnteringItem() {
    for (let i = 0, ii = this.items.length; i < ii; i++) {
      if (this.items[i].state === STAGED_ENTERING_STATE) {
        return this.items[i];
      }
    }
    return null;
  }

  getStagedLeavingItem() {
    for (let i = 0, ii = this.items.length; i < ii; i++) {
      if (this.items[i].state === STAGED_LEAVING_STATE) {
        return this.items[i];
      }
    }
    return null;
  }

  getNavElement() {
    return this.domElement;
  }

  navbarViewContainer(nbContainer) {
    if (nbContainer) {
      this._nbContainer = nbContainer;
    }
    if (this._nbContainer) {
      return this._nbContainer;
    }
    if (this.parent) {
      return this.parent.navbarViewContainer();
    }
  }

  add(item) {
    item.id = this.id + '' + (++this.childIds);
    this.items.push(item);
  }

  remove(itemOrIndex) {
    util.array.remove(this.items, itemOrIndex);
  }

  length() {
    return this.items.length;
  }

  clear() {
    let pops = [];
    for (let item of this.items) {
      pops.push(this.pop({
        animate: false
      }));
    }
    return Promise.all(pops);
  }

  instances() {
    let instances = [];
    for (let item of this.items) {
      if (item.instance) {
        instances.push(item.instance);
      }
    }
    return instances;
  }

  isActive(item) {
    return (item && item.state === ACTIVE_STATE);
  }

  isStagedEntering(item) {
    return (item && item.state === STAGED_ENTERING_STATE);
  }

  width() {
    return this.domElement.offsetWidth;
  }

}

const ACTIVE_STATE = 1;
const CACHED_STATE = 2;
const STAGED_ENTERING_STATE = 3;
const STAGED_LEAVING_STATE = 4;
const ACTIVELY_ENTERING_STATE = 5;
const ACTIVELY_LEAVING_STATE = 6;

let itemIds = -1;
