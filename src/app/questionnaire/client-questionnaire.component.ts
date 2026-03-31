import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  host: {
    class: 'questionnaire-route-host',
    style: 'display: block; min-height: 100vh; min-height: 100dvh;',
  },
})
export class ClientQuestionnaireComponent implements OnInit, OnDestroy {
  token = '';
  clientName = '';
  advisorId = '';
  advisorName = '';
  advisorFirstName = '';
  advisorPhoto = '';
  advisorBio = '';
  currencySymbol = '';
  questions: QuestionModel[] = [];
  showIntro = true;
  introFadingOut = false;
  isSubmitting = false;
  submitted = false;
  /** After smooth scroll to success, blocks scrolling back to prior sections. */
  private successViewLocked = false;
  errorMessage = '';

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
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.onDocumentKeydownCapture, { capture: true });
    if (this.wheelIdleTimer != null) {
      clearTimeout(this.wheelIdleTimer);
      this.wheelIdleTimer = null;
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.minTimeElapsed = true;
      this.dismissIntroIfReady();
    }, 5000);

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
        this.advisorBio = data?.bio || '';
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
    setTimeout(() => {
      this.showIntro = false;
      setTimeout(() => {
        this.onScroll();
        this.setupTouchScrolling();
      }, 50);
    }, 500);
  }

  initResponses(): void {
    this.importantPeople = [{ name: '', relationship: '' }];
    this.othersByQuestion = {};
    this.financialPlanningByQuestion = {};
    this.responses = {};
  }

  /* ─── Scroll tracking & progress ─── */

  private touchStartY = 0;
  /**
   * One section change per wheel *burst*: trackpads emit many wheel events in one flick. A fixed ms gap
   * still allows N steps in a long gesture; instead, consume one step per burst and reset after wheel
   * goes quiet briefly.
   */
  private wheelBurstConsumed = false;
  private wheelIdleTimer: ReturnType<typeof setTimeout> | null = null;
  /** Quiet period after last wheel before a new burst can advance a section; keep > inter-packet noise, low enough to feel instant. */
  private readonly WHEEL_BURST_IDLE_MS = 90;
  /**
   * While a burst is consumed, only "strong" wheel deltas prolong the idle deadline; weak tail packets
   * would otherwise keep resetting the idle timer for seconds. Tune above typical decay, below new-flick peaks.
   */
  private readonly WHEEL_BURST_EXTEND_MIN_NORM = 36;
  /**
   * After burst idle, ignore section steps from medium deltas still in the same momentum tail until
   * this window ends or a clearly new flick (|norm| >= STRONG_MIN) occurs.
   */
  private readonly WHEEL_POST_BURST_GATE_MS = 900;
  private readonly WHEEL_POST_BURST_STRONG_MIN = 48;
  private wheelPostBurstGateUntil = 0;

  /** Capture-phase: run before browser applies arrow-key scroll to .snap-container / section-inner. */
  private readonly onDocumentKeydownCapture = (event: KeyboardEvent): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    if (this.showIntro || this.errorMessage) return;
    if (this.submitted) {
      event.preventDefault();
      return;
    }
    if (this.keyboardArrowTargetNeedsDefault(event)) return;

    event.preventDefault();
    if (event.repeat) return;
    this.tryStep(event.key === 'ArrowDown' ? 1 : -1);
  };

  get totalSections(): number {
    const staticSections = this.advisorBio ? 5 : 4;
    return this.questions.length + staticSections + (this.submitted ? 1 : 0);
  }

  /** First snap-section index that maps to `questions[0]`. */
  get firstQuestionSectionIndex(): number {
    return this.advisorBio ? 4 : 3;
  }

  get submitSectionIndex(): number {
    return this.firstQuestionSectionIndex + this.questions.length;
  }

  onScroll(): void {
    const el = this.snapContainer?.nativeElement;
    if (!el) return;

    const sectionHeight = el.clientHeight;
    const maxScroll = el.scrollHeight - sectionHeight;

    if (this.submitted && this.successViewLocked && maxScroll > 0 && el.scrollTop < maxScroll - 2) {
      el.scrollTop = maxScroll;
      return;
    }

    if (maxScroll > 0) {
      this.currentIndex = Math.round(el.scrollTop / sectionHeight);
      this.progressPercent = (el.scrollTop / maxScroll) * 100;
    }
  }

  get isLastSection(): boolean {
    if (this.submitted) return true;
    const lastIndex = this.totalSections - 1;
    return this.currentIndex >= lastIndex || this.progressPercent >= 98;
  }

  onSwipeUpClick(): void {
    if (this.currentIndex === 0) {
      this.tryStep(1);
    } else {
      this.tryStep(-1);
    }
  }

  /** Snap to section index instantly (full viewport per section). */
  private scrollToSection(index: number): void {
    const el = this.snapContainer?.nativeElement;
    if (!el) return;

    const last = this.totalSections - 1;
    const clamped = this.submitted ? last : Math.max(0, Math.min(index, last));
    const targetTop = el.clientHeight * clamped;
    el.scrollTop = targetTop;
    this.onScroll();
  }

  /**
   * Move one section in the given direction. Returns true if the view actually changed.
   */
  tryStep(direction: 1 | -1): boolean {
    if (this.showIntro || this.errorMessage) return false;

    if (this.submitted) {
      if (!this.successViewLocked) return false;
      if (direction < 0) return false;
      return false;
    }

    const el = this.snapContainer?.nativeElement;
    if (!el) return false;

    const last = this.totalSections - 1;
    let target = this.currentIndex + direction;
    target = Math.max(0, Math.min(target, last));
    if (target === this.currentIndex) return false;

    if (direction > 0) {
      if (this.currentIndex >= this.submitSectionIndex) {
        return false;
      }
      if (!this.canLeaveSection(this.currentIndex)) {
        this.toastr.warning(
          this.translate.instant('Please answer this question before continuing.'),
        );
        return false;
      }
    }

    this.scrollToSection(target);
    return true;
  }

  private canLeaveSection(sectionIndex: number): boolean {
    if (sectionIndex < this.firstQuestionSectionIndex) {
      return true;
    }
    if (sectionIndex >= this.submitSectionIndex) {
      return true;
    }
    const qi = sectionIndex - this.firstQuestionSectionIndex;
    const q = this.questions[qi];
    return q ? this.isQuestionAnswered(q) : true;
  }

  private isQuestionAnswered(q: QuestionModel): boolean {
    switch (q.type) {
      case 'ImportantPeople':
      case 'FinancialPlanningImprovement':
        return true;
      case 'Goals': {
        const selected = (this.responses[`goals_${q.id}`] as string[]) || [];
        if (selected.length === 0) return false;
        if (selected.includes('Other')) {
          return !!this.othersByQuestion[`goals_${q.id}`]?.trim();
        }
        return true;
      }
      case 'AreasOfWorry': {
        const selected = (this.responses[`worry_${q.id}`] as string[]) || [];
        if (selected.length === 0) return false;
        if (selected.includes('Other')) {
          return !!this.othersByQuestion[`worry_${q.id}`]?.trim();
        }
        return true;
      }
      case 'InvestableAssets':
      case 'InvestmentApproach':
        return !!this.getSingleSelect(q.id)?.trim();
      default:
        return true;
    }
  }

  private normalizeWheelDeltaY(e: WheelEvent): number {
    let y = e.deltaY;
    if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      y *= 16;
    } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      const el = this.snapContainer?.nativeElement;
      y *= el?.clientHeight ?? 400;
    }
    return y;
  }

  private findScrollableAncestor(el: HTMLElement | null, stopAt: HTMLElement): HTMLElement | null {
    let node: HTMLElement | null = el;
    while (node && node !== stopAt) {
      const style = getComputedStyle(node);
      const oy = style.overflowY;
      const scrollable =
        (oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1;
      if (scrollable) return node;
      node = node.parentElement;
    }
    return null;
  }

  /** Let the browser scroll inner overflow (e.g. long question card) before changing sections. */
  private shouldDelegateWheelToInnerScroll(e: WheelEvent): boolean {
    const container = this.snapContainer?.nativeElement;
    if (!container) return false;
    const scrollable = this.findScrollableAncestor(e.target as HTMLElement, container);
    if (!scrollable) return false;
    const delta = this.normalizeWheelDeltaY(e);
    const max = scrollable.scrollHeight - scrollable.clientHeight;
    if (delta > 0 && scrollable.scrollTop < max - 1) return true;
    if (delta < 0 && scrollable.scrollTop > 1) return true;
    return false;
  }

  private scheduleWheelBurstEnd(): void {
    if (this.wheelIdleTimer != null) {
      clearTimeout(this.wheelIdleTimer);
    }
    this.wheelIdleTimer = setTimeout(() => {
      this.wheelIdleTimer = null;
      const wasConsumed = this.wheelBurstConsumed;
      this.wheelBurstConsumed = false;
      if (wasConsumed) {
        this.wheelPostBurstGateUntil = Date.now() + this.WHEEL_POST_BURST_GATE_MS;
      }
    }, this.WHEEL_BURST_IDLE_MS);
  }

  /** Reschedule burst-idle timer only when the packet should extend the "same gesture" window. */
  private maybeRescheduleWheelBurstEnd(absNorm: number): void {
    const inPostGate = Date.now() < this.wheelPostBurstGateUntil;
    const strongEnough = absNorm >= this.WHEEL_BURST_EXTEND_MIN_NORM;
    const shouldSchedule =
      (this.wheelBurstConsumed && strongEnough) ||
      (!this.wheelBurstConsumed && (!inPostGate || strongEnough));
    if (shouldSchedule) {
      this.scheduleWheelBurstEnd();
    }
  }

  private onSnapWheel(e: WheelEvent): void {
    const container = this.snapContainer?.nativeElement;
    if (!container) return;

    if (this.showIntro || this.errorMessage) return;

    if (this.submitted) {
      e.preventDefault();
      return;
    }

    const delegate = this.shouldDelegateWheelToInnerScroll(e);
    const norm = this.normalizeWheelDeltaY(e);

    if (delegate) {
      return;
    }

    e.preventDefault();
    this.maybeRescheduleWheelBurstEnd(Math.abs(norm));

    if (this.wheelBurstConsumed) {
      return;
    }

    if (Math.abs(norm) < 10) {
      return;
    }

    const now = Date.now();
    if (now < this.wheelPostBurstGateUntil && Math.abs(norm) < this.WHEEL_POST_BURST_STRONG_MIN) {
      return;
    }

    this.wheelBurstConsumed = true;
    const dir = norm > 0 ? 1 : -1;
    this.tryStep(dir);
  }

  private setupTouchScrolling(): void {
    const el = this.snapContainer?.nativeElement;
    if (!el) return;

    el.addEventListener('touchstart', (e: TouchEvent) => {
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    el.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.isInsideScrollableChild(e.target as HTMLElement)) {
        e.preventDefault();
      }
    }, { passive: false });

    el.addEventListener('touchend', (e: TouchEvent) => {
      if (this.showIntro || this.errorMessage) return;
      if (this.submitted && !this.successViewLocked) return;

      const deltaY = this.touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) <= 40) return;

      const dir = deltaY > 0 ? 1 : -1;
      this.tryStep(dir);
    }, { passive: true });

    el.addEventListener('wheel', (e: WheelEvent) => this.onSnapWheel(e), {
      passive: false,
      capture: true,
    });

    document.addEventListener('keydown', this.onDocumentKeydownCapture, { capture: true });
  }

  /**
   * When true, ArrowUp/Down keep browser/Material default (inputs, select panels, overlays).
   * Uses activeElement: keydown.target is often document.body (not inside #snapContainer), which
   * incorrectly skipped preventDefault and caused line-by-line scrolling.
   */
  private keyboardArrowTargetNeedsDefault(event: KeyboardEvent): boolean {
    const root = this.snapContainer?.nativeElement;
    if (!root) return true;

    const rawTarget = event.target as HTMLElement | null;
    const ae = document.activeElement as HTMLElement | null;

    if (
      rawTarget?.closest?.('.cdk-overlay-container') ||
      ae?.closest?.('.cdk-overlay-container')
    ) {
      return true;
    }

    let node: HTMLElement | null = null;
    if (ae && root.contains(ae)) {
      node = ae;
    } else if (rawTarget && root.contains(rawTarget)) {
      node = rawTarget;
    } else if (
      rawTarget === document.body ||
      rawTarget === document.documentElement ||
      ae === document.body ||
      ae === document.documentElement
    ) {
      // Clicks on non-focusable UI leave focus on body; arrows should still do section steps.
      return false;
    } else {
      return true;
    }

    const tag = node.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'INPUT') {
      const type = (node as HTMLInputElement).type?.toLowerCase() ?? '';
      // Text-like fields need arrow keys for caret; radio/checkbox must NOT opt into default —
      // otherwise focus stays on the chip/option after click and ArrowUp/Down scroll .section-inner
      // pixel-by-pixel instead of changing section.
      if (
        type === 'text' ||
        type === 'search' ||
        type === 'email' ||
        type === 'url' ||
        type === 'tel' ||
        type === 'number'
      ) {
        return true;
      }
    }
    if (tag === 'MAT-SELECT' || tag === 'MAT-OPTION') return true;

    if (node.isContentEditable) return true;

    let walk: HTMLElement | null = node;
    while (walk) {
      if (walk.classList.contains('important-people')) return true;
      if (walk.classList.contains('chip-list-scrollable')) return true;
      walk = walk.parentElement;
    }

    return false;
  }

  private isInsideScrollableChild(target: HTMLElement): boolean {
    let el: HTMLElement | null = target;
    const container = this.snapContainer?.nativeElement;
    while (el && el !== container) {
      const tag = el.tagName;
      if (tag === 'TEXTAREA' || tag === 'MAT-SELECT') return true;
      if (tag === 'INPUT' && (el as HTMLInputElement).type === 'text') return true;
      if (el.classList.contains('important-people')) return true;
      if (el.classList.contains('chip-list-scrollable')) return true;
      el = el.parentElement;
    }
    return false;
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

  private readonly exclusiveOptions = ['None of the above'];

  toggleGoal(questionId: string, option: string): void {
    const key = `goals_${questionId}`;
    let arr = (this.responses[key] as string[]) || [];
    const isExclusive = this.exclusiveOptions.includes(option);

    if (arr.includes(option)) {
      arr = arr.filter((o) => o !== option);
    } else if (isExclusive) {
      arr = [option];
    } else {
      arr = [...arr.filter((o) => !this.exclusiveOptions.includes(o)), option];
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
    const isExclusive = this.exclusiveOptions.includes(option);

    if (arr.includes(option)) {
      arr = arr.filter((o) => o !== option);
    } else if (isExclusive) {
      arr = [option];
    } else {
      arr = [...arr.filter((o) => !this.exclusiveOptions.includes(o)), option];
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
    if (this.isSubmitting || this.submitted) {
      return;
    }
    this.isSubmitting = true;
    this.cdr.detectChanges();

    const payload = { responses: this.buildSubmitPayload() };

    this.questionnaireHttpService.submit(this.token, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitted = true;
        this.successViewLocked = false;

        setTimeout(() => {
          const el = this.snapContainer?.nativeElement;
          if (el) {
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
          }
          this.progressPercent = 100;
        }, 50);

        setTimeout(() => {
          this.successViewLocked = true;
          const el = this.snapContainer?.nativeElement;
          if (el) {
            const maxScroll = el.scrollHeight - el.clientHeight;
            if (maxScroll > 0 && el.scrollTop < maxScroll - 2) {
              el.scrollTop = maxScroll;
            }
          }
        }, 900);
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = typeof err.error === 'string' ? err.error : 'Failed to submit. Please try again.';
        this.toastr.error(msg);
      },
    });
  }
}
