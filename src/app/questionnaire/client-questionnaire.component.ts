import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
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
import { allCountries } from '../clients/models/country';

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
  advisorId = '';
  advisorName = '';
  advisorFirstName = '';
  advisorPhoto = '';
  currencySymbol = '';
  questions: QuestionModel[] = [];
  showIntro = true;
  introFadingOut = false;
  isSubmitting = false;
  submitted = false;
  showBubbles = false;
  errorMessage = '';
  bubbleCount = Array.from({ length: 30 });

  private dataReady = false;
  private minTimeElapsed = false;

  responses: Record<string, unknown> = {};

  importantPeople: { name: string; relationship: string }[] = [{ name: '', relationship: '' }];
  othersByQuestion: Record<string, string> = {};
  financialPlanningByQuestion: Record<string, string> = {};

  currentIndex = 0;
  progressPercent = 0;

  @ViewChild('snapContainer') snapContainer!: ElementRef<HTMLDivElement>;

  constructor(
    private route: ActivatedRoute,
    private questionnaireHttpService: QuestionnaireHttpService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.minTimeElapsed = true;
      this.dismissIntroIfReady();
    }, 2000);

    this.route.params.subscribe((params) => {
      this.token = params['token'];
      if (this.token) {
        this.loadQuestionnaire();
      } else {
        this.errorMessage = 'Invalid or missing link';
        this.dataReady = true;
        this.dismissIntroIfReady();
      }
    });
  }

  loadQuestionnaire(): void {
    this.questionnaireHttpService.getByToken(this.token).subscribe({
      next: (data) => {
        this.clientName = data.clientName;
        this.advisorId = data.advisorId;
        this.advisorName = data.advisorName;
        this.advisorFirstName = data.advisorName?.split(' ')[0] || data.advisorName;
        this.advisorPhoto = data?.profilePhotoUrl || '';
        this.currencySymbol = this.resolveCurrencySymbol(data?.currency);
        this.questions = data.questions;
        this.initResponses();
        this.dataReady = true;
        this.dismissIntroIfReady();
      },
      error: (err) => {
        this.errorMessage = err.status === 410 || err.error ? (err.error || 'This link has expired or is no longer valid') : 'Unable to load questionnaire';
        this.dataReady = true;
        this.dismissIntroIfReady();
      },
    });
  }

  private dismissIntroIfReady(): void {
    if (!this.dataReady || !this.minTimeElapsed) return;
    this.introFadingOut = true;
    setTimeout(() => { this.showIntro = false; }, 500);
  }

  initResponses(): void {
    this.importantPeople = [{ name: '', relationship: '' }];
    this.othersByQuestion = {};
    this.financialPlanningByQuestion = {};
    this.responses = {};
  }

  /* ─── Scroll tracking & progress ─── */

  onScroll(): void {
    const el = this.snapContainer?.nativeElement;
    if (!el) return;

    const sectionHeight = el.clientHeight;
    const maxScroll = el.scrollHeight - sectionHeight;

    if (maxScroll > 0) {
      this.currentIndex = Math.round(el.scrollTop / sectionHeight);
      this.progressPercent = (el.scrollTop / maxScroll) * 100;
    }
  }

  scrollToSection(index: number): void {
    const el = this.snapContainer?.nativeElement;
    if (!el) return;

    const totalSections = this.questions.length + 5 + (this.submitted ? 1 : 0);
    const clamped = Math.max(0, Math.min(index, totalSections - 1));
    el.scrollTo({ top: el.clientHeight * clamped, behavior: 'smooth' });
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.submitted || this.showIntro || this.errorMessage) return;

    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.scrollToSection(this.currentIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.scrollToSection(this.currentIndex - 1);
    }
  }

  /* ─── ImportantPeople helpers ─── */

  addImportantPerson(): void {
    this.importantPeople.push({ name: '', relationship: '' });
  }

  removeImportantPerson(index: number): void {
    this.importantPeople.splice(index, 1);
  }

  getImportantPeopleValue(): { name: string; relationship: string }[] {
    return this.importantPeople.filter((p) => p.name?.trim());
  }

  /* ─── Goals helpers ─── */

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

  /* ─── AreasOfWorry helpers ─── */

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

  /* ─── Currency helpers ─── */

  private resolveCurrencySymbol(code?: string): string {
    if (!code) return '';
    const country = allCountries.find(c => c.currencySymbol === code);
    return country?.symbol || code;
  }

  formatAssetOption(option: string): string {
    if (!this.currencySymbol) return option;
    return option.replace(/\d[\d,]*(\.\d+)?/g, (match) => `${this.currencySymbol}${match}`);
  }

  /* ─── Single-select helpers ─── */

  setSingleSelect(questionId: string, value: string): void {
    this.responses[questionId] = value;
  }

  getSingleSelect(questionId: string): string {
    return (this.responses[questionId] as string) || '';
  }

  /* ─── Submit ─── */

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
        this.isSubmitting = false;
        this.submitted = true;
        this.showBubbles = true;

        setTimeout(() => {
          const el = this.snapContainer?.nativeElement;
          if (el) {
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
          }
          this.progressPercent = 100;
        }, 50);

        setTimeout(() => { this.showBubbles = false; }, 3000);
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = typeof err.error === 'string' ? err.error : 'Failed to submit. Please try again.';
        this.toastr.error(msg);
      },
    });
  }
}
