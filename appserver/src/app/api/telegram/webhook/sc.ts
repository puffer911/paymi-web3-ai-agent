
import { TronWeb } from "tronweb";
import { NextResponse } from "next/server";
import { implementationABI } from '../../../../lib/contract/abi';
import { CONFIG, MESSAGES } from './config';
import { sendMessage, answerCallbackQuery } from './utils';

// TRON setup
const tronWeb = new TronWeb({
  fullHost: CONFIG.TRON_FULL_NODE_URL,
  privateKey: CONFIG.TRON_ADMIN_PRIVATE_KEY,
});

// Validate TRON address format and existence
export async function validateTronAddress(address: string): Promise<{ 
  isValid: boolean, 
  message?: string 
}> {
  // Check basic format
  if (!address || !address.startsWith('T') || address.length !== 34) {
    return {
      isValid: false,
      message: "❌ Invalid TRON address format. Address should:\n" +
               "- Start with 'T'\n" +
               "- Be 34 characters long\n" +
               "Example: TXyz123..."
    };
  }

  // Additional on-chain validation (optional)
  try {
    if (!tronWeb.isAddress(address)) {
      return {
        isValid: false,
        message: "❌ Address does not exist on TRON network. " +
                 "Please verify the address carefully."
      };
    }

    // Optional: Check address balance or other on-chain properties
    const balance = await tronWeb.trx.getBalance(address);
    
    return {
      isValid: true,
      message: balance > 0 
        ? "✅ Valid TRON address with existing balance." 
        : "⚠️ Valid address, but no TRX balance detected."
    };
  } catch (error) {
    return {
      isValid: false,
      message: "❌ Error validating address. Please try again."
    };
  }
}

export async function handleListInvoices(chatId: number, userAddress: string) {
  if (!tronWeb.isAddress(userAddress)) {
    await sendMessage(
      chatId,
      "Invalid TRON address. Please enter a valid TRON wallet address."
    );
    return NextResponse.json({ status: "invalid_address" });
  }

  try {
    if (!CONFIG.CONTRACT_ADDRESS) {
      throw new Error("Contract Address is not defined");
    }

    const contract = await tronWeb.contract(implementationABI, CONFIG.CONTRACT_ADDRESS);
    const invoiceIds = await contract
      .methods['getFreelancerInvoices'](userAddress)
      .call();

    if (invoiceIds.length === 0) {
      await sendMessage(chatId, MESSAGES.NO_INVOICES);
      return NextResponse.json({ status: "no_invoices" });
    }

    let invoiceMessage = `📋 Invoices for ${userAddress}:\n\n`;

    for (const invoiceId of invoiceIds) {
      const invoiceDetails = await contract
        .getInvoiceDetails(invoiceId)
        .call();

      const amountInUSDT = Number(invoiceDetails.amount) / 1_000_000;
      const statusText =
        Number(invoiceDetails.status) === 1 ? "✅ Paid" : "⏳ Unpaid";
      const createdAt = new Date(
        Number(invoiceDetails.createdAt) * 1000
      ).toLocaleString();
      const paidAt =
        Number(invoiceDetails.status) === 1
          ? new Date(
              Number(invoiceDetails.paidAt) * 1000
            ).toLocaleString()
          : "Not paid";

      invoiceMessage += `Invoice #${invoiceId}:\n` +
        `Freelancer: ${tronWeb.address.fromHex(invoiceDetails.freelancer)}\n` +
        `Amount: ${amountInUSDT} USDT\n` +
        `Status: ${statusText}\n` +
        `Created: ${createdAt}\n`+
        `Paid At: ${paidAt}\n` +
        `Invoice Link: ${CONFIG.NEXT_PUBLIC_APP_URL}/invoice/${invoiceId}\n\n` ;
    }

    await sendMessage(chatId, invoiceMessage);
  } catch (err) {
    console.error("Invoices Retrieval Error:", err);
    await sendMessage(chatId, MESSAGES.INVOICES_ERROR);
  }
}

export async function handleCreateInvoice(chatId: number, recipientAddress: string, amount: string) {
  if (!tronWeb.isAddress(recipientAddress) || isNaN(Number(amount))) {
    await sendMessage(chatId, MESSAGES.INVALID_INPUT);
    return NextResponse.json({ status: "invalid_input" });
  }

  try {
    if (!CONFIG.CONTRACT_ADDRESS) {
      throw new Error("Contract Address is not defined");
    }

    const contract = await tronWeb.contract(implementationABI, CONFIG.CONTRACT_ADDRESS);
    const invoiceTx = await contract
      .methods['createInvoice'](recipientAddress, BigInt(tronWeb.toSun(Number(amount)).toString()))
      .send({ feeLimit: 100_000_000, callValue: 0 });

    const invoiceId = await contract
      .methods['invoiceCounter']()
      .call();

    await sendMessage(
      chatId,
      MESSAGES.INVOICE_SUCCESS(invoiceTx, recipientAddress, amount, BigInt(invoiceId))
    );
  } catch (err) {
    console.error("Contract Interaction Error:", err);
    await sendMessage(chatId, MESSAGES.CONTRACT_ERROR);
  }
}