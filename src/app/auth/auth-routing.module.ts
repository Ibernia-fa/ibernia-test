import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthCallbackComponent } from './components/auth-callback.component.ts/auth-callback.component.ts.component';

const routes: Routes = [
  // { path: 'login', component: LoginComponent },
  { path: '', component: AuthCallbackComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }