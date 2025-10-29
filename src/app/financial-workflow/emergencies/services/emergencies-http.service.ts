import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EmergenciesModel } from '../models/emergencies.model';
import { T } from '@angular/cdk/keycodes';

@Injectable({
  providedIn: 'root'
})
export class EmergenciesHttpService {
  constructor(private httpClient: HttpClient) { }

}

