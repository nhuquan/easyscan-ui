import { Component, OnInit } from '@angular/core';
import { ScanService } from '../services/scan.service';
import { ActionSheetController } from '@ionic/angular';
import { Document } from '../domain/document';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
})
export class ScanPage implements OnInit {

  constructor(public scanService: ScanService,
              public actionSheetController: ActionSheetController) {}

  ngOnInit(): void {
    this.scanService.loadSaved();
  }

  public async showActionSheet(document: Document, position: number) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Documents',
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.scanService.deleteDocument(document, position);
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          // Nothing to do, action sheet is automatically closed
        }
      }]
    });
    await actionSheet.present();
  }
}
