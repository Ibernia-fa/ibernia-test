import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiReccomendationsComponent } from './ai-reccomendations.component';

describe('AiReccomendationsComponent', () => {
  let component: AiReccomendationsComponent;
  let fixture: ComponentFixture<AiReccomendationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiReccomendationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiReccomendationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
