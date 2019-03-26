
import { of as observableOf, Observable } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ContentService } from './../content/content.service';
import { UserService } from './../user/user.service';
import { Injectable } from '@angular/core';
import {
  ConfigService, IUserData, ServerResponse,
  ContentDetails, PlayerConfig, ContentData, NavigationHelperService
} from '@sunbird/shared';
import { CollectionHierarchyAPI } from '../../interfaces';
import * as _ from 'lodash';
import { environment } from '@sunbird/environment';
import { PublicDataService } from './../public-data/public-data.service';
/**
 * helper services to fetch content details and preparing content player config
 */
@Injectable()
export class PlayerService {
  /**
   * stores content details
   */
  contentData: ContentData;
  /**
   * stores collection/course details
   */
  collectionData: ContentData;
  constructor(public userService: UserService, public contentService: ContentService,
    public configService: ConfigService, public router: Router, public navigationHelperService: NavigationHelperService,
    public publicDataService: PublicDataService) {
  }

  /**
   *
   *
   * @param {string} id
   * @returns {Observable<{contentId: string, contentData: ContentData }>}
   */
  getConfigByContent(id: string, option: any = { params: {} }): Observable<PlayerConfig> {
    return this.getContent(id, option).pipe(
      mergeMap((content) => {
        const contentDetails: ContentDetails = {
          contentId: content.result.content.identifier,
          contentData: content.result.content
        };
        if (option.courseId) {
          contentDetails.courseId = option.courseId;
        }
        if (option.courseId && option.batchHashTagId) {
          contentDetails.batchHashTagId = option.batchHashTagId;
        }
        return observableOf(this.getConfig(contentDetails));
      }));
  }

  /**
   * Return content details
   * @param {string} contentId
   * @returns {Observable<ServerResponse>}
   */
  getContent(contentId: string, option: any = { params: {} }): Observable<ServerResponse> {
    let param = { fields: this.configService.urlConFig.params.contentGet };
    param = { ...param, ...option.params };
    const req = {
      url: `${this.configService.urlConFig.URLS.CONTENT.GET}/${contentId}`,
      param: { ...param, ...option.params }
    };
    return this.publicDataService.get(req).pipe(map((response: ServerResponse) => {
      this.contentData = response.result.content;
      return response;
    }));
  }
  /**
   * returns player config details.
   * @param {ContentDetails} contentDetails
   * @memberof PlayerService
   */
  getConfig(contentDetails: ContentDetails): PlayerConfig {
    const configuration: any = this.configService.appConfig.PLAYER_CONFIG.playerConfig;
    configuration.context.contentId = contentDetails.contentId;
    configuration.context.sid = this.userService.sessionId;
    configuration.context.uid = this.userService.userid;
    configuration.context.contextRollup = this.getRollUpData(this.userService.userProfile.organisationIds);
    configuration.context.channel = this.userService.channel;
    const buildNumber = (<HTMLInputElement>document.getElementById('buildNumber'));
    configuration.context.pdata.ver = buildNumber && buildNumber.value ?
    buildNumber.value.slice(0, buildNumber.value.lastIndexOf('.')) : '1.0';
    if (_.isUndefined(contentDetails.courseId)) {
      configuration.context.dims = this.userService.dims;
    } else {
      const cloneDims = _.cloneDeep(this.userService.dims) || [];
      cloneDims.push(contentDetails.courseId);
      if (contentDetails.batchHashTagId) {
        cloneDims.push(contentDetails.batchHashTagId);
      }
      configuration.context.dims = cloneDims;
    }
    const tags = [];
    _.forEach(this.userService.userProfile.organisations, (org) => {
      if (org.hashTagId) {
        tags.push(org.hashTagId);
      } else if (org.organisationId) {
        tags.push(org.organisationId);
      }
    });
    if (this.userService.channel) {
      tags.push(this.userService.channel);
    }
    configuration.context.tags = tags;
    configuration.context.app = [this.userService.channel];
    if (contentDetails.courseId) {
      configuration.context.cdata = [{
        id: contentDetails.courseId,
        type: 'course'
      }];
    }
    configuration.context.pdata.id = this.userService.appId;
    configuration.metadata = contentDetails.contentData;
    configuration.data = contentDetails.contentData.mimeType !== this.configService.appConfig.PLAYER_CONFIG.MIME_TYPE.ecmlContent ?
      {} : contentDetails.contentData.body;
    configuration.config.enableTelemetryValidation = environment.enableTelemetryValidation; // telemetry validation
    return configuration;
  }

  /**
   *
   *
   * @private
   * @param {Array<string>} [data=[]]
   * @returns
   * @memberof TelemetryService
   */
  private getRollUpData(data: Array<string> = []) {
    const rollUp = {};
    data.forEach((element, index) => rollUp['l' + (index + 1)] = element);
    return rollUp;
  }

  public getCollectionHierarchy(identifier: string, option: any = { params: {} }): Observable<CollectionHierarchyAPI.Get> {
    const req = {
      url: `${this.configService.urlConFig.URLS.COURSE.HIERARCHY}/${identifier}`,
      param: option.params
    };
    return this.publicDataService.get(req).pipe(map((response: ServerResponse) => {
      this.collectionData = response.result.content;
      return response;
    }));
  }

  updateContentBodyForReviewer(data) {
    // data object is body of the content after JSON.parse()
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = null;
    }
    if (!parsedData) {
      return data;
    }
    const questionSetPluginId = 'org.ekstep.questionset';
    const questionPluginId = 'org.ekstep.question';
    // checking content has questionset plugin dependency
    const isQuestionSetPluginExist = parsedData.theme['plugin-manifest']['plugin'].filter((plugin) => {
        return plugin.id !== questionSetPluginId;
    });

    if (isQuestionSetPluginExist) {
        // checking each stage for questionset plugin
        parsedData.theme['stage'].forEach((stage) =>  {
            if (stage[questionSetPluginId]) {
                // checking each questionset plugin inside a stage
                stage[questionSetPluginId].forEach( (questionSetData) => {
                    const questionSetConfigData = JSON.parse(questionSetData.config.__cdata);
                    const actualNumberOfQuestions = questionSetData[questionPluginId].length;
                    // ensuring total items (display items ) always equval to number of questions inside question set
                    questionSetConfigData.total_items = actualNumberOfQuestions;
                    // ensuring shuffle is always off for the reviewer
                    questionSetConfigData.shuffle_questions = false;
                    questionSetData.config.__cdata = JSON.stringify(questionSetConfigData);
                });
            }
        });
    }
    return JSON.stringify(parsedData);
  }

  playContent(content) {
    this.navigationHelperService.storeResourceCloseUrl();
    setTimeout(() => { // setTimeOut is used to trigger telemetry interact event as changeDetectorRef.detectChanges() not working.
      if (content.mimeType === this.configService.appConfig.PLAYER_CONFIG.MIME_TYPE.collection) {
        if (content.contentType !== this.configService.appConfig.PLAYER_CONFIG.contentType.Course) {
          this.router.navigate(['/resources/play/collection', content.identifier]);
        } else if (content.batchId) {
          this.router.navigate(['/learn/course', content.courseId || content.identifier, 'batch', content.batchId]);
        } else {
          this.router.navigate(['/learn/course', content.identifier]);
        }
      } else if (content.mimeType === this.configService.appConfig.PLAYER_CONFIG.MIME_TYPE.ecmlContent) {
        this.router.navigate(['/resources/play/content', content.identifier]);
      } else {
        this.router.navigate(['/resources/play/content', content.identifier]);
      }
    }, 0);
  }
}
