import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimulateEmergencyComponent } from './simulate-emergency.component';

describe('SimulateEmergencyComponent', () => {
  let component: SimulateEmergencyComponent;
  let fixture: ComponentFixture<SimulateEmergencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulateEmergencyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimulateEmergencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
