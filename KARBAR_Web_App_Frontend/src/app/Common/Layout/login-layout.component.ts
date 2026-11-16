import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-login-layout',
  standalone: true,
  imports: [
    RouterOutlet
  ],
  template: `
    <router-outlet />
  `
})
export class LoginLayoutComponent implements OnInit {

  

  constructor() { }

  ngOnInit() {
  }


}
