import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FrmUsuario } from './frm-usuario';

describe('FrmUsuario', () => {
  let component: FrmUsuario;
  let fixture: ComponentFixture<FrmUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FrmUsuario],
    }).compileComponents();

    fixture = TestBed.createComponent(FrmUsuario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
