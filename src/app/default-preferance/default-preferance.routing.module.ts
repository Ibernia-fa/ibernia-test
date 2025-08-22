// settings/settings-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DefaultPreferanceComponent } from './default-preferance/default-preferance.component';


const routes: Routes = [
  { path: '', component: DefaultPreferanceComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DefaultPreferanceRoutingModule {}
