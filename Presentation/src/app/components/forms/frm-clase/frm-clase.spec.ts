import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FrmClase } from './frm-clase';

describe('FrmClase', () => {
  let component: FrmClase;
  let fixture: ComponentFixture<FrmClase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrmClase],
    }).compileComponents();

    fixture = TestBed.createComponent(FrmClase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
