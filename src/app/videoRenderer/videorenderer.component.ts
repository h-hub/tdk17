import { Component, Renderer2 } from '@angular/core';
import { SharedService } from '../services/shared.service';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-video-chat',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class VideoRendererComponent {

  isLoading = true;
  isConnected = false;
  roomId = '';
  isConnectionError = false;

  constructor(
    private renderer: Renderer2,
    private sharedService: SharedService,
    private eventService: EventService) {
    this.listenEvent();
    this.listenConnectionChangeOrder();
    this.loadVidyoClientLibrary();
  }

  listenConnectionChangeOrder() {
    this.eventService.on('connection:on', () => {
      if (!this.sharedService.vidyoConnector) {
        this.loadVidyoClientLibrary();
      } else {
        this.connectVidyo(this.sharedService.vidyoConnector);
      }
    });

    this.eventService.on('connection:off', () => {
      this.disconnectVidyo(this.sharedService.vidyoConnector);
    });

    this.eventService.on('micMute:on', () => {
      this.sharedService.vidyoConnector.SetMicrophonePrivacy(true);
    });

    this.eventService.on('micMute:off', () => {
      this.sharedService.vidyoConnector.SetMicrophonePrivacy(false);
    });

    this.eventService.on('cameraMute:on', () => {
      this.sharedService.vidyoConnector.SetCameraPrivacy(true);
    });

    this.eventService.on('cameraMute:off', () => {
      this.sharedService.vidyoConnector.SetCameraPrivacy(false);
    });

    this.renderer.listen('document', 'connection:on', () => {
      if (!this.sharedService.vidyoConnector) {
        this.loadVidyoClientLibrary();
      } else {
        this.connectVidyo(this.sharedService.vidyoConnector);
      }
    })

    this.renderer.listen('document', 'connection:off', () => {
      this.disconnectVidyo(this.sharedService.vidyoConnector);
    });

    this.renderer.listen('document', 'micMute:on', () => {
      this.sharedService.vidyoConnector.SetMicrophonePrivacy(true);
    });

    this.renderer.listen('document', 'micMute:off', () => {
      this.sharedService.vidyoConnector.SetMicrophonePrivacy(false);
    });

    this.renderer.listen('document', 'cameraMute:on', () => {
      this.sharedService.vidyoConnector.SetCameraPrivacy(true);
    });

    this.renderer.listen('document', 'cameraMute:off', () => {
      this.sharedService.vidyoConnector.SetCameraPrivacy(false);
    });
  }

  listenEvent() {
    document.addEventListener('vidyoclient:ready', (e) => {
      console.log(e);
      this.renderVideo(e);
    });
  }

  renderVideo(VC) {

    setTimeout(function() {
      VC.detail.CreateVidyoConnector({
        viewId: 'renderer',                            // Div ID where the composited video will be rendered, see VidyoConnector.html
        viewStyle: 'VIDYO_CONNECTORVIEWSTYLE_Default', // Visual style of the composited renderer
        remoteParticipants: 16,                        // Maximum number of participants
        logFileFilter: 'warning all@VidyoConnector info@VidyoClient',
        logFileName: '',
        userData: ''
      }).then((vidyoConnector) => {
        this.sharedService.vidyoConnector = vidyoConnector;
        this.connectVidyo(vidyoConnector);
      }).catch(() => {
        console.log('CreateVidyoConnector Failed');
        this.isLoading = false;
        this.isConnectionError = true;
      });
    }, 1);
  }

  loadVidyoClientLibrary() {
    let webrtc = true;
    let plugin = false;

    const userAgent = navigator.userAgent || navigator.vendor; // || window.opera
    const isFirefox = userAgent.indexOf('Firefox') !== -1;
    const isChrome = userAgent.indexOf('Chrome') !== -1;

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

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://static.vidyo.io/latest/javascript/VidyoClient/VidyoClient.js?' +
      'onload=onVidyoClientLoaded&webrtc=' + webrtc + '&plugin=' + plugin;
    document.getElementsByTagName('head')[0].appendChild(script);
  }

  disconnectVidyo(vidyoConnector) {
    vidyoConnector.Disconnect();
  }

  connectVidyo(vidyoConnector) {
    console.log('passed in token', this.sharedService.user.token);
    console.log('passed in user name', this.sharedService.user.name);
    console.log('passed in room id', this.sharedService.user.roomId);

    this.roomId = this.sharedService.user.roomId || 'demoRoom';
    vidyoConnector.Connect({
      host: 'prod.vidyo.io',
      token: this.sharedService.user.token,
      displayName: this.sharedService.user.name,
      resourceId: this.sharedService.user.roomId,

      onSuccess: () => {
        // Connected
        console.log('connected!');
        this.isConnected = true;
        this.sharedService.isConnecte = true;
        //$broadcast('connectedStatus', { isConnected: true });
      },
      onFailure: (reason) => {
        // Failed
        this.isConnectionError = true;
        console.log('failed! The reason: ', reason);
      },
      onDisconnected: (reason) => {
        // Disconnected
        this.isConnected = false;
        console.log('disconnected! Reason: ', reason);
        this.sharedService.isConnecte = false;
        //this.$rootScope.$broadcast('connectedStatus', { isConnected: false });
      }
    }).then((status) => {
      this.isLoading = false;
      if (status) {
        this.handlePaticipants(vidyoConnector);
        this.receiveMessage(vidyoConnector);
      } else {
        this.isConnectionError = true;
        console.error('ConnectCall Failed');
      }
    }).catch(() => {
      this.isConnectionError = true;
      this.isLoading = false;
      console.error('ConnectCall Failed');
    });
  }

  receiveMessage(vidyoConnector) {
    vidyoConnector.RegisterMessageEventListener({
      onChatMessageReceived: (participant, chatMessage) => {
        vidyoConnector.onSendMessage({ id: participant.id, name: participant.name, content: chatMessage.body });
      }
    }).then(() => {
      console.log('RegisterParticipantEventListener Success');
    }).catch(() => {
      console.log('RegisterParticipantEventListener Failed');
    });
  }

  handlePaticipants(vidyoConnector) {
    vidyoConnector.RegisterParticipantEventListener(
      {
        onJoined: (participant) => {
          console.log('Joined', participant);
          vidyoConnector.onAddUser({ id: participant.id, name: participant.name });
        },
        onLeft: (participant) => {
          console.log('Left', participant);
          vidyoConnector.onRemoveUser({ id: participant.id, name: participant.name });
        },
        onDynamicChanged: (participants, cameras) => { /* Ordered array of participants according to rank */ },
        onLoudestChanged: (participant, audioOnly) => { /* Current loudest speaker */ }
      }
    ).then(() => {
      console.log('RegisterParticipantEventListener Success');
    }).catch(() => {
      console.log('RegisterParticipantEventListener Failed');
    });
  }

}
