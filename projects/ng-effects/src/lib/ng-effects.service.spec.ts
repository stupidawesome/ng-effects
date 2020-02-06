import { TestBed } from '@angular/core/testing';

import { NgEffectsService } from './ng-effects.service';

describe('NgEffectsService', () => {
  let service: NgEffectsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgEffectsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
