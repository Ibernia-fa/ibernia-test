import { Injectable } from '@angular/core';
import { Client } from '../models/client';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  public selectedClient: Client
  constructor() { }
}
