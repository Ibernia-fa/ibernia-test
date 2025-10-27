import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AiRecommendationsModel } from '../models/ai-recommendations.model';
import { T } from '@angular/cdk/keycodes';

@Injectable({
  providedIn: 'root'
})
export class AiRecommendationsHttpService {
  constructor(private httpClient: HttpClient) { }

}

