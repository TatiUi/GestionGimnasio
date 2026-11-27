import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanesMembresiasComponent } from './planes-membresias-component';

describe('PlanesMembresiasComponent', () => {
  let component: PlanesMembresiasComponent;
  let fixture: ComponentFixture<PlanesMembresiasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanesMembresiasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanesMembresiasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
