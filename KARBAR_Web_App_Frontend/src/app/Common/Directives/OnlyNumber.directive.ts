import { Directive, HostListener } from '@angular/core';

@Directive({
	selector: '[appOnlyNumber]',
	standalone: true
})
export class OnlyNumberDirective {

	@HostListener('keydown', ['$event'])
	onKeyDown(event: KeyboardEvent) {
		const allowedKeys = [
			'Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete'
		];

		if (
			allowedKeys.indexOf(event.key) !== -1 ||
			(event.ctrlKey && ['a', 'c', 'v', 'x'].indexOf(event.key) !== -1)
		) {
			// Allow navigation and control keyss
			return;
		}

		// Allow digits (0-9)
		const isNumberKey = (event.key >= '0' && event.key <= '9');

		if (!isNumberKey) {
			event.preventDefault();
		}
	}

}
