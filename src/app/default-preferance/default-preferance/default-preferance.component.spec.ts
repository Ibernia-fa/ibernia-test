import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultPreferanceComponent } from './default-preferance.component';

describe('DefaultPreferanceComponent', () => {
  let component: DefaultPreferanceComponent;
  let fixture: ComponentFixture<DefaultPreferanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultPreferanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefaultPreferanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
