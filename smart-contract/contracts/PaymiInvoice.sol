// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Custom IERC20 Interface
interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PaymiInvoice {

    // Invoice Statuses
    enum InvoiceStatus { 
        PENDING,   // Initial state
        PAID,      // Fully paid
        CANCELLED  // Cancelled by platform
    }

    // USDT Token Contract (Tron Mainnet/Nile)
    IERC20 public USDT_TOKEN;

    // Platform and Owner Management
    address public platformWallet;
    address public owner;

    // Invoice Structure
    struct Invoice {
        address freelancer;      // Who created the invoice
        uint256 amount;          // Invoice amount in USDT
        InvoiceStatus status;    // Current invoice status
        uint256 createdAt;       // Timestamp of invoice creation
        uint256 paidAt;          // Timestamp of payment
    }

    // Mapping to store invoices
    mapping(uint256 => Invoice) public invoices;
    mapping(address => uint256[]) public freelancerInvoices;

    uint256 public invoiceCounter;

    // Events
    event InvoiceCreated(
        uint256 indexed invoiceId, 
        address indexed freelancer, 
        uint256 amount
    );
    event InvoicePaid(
        uint256 indexed invoiceId, 
        uint256 amount
    );
    event InvoiceCancelled(
        uint256 indexed invoiceId
    );

    modifier onlyPlatform() {
        require(msg.sender == platformWallet, "Not authorized platform");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized owner");
        _;
    }

    constructor(address _usdtTokenAddress) {
        require(_usdtTokenAddress != address(0), "Invalid USDT address");
        USDT_TOKEN = IERC20(_usdtTokenAddress);
        owner = msg.sender;
        platformWallet = msg.sender;
    }

    /**
     * @dev Create an invoice for a specific client
     * @param _amount Invoice amount in USDT
     * @return invoiceId Unique invoice identifier
     */
    function createInvoice(
        uint256 _amount
    ) external returns (uint256 invoiceId) {
        require(_amount > 0, "Invalid invoice amount");

        invoiceId = ++invoiceCounter;

        invoices[invoiceId] = Invoice({
            freelancer: msg.sender,
            amount: _amount,
            status: InvoiceStatus.PENDING,
            createdAt: block.timestamp,
            paidAt: 0
        });

        freelancerInvoices[msg.sender].push(invoiceId);

        emit InvoiceCreated(invoiceId, msg.sender, _amount);
        return invoiceId;
    }

    /**
     * @dev Pay an invoice using USDT
     * @param _invoiceId Invoice to be paid
     */
    function payInvoice(uint256 _invoiceId) external {
        Invoice storage invoice = invoices[_invoiceId];
        
        require(invoice.createdAt > 0, "Invoice does not exist");
        require(invoice.status == InvoiceStatus.PENDING, "Invoice not pending");

        // Transfer USDT directly from sender to freelancer
        USDT_TOKEN.transferFrom(msg.sender, invoice.freelancer, invoice.amount);

        // Update invoice status
        invoice.status = InvoiceStatus.PAID;
        invoice.paidAt = block.timestamp;

        emit InvoicePaid(_invoiceId, invoice.amount);
    }


    /**
     * @dev Get freelancer's invoices
     */
    function getFreelancerInvoices(address _freelancer) external view returns (uint256[] memory) {
        return freelancerInvoices[_freelancer];
    }

    /**
     * @dev Get invoice details
     */
    function getInvoiceDetails(uint256 _invoiceId) external view returns (
        address freelancer,
        uint256 amount,
        InvoiceStatus status,
        uint256 createdAt,
        uint256 paidAt
    ) {
        Invoice memory invoice = invoices[_invoiceId];
        return (
            invoice.freelancer,
            invoice.amount,
            invoice.status,
            invoice.createdAt,
            invoice.paidAt
        );
    }

    // Platform management functions
    function setPlatformWallet(address _newPlatform) external onlyOwner {
        platformWallet = _newPlatform;
    }
}