import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditModelDialogComponent } from './edit-model-dialog.component';

describe('EditModelDialogComponent', () => {
  let component: EditModelDialogComponent;
  let fixture: ComponentFixture<EditModelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditModelDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditModelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
