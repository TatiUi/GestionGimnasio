import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FrmPago } from './frm-pago';

describe('FrmPago', () => {
  let component: FrmPago;
  let fixture: ComponentFixture<FrmPago>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrmPago],
    }).compileComponents();

    fixture = TestBed.createComponent(FrmPago);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
