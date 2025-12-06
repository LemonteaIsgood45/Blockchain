import { Component, OnInit } from '@angular/core';
import { DoctorService } from '../services/doctor.service';
import { IpfsService } from '../../services/ipfs.service';
import { BlockchainService } from '../../services/blockchain.service';

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
  selector: 'app-patient',
  templateUrl: './search-station.component.html',
  styleUrls: ['./search-station.component.sass']
})
export class SearchStationComponent implements OnInit {
  searchStationId: string = '';
  stationInfo: any = null;
  reports: AirQualityReport[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  searchCompleted: boolean = false;

  Doctors: string[] = [];

  Doctor: any = {
    docID: '',
    fName: 'First Name',
    lName: 'Last Name',
    Doj: '',
    emailID: 'test_name@mail.com',
    phone: '123456789',
    city: 'city',
    state: 'state',
    specialty: 'specialty',
    imageHash: '',
  };

  DoctorDetails: any = [];

  loaded: boolean = false;
  loadComplete: boolean = false;

  showProgressCard: boolean = false;
  showProgressWarn: boolean = false;
  progressMsg: string = ''

  constructor(
    private doctorService: DoctorService,
    private ipfsService: IpfsService,
    private blockchainService: BlockchainService
  ) {}

  ngOnInit(): void {
    this.GetDoctors()
  }



  async searchReports() {
    if (!this.searchStationId || !this.searchStationId.trim()) {
      this.errorMessage = 'Please enter a valid Station ID';
      return;
    }

    // Validate Ethereum address format
    if (!this.isValidEthereumAddress(this.searchStationId)) {
      this.errorMessage = 'Invalid Station ID format. Please enter a valid Ethereum address.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.stationInfo = null;
    this.reports = [];
    this.searchCompleted = false;

    try {
      const contract = await this.blockchainService.getContract();

      // First, check if this is a valid doctor/station
      const isDoctor = await contract.methods.isDr(this.searchStationId).call();
      
      if (!isDoctor) {
        this.errorMessage = 'Station ID not found. This address is not registered as a monitoring station.';
        this.isLoading = false;
        this.searchCompleted = true;
        return;
      }

      // Get station information
      await this.getStationInfo(this.searchStationId);

      // Get reports for this station
      const reportHashes = await contract.methods
        .getReports(this.searchStationId)
        .call();

      console.log('Report hashes:', reportHashes);

      if (reportHashes && reportHashes.length > 0) {
        // Fetch each report from IPFS
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
        
        // Sort reports by timestamp (newest first)
        this.reports.sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
      }

      this.searchCompleted = true;
      this.isLoading = false;

    } catch (error: any) {
      console.error('Error searching reports:', error);
      this.errorMessage = 'Failed to load reports. Please try again.';
      this.isLoading = false;
      this.searchCompleted = true;
    }
  }

  async getStationInfo(stationId: string) {
    try {
      const contract = await this.blockchainService.getContract();
      const stationHash = await contract.methods.getDr(stationId).call();

      if (stationHash) {
        let data = '';
        const ipfs = this.ipfsService.getIPFS();
        
        for await (const chunk of ipfs.cat(stationHash)) {
          data += new TextDecoder().decode(chunk);
        }
        
        this.stationInfo = JSON.parse(data);
        console.log('Station info:', this.stationInfo);
      }
    } catch (error) {
      console.error('Error fetching station info:', error);
      // Continue even if station info fails
    }
  }

  loadDrDetails() {
    console.log(this.Doctors);
    this.DoctorDetails = []
    for (var i = 0; i <= this.Doctors.length; i++) {
      if (this.Doctors[i])
        this.doctorService.getDoctorDetails(this.Doctors[i]).then((data: any) => {
          this.DoctorDetails.push(data)
        });
    }
    this.progressMsg = ''
    this.showProgressCard = false
  }

  GetDoctors(): any {
    this.showProgressCard = true;
    this.showProgressWarn = false;
    this.progressMsg = ''
    this.loadComplete = false

    this.DoctorDetails = []

    if (this.DoctorDetails.length >= 1) {
      this.showProgressCard = false
      return 0
    }

    this.doctorService.getDrs().then((docs: any) => {
      this.Doctors = docs
      if (this.Doctors.length >= 1) {
        this.loadDrDetails();
        this.progressMsg = "Found " + this.Doctors.length + " Accounts"
      } else {
        this.progressMsg = 'No Doctors in the Network....'
        this.loadComplete = true
        this.showProgressCard = false
      }
    })

  }

  isValidEthereumAddress(address: string): boolean {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  async refreshReports() {
    if (this.searchStationId) {
      await this.searchReports();
    }
  }

  clearSearch() {
    this.searchStationId = '';
    this.stationInfo = null;
    this.reports = [];
    this.errorMessage = '';
    this.searchCompleted = false;
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
}