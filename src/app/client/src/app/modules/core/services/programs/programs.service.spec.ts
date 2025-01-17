import { IProgram } from './../../interfaces/programs';
import { ProgramsService } from '@sunbird/core';
import { OrgDetailsService } from './../org-details/org-details.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExtPluginService } from './../ext-plugin/ext-plugin.service';
import { SharedModule, ConfigService } from '@sunbird/shared';
import { TestBed, inject } from '@angular/core/testing';
import { UserService } from '../user/user.service';
import { RouterTestingModule } from '@angular/router/testing';
import { mockResponseData } from './programs.service.spec.data';
import * as _ from 'lodash-es';
import { TelemetryModule, TelemetryService } from '@sunbird/telemetry';
import { of, throwError } from 'rxjs';
import { APP_BASE_HREF, DatePipe } from '@angular/common';
import { LearnerService } from '../learner/learner.service';

describe('ProgramsService', () => {

  beforeEach(() => TestBed.configureTestingModule({
    imports: [SharedModule.forRoot(), HttpClientTestingModule, RouterTestingModule, TelemetryModule],
    providers: [ConfigService, ExtPluginService, OrgDetailsService, UserService,
      DatePipe, TelemetryService, LearnerService,
      {provide: APP_BASE_HREF, useValue: '/'}]
  }));

  describe('enableContributeMenu method', () => {
    let userService: UserService;
    let orgDetailsService: OrgDetailsService;

    beforeEach(() => {
      userService = TestBed.get(UserService);
      orgDetailsService = TestBed.get(OrgDetailsService);
    });

    // it('should return false if user belongs to custodian org', inject([ProgramsService], (programsService) => {
    //   mockResponseData.userData['stateValidated'] = true;
    //   userService['_userData$'].next({ err: null, userProfile: _.get(mockResponseData, 'userData') });
    //   spyOn(orgDetailsService, 'getCustodianOrgDetails').and.callFake(() => of(mockResponseData.mockCustodianOrgApiResponse));
    //   spyOn(programsService, 'moreThanOneProgram').and.callFake(() => of(true));
    //   programsService.enableContributeMenu()
    //     .subscribe(result => {
    //       expect(result).toBeDefined();
    //       expect(result).toBeFalsy();
    //     });
    // }));

    it('should return false if user is not state validated', inject([ProgramsService], (programsService) => {
      mockResponseData.userData['stateValidated'] = false;
      mockResponseData.mockCustodianOrgApiResponse.result.response.value = '2343242';
      userService['_userData$'].next({ err: null, userProfile: _.get(mockResponseData, 'userData') });
      spyOn(orgDetailsService, 'getCustodianOrgDetails').and.callFake(() => of(mockResponseData.mockCustodianOrgApiResponse));
      spyOn(programsService, 'moreThanOneProgram').and.callFake(() => of(true));
      programsService.enableContributeMenu()
        .subscribe(result => {
          expect(result).toBeDefined();
          expect(result).toBeFalsy();
        });
    }));

    // it('should return false if error thrown either is userService or orgDetails service', inject([ProgramsService], (programsService) => {
    //   mockResponseData.userData['stateValidated'] = true;
    //   userService['_userData$'].next({ err: null, userProfile: _.get(mockResponseData, 'userData') });
    //   spyOn(orgDetailsService, 'getCustodianOrgDetails').and.callFake(() => throwError(mockResponseData.mockCustodianOrgApiResponse));
    //   spyOn(programsService, 'moreThanOneProgram').and.callFake(() => of(true));
    //   programsService.enableContributeMenu()
    //     .subscribe(result => {
    //       expect(result).toBeDefined();
    //       expect(result).toBeFalsy();
    //     });
    // }));

    it('should return false if user does not belong to custodian org and is state validated but no programs exist for that user',
      inject([ProgramsService], (programsService) => {
        mockResponseData.userData['stateValidated'] = true;
        mockResponseData.mockCustodianOrgApiResponse.result.response.value = '2343242';
        userService['_userData$'].next({ err: null, userProfile: _.get(mockResponseData, 'userData') });
        spyOn(orgDetailsService, 'getCustodianOrgDetails').and.callFake(() => of(mockResponseData.mockCustodianOrgApiResponse));
        spyOn(programsService, 'moreThanOneProgram').and.callFake(() => of(false));
        programsService.enableContributeMenu()
          .subscribe(result => {
            expect(result).toBeDefined();
            expect(result).toBeFalsy();
          });
      }));

    it('should return true if user is state validated and have at least one programs', inject([ProgramsService], (programsService) => {
      mockResponseData.userData['stateValidated'] = true;
      mockResponseData.mockCustodianOrgApiResponse.result.response.value = '2343242';
      userService['_userData$'].next({ err: null, userProfile: _.get(mockResponseData, 'userData') });
      spyOn(orgDetailsService, 'getCustodianOrgDetails').and.callFake(() => of(mockResponseData.mockCustodianOrgApiResponse));
      spyOn(programsService, 'moreThanOneProgram').and.callFake(() => of(true));
      programsService.enableContributeMenu()
        .subscribe(result => {
          expect(result).toBeDefined();
          expect(result).toBeTruthy();
        });
    }));

    it('getOrgUsersDetails should call learnerService.post', inject([ProgramsService], (programsService) => {
      const learnerService = TestBed.get(LearnerService);
      spyOn(learnerService, 'post').and.callFake(() => {});
      spyOn(programsService, 'getOrgUsersDetails').and.callThrough();
      programsService.getOrgUsersDetails({}, 0, 5, ['name']);
      expect(learnerService.post).toHaveBeenCalled();
    }));
  });

  describe('getPrograms', () => {
    it('should return list array of programs', inject([ProgramsService], (programsService) => {
      spyOn(programsService, 'searchProgramsAPICall').and.returnValue(of(mockResponseData.mockProgramsApiResponse));
      programsService.getPrograms().subscribe(apiResult => {
        expect(apiResult).toBeDefined();
        expect(apiResult).toBe(mockResponseData.mockProgramsApiResponse.result.programs);
        expect(apiResult.length).toBeGreaterThan(0);
      });
    }));

    it('should return empty array if error occurs', inject([ProgramsService], (programsService) => {
      spyOn(programsService, 'searchProgramsAPICall').and.returnValue(throwError(mockResponseData.mockProgramsApiResponse));
      programsService.getPrograms().subscribe(apiResult => {
        expect(apiResult).toBeDefined();
        expect(apiResult).toEqual([]);
        expect(apiResult.length).toEqual(0);
      });
    }));
  });

  describe('moreThanOneProgram', () => {

    it('should return true if there are more than program', inject([ProgramsService], (programsService) => {
      spyOn(programsService, 'getPrograms').and.returnValue(of([{ type: 'public' }, { type: 'private' }]));
      programsService.moreThanOneProgram().subscribe(val => {
        expect(val).toBeDefined();
        expect(val).toBeTruthy();
      });
    }));

    it('should return false if there are no program', inject([ProgramsService], (programsService) => {
      spyOn(programsService, 'getPrograms').and.returnValue(of([]));
      programsService.moreThanOneProgram().subscribe(val => {
        expect(val).toBeDefined();
        expect(val).toBeFalsy();
      });
    }));
  });

  describe('filterPublicPrograms ', () => {
    it('should filter out public programs', inject([ProgramsService], (programsService) => {
      spyOn(programsService, 'getPrograms').and.returnValue(of([{ type: 'public' }, { type: 'private' }]));
      programsService['filterPublicPrograms']().subscribe(val => {
        expect(val).toBeDefined();
        expect(val.length).toBe(1);
        expect(val).toEqual([{ type: 'public' }]);
      });
    }));
  });
});
