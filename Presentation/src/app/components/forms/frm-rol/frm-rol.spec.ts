import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FrmRol } from './frm-rol';

describe('FrmRol', () => {
  let component: FrmRol;
  let fixture: ComponentFixture<FrmRol>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrmRol],
    }).compileComponents();

    fixture = TestBed.createComponent(FrmRol);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
