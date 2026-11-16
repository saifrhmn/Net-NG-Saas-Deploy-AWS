import { Component, Input, Output, EventEmitter, OnInit, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-typeable-selection-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule
  ],
  templateUrl: './typeable-selection-dropdown.component.html',
  styleUrl: './typeable-selection-dropdown.component.scss'
})
export class TypeableSelectionDropdownComponent implements OnInit, OnChanges {
  @Input() label: string = 'Choose Option';
  @Input() placeholder: string = 'Type to search...';
  @Input() options: any[] = [];
  @Input() displayProperty: string = 'name';
  @Input() valueProperty: string = 'id';
  @Input() selectedValue: any = null;
  @Input() cssClass: string = 'category-dropdown';
  
  @Output() selectionChanged = new EventEmitter<any>();
  @Output() searchChanged = new EventEmitter<string>();
  
  filteredOptions: any[] = [];
  searchText: string = '';
  selectedDisplay: string = '';

  ngOnInit() {
    this.filteredOptions = this.options;
  }

  // ngOnChanges(changes: SimpleChanges) {
  //   if (changes['options'] && this.options) {
  //     this.filteredOptions = this.options;
  //   }
    
  //   // Clear searchText when selectedValue is cleared (empty string or null)
  //   if (changes['selectedValue']) {
  //     if (!this.selectedValue || this.selectedValue === '' || this.selectedValue === 'all') {
  //       this.searchText = '';
  //       this.selectedDisplay = '';
  //     }
  //   }
  // }

  ngOnChanges(changes: SimpleChanges) {
  if (changes['options'] && this.options) {
    this.filteredOptions = this.options;
  }
  
  if (changes['selectedValue']) {
    if (!this.selectedValue || this.selectedValue === '' || this.selectedValue === 'all') {
      // Clear searchText when selectedValue is cleared
      this.searchText = '';
      this.selectedDisplay = '';
    } else {
      // Populate the input with the incoming value (name) when set from parent
      this.searchText = this.selectedValue;
      this.selectedDisplay = this.selectedValue;
    }
  }
}

  // Maps the selected option value (e.g. id) back to its display text for the input
  displayFn = (value: any): string => {
    if (value === null || value === undefined) return '';
    const match = this.options?.find(o => o[this.valueProperty] === value);
    return match ? match[this.displayProperty] : value;
  };

  onSearch(searchValue: string) {
    this.searchText = searchValue;
    this.searchChanged.emit(searchValue);
    
    const query = (searchValue || '').toLowerCase().trim();
    
    if (query === '') {
      this.filteredOptions = this.options;
    } else {
      this.filteredOptions = this.options.filter(option =>
        option[this.displayProperty]?.toLowerCase().includes(query)
      );
    }
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent) {
    const selectedOption = event.option;
    const value = selectedOption.value;
    const display = selectedOption.viewValue;
    
    this.selectedValue = value;
    this.selectedDisplay = display;
    this.searchText = display;
    
    this.selectionChanged.emit({
      value: value,
      display: display,
      fullObject: this.options.find(o => o[this.valueProperty] === value)
    });
  }
}
