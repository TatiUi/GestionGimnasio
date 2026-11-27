import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FrmInscripcion } from './frm-inscripcion';

describe('FrmInscripcion', () => {
  let component: FrmInscripcion;
  let fixture: ComponentFixture<FrmInscripcion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrmInscripcion],
    }).compileComponents();

    fixture = TestBed.createComponent(FrmInscripcion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
