import {Directive, ElementRef, Input} from 'angular2/core';


/**
 * @name Option
 */
@Directive({
  selector: 'ion-option'
})
export class Option {
  private _checked: boolean = false;
  
  constructor(private _elementRef: ElementRef) {
    this._checked = false;
  }

  @Input() value: string;

  get checked() {
    return this._checked;
  }
  
  @Input()
  set checked(val: any) {
    this._checked = (val === 'true' || val === true || val === '');
  }

  get text() {
    return this._elementRef.nativeElement.textContent;
  }
}
