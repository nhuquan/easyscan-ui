import {Component, OnInit} from '@angular/core';
import {ScanService} from '../services/scan.service';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
})
export class ScanPage implements OnInit {

  constructor(public scanService: ScanService) {
  }

  ngOnInit(): void {
    this.scanService.loadSaved();
  }
}
