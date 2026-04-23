import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface QuestionOptionDto {
  value: string;
  iconUrl: string;
}

export interface QuestionModel {
  id: string;
  text: string;
  subtitle: string;
  type: string;
  order: number;
  options: QuestionOptionDto[];
}

export interface CreateQuestionnaireLinkRequest {
  clientId: string;
  advisorId: string;
  questionIds: string[];
  /** Appended as ?lang= on the public questionnaire URL (e.g. en, it). */
  locale?: string;
}

export interface CreateQuestionnaireLinkResponse {
  token: string;
  shareableUrl: string;
  expiryDate: string;
}

export interface GetQuestionnaireByTokenResponse {
  clientName: string;
  advisorId: string;
  advisorName: string;
  profilePhotoUrl?: string;
  bio?: string;
  currency?: string;
  questions: QuestionModel[];
}

export interface QuestionnaireResponseItem {
  questionId: string;
  questionText?: string;
  type: string;
  value: unknown;
  /** Maps selected option value to icon URL (from DB) for Goals and AreasOfWorry */
  optionIcons?: Record<string, string>;
}

export interface SubmitQuestionnaireRequest {
  responses: QuestionnaireResponseItem[];
}

export interface GetClientQuestionnaireResponse {
  clientId: string;
  advisorId: string;
  advisorName: string;
  profilePhotoUrl?: string;
  currency?: string;
  submittedAt: string;
  responses: QuestionnaireResponseItem[];
}

@Injectable({
  providedIn: 'root'
})
export class QuestionnaireHttpService {
  readonly BASE_URL = '/api/v1/Questionnaire';

  constructor(private httpClient: HttpClient) {}

  getQuestions() {
    return this.httpClient.get<QuestionModel[]>(`${this.BASE_URL}/questions`);
  }

  createLink(request: CreateQuestionnaireLinkRequest) {
    return this.httpClient.post<CreateQuestionnaireLinkResponse>(
      `${this.BASE_URL}/create`,
      { ...request, questionIds: request.questionIds }
    );
  }

  sendToClient(request: CreateQuestionnaireLinkRequest) {
    return this.httpClient.post<CreateQuestionnaireLinkResponse>(
      `${this.BASE_URL}/send-to-client`,
      { ...request, questionIds: request.questionIds }
    );
  }

  getByToken(token: string) {
    return this.httpClient.get<GetQuestionnaireByTokenResponse>(
      `${this.BASE_URL}/view/${token}`
    );
  }

  submit(token: string, request: SubmitQuestionnaireRequest) {
    return this.httpClient.post<{ message: string }>(
      `${this.BASE_URL}/submit/${token}`,
      request
    );
  }

  getClientResponses(clientId: string) {
    return this.httpClient.get<GetClientQuestionnaireResponse>(
      `${this.BASE_URL}/client/${clientId}`
    );
  }
}
