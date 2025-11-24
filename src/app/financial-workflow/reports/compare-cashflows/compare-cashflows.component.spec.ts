import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareCashflowsComponent } from './compare-cashflows.component';

describe('CompareCashflowsComponent', () => {
  let component: CompareCashflowsComponent;
  let fixture: ComponentFixture<CompareCashflowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompareCashflowsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompareCashflowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
