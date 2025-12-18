import { Injectable, Renderer2, RendererFactory2, ComponentFactoryResolver, ApplicationRef, Injector, ComponentRef, createNgModuleRef, NgModuleRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { SavingsBarStackedChartComponent } from '../financial-workflow/reports/savings-bar-stacked-chart/savings-bar-stacked-chart.component';
// import { SavingsBarStackedChartComponent } from './savings-bar-stacked-chart/savings-bar-stacked-chart.component';

export interface FullscreenData {
  report: any;
  client: any;
  forecastStartDate: Date;
  forecastEndDate: Date;
  cashFlowName: string;
  isComparison?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FullscreenService {
  private isFullscreenSubject = new BehaviorSubject<boolean>(false);
  isFullscreen$ = this.isFullscreenSubject.asObservable();
  
  private fullscreenDataSubject = new BehaviorSubject<FullscreenData | null>(null);
  fullscreenData$ = this.fullscreenDataSubject.asObservable();
  
  private renderer: Renderer2;
  private overlayElement: HTMLElement | null = null;
  private chartComponentRef: ComponentRef<SavingsBarStackedChartComponent> | null = null;

  constructor(
    private rendererFactory: RendererFactory2,
    private componentFactoryResolver: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    private injector: Injector
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  enterFullscreen(data: FullscreenData): void {
    this.isFullscreenSubject.next(true);
    this.fullscreenDataSubject.next(data);
    
    this.createOverlay();
    document.body.style.overflow = 'hidden';
    
    // Initialize chart immediately after creating overlay
    setTimeout(() => this.initializeChart(data), 0);
  }

  exitFullscreen(): void {
    this.isFullscreenSubject.next(false);
    this.fullscreenDataSubject.next(null);
    
    this.destroyChart();
    this.removeOverlay();
    document.body.style.overflow = '';
  }

  private createOverlay(): void {
    // Create overlay element
    this.overlayElement = this.renderer.createElement('div');
    this.renderer.addClass(this.overlayElement, 'global-fullscreen-overlay');
    
    // Create content container
    const contentDiv = this.renderer.createElement('div');
    this.renderer.addClass(contentDiv, 'global-fullscreen-content');
    
    // Create header
    const headerDiv = this.renderer.createElement('div');
    this.renderer.addClass(headerDiv, 'global-fullscreen-header');
    
    const title = this.renderer.createElement('h4');
    this.renderer.setProperty(title, 'textContent', 
      `Lifetime Plan - ${this.fullscreenDataSubject.value?.isComparison ? 'Comparison' : 'Main View'}`);
    
    const closeButton = this.renderer.createElement('button');
    this.renderer.addClass(closeButton, 'global-close-fullscreen-btn');
    this.renderer.setAttribute(closeButton, 'mat-icon-button', '');
    this.renderer.listen(closeButton, 'click', () => this.exitFullscreen());
    
    const closeIcon = this.renderer.createElement('mat-icon');
    this.renderer.setProperty(closeIcon, 'textContent', 'close');
    
    this.renderer.appendChild(closeButton, closeIcon);
    this.renderer.appendChild(headerDiv, title);
    this.renderer.appendChild(headerDiv, closeButton);
    
    // Create chart container
    const chartContainer = this.renderer.createElement('div');
    this.renderer.addClass(chartContainer, 'global-fullscreen-chart-container');
    this.renderer.setProperty(chartContainer, 'id', 'global-fullscreen-chart');
    
    this.renderer.appendChild(contentDiv, headerDiv);
    this.renderer.appendChild(contentDiv, chartContainer);
    this.renderer.appendChild(this.overlayElement, contentDiv);
    
    // Add to body
    this.renderer.appendChild(document.body, this.overlayElement);
    
    // Add click outside to close
    this.renderer.listen(this.overlayElement, 'click', (event) => {
      if (event.target === this.overlayElement) {
        this.exitFullscreen();
      }
    });
  }

//   private initializeChart(data: FullscreenData): void {
//     const chartContainer = document.getElementById('global-fullscreen-chart');
//     if (!chartContainer) return;
    
//     // Clear container
//     chartContainer.innerHTML = '';
    
//     // Create component factory
//     const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
//       SavingsBarStackedChartComponent
//     );
    
//     // Create component reference
//     this.chartComponentRef = componentFactory.create(this.injector);
    
//     // Set component inputs
//     this.chartComponentRef.instance.report = data.report;
//     this.chartComponentRef.instance.client = data.client;
//     this.chartComponentRef.instance.forecastStartDate = data.forecastStartDate;
//     this.chartComponentRef.instance.forecastEndDate = data.forecastEndDate;
//     this.chartComponentRef.instance.cashFlowName = data.cashFlowName;
//     this.chartComponentRef.instance.isFullscreen = true;
    
//     // Attach to application
//     this.appRef.attachView(this.chartComponentRef.hostView);
    
//     // Append to DOM
//     chartContainer.appendChild(this.chartComponentRef.location.nativeElement);
    
//     // Trigger change detection
//     this.chartComponentRef.changeDetectorRef.detectChanges();
//   }

private initializeChart(data: FullscreenData): void {
  const chartContainer = document.getElementById('global-fullscreen-chart');
  if (!chartContainer) return;
  
  // Clear container
  chartContainer.innerHTML = '';
  
  // Create component factory
  const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
    SavingsBarStackedChartComponent
  );
  
  // Create component reference
  this.chartComponentRef = componentFactory.create(this.injector);
  
  // Set component inputs
  this.chartComponentRef.instance.report = data.report;
  this.chartComponentRef.instance.client = data.client;
  this.chartComponentRef.instance.forecastStartDate = data.forecastStartDate;
  this.chartComponentRef.instance.forecastEndDate = data.forecastEndDate;
  this.chartComponentRef.instance.cashFlowName = data.cashFlowName;
  this.chartComponentRef.instance.isFullscreen = true;
  
  // Attach to application
  this.appRef.attachView(this.chartComponentRef.hostView);
  
  // Append to DOM
  chartContainer.appendChild(this.chartComponentRef.location.nativeElement);
  
  // MANUALLY TRIGGER ngOnChanges - THIS IS THE KEY FIX!
  // This ensures chart options (including tooltip) are initialized
  if (this.chartComponentRef.instance.ngOnChanges) {
    this.chartComponentRef.instance.ngOnChanges({
      report: {
        currentValue: data.report,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true
      },
      client: {
        currentValue: data.client,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true
      },
      forecastStartDate: {
        currentValue: data.forecastStartDate,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true
      },
      forecastEndDate: {
        currentValue: data.forecastEndDate,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true
      },
      cashFlowName: {
        currentValue: data.cashFlowName,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true
      }
    });
  }
  
  // Trigger change detection
  this.chartComponentRef.changeDetectorRef.detectChanges();
}

  private destroyChart(): void {
    if (this.chartComponentRef) {
      this.appRef.detachView(this.chartComponentRef.hostView);
      this.chartComponentRef.destroy();
      this.chartComponentRef = null;
    }
  }

  private removeOverlay(): void {
    if (this.overlayElement && document.body.contains(this.overlayElement)) {
      this.renderer.removeChild(document.body, this.overlayElement);
      this.overlayElement = null;
    }
  }
}