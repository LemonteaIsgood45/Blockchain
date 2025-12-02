import { Injectable } from '@angular/core';
import { rejects } from 'assert';
import { resolve } from 'dns';
import { Observable } from 'rxjs';
import { BlockchainService } from 'src/services/blockchain.service';
import { IpfsService } from 'src/services/ipfs.service';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  web3: any;
  contract: any;
  account: any;

  isDoctor: boolean = false;
  Doctors: any = [];
  checkComplete: boolean = false;

  DoctorDetails: any = {};

  PatientDetails: any = {};
  patientId: string = '';

  ipfs: any;

  constructor(
    private blockchainService: BlockchainService,
    private ipfsService: IpfsService
  ) {
    this.web3 = blockchainService.getWeb3();
    this.contract = blockchainService.getContract();
    this.account = blockchainService.getAccount();

    this.ipfs = ipfsService.getIPFS();
  }

  checkisDr() {
    this.contract = this.blockchainService.contract;
    console.log(this.contract);

    // If account is a signal, call it to get the value
    const accountAddress = typeof this.blockchainService.account === 'function' 
      ? this.blockchainService.account() 
      : this.blockchainService.account;
    
    this.account = accountAddress;
    console.log('Account Address:', this.account);

    this.contract.methods
      .getAllDrs()
      .call()
      .then((result: any) => {
        console.log('All Station:', result);
        this.Doctors = result;
        
        if (this.Doctors.length > 0) {
          for (var i = 0; i < this.Doctors.length; i++) {
            if (this.Doctors[i].toLowerCase() === this.account.toLowerCase()) {
              this.isDoctor = true;
              console.log('✓ Station verified!');
              break;
            }
          }
        }
        this.checkComplete = true;
      })
      .catch((err: any) => {
        console.log(err);
        this.checkComplete = true;
      });
  }

  async getDoctor(): Promise<any> {
    this.contract = this.blockchainService.contract;

    return new Promise((resolve, reject) => {
      this.contract.methods.getDr(this.account).call().then(async (result: any) => {
        try {
          let data = "";
          for await (const chunk of this.ipfs.cat(result)) {
            data += new TextDecoder().decode(chunk);
          }
          this.DoctorDetails = JSON.parse(data);
          resolve(this.DoctorDetails);
        } catch (err) {
          console.log(err);
          reject(err);
        }
      });
    });
  }

  async getDoctorReports(drId: string): Promise<any> {
    this.contract = this.blockchainService.contract;

    console.log("Fetching reports for Doctor ID:", drId);

    return new Promise((resolve, reject) => {
      this.contract.methods
        .getReports(drId)
        .call()
        .then((result: any) => {
          console.log("Reports:", result);
          resolve(result);
        })
        .catch((err: any) => {
          console.log(err);
          reject(err);
        });
    });
  }

  async addReport(reportData: any): Promise<any> {
    this.contract = this.blockchainService.contract;

    return new Promise(async (resolve, reject) => {
      try {
        const ipfsHash = await this.ipfs.add(JSON.stringify(reportData));
        const hash = ipfsHash.path;

        const contract = await this.blockchainService.getContract();

        const account = await this.blockchainService.getCurrentAccount();

        contract.methods
          .addReport(hash)
          .send({ from: account })
          .on("confirmation", (result: any) => {
            console.log("Report added:", result);
            resolve(result);
          })
          .on("error", (err: any) => {
            console.error(err);
            reject(err);
          });

      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }



  async checkIsPatient(id: string): Promise<any> {
    this.patientId = id;
    return new Promise((resolve, reject) => {
      this.contract.methods
        .isPat(id)
        .call()
        .then((result: any) => {
          console.log(result);
          resolve(result);
        })
        .catch((err: any) => {
          console.log(err);
          reject(err);
        });
    });
  }

  async getPatientDetails(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.contract.methods
        .getPatInfo(id)
        .call()
        .then((result: any) => {
          console.log(result);
          this.ipfs.cat(result).then((data: any) => {
            console.log(data);
            resolve(data);
          });
        })
        .catch((err: any) => {
          console.log(err);
          reject(err);
        });
    });
  }

  async savePatientMedRecord(data: any): Promise<any> {
    console.log(this.patientId, data);
    let PatientData = {
      doctor: this.account,
      data: data,
      date: Date.now()
    }
    return new Promise((resolve, reject) => {
      this.getPatientRecords(this.patientId)
        .then((record: any) => {
          console.log(record);
          
          let PatientRecord;

          if(record != null){
            record['MedRecord'].push(PatientData)
            PatientRecord = record
          }
          else{
            PatientRecord = { "MedRecord":[PatientData] };
          }

          console.log(PatientRecord);
          this.ipfs
            .addJSON(PatientRecord)
            .then((IPFSHash: any) => {
              console.log(IPFSHash);
              this.contract.methods
                .addMedRecord(IPFSHash, this.patientId)
                .send({ from: this.account })
                .on('confirmation', (result: any) => {
                  console.log(result);
                  resolve(result);
                })
                .on('error', (err: any) => {
                  console.log(err);
                  reject(err);
                });
            })
            .catch((err: any) => {
              console.log(err);
              reject(err);
            });
        })
        .catch((err: any) => {
          console.log(err);
          reject(err);
        });
    });
  }

  async getPatientRecords(id: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.contract.methods
        .viewMedRec(id)
        .call()
        .then((result: any) => {
          console.log(result);
          if (result.length >= 1) {
            this.ipfs
              .cat(result)
              .then((record: any) => {
                console.log(JSON.parse(record));
                resolve(JSON.parse(record));
              })
              .catch((err: any) => {
                console.log(err);
                reject(err);
              });
          }
          else{
            resolve(null)
          }
        })
        .catch((err: any) => {
          console.log(err);
          reject(err);
        });
    });
  }
}
