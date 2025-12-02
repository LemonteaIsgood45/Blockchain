import { Component, OnInit, effect } from '@angular/core';
import { BlockchainService } from 'src/services/blockchain.service';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.sass']
})
export class DashboardHomeComponent implements OnInit {

  Titles: any = ['Active Station', 'Reports']
  Images: any = ['fa-regular fa-house', 'fa-solid fa-clipboard']
  Count: number[] = [0, 0];
  Background: any = ['blue', 'violet']

  accountBalance: any;

  constructor(blockchainService: BlockchainService) {
    effect(() => {

      this.accountBalance = blockchainService.balance()
      Promise.all([blockchainService.getDoctorsNumber(), blockchainService.getTotalReportNumber()]).then(([doctorsNumber, reportsNumber]) => {
        this.Count = [doctorsNumber, reportsNumber];
      });
      console.log(this.accountBalance);

    })
  }

  ngOnInit(): void {

  }





}
