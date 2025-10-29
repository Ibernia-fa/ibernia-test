import { NgModule } from '@angular/core';
import { ThousandSeparatorPipe } from './thousand-separator.pipe';

@NgModule({
  declarations: [ThousandSeparatorPipe],
  exports: [ThousandSeparatorPipe]
})
export class ThousandSeparatorModule {}
