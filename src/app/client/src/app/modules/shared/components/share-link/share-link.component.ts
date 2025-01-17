import { IShareEventData, IShareEventInput } from '@sunbird/telemetry';
import {
  Component, OnInit, Input, EventEmitter,
  ElementRef, ViewChild, Renderer2, Output
} from '@angular/core';
import { ResourceService } from '../../services/index';
import { IPopup } from 'ng2-semantic-ui-v9';
import { ISharelink, ITelemetryShare } from './../../interfaces';
@Component({
  selector: 'app-share-link',
  templateUrl: './share-link.component.html'
})
export class ShareLinkComponent implements OnInit {
  /**
  * position for the popup
  */
  position: string;
  /**
   * To show / hide modal
  */
  sharelinkModal = false;
  /**
  *baseUrl;
  */
  public baseUrl: string;
  telemetryShare: IShareEventData;
  /**
  *input for Sharelink;
  */
  @Input() shareLink: string;
  /**
  *input for telemetryShare;
  */
  @Input() telemetryShareData: Array<ITelemetryShare> = [];
  /**
  *Output for Sharelink;
  */
  @Output() close = new EventEmitter<any>();
  /**
  *Element Ref  for copyLinkButton;
  */
  @ViewChild('copyLinkButton') copyLinkButton: ElementRef;
  /**
  *Element Ref  for copyLinkData;
  */
  // @ViewChild('copyLinkData') copyLinkData: ElementRef;
  /**
  * To call resource service which helps to use language constant
  */
  public resourceService: ResourceService;
  /**
  * Refrence of UserService
  */
  /**
  * Constructor to create injected service(s) object
  *Default method of unpublished Component class
  *@param {ResourceService} SearchService Reference of SearchService
  *@param {WorkSpaceService} WorkSpaceService Reference of SearchService
  */
  constructor(resourceService: ResourceService, private _renderer: Renderer2) {
    this.resourceService = resourceService;
    this.position = 'top center';
    this.baseUrl = document.location.origin + '/';
  }
  ngOnInit() {
    this.initializeModal();
  }
  /**
  * popDenys
  */
  popDeny(pop) {
    pop.close();
  }
  /**
  * initializeModal
  */
  initializeModal() {
    setTimeout(() => {
      if (this.copyLinkButton) {
        this.copyLinkButton.nativeElement.click();
      }
    }, 300);
    this.telemetryShare = {
      type: 'Link',
      dir: 'out',
      items: this.telemetryShareData
    };
  }
  /**
  * copyLink
  * {object}  copyLinkData -element ref
  * {object}  popup -element ref
  */
  public copyLink(popup: IPopup) {
    popup.open();
    $('#copyLinkData').select();
    document.execCommand('copy');
  }

  public closeModal(contentShareModal) {
    contentShareModal.deny();
    this.close.emit();
  }
}
