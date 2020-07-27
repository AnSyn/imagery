import { TestBed } from '@angular/core/testing';

import { AttributeControlService } from './attribute-control.service';

describe('AttributeControlService', () => {
  let service: AttributeControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttributeControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
