import { TestBed } from '@angular/core/testing';

import { AttributesService } from './attributes.service';

describe('AttributesService', () => {
  let service: AttributesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttributesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
