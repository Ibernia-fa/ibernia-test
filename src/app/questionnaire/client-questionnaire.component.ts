import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule } from '@ngx-translate/core';
import {
  QuestionnaireHttpService,
  QuestionModel,
  QuestionnaireResponseItem,
} from '../clients/services/questionnaire-http.service';

@Component({
  selector: 'app-client-questionnaire',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './client-questionnaire.component.html',
  styleUrl: './client-questionnaire.component.scss',
})
export class ClientQuestionnaireComponent implements OnInit {
  token = '';
  clientName = '';
  advisorName = '';
  questions: QuestionModel[] = [];
  isLoaderVisible = true;
  isSubmitting = false;
  submitted = false;
  errorMessage = '';

  responses: Record<string, unknown> = {};

  importantPeople: { name: string; relationship: string }[] = [{ name: '', relationship: '' }];
  othersByQuestion: Record<string, string> = {};
  financialPlanningByQuestion: Record<string, string> = {};

  constructor(
    private route: ActivatedRoute,
    private questionnaireHttpService: QuestionnaireHttpService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.token = params['token'];
      if (this.token) {
        this.loadQuestionnaire();
      } else {
        this.errorMessage = 'Invalid or missing link';
        this.isLoaderVisible = false;
      }
    });
  }

  loadQuestionnaire(): void {
    this.questionnaireHttpService.getByToken(this.token).subscribe({
      next: (data) => {
        this.clientName = data.clientName;
        this.advisorName = data.advisorName;
        this.questions = data.questions;
        this.initResponses();
        this.isLoaderVisible = false;
      },
      error: (err) => {
        this.isLoaderVisible = false;
        this.errorMessage = err.status === 410 || err.error ? (err.error || 'This link has expired or is no longer valid') : 'Unable to load questionnaire';
      },
    });
  }

  initResponses(): void {
    this.importantPeople = [{ name: '', relationship: '' }];
    this.othersByQuestion = {};
    this.financialPlanningByQuestion = {};
    this.responses = {};
  }

  addImportantPerson(): void {
    this.importantPeople.push({ name: '', relationship: '' });
  }

  removeImportantPerson(index: number): void {
    if (this.importantPeople.length > 1) {
      this.importantPeople.splice(index, 1);
    }
  }

  getImportantPeopleValue(): { name: string; relationship: string }[] {
    return this.importantPeople.filter((p) => p.name?.trim());
  }

  toggleGoal(questionId: string, option: string): void {
    const key = `goals_${questionId}`;
    let arr = (this.responses[key] as string[]) || [];
    if (arr.includes(option)) {
      arr = arr.filter((o) => o !== option);
    } else {
      arr = [...arr, option];
    }
    this.responses[key] = arr;
  }

  isGoalSelected(questionId: string, option: string): boolean {
    const arr = (this.responses[`goals_${questionId}`] as string[]) || [];
    return arr.includes(option);
  }

  toggleWorry(questionId: string, option: string): void {
    const key = `worry_${questionId}`;
    let arr = (this.responses[key] as string[]) || [];
    if (arr.includes(option)) {
      arr = arr.filter((o) => o !== option);
    } else {
      arr = [...arr, option];
    }
    this.responses[key] = arr;
  }

  isWorrySelected(questionId: string, option: string): boolean {
    const arr = (this.responses[`worry_${questionId}`] as string[]) || [];
    return arr.includes(option);
  }

  setSingleSelect(questionId: string, value: string): void {
    this.responses[questionId] = value;
  }

  getSingleSelect(questionId: string): string {
    return (this.responses[questionId] as string) || '';
  }

  buildSubmitPayload(): QuestionnaireResponseItem[] {
    const items: QuestionnaireResponseItem[] = [];

    for (const q of this.questions) {
      switch (q.type) {
        case 'ImportantPeople': {
          const people = this.getImportantPeopleValue();
          items.push({ questionId: q.id, type: q.type, value: people });
          break;
        }
        case 'Goals': {
          const selected = (this.responses[`goals_${q.id}`] as string[]) || [];
          const others = this.othersByQuestion[`goals_${q.id}`]?.trim();
          items.push({
            questionId: q.id,
            type: q.type,
            value: { selected, others: others || undefined },
          });
          break;
        }
        case 'InvestableAssets':
        case 'InvestmentApproach':
          items.push({
            questionId: q.id,
            type: q.type,
            value: this.getSingleSelect(q.id),
          });
          break;
        case 'AreasOfWorry': {
          const selected = (this.responses[`worry_${q.id}`] as string[]) || [];
          const others = this.othersByQuestion[`worry_${q.id}`]?.trim();
          items.push({
            questionId: q.id,
            type: q.type,
            value: { selected, others: others || undefined },
          });
          break;
        }
        case 'FinancialPlanningImprovement':
          items.push({
            questionId: q.id,
            type: q.type,
            value: this.financialPlanningByQuestion[q.id]?.trim() || '',
          });
          break;
      }
    }

    return items;
  }

  onSubmit(): void {
    this.isSubmitting = true;
    const payload = { responses: this.buildSubmitPayload() };

    this.questionnaireHttpService.submit(this.token, payload).subscribe({
      next: () => {
        this.submitted = true;
        this.isSubmitting = false;
        this.toastr.success('Thank you! Your responses have been shared with your advisor.');
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toastr.error(err.error || 'Failed to submit. Please try again.');
      },
    });
  }
}
