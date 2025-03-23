import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddNewPotComponent } from './add-new-pot/add-new-pot.component';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CdkDragDrop,
  moveItemInArray,
  CdkDrag,
  CdkDropList,
  CdkDragHandle,
} from '@angular/cdk/drag-drop';
import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { combineLatest, switchMap, tap } from 'rxjs';
import { SavingsPotsHttpService as SavingPotsHttpService } from './services/savings-pots-http.service';
import { ClientSaving, SavingPotsModel as SavingPots } from './models/saving-pots.model';
import { Cashflow } from 'src/app/clients/models/cashflow';
import { TimelineHttpService } from '../timeline/services/timeline-http.service';
import { Client } from 'src/app/clients/models/client';
import {
  Cycle,
  EscalationRate,
  FinancialTimeline,
} from '../timeline/models/financial-timeline';
import { SettingsHttpService } from '../settings/services/settings-http.service';
import moment from 'moment';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { FinancialWorkflowService } from '../services/financial-workflow.service';
import { NavItemService } from 'src/app/layouts/full/nav-item.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-saving-pots',
  imports: [
    MatDialogModule,
    MatCardModule,
    MatSliderModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
  ],

  templateUrl: './saving-pots.component.html',
  styleUrl: './saving-pots.component.scss',
  animations: [
    trigger('moveItem', [
      transition(':increment', [
        style({ transform: 'translateY(0)' }),
        animate('300ms ease-out', style({ transform: 'translateY(-50px)' })),
      ]),
      transition(':decrement', [
        style({ transform: 'translateY(0)' }),
        animate('300ms ease-out', style({ transform: 'translateY(50px)' })),
      ]),
    ]),
  ],
  // animations: [
  //   trigger('listAnimation', [
  //     transition('up', [
  //       style({ opacity: 0, transform: 'translateY(-120px)' }),
  //       animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  //     ]),
  //     transition('down', [
  //       animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(120px)' }))
  //     ]),
  //     transition('* => *', [
  //       animate(
  //         '300ms ease-in-out',
  //         keyframes([
  //           style({ transform: 'translateY(-80px)', offset: 0.2 }),
  //           style({ transform: 'translateY(0px)', offset: 1 })
  //         ])
  //       )
  //     ])
  //   ])
  // ]
})
export class SavingPotsComponent implements OnInit {
  constructor(
    private dialog: MatDialog,
    private savingPotsHttpService: SavingPotsHttpService,
    private timelineHttpService: TimelineHttpService,
    private settingHttpService: SettingsHttpService,
    private activatedRoute: ActivatedRoute,
    private financialWorkflowService: FinancialWorkflowService,
    private navItemService: NavItemService
  ) {
    this.navItemService.currentRouteName = 'Saving Pots';
    this.getData();
  }

  transitionState = '';
  selectedCashflow: Cashflow | null;
  selectedClient: Client | null;
  savingPots: SavingPots;
  timeline: FinancialTimeline;
  amountCycles: Array<Cycle>;
  escalationRates: Array<EscalationRate>;
  isLoaderVisible = false;
  showFeedbackPopup = false;
  selectedRating = '';
  currentStep = 1;
  feedbackDetail = '';

  items = [
    { id: 1, name: 'Item 1', score: 5 },
    { id: 2, name: 'Item 2', score: 3 },
    { id: 3, name: 'Item 3', score: 8 },
    { id: 4, name: 'Item 4', score: 2 },
  ];

  getData() {
    this.isLoaderVisible = true;
    this.activatedRoute.params
      .pipe(
        switchMap((params) =>
          this.financialWorkflowService.loadClientCashflowMetadata(params)
        ),
        tap(([client, cashflow]) => {
          this.selectedClient = client as Client;
          console.log(cashflow);
          this.selectedCashflow = cashflow as Cashflow;
        }),
        switchMap(([client, cashflow]) => {
          return combineLatest([
            this.savingPotsHttpService.getAllSavingsPots(
              (cashflow as Cashflow).id
            ),
            this.timelineHttpService.getTimelinebyCashflowId(
              (cashflow as Cashflow).id
            ),
            this.settingHttpService.getAmountCycles(),
            this.settingHttpService.getEscalationRates(
              (client as Client).financialAdvisor.advisorId
            ),
          ]);
        }),
        tap(([savingPots, timeline, amountCycles, escalationRates]) => {
          console.log(timeline, amountCycles, escalationRates);
          this.savingPots = savingPots;
          this.timeline = timeline;
          this.amountCycles = amountCycles;
          this.escalationRates = escalationRates;
          this.isLoaderVisible = false;
        })
      )
      .subscribe();
  }

  ngOnInit(): void {
    var showFeedbackPopup = localStorage.getItem('showFeedbackPopup');
    if (showFeedbackPopup !== null) {
      this.showFeedbackPopup = showFeedbackPopup === 'true';
    } else {
      this.showFeedbackPopup = true;
    }
  }

  closeFeedbackPopupClicked() {
    this.showFeedbackPopup = false;
    localStorage.setItem('showFeedbackPopup', 'false');
  }

  selectRating(value: any) {
    this.selectedRating = value;
    this.currentStep = 2;
  }

  feedbackSubmitBtnClicked() {
    var feedback = {
      rating: this.selectedRating,
      feedbackDetail: this.feedbackDetail,
    };
    localStorage.setItem('feedbackSubmission', JSON.stringify(feedback));
    localStorage.setItem('showFeedbackPopup', 'false');

    this.currentStep = 3;
    setTimeout(() => {
      this.showFeedbackPopup = false;
    }, 5000);
  }

  upvote(item: any): void {
    item.score++;
  }

  downvote(item: any): void {
    item.score--;
  }

  drop(event: CdkDragDrop<any>) {
    moveItemInArray(
      this.savingPots.clientSavings,
      event.previousIndex,
      event.currentIndex
    );
  }

  moveUp(index: number) {
    if (index > 0) {
      moveItemInArray(this.savingPots.clientSavings, index - 1, index);
      this.transitionState = 'up';
      this.savingPots.clientSavings = [...this.savingPots.clientSavings];
    }
  }

  moveDown(index: number) {
    if (index < this.savingPots.clientSavings.length - 1) {
      moveItemInArray(this.savingPots.clientSavings, index + 1, index);
      this.transitionState = 'down';
      this.savingPots.clientSavings = [...this.savingPots.clientSavings];
    }
  }

  updateEventClicked(event: ClientSaving) {
    const dialogRef = this.dialog.open(AddNewPotComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: this.timeline.clientEvents,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        cashflowId: this.selectedCashflow?.id,
        isEditWorkflow: true,
        event: event
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      this.savingPots = result.savingPot;
      // this.savingPots.clientSavings.push(result.clientSaving);
    });
  }
  
  newEventClicked() {
    const dialogRef = this.dialog.open(AddNewPotComponent, {
      width: '700px',
      disableClose: true,
      data: {
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: this.timeline.clientEvents,
        clientBirthDate: this.selectedClient?.clientDetails.birthDate,
        clientPreferredCurrency:
          this.selectedClient?.clientDetails.preferredCurrency,
        forecastEndDateYear: moment(this.timeline.forecastEndtDate).year(),
        forecastStartDateYear: moment(this.timeline.forecastStartDate).year(),
        cashflowId: this.selectedCashflow?.id,
        isEditWorkflow: false
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
      this.savingPots = result.savingPot;
      // this.savingPots.clientSavings.push(result.clientSaving);
    });
  }
}
