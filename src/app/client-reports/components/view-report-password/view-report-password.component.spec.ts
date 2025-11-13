import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewReportPasswordComponent } from './view-report-password.component';

describe('ViewReportPasswordComponent', () => {
  let component: ViewReportPasswordComponent;
  let fixture: ComponentFixture<ViewReportPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewReportPasswordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewReportPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
