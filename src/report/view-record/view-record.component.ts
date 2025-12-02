import { Component, OnInit } from '@angular/core';
import { DoctorService } from '../services/doctor.service';
import { IpfsService } from 'src/services/ipfs.service';

interface AirQualityReport {
  reportId: string;
  timestamp: string;
  location: string;
  pm25: number;
  pm10: number;
  aqi: number;
  temperature: number;
  humidity: number;
  co2: number;
  no2: number;
  so2: number;
  o3: number;
  status: 'Good' | 'Moderate' | 'Unhealthy' | 'Hazardous';
  notes?: string;
  ipfsHash?: string;
}

@Component({
  selector: 'app-view-record',
  templateUrl: './view-record.component.html',
  styleUrls: ['./view-record.component.sass']
})
export class ViewRecordComponent implements OnInit {
  reports: AirQualityReport[] = [];
  loading: boolean = true;
  error: string = '';
  doctorId: string = '';

  constructor(
    private doctorService: DoctorService,
    private ipfsService: IpfsService
  ) {}

  async ngOnInit() {
    await this.loadReports();
  }

  async loadReports() {
    try {
      this.loading = true;
      this.error = '';

      const account = this.doctorService.account;
      this.doctorId = account;

      const reportHashes = await this.doctorService.getDoctorReports(account);
      
      if (reportHashes && reportHashes.length > 0) {
        const reportPromises = reportHashes.map(async (hash: string) => {
          try {
            let data = '';
            const ipfs = this.ipfsService.getIPFS();
            
            for await (const chunk of ipfs.cat(hash)) {
              data += new TextDecoder().decode(chunk);
            }
            
            const report = JSON.parse(data);
            report.ipfsHash = hash;
            return report;
          } catch (err) {
            console.error('Error fetching report from IPFS:', err);
            return null;
          }
        });

        const fetchedReports = await Promise.all(reportPromises);
        this.reports = fetchedReports.filter(report => report !== null);
      }

      this.loading = false;
    } catch (err: any) {
      console.error('Error loading reports:', err);
      this.error = 'Failed to load reports. Please try again.';
      this.loading = false;
    }
  }

  getAQIColor(aqi: number): string {
    if (aqi <= 50) return '#00e400'; // Good - Green
    if (aqi <= 100) return '#ffff00'; // Moderate - Yellow
    if (aqi <= 150) return '#ff7e00'; // Unhealthy for Sensitive - Orange
    if (aqi <= 200) return '#ff0000'; // Unhealthy - Red
    if (aqi <= 300) return '#8f3f97'; // Very Unhealthy - Purple
    return '#7e0023'; // Hazardous - Maroon
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Good': return '#00e400';
      case 'Moderate': return '#ffff00';
      case 'Unhealthy': return '#ff7e00';
      case 'Hazardous': return '#ff0000';
      default: return '#gray';
    }
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  async refreshReports() {
    await this.loadReports();
  }
}