// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./Roles.sol";

contract Contract {
    using Roles for Roles.Role;

    Roles.Role private admin;
    Roles.Role private doctor;

    struct Doctor {
        address id;
        string drHash;
        string[] reports; // <--- ADD REPORT LIST
    }

    mapping(address => Doctor) private Doctors;
    address[] public DrIDs;

    constructor() {
        admin.add(msg.sender);
    }

    // -----------------------
    //       ADMIN
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

    // -----------------------
    //       DOCTOR
    // -----------------------

    /// @notice Add a report (ONLY doctor can add THEIR OWN)
    function addReport(string memory reportHash) public {
        require(doctor.has(msg.sender), "Only Doctor");
        Doctors[msg.sender].reports.push(reportHash);
    }

    /// @notice Get all reports of a doctor
    function getReports(address dr_id) public view returns (string[] memory) {
        return Doctors[dr_id].reports;
    }

    // -----------------------
    //       VIEW
    // -----------------------

    function getAllDrs() public view returns (address[] memory) {
        return DrIDs;
    }

    function getDr(address _id) public view returns (string memory) {
        return Doctors[_id].drHash;
    }

    function isDr(address id) public view returns (bool) {
        return doctor.has(id);
    }
}
