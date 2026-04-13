import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

interface SchoolSlide {
  title: string;
  body: string;
}

interface SchoolModule {
  id: string;
  title: string;
  subtitle: string;
  slides: SchoolSlide[];
}

@Component({
  selector: 'app-school',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, TranslateModule],
  templateUrl: './school.component.html',
  styleUrl: './school.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolComponent {
  modules: SchoolModule[] = [];
  activeModule: SchoolModule | null = null;

  constructor(private translate: TranslateService) {
    this.modules = [
      {
        id: 'inflation',
        title: this.translate.instant('SCHOOL.INFLATION_TITLE'),
        subtitle: this.translate.instant('SCHOOL.INFLATION_SUBTITLE'),
        slides: [
          { title: this.translate.instant('SCHOOL.INFLATION_TITLE'), body: 'Intro placeholder: explain that prices tend to increase over time in most economies.' },
          { title: this.translate.instant('SCHOOL.CORE_CONCEPT'), body: 'Placeholder: a fixed amount of money buys fewer goods and services as prices rise.' },
          { title: this.translate.instant('SCHOOL.SIMPLE_EXAMPLE'), body: 'Placeholder: a coffee that cost 2€ a few years ago might cost 2.40€ today.' },
          { title: this.translate.instant('SCHOOL.WHY_IT_MATTERS'), body: 'Placeholder: long‑term plans must account for rising living costs.' },
          { title: this.translate.instant('SCHOOL.SUMMARY'), body: 'Placeholder: inflation slowly erodes purchasing power and needs to be built into plans.' },
        ],
      },
      {
        id: 'compound-interest',
        title: this.translate.instant('SCHOOL.COMPOUND_INTEREST_TITLE'),
        subtitle: this.translate.instant('SCHOOL.COMPOUND_INTEREST_SUBTITLE'),
        slides: [
          { title: this.translate.instant('SCHOOL.COMPOUND_INTEREST_TITLE'), body: 'Intro placeholder: returns can generate additional returns over time.' },
          { title: this.translate.instant('SCHOOL.CORE_CONCEPT'), body: 'Placeholder: interest is earned on both the original amount and past interest.' },
          { title: this.translate.instant('SCHOOL.SIMPLE_EXAMPLE'), body: 'Placeholder: 1,000€ growing at 5% per year increases faster each year.' },
          { title: this.translate.instant('SCHOOL.WHY_IT_MATTERS'), body: 'Placeholder: starting earlier gives compound growth more time to work.' },
          { title: this.translate.instant('SCHOOL.SUMMARY'), body: 'Placeholder: small differences in rate and time can lead to big outcomes.' },
        ],
      },
      {
        id: 'financial-crisis',
        title: this.translate.instant('SCHOOL.FINANCIAL_CRISIS_TITLE'),
        subtitle: this.translate.instant('SCHOOL.FINANCIAL_CRISIS_SUBTITLE'),
        slides: [
          { title: this.translate.instant('SCHOOL.FINANCIAL_CRISIS_TITLE'), body: 'Intro placeholder: markets can experience sharp, sudden falls.' },
          { title: this.translate.instant('SCHOOL.CORE_CONCEPT'), body: 'Placeholder: crises are usually caused by a shock to confidence or the system.' },
          { title: this.translate.instant('SCHOOL.SIMPLE_EXAMPLE'), body: 'Placeholder: describe a short, fictional market drop and recovery path.' },
          { title: this.translate.instant('SCHOOL.WHY_IT_MATTERS'), body: 'Placeholder: plans should assume that downturns occur from time to time.' },
          { title: this.translate.instant('SCHOOL.SUMMARY'), body: 'Placeholder: staying invested and diversified can help ride out crises.' },
        ],
      },
      {
        id: 'diversification',
        title: this.translate.instant('SCHOOL.DIVERSIFICATION_TITLE'),
        subtitle: this.translate.instant('SCHOOL.DIVERSIFICATION_SUBTITLE'),
        slides: [
          { title: this.translate.instant('SCHOOL.DIVERSIFICATION_TITLE'), body: 'Intro placeholder: avoid relying on a single investment or idea.' },
          { title: this.translate.instant('SCHOOL.CORE_CONCEPT'), body: 'Placeholder: different assets behave differently in various environments.' },
          { title: this.translate.instant('SCHOOL.SIMPLE_EXAMPLE'), body: 'Placeholder: a mix of assets can smooth the journey compared to just one.' },
          { title: this.translate.instant('SCHOOL.WHY_IT_MATTERS'), body: 'Placeholder: diversification can reduce the impact of any one setback.' },
          { title: this.translate.instant('SCHOOL.SUMMARY'), body: 'Placeholder: spreading risk supports more resilient long‑term planning.' },
        ],
      },
      {
        id: 'risk-and-return',
        title: this.translate.instant('SCHOOL.RISK_AND_RETURN_TITLE'),
        subtitle: this.translate.instant('SCHOOL.RISK_AND_RETURN_SUBTITLE'),
        slides: [
          { title: this.translate.instant('SCHOOL.RISK_AND_RETURN_TITLE'), body: 'Intro placeholder: higher potential returns usually come with higher risk.' },
          { title: this.translate.instant('SCHOOL.CORE_CONCEPT'), body: 'Placeholder: there is a trade‑off between stability and growth.' },
          { title: this.translate.instant('SCHOOL.SIMPLE_EXAMPLE'), body: 'Placeholder: compare a savings account with a diversified investment portfolio.' },
          { title: this.translate.instant('SCHOOL.WHY_IT_MATTERS'), body: 'Placeholder: clients need a mix that matches their goals and comfort levels.' },
          { title: this.translate.instant('SCHOOL.SUMMARY'), body: 'Placeholder: risk and return should be discussed in the context of the whole plan.' },
        ],
      },
      {
        id: 'retirement-basics',
        title: this.translate.instant('SCHOOL.RETIREMENT_BASICS_TITLE'),
        subtitle: this.translate.instant('SCHOOL.RETIREMENT_BASICS_SUBTITLE'),
        slides: [
          { title: this.translate.instant('SCHOOL.RETIREMENT_BASICS_TITLE'), body: 'Intro placeholder: retirement is about replacing a salary with other income sources.' },
          { title: this.translate.instant('SCHOOL.CORE_CONCEPT'), body: 'Placeholder: savings, pensions, and other assets need to support future spending.' },
          { title: this.translate.instant('SCHOOL.SIMPLE_EXAMPLE'), body: 'Placeholder: outline a simple monthly income need and how assets might cover it.' },
          { title: this.translate.instant('SCHOOL.WHY_IT_MATTERS'), body: 'Placeholder: early, consistent planning can make retirement choices more flexible.' },
          { title: this.translate.instant('SCHOOL.SUMMARY'), body: 'Placeholder: the goal is a sustainable income that matches lifestyle and priorities.' },
        ],
      },
    ];
  }
  activeSlideIndex = 0;

  get hasActiveModule(): boolean {
    return !!this.activeModule;
  }

  get totalSlides(): number {
    return this.activeModule?.slides.length ?? 0;
  }

  get currentSlide(): SchoolSlide | null {
    if (!this.activeModule) return null;
    return this.activeModule.slides[this.activeSlideIndex] ?? null;
  }

  openModule(id: string): void {
    const mod = this.modules.find((m) => m.id === id) ?? null;
    this.activeModule = mod;
    this.activeSlideIndex = 0;
  }

  closeModule(): void {
    this.activeModule = null;
    this.activeSlideIndex = 0;
  }

  nextSlide(): void {
    if (!this.activeModule) return;
    if (this.activeSlideIndex < this.activeModule.slides.length - 1) {
      this.activeSlideIndex += 1;
    }
  }

  previousSlide(): void {
    if (!this.activeModule) return;
    if (this.activeSlideIndex > 0) {
      this.activeSlideIndex -= 1;
    }
  }
}

