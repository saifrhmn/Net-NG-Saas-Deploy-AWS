import { ChangeDetectionStrategy, Component, forwardRef, Input, OnInit } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [
    FormsModule,
    MatIcon,
    MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent implements OnInit {

  @Input() label!: string;
  @Input() id: string = '';
  @Input() class: string = 'w-100';
  @Input() name!: string;
  // @Input() options: any[] = [];
  @Input() optionLabel: string = 'label';
  @Input() optionValue: string = 'value';
  @Input() placeholder: string = '';
  @Input() errorMessage: string = 'This field is required';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() multiple: boolean = false;
  @Input() searchable: boolean = false;

  value: any;
  searchText: string = '';
  filteredOptions: any[] = [];

  private _options: any[] = [];

  @Input()
  set options(value: any[]) {
    this._options = value || [];
    this.filteredOptions = [...this._options]; // ✅ update filtered list when options change
  }
  get options(): any[] {
    return this._options;
  }

  constructor() { }

  ngOnInit(): void {
    this.filteredOptions = this.options;
  }

  onChange = (_: any) => { };
  onTouched = () => { };

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // optional
  }

  onSelectionChange(event: any) {
    if (this.multiple) {
      const selected = event.value;

      const allSelected = selected.includes('All');

      if (allSelected) {
        // Select all real values, including 'All'
        const allValues = this.filteredOptions.map(opt => opt[this.optionValue]);
        this.value = ['All'];
      } else {
        // Deselect "All" if user unselects any item
        this.value = selected.filter((v: any) => v !== 'All');
      }
    } else {
      this.value = event.value;
    }

    this.onChange(this.value);
  }

  filterOptions() {
    const search = this.searchText.toLowerCase();
    this.filteredOptions = this.options.filter(opt =>
      opt[this.optionLabel].toLowerCase().includes(search)
    );
  }

  clearSearch() {
    this.searchText = '';
    this.filteredOptions = [...this.options]; // Reset to original options
  }
}
