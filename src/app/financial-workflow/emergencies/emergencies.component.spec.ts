import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmergenciesComponent } from './emergencies.component';

describe('EmergenciesComponent', () => {
  let component: EmergenciesComponent;
  let fixture: ComponentFixture<EmergenciesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergenciesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmergenciesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
