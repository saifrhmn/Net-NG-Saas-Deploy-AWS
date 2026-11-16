import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [
    FormsModule,
    MatIcon,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements OnInit {

  @Input() label: string = '';
  @Input() name: string = '';
  @Input() id: string = '';
  @Input() class: string = 'w-100';
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() errorMessage: string = 'Invalid input';
  @Input() readonly: boolean = false;
  @Input() autocomplete: string = 'off';

  value: string = '';

  constructor() { }

  ngOnInit() {
  }

  // The function signature for the ControlValueAccessor interface
  onChange: (value: any) => void = () => { };
  onTouched: () => void = () => { };

  // Write value to the input field
  writeValue(value: any): void {
    if (value !== undefined) {
      this.value = value;  // Set the value to the input
    }
  }

  // Register onChange function
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  // Register onTouched function
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // This can be used to disable the input field
  setDisabledState(isDisabled: boolean): void {
    // You can manage input's disabled state here
  }

  // Handle value change and trigger onChange
  onInputChange(event: any): void {
    this.onChange(this.value);
  }

  // onInput(event: Event) {
  //   const input = event.target as HTMLInputElement;
  //   this.value = input.value;
  // }
}
