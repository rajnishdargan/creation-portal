import { TestBed } from '@angular/core/testing';
import { OfflineCardService } from '@sunbird/shared';
import { Response } from './offline-card.service.spec.data';

describe('OfflineCardService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  xit('should be created', () => {
    const service: OfflineCardService = TestBed.get(OfflineCardService);
    expect(service).toBeTruthy();
  });

  it('If data has youtube content', () => {
    const service: OfflineCardService = TestBed.get(OfflineCardService);
    const response = service.isYoutubeContent(Response.cardData);
    expect(response).toBe(true);
  });

  it('If data does not have youtube content', () => {
    const service: OfflineCardService = TestBed.get(OfflineCardService);
    const response = service.isYoutubeContent(Response.cardDataWithoutYoutubeContent);
    expect(response).toBe(false);
  });
});
