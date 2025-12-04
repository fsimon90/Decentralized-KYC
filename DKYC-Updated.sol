// SPDX-License-Identifier: GPL-3.0
// Group Members: Febu, Christas, Gaurav
pragma solidity ^0.8.16;

contract DecentralizedKYC {
    address public owner;
    uint256 public verificationFee = 0.01 ether; // Example fee for KYC submission

    struct CustomerInfo {
        string name;
        string dob;
        string homeAddress;
        bytes32 documentHash;     // Hash of uploaded file (SHA-256)
        string fileKey;           // <-- NEW: S3 file path (e.g., uploads/1234.pdf)
        bool isVerified;
    }

    mapping(address => CustomerInfo) private customers;
    mapping(address => bool) private validators;
    mapping(address => mapping(address => bool)) private accessPermissions;
    mapping(address => uint256) public deposits;

    // -------- EVENTS --------
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event KYCSubmitted(address indexed customer, bytes32 documentHash, string fileKey);
    event KYCVerified(address indexed validator, address indexed customer);
    event AccessGranted(address indexed customer, address indexed bank);
    event AccessRevoked(address indexed customer, address indexed bank);
    event DepositReceived(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event VerificationFeeChanged(uint256 newFee);

    // -------- MODIFIERS --------
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action.");
        _;
    }

    modifier onlyValidator() {
        require(validators[msg.sender], "Only a validator can perform this action.");
        _;
    }

    modifier customerExists(address customer) {
        require(customers[customer].documentHash != bytes32(0), "Customer does not exist.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // -------- VALIDATOR MANAGEMENT --------
    function addValidator(address _validator) external onlyOwner {
        require(_validator != address(0), "Invalid validator address.");
        validators[_validator] = true;
        emit ValidatorAdded(_validator);
    }

    function removeValidator(address _validator) external onlyOwner {
        require(validators[_validator], "Validator not found.");
        validators[_validator] = false;
        emit ValidatorRemoved(_validator);
    }

    // --------------------------------------------------
    // -------- KYC SUBMISSION WITH FILE SUPPORT --------
    // --------------------------------------------------
    function submitKYC(
        address customer,
        string memory _name,
        string memory _dob,
        string memory _homeAddress,
        bytes32 _documentHash,     // NEW: File hash from Lambda
        string memory _fileKey     // NEW: S3 file key
    ) external payable {
        require(customer != address(0), "Invalid address");
        require(msg.value >= verificationFee, "Insufficient ETH sent for KYC");
        require(customers[customer].documentHash == bytes32(0), "KYC already exists");

        // fallback old behavior only if no hash is provided
        bytes32 finalHash = 
            _documentHash != bytes32(0)
                ? _documentHash
                : keccak256(abi.encodePacked(
                    _name, _dob, _homeAddress, customer, block.timestamp
                ));

        customers[customer] = CustomerInfo({
            name: _name,
            dob: _dob,
            homeAddress: _homeAddress,
            documentHash: finalHash,
            fileKey: _fileKey,
            isVerified: false
        });

        deposits[customer] += msg.value;

        emit KYCSubmitted(customer, finalHash, _fileKey);
    }

    // -------- VERIFICATION --------
    function verifyKYC(address _customer) 
        external 
        onlyValidator 
        customerExists(_customer) 
    {
        require(!customers[_customer].isVerified, "KYC already verified.");
        customers[_customer].isVerified = true;
        emit KYCVerified(msg.sender, _customer);
    }

    // -------- ACCESS CONTROL --------
    function grantAccess(address _bank) external customerExists(msg.sender) {
        require(customers[msg.sender].isVerified, "KYC not verified.");
        accessPermissions[msg.sender][_bank] = true;
        emit AccessGranted(msg.sender, _bank);
    }

    function revokeAccess(address _bank) external customerExists(msg.sender) {
        require(accessPermissions[msg.sender][_bank], "Access not previously granted.");
        accessPermissions[msg.sender][_bank] = false;
        emit AccessRevoked(msg.sender, _bank);
    }

    // --------------------------------------------------
    // -------- GET KYC INFO (Banker Page) --------------
    // --------------------------------------------------
    function getKYCInfo(address _customer)
        external
        view
        returns (
            string memory name,
            string memory dob,
            string memory homeAddress,
            bytes32 documentHash,
            string memory fileKey,        // <-- NEW: return S3 path
            bool isVerified
        )
    {
        require(
            accessPermissions[_customer][msg.sender] || msg.sender == _customer,
            "Access denied."
        );

        CustomerInfo memory customer = customers[_customer];

        return (
            customer.name,
            customer.dob,
            customer.homeAddress,
            customer.documentHash,
            customer.fileKey,
            customer.isVerified
        );
    }

    // --------------------------------------------------
    // -------- UPDATE KYC WITH NEW FILE ----------------
    // --------------------------------------------------
    function updateKYC(
        address customer,
        string memory _name,
        string memory _dob,
        string memory _homeAddress,
        bytes32 _documentHash,     // allow new file
        string memory _fileKey     // allow new S3 key
    ) external payable {
        require(customer != address(0), "Invalid address");
        require(customers[customer].documentHash != bytes32(0), "No existing record");
        require(msg.value >= verificationFee, "Insufficient ETH for KYC update.");

        deposits[customer] += msg.value;

        // If new hash isn't provided → generate fresh auto hash
        bytes32 newHash =
            _documentHash != bytes32(0)
                ? _documentHash
                : keccak256(
                    abi.encodePacked(_name, _dob, _homeAddress, customer, block.timestamp)
                );

        customers[customer].name = _name;
        customers[customer].dob = _dob;
        customers[customer].homeAddress = _homeAddress;
        customers[customer].documentHash = newHash;
        customers[customer].fileKey = _fileKey; // update file path too
    }

    // -------- ETH HANDLING --------
    receive() external payable {
        deposits[msg.sender] += msg.value;
        emit DepositReceived(msg.sender, msg.value);
    }

    function withdraw(uint256 _amount) external onlyOwner {
        require(address(this).balance >= _amount, "Insufficient contract balance.");
        (bool success, ) = payable(owner).call{value: _amount}("");
        require(success, "ETH transfer failed.");
        emit Withdrawn(owner, _amount);
    }

    function setVerificationFee(uint256 _newFee) external onlyOwner {
        require(_newFee > 0, "Fee must be greater than zero.");
        verificationFee = _newFee;
        emit VerificationFeeChanged(_newFee);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
