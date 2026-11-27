import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FrmAsistencia } from './frm-asistencia';

describe('FrmAsistencia', () => {
  let component: FrmAsistencia;
  let fixture: ComponentFixture<FrmAsistencia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrmAsistencia],
    }).compileComponents();

    fixture = TestBed.createComponent(FrmAsistencia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
