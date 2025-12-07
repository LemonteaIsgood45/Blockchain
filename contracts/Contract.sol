// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./Roles.sol";

contract Contract {
    using Roles for Roles.Role;

    Roles.Role private admin;
    Roles.Role private doctor;

    // -----------------------
    //      STRUCTS
    // -----------------------

    struct Report {
        string hash;
        bool approved;
    }

    struct Doctor {
        address id;
        string drHash;
        Report[] reports;
    }

    mapping(address => Doctor) private Doctors;
    address[] public DrIDs;

    constructor() {
        admin.add(msg.sender);
    }

    // -----------------------
    //        ADMIN
    // -----------------------

    function isAdmin() public view returns (bool) {
        return admin.has(msg.sender);
    }

    function addDrInfo(address dr_id, string memory _drInfo_hash) public {
        require(admin.has(msg.sender), "Only Admin");

        Doctor storage drInfo = Doctors[dr_id];
        drInfo.id = dr_id;
        drInfo.drHash = _drInfo_hash;

        DrIDs.push(dr_id);
        doctor.add(dr_id);
    }

    /// @notice Approve a doctor's report + pay 1 ETH reward
    function approveReport(address dr_id, uint reportIndex) public {
        require(admin.has(msg.sender), "Only Admin");
        Doctor storage dr = Doctors[dr_id];

        require(reportIndex < dr.reports.length, "Invalid report index");
        require(dr.reports[reportIndex].approved == false, "Already approved");

        uint reward = 1 ether;
        require(address(this).balance >= reward, "Contract needs more ETH");

        // mark approved
        dr.reports[reportIndex].approved = true;

        // send reward
        (bool sent, ) = dr_id.call{value: reward}("");
        require(sent, "Reward transfer failed");
    }

    // -----------------------
    //        DOCTOR
    // -----------------------

    /// @notice Add a report (ONLY doctor can add THEIR OWN)
    function addReport(string memory reportHash) public {
        require(doctor.has(msg.sender), "Only Doctor");

        Doctors[msg.sender].reports.push(
            Report({
                hash: reportHash,
                approved: false
            })
        );
    }

    /// @notice Get all reports (structs)
    function getReports(address dr_id) public view returns (Report[] memory) {
        return Doctors[dr_id].reports;
    }

    // -----------------------
    //       VIEW
    // -----------------------

    function getAllDrs() public view returns (address[] memory) {
        return DrIDs;
    }

    function getTotalReports() public view returns (uint) {
        uint total = 0;
        for (uint i = 0; i < DrIDs.length; i++) {
            total += Doctors[DrIDs[i]].reports.length;
        }
        return total;
    }

    function getTotalDoctors() public view returns (uint) {
        return DrIDs.length;
    }

    function getDr(address _id) public view returns (string memory) {
        return Doctors[_id].drHash;
    }

    function isDr(address id) public view returns (bool) {
        return doctor.has(id);
    }

    // -----------------------
    //      ALL REPORTS
    // -----------------------

    /// @notice Get ALL report hashes from ALL doctors
    function getAllReportHashes() public view returns (string[] memory) {
        uint total = getTotalReports();
        string[] memory allReports = new string[](total);

        uint index = 0;
        for (uint i = 0; i < DrIDs.length; i++) {
            Doctor storage dr = Doctors[DrIDs[i]];

            for (uint j = 0; j < dr.reports.length; j++) {
                allReports[index] = dr.reports[j].hash;
                index++;
            }
        }
        return allReports;
    }

    // -----------------------
    //    ETH HANDLING
    // -----------------------

    /// @notice allow contract to receive ETH
    receive() external payable {}
    fallback() external payable {}
}
