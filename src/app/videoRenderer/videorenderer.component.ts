import { Component, OnInit, AfterViewInit, Renderer } from '@angular/core';
import { SharedService } from '../services/shared.service'; 

@Component({
  selector: 'video-chat',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class VideoRendererComponent implements OnInit, AfterViewInit {

  isLoading = true;
  isConnected = false;
  roomId = "";
  isConnectionError = false;

  constructor(
    private renderer : Renderer,
    private sharedService: SharedService) {
    // this.$timeout = $timeout;
    // this.$rootScope = $rootScope;
    
    // this.listenEvent();
    this.listenConnectionChangeOrder();
    this.loadVidyoClientLibrary();
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
  }

  listenConnectionChangeOrder() {

    this.renderer.listen('connection', 'on', () => {
      if (!this.sharedService.vidyoConnector) {
        this.loadVidyoClientLibrary();
      } else {
        //this.connectVidyo(this.sharedService.vidyoConnector);
      }
    })

    this.renderer.listen('connection', 'off', () => {

    });

    this.renderer.listen('micMute', 'on', () => {

    });

    this.renderer.listen('micMute', 'off', () => {

    });

    this.renderer.listen('cameraMute', 'on', () => {

    });

    this.renderer.listen('cameraMute', 'off', () => {

    });

    // this.$rootScope.$on('connection:off', () => {
    //   this.disconnectVidyo(this.$rootScope.vidyoConnector);
    // });

    // this.$rootScope.$on('micMute:on', () => {
    //   this.$rootScope.vidyoConnector.SetMicrophonePrivacy(true);
    // });

    // this.$rootScope.$on('micMute:off', () => {
    //   this.$rootScope.vidyoConnector.SetMicrophonePrivacy(false);
    // });

    // this.$rootScope.$on('cameraMute:on', () => {
    //   this.$rootScope.vidyoConnector.SetCameraPrivacy(true);
    // });

    // this.$rootScope.$on('cameraMute:off', () => {
    //   this.$rootScope.vidyoConnector.SetCameraPrivacy(false);
    // });
  }

  loadVidyoClientLibrary() {
    var webrtc = true;
    var plugin = false;

    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    var isFirefox = userAgent.indexOf("Firefox") != -1;
    var isChrome = userAgent.indexOf("Chrome") != -1;

    if (isChrome || isFirefox) {
      /* Supports WebRTC */
      webrtc = true;
      plugin = false;
      console.log('Either chrome or Firefox');
    } else  {
      plugin = true;
      webrtc = false;
      console.log('Not chrome or Firefox');
    }

    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://static.vidyo.io/latest/javascript/VidyoClient/VidyoClient.js?onload=onVidyoClientLoaded&webrtc=' + webrtc + '&plugin=' + plugin;
    document.getElementsByTagName('head')[0].appendChild(script);
  }

}
