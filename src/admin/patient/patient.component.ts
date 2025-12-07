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
  approved: boolean;
  reportIndex?: number;
}

@Component({
  selector: 'app-patient',
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.sass']
})
export class PatientComponent implements OnInit {
  searchStationId: string = '';
  stationInfo: any = null;
  reports: AirQualityReport[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  searchCompleted: boolean = false;
  approvingReportIndex: number | null = null;
  contractBalance: string | null = null;

  constructor(
    private doctorService: DoctorService,
    private ipfsService: IpfsService,
    private blockchainService: BlockchainService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadContractBalance();
  }

  async loadContractBalance() {
    try {
      const contract = await this.blockchainService.getContract();
      const web3 = await this.blockchainService.getWeb3();
      
      const balanceWei = await web3.eth.getBalance(contract.options.address);
      this.contractBalance = web3.utils.fromWei(balanceWei, 'ether');
      
      console.log('Contract balance loaded:', this.contractBalance, 'ETH');
    } catch (error) {
      console.error('Error loading contract balance:', error);
      this.contractBalance = null;
    }
  }

  async fundContract() {
    try {
      const contract = await this.blockchainService.getContract();
      const accounts = await this.blockchainService.getAccounts();
      const web3 = await this.blockchainService.getWeb3();

      if (!accounts || accounts.length === 0) {
        alert('Please connect your wallet.');
        return;
      }

      const amount = prompt('How much ETH to send to contract?', '5');
      if (!amount) return;

      const confirmed = confirm(
        `Send ${amount} ETH to contract?\n\n` +
        `From: ${accounts[0]}\n` +
        `To: ${contract.options.address}`
      );

      if (!confirmed) return;

      await web3.eth.sendTransaction({
        from: accounts[0],
        to: contract.options.address,
        value: web3.utils.toWei(amount, 'ether')
      });

      const balance = await web3.eth.getBalance(contract.options.address);
      const balanceEth = web3.utils.fromWei(balance, 'ether');

      alert(`Success! Contract now has ${balanceEth} ETH`);

    } catch (error) {
      console.error('Error funding contract:', error);
      alert('Failed to fund contract. Check console for details.');
    }
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

      // Get reports for this station (now returns Report structs with approved field)
      const reportStructs = await contract.methods
        .getReports(this.searchStationId)
        .call();

      console.log('Report structs:', reportStructs);

      if (reportStructs && reportStructs.length > 0) {
        // Fetch each report from IPFS
        const reportPromises = reportStructs.map(async (reportStruct: any, index: number) => {
          try {
            let data = '';
            const ipfs = this.ipfsService.getIPFS();
            
            for await (const chunk of ipfs.cat(reportStruct.hash)) {
              data += new TextDecoder().decode(chunk);
            }
            
            const report = JSON.parse(data);
            report.ipfsHash = reportStruct.hash;
            report.approved = reportStruct.approved;
            report.reportIndex = index; // Store the index for approval
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

  async approveReport(reportIndex: number) {
    const report = this.reports[reportIndex];
    if (!report || report.approved) {
      return;
    }

    const confirmApproval = confirm(
      `Are you sure you want to approve this report?\n\n` +
      `Location: ${report.location}\n` +
      `Timestamp: ${this.formatDate(report.timestamp)}\n` +
      `AQI: ${report.aqi}\n\n` +
      `This will send 1 ETH reward to the station.`
    );

    if (!confirmApproval) {
      return;
    }

    this.approvingReportIndex = reportIndex;

    try {
      const contract = await this.blockchainService.getContract();
      const accounts = await this.blockchainService.getAccounts();

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      const actualReportIndex = report.reportIndex;

      // Send the transaction
      const result = await contract.methods
        .approveReport(this.searchStationId, actualReportIndex)
        .send({ from: accounts[0] });

      console.log('Transaction result:', result);

      // Update the local report status
      this.reports[reportIndex].approved = true;

      // Reload contract balance after approval
      await this.loadContractBalance();

      alert('Report approved successfully! 1 ETH reward has been sent to the station.');

    } catch (error: any) {
      console.error('Error approving report:', error);
      
      let errorMessage = 'Failed to approve report. ';
      
      if (error.message) {
        if (error.message.includes('Already approved')) {
          errorMessage += 'This report has already been approved.';
        } else if (error.message.includes('Invalid report index')) {
          errorMessage += `Invalid report index.`;
        } else if (error.message.includes('Contract needs more ETH')) {
          errorMessage += 'The contract does not have enough ETH to pay the reward.';
        } else if (error.message.includes('Reward transfer failed')) {
          errorMessage += 'Failed to send reward to the station.';
        } else {
          errorMessage += error.message || 'Please try again.';
        }
      }
      
      alert(errorMessage);
    } finally {
      this.approvingReportIndex = null;
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