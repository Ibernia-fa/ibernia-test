import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './school.component.html',
  styleUrl: './school.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchoolComponent {
  modules: SchoolModule[] = [
    {
      id: 'inflation',
      title: 'Inflation',
      subtitle: 'How prices rise over time',
      slides: [
        { title: 'Inflation', body: 'Intro placeholder: explain that prices tend to increase over time in most economies.' },
        { title: 'Core concept', body: 'Placeholder: a fixed amount of money buys fewer goods and services as prices rise.' },
        { title: 'Simple example', body: 'Placeholder: a coffee that cost 2€ a few years ago might cost 2.40€ today.' },
        { title: 'Why it matters', body: 'Placeholder: long‑term plans must account for rising living costs.' },
        { title: 'Summary', body: 'Placeholder: inflation slowly erodes purchasing power and needs to be built into plans.' },
      ],
    },
    {
      id: 'compound-interest',
      title: 'Compound interest',
      subtitle: 'How growth builds on growth',
      slides: [
        { title: 'Compound interest', body: 'Intro placeholder: returns can generate additional returns over time.' },
        { title: 'Core concept', body: 'Placeholder: interest is earned on both the original amount and past interest.' },
        { title: 'Simple example', body: 'Placeholder: 1,000€ growing at 5% per year increases faster each year.' },
        { title: 'Why it matters', body: 'Placeholder: starting earlier gives compound growth more time to work.' },
        { title: 'Summary', body: 'Placeholder: small differences in rate and time can lead to big outcomes.' },
      ],
    },
    {
      id: 'financial-crisis',
      title: 'Financial crisis',
      subtitle: 'What happens in major downturns',
      slides: [
        { title: 'Financial crisis', body: 'Intro placeholder: markets can experience sharp, sudden falls.' },
        { title: 'Core concept', body: 'Placeholder: crises are usually caused by a shock to confidence or the system.' },
        { title: 'Simple example', body: 'Placeholder: describe a short, fictional market drop and recovery path.' },
        { title: 'Why it matters', body: 'Placeholder: plans should assume that downturns occur from time to time.' },
        { title: 'Summary', body: 'Placeholder: staying invested and diversified can help ride out crises.' },
      ],
    },
    {
      id: 'diversification',
      title: 'Diversification',
      subtitle: 'Why spreading risk matters',
      slides: [
        { title: 'Diversification', body: 'Intro placeholder: avoid relying on a single investment or idea.' },
        { title: 'Core concept', body: 'Placeholder: different assets behave differently in various environments.' },
        { title: 'Simple example', body: 'Placeholder: a mix of assets can smooth the journey compared to just one.' },
        { title: 'Why it matters', body: 'Placeholder: diversification can reduce the impact of any one setback.' },
        { title: 'Summary', body: 'Placeholder: spreading risk supports more resilient long‑term planning.' },
      ],
    },
    {
      id: 'risk-and-return',
      title: 'Risk and return',
      subtitle: 'The balance between safety and growth',
      slides: [
        { title: 'Risk and return', body: 'Intro placeholder: higher potential returns usually come with higher risk.' },
        { title: 'Core concept', body: 'Placeholder: there is a trade‑off between stability and growth.' },
        { title: 'Simple example', body: 'Placeholder: compare a savings account with a diversified investment portfolio.' },
        { title: 'Why it matters', body: 'Placeholder: clients need a mix that matches their goals and comfort levels.' },
        { title: 'Summary', body: 'Placeholder: risk and return should be discussed in the context of the whole plan.' },
      ],
    },
    {
      id: 'retirement-basics',
      title: 'Retirement basics',
      subtitle: 'Planning for income later in life',
      slides: [
        { title: 'Retirement basics', body: 'Intro placeholder: retirement is about replacing a salary with other income sources.' },
        { title: 'Core concept', body: 'Placeholder: savings, pensions, and other assets need to support future spending.' },
        { title: 'Simple example', body: 'Placeholder: outline a simple monthly income need and how assets might cover it.' },
        { title: 'Why it matters', body: 'Placeholder: early, consistent planning can make retirement choices more flexible.' },
        { title: 'Summary', body: 'Placeholder: the goal is a sustainable income that matches lifestyle and priorities.' },
      ],
    },
  ];

  activeModule: SchoolModule | null = null;
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

