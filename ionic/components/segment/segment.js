import {Renderer, ElementRef, EventEmitter} from 'angular2/angular2'

import {Component, Directive, onInit} from 'angular2/src/core/annotations_impl/annotations';
import {Ancestor} from 'angular2/src/core/annotations_impl/visibility';
import {View} from 'angular2/src/core/annotations_impl/view';

import {Control, NgControl,NgFormControl} from 'angular2/forms';
import {ControlGroup, ControlDirective} from 'angular2/forms'
import {dom} from 'ionic/util';
import {IonicComponent} from 'ionic/config/component'

@Directive({
  selector: 'ion-segment',
  host: {
    '(change)': 'onChange($event.target.value)',
    '(input)': 'onChange($event.target.value)',
    '(blur)': 'onTouched()',
    '[value]': 'value',
    '[class.ng-untouched]': 'cd.control?.untouched == true',
    '[class.ng-touched]': 'cd.control?.touched == true',
    '[class.ng-pristine]': 'cd.control?.pristine == true',
    '[class.ng-dirty]': 'cd.control?.dirty == true',
    '[class.ng-valid]': 'cd.control?.valid == true',
    '[class.ng-invalid]': 'cd.control?.valid == false'
  }
})
export class SegmentControlValueAccessor {
  constructor(cd: NgControl, renderer: Renderer, elementRef: ElementRef, segment: Segment) {
    this.onChange = (_) => {};
    this.onTouched = (_) => {};
    this.cd = cd;
    this.renderer = renderer;
    this.elementRef = elementRef;
    this.segment = segment;

    cd.valueAccessor = this;
  }

  writeValue(value) {
    // both this.value and setProperty are required at the moment
    // remove when a proper imperative API is provided
    this.value = !value ? '' : value;
    this.renderer.setElementProperty(this.elementRef.parentView.render, this.elementRef.boundElementIndex, 'value', this.value);

    this.segment.value = this.value;
    this.segment.selectFromValue(value);
  }

  registerOnChange(fn) { this.onChange = fn; }

  registerOnTouched(fn) { this.onTouched = fn; }
}


@IonicComponent(Segment)
@View({
  template: `<div class="ion-segment">
    <content></content>
  </div>
  `,
  directives: [SegmentButton]
})
export class Segment {

  static get config() {
    return {
      selector: 'ion-segment',
      appInjector: [ NgFormControl ],
      properties: [
        'value'
      ],
      lifecycle: [onInit],
      host: {
        '(click)': 'buttonClicked($event)',
        '(change)': 'onChange($event)',
        '[value]': 'value',
        '[class.ng-untouched]': 'cd.control?.untouched == true',
        '[class.ng-touched]': 'cd.control?.touched == true',
        '[class.ng-pristine]': 'cd.control?.pristine == true',
        '[class.ng-dirty]': 'cd.control?.dirty == true',
        '[class.ng-valid]': 'cd.control?.valid == true',
        '[class.ng-invalid]': 'cd.control?.valid == false'
      }
    }
  }

  constructor(
    cd: NgFormControl,
    elementRef: ElementRef,
    renderer: Renderer
  ) {
    this.domElement = elementRef.domElement
    this.elementRef = elementRef;
    this.renderer = renderer;

    this.change = new EventEmitter('change');
    this.input = new EventEmitter('input');

    this.cd = cd;

    this.buttons = [];
  }

  onInit() {
    Segment.applyConfig(this);
  }

  /**
   * Called by child SegmentButtons to bind themselves to
   * the Segment.
   */
  register(segmentButton) {
    this.buttons.push(segmentButton);

    // If this button is registered and matches our value,
    // make sure to select it
    if(this.value == segmentButton.value) {
      this.selected(segmentButton);
    }
  }

  /**
   * Select the button with the given value.
   */
  selectFromValue(value) {
    for(let button of this.buttons) {
      if(button.value === value) {
        button.isActive = true;
      }
    }
  }

  /**
   * Indicate a button should be selected.
   */
  selected(segmentButton) {
    for(let button of this.buttons) {
      button.setActive(false);
    }
    segmentButton.setActive(true);

    //this.onChange();


    setTimeout(() => {
      this.value = segmentButton.value;
      this.cd.valueAccessor.writeValue(segmentButton.value);
      this.selectFromValue(segmentButton.value);

      this.cd.form.updateValue(segmentButton.value);

      // Trigger on change
      this.change.next();
    })


    //this.ngControl.control().updateValue(this.value);
    // TODO: Better way to do this?
    //this.controlDirective._control().updateValue(this.value);
  }
}


@Directive({
  selector: 'ion-segment-button',
  properties: [
    'value'
  ],
  host: {
    '(click)': 'buttonClicked($event)',
    '[class.active]': 'isActive'
  },
  lifecycle: [onInit]
})
export class SegmentButton {
  constructor(
    @Ancestor() segment: Segment,
    elementRef: ElementRef
  ) {
    this.domElement = elementRef.domElement
    this.segment = segment;
  }

  onInit() {
    this.segment.register(this);
  }

  setActive(isActive) {
    this.isActive = isActive;
  }

  buttonClicked(event) {
    this.segment.selected(this, event);
    event.preventDefault();
  }

}
