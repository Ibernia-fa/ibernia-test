import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefaultPreferanceComponent } from './default-preferance/default-preferance.component';
import { DefaultPreferanceRoutingModule } from './default-preferance.routing.module';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material.module';
import { MatDialogModule } from '@angular/material/dialog';


@NgModule({
  declarations: [DefaultPreferanceComponent],
  imports: [
    CommonModule,
        MatInputModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    DefaultPreferanceRoutingModule,
    MatSelectModule,
    FormsModule,
        MaterialModule,
    
    ReactiveFormsModule,
    MatDialogModule
  ],
    exports: [DefaultPreferanceComponent] 
})
export class DefaultPreferanceModule { }
