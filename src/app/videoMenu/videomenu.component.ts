import { Component, Renderer2 } from '@angular/core';
import { SharedService } from '../services/shared.service';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-videomenu-chat',
  templateUrl: './videomenu.component.html',
  styleUrls: ['./videomenu.component.css']
})
export class VideoMenuComponent {
  isConnected = false;
  muteCamera = false;
  muteMic = false;
  isWorking = false;

  constructor(
    private renderer: Renderer2,
    private sharedService: SharedService,
    private eventService: EventService) {
    this.updateConnectedStatus();
  }

  updateConnectedStatus() {
    this.renderer.listen('document', 'connectedStatus', (data) => {
      setTimeout(function() {
        this.isWorking = false;
        this.isConnected = data.isConnected;
      });
    });
  }

  openChatWindow() {
    //this.onOpenChat();
  }

  toggleConnect() {
    if (!this.isConnected) {
      this.isWorking = true;
      this.eventService.broadcast({ name: 'connection:on' });
    } else {
      this.isWorking = true;
      this.eventService.broadcast({ name: 'connection:off' });
    }
  }

  toggleMic() {
    if (!this.muteMic) {
      this.eventService.broadcast({ name: 'micMute:on' });
    } else {
      this.eventService.broadcast({ name: 'micMute:off' });
    }
    this.muteMic = !this.muteMic;
  }

  toggleCamera() {
    if (!this.muteCamera) {
      this.eventService.broadcast({ name: 'cameraMute:on' });
    } else {
      this.eventService.broadcast({ name: 'cameraMute:off' });
    }
    this.muteCamera = !this.muteCamera;
  }
}
