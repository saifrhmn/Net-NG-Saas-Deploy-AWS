import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberToWords',
  standalone: true
})
export class NumberToWordsPipe implements PipeTransform {

  private readonly ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five',
    'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
    'Fifteen', 'Sixteen', 'Seventeen',
    'Eighteen', 'Nineteen'
  ];

  private readonly tens = [
    '', '', 'Twenty', 'Thirty', 'Forty',
    'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  transform(value: number | string | null | undefined): string {

    if (value === null || value === undefined || value === '') {
      return '';
    }

    const amount = Number(value);

    if (isNaN(amount)) {
      return '';
    }

    if (amount === 0) {
      return 'Zero Taka Only';
    }

    const taka = Math.floor(amount);
    const paisa = Math.round((amount - taka) * 100);

    let result = this.convert(taka) + ' Taka';

    if (paisa > 0) {
      result += ' and ' + this.convert(paisa) + ' Paisa';
    }

    return result + ' Only';
  }

  private convert(num: number): string {

    if (num === 0) {
      return 'Zero';
    }

    return this.convertNumber(num).trim();
  }

  private convertNumber(num: number): string {

    if (num < 20) {
      return this.ones[num];
    }

    if (num < 100) {
      return this.tens[Math.floor(num / 10)] +
        (num % 10 ? ' ' + this.ones[num % 10] : '');
    }

    if (num < 1000) {
      return this.ones[Math.floor(num / 100)] + ' Hundred' +
        (num % 100 ? ' ' + this.convertNumber(num % 100) : '');
    }

    if (num < 1000000) {
      return this.convertNumber(Math.floor(num / 1000)) + ' Thousand' +
        (num % 1000 ? ' ' + this.convertNumber(num % 1000) : '');
    }

    if (num < 1000000000) {
      return this.convertNumber(Math.floor(num / 1000000)) + ' Million' +
        (num % 1000000 ? ' ' + this.convertNumber(num % 1000000) : '');
    }

    if (num < 1000000000000) {
      return this.convertNumber(Math.floor(num / 1000000000)) + ' Billion' +
        (num % 1000000000 ? ' ' + this.convertNumber(num % 1000000000) : '');
    }

    return this.convertNumber(Math.floor(num / 1000000000000)) + ' Trillion' +
      (num % 1000000000000 ? ' ' + this.convertNumber(num % 1000000000000) : '');
  }
}