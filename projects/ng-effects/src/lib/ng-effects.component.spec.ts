import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgEffectsComponent } from './ng-effects.component';

describe('NgEffectsComponent', () => {
  let component: NgEffectsComponent;
  let fixture: ComponentFixture<NgEffectsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgEffectsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgEffectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
