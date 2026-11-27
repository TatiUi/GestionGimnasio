import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FrmPlanMembresia } from './frm-plan-membresia';

describe('FrmPlanMembresia', () => {
  let component: FrmPlanMembresia;
  let fixture: ComponentFixture<FrmPlanMembresia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrmPlanMembresia],
    }).compileComponents();

    fixture = TestBed.createComponent(FrmPlanMembresia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
