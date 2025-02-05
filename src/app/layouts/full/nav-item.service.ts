import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavItemService {

  currentRouteName: string = ''
  constructor() { }
}
