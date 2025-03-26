import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddContributionComponent } from './add-contribution.component';

describe('AddContributionComponent', () => {
  let component: AddContributionComponent;
  let fixture: ComponentFixture<AddContributionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddContributionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddContributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
