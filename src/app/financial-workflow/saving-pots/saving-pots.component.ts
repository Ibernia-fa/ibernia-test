import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddNewPotComponent } from './add-new-pot/add-new-pot.component';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
  CdkDragHandle,
} from '@angular/cdk/drag-drop';
import {
  animate,
  keyframes,
  query,
  stagger,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-saving-pots',
  imports: [
    MatDialogModule,
    MatCardModule,
    MatSliderModule,
    MatTooltipModule,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    CommonModule,
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
export class SavingPotsComponent {
  constructor(private dialog: MatDialog) {}

  all = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  transitionState = '';

  items = [
    { id: 1, name: 'Item 1', score: 5 },
    { id: 2, name: 'Item 2', score: 3 },
    { id: 3, name: 'Item 3', score: 8 },
    { id: 4, name: 'Item 4', score: 2 },
  ];

  ngOnInit(): void {}

  upvote(item: any): void {
    item.score++;
  }

  downvote(item: any): void {
    item.score--;
  }

  // drop(event: CdkDragDrop<number[]>) {
  //   console.log({event})
  //   if (event.previousContainer === event.container) {
  //     moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
  //   } else {
  //     transferArrayItem(
  //       event.previousContainer.data,
  //       event.container.data,
  //       event.previousIndex,
  //       event.currentIndex,
  //     );
  //   }
  // }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.all, event.previousIndex, event.currentIndex);
  }

  // Move item up
  moveUp(index: number) {
    if (index > 0) {
      moveItemInArray(this.all, index - 1, index);
      this.transitionState = 'up';
      this.all = [...this.all];
      // [this.all[index], this.all[index - 1]] = [this.all[index - 1], this.all[index]];
    }
  }

  // Move item down
  moveDown(index: number) {
    if (index < this.all.length - 1) {
      moveItemInArray(this.all, index + 1, index);
      this.transitionState = 'down';
      this.all = [...this.all];
      // [this.all[index], this.all[index + 1]] = [this.all[index + 1], this.all[index]];
    }
  }

  newEventClicked() {
    const dialogRef = this.dialog.open(AddNewPotComponent, {
      width: '700px',
      disableClose: true,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('Dialog closed with result:', result);
    });
  }
}
