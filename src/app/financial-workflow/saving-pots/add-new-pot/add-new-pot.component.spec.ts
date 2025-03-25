import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewPotComponent } from './add-new-pot.component';

describe('AddNewPotComponent', () => {
  let component: AddNewPotComponent;
  let fixture: ComponentFixture<AddNewPotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewPotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddNewPotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
