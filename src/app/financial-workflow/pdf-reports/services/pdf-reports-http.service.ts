import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PdfReportsModel } from '../models/pdf-reports.model';
import { T } from '@angular/cdk/keycodes';

@Injectable({
  providedIn: 'root'
})
export class PdfReportsHttpService {
  constructor(private httpClient: HttpClient) { }

}

