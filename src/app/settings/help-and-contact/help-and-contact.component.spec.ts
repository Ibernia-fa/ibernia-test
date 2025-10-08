import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpAndContactComponent } from './help-and-contact.component';

describe('HelpAndContactComponent', () => {
  let component: HelpAndContactComponent;
  let fixture: ComponentFixture<HelpAndContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpAndContactComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpAndContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
