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
import { combineLatest, filter, map, Subject, switchMap, takeUntil, tap } from 'rxjs';
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
import { CurrencySymbolPipe } from 'src/app/pipe/currency-symbol.pipe';
import { ThousandSeparatorPipe } from 'src/app/pipe/thousand-separator.pipe';
import { AuthService } from 'src/app/auth/services/auth.service';
import { SettingsService } from 'src/app/default-preferance/services/default-preferance.http.service';
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
    CurrencySymbolPipe,
    ThousandSeparatorPipe
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
  user: any;
  userRerturnRate: any;
  loggedInUserPreferences: any;
      private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private savingPotsHttpService: SavingPotsHttpService,
    private timelineHttpService: TimelineHttpService,
    private settingHttpService: SettingsHttpService,
    private activatedRoute: ActivatedRoute,
    private financialWorkflowService: FinancialWorkflowService,
    private navItemService: NavItemService,
    private Authservice: AuthService,
     private settingsService: SettingsService
  ) {
    this.navItemService.currentRouteName = 'Saving Pots';
        this.user = this.Authservice.getUserProfile();
  // this.settingsService.getUserProfileResponse(this.user?.sub).subscribe({
  //   next: (res: any) => {
  //     console.log('res =>', res);
  //     // console.log('data', res.body);
  //      const p = res?.body?.preferences;
  //      this.loggedInUserPreferences = p;
  //     this.userRerturnRate = p.investmentReturn;
  //   }});
      this.settingsService.userData$
        .pipe(
          filter((v): v is NonNullable<typeof v> => v != null), // skip initial null
          takeUntil(this.destroy$)
        )
        .subscribe((data) => {
      console.log('res 1=>', data);

          // console.log('userData arrived', data);
          // this.userData = data;
                 const p = data.preferences;
       this.loggedInUserPreferences = p;
      this.userRerturnRate = p.investmentReturn;
        });
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
        tap(([savingPots, timeline, amountCycles, escalationRatesResponse]) => {
          console.log(timeline, amountCycles, escalationRatesResponse);
          // this.savingPots = savingPots;
            this.savingPots = {
            ...savingPots,
            clientSavings: savingPots.clientSavings
              .map((item, index) => ({ ...item, orderNumber: item.orderNumber ?? index }))
              .sort((a, b) => a.orderNumber - b.orderNumber)
          };
          this.ensureCashFirst();
          this.timeline = timeline;
          this.amountCycles = amountCycles;
          this.escalationRates = escalationRatesResponse.escalationRates;
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

  // drop(event: CdkDragDrop<any>) {
  //   moveItemInArray(
  //     this.savingPots.clientSavings,
  //     event.previousIndex,
  //     event.currentIndex
  //   );
  // }

  drop(event: CdkDragDrop<any>) {
  const list = this.savingPots?.clientSavings ?? [];
  if (!list.length) return;

  // Don’t let anything be dropped at index 0
  if (event.currentIndex === 0) {
    return;
  }

  // Don’t let the first item (Cash) be moved at all (defense in depth)
  if (event.previousIndex === 0) {
    return;
  }

  moveItemInArray(list, event.previousIndex, event.currentIndex);
  this.savingPots.clientSavings = [...list];

  // Recompute order numbers and persist (you already have this)
  this.updateOrderNumbers();
}


  // moveUp(index: number) {
  //   if (index > 0) {
  //     moveItemInArray(this.savingPots.clientSavings, index - 1, index);
  //     this.transitionState = 'up';
  //     this.savingPots.clientSavings = [...this.savingPots.clientSavings];
  //   }
  // }

  // moveDown(index: number) {
  //   if (index < this.savingPots.clientSavings.length - 1) {
  //     moveItemInArray(this.savingPots.clientSavings, index + 1, index);
  //     this.transitionState = 'down';
  //     this.savingPots.clientSavings = [...this.savingPots.clientSavings];
  //   }
  // }


// moveUp(index: number) {
//   if (index > 0) {
//     const currentItem = this.savingPots.clientSavings[index];
//     const previousItem = this.savingPots.clientSavings[index - 1];

//     // Swap order numbers
//     const tempOrder = currentItem.orderNumber;
//     currentItem.orderNumber = previousItem.orderNumber;
//     previousItem.orderNumber = tempOrder;

//     // Swap items in array
//     moveItemInArray(this.savingPots.clientSavings, index, index - 1);
//     this.savingPots.clientSavings = [...this.savingPots.clientSavings];

//     // Call API
//     this.updateOrderNumbers();
//   }
// }

// moveDown(index: number) {
//   if (index < this.savingPots.clientSavings.length - 1) {
//     const currentItem = this.savingPots.clientSavings[index];
//     const nextItem = this.savingPots.clientSavings[index + 1];

//     // Swap order numbers
//     const tempOrder = currentItem.orderNumber;
//     currentItem.orderNumber = nextItem.orderNumber;
//     nextItem.orderNumber = tempOrder;

//     // Swap items in array
//     moveItemInArray(this.savingPots.clientSavings, index, index + 1);
//     this.savingPots.clientSavings = [...this.savingPots.clientSavings];

//     // Call API
//     this.updateOrderNumbers();
//   }
// }

moveUp(index: number) {
  if (index <= 0) return;

  // If moving up would place the item into index 0, block it
  if (index - 1 === 0) return;

  // Also, if the row above is Cash, block the move
  if (this.isCashName(this.savingPots.clientSavings[index - 1]?.name)) return;

  const currentItem = this.savingPots.clientSavings[index];
  const previousItem = this.savingPots.clientSavings[index - 1];

  const tempOrder = currentItem.orderNumber;
  currentItem.orderNumber = previousItem.orderNumber;
  previousItem.orderNumber = tempOrder;

  moveItemInArray(this.savingPots.clientSavings, index, index - 1);
  this.savingPots.clientSavings = [...this.savingPots.clientSavings];
  this.updateOrderNumbers();
}

moveDown(index: number) {
  if (index >= this.savingPots.clientSavings.length - 1) return;

  // Normal guard: the next item can be Cash (that’s fine),
  // but moving down never touches index 0 anyway.
  const currentItem = this.savingPots.clientSavings[index];
  const nextItem = this.savingPots.clientSavings[index + 1];

  const tempOrder = currentItem.orderNumber;
  currentItem.orderNumber = nextItem.orderNumber;
  nextItem.orderNumber = tempOrder;

  moveItemInArray(this.savingPots.clientSavings, index, index + 1);
  this.savingPots.clientSavings = [...this.savingPots.clientSavings];
  this.updateOrderNumbers();
}



updateOrderNumbers() {
  if (!this.selectedCashflow) return;

  // Ensure all orderNumbers are unique and sorted by position
  this.savingPots.clientSavings.forEach((item, index) => {
    item.orderNumber = index;
  });

  this.savingPotsHttpService
    .updateSavingsPots(this.selectedCashflow.id, this.savingPots.clientSavings)
    .subscribe({
      next: () => {
        console.log('Updated orderNumbers successfully');
      },
      error: (err) => {
        console.error('Failed to update orderNumbers', err);
      }
    });
}




  updateEventClicked(event: ClientSaving) {
    console.log('Saving Pot Data Received')
    console.log(event)
    const dialogRef = this.dialog.open(AddNewPotComponent, {
      width: '700px',
      disableClose: true,
      data: {
        returnRate: this.userRerturnRate,
        loggedInUserPreferences : this.loggedInUserPreferences,
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: this.timeline.clientEvents.sort((a, b) => a.start.age - b.start.age),
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
      this.ensureCashFirst();
      // this.savingPots.clientSavings.push(result.clientSaving);
    });
  }
  
  deleteEventClicked(event: ClientSaving) {
    if(this.selectedCashflow) {
      this.savingPotsHttpService.deleteSavingPot(this.selectedCashflow?.id, event).pipe(
        map((res) => {
          const index = this.savingPots.clientSavings.findIndex(x => x.id === event.id);
          this.savingPots.clientSavings.splice(index, 1);
        })
      ).subscribe();
    }
  }
  
  newEventClicked() {
    console.log(this.timeline.clientEvents)
    const dialogRef = this.dialog.open(AddNewPotComponent, {
      width: '700px',
      disableClose: true,
      data: {
        returnRate: this.userRerturnRate,
        loggedInUserPreferences : this.loggedInUserPreferences,
        amountCycles: this.amountCycles,
        escalataionRates: this.escalationRates,
        eventsList: this.timeline.clientEvents.sort((a, b) => a.start.age - b.start.age),
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
      if(result?.savingPot) {
        this.savingPots = result?.savingPot;
        this.ensureCashFirst();
      }
      // this.savingPots.clientSavings.push(result.clientSaving);
    });
  }

  // Add these helpers to the component
private isCashName(n?: string): boolean {
  return (n ?? '').trim().toLowerCase() === 'cash';
}

private ensureCashFirst(): void {
  const list = this.savingPots?.clientSavings;
  if (!list || !list.length) return;
  const cashIdx = list.findIndex(x => this.isCashName(x?.name));
  if (cashIdx > 0) {
    const [cash] = list.splice(cashIdx, 1);
    list.unshift(cash);
    this.savingPots.clientSavings = [...list];
    this.updateOrderNumbers(); // persist the invariant
  }
}

}
