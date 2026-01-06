import axios from "axios";
import { ethers } from "ethers";
import erc20Json from "@openzeppelin/contracts/build/contracts/ERC20.json" with { type: "json" };

const erc20Abi = erc20Json.abi;



const rpc_url = process.env.INFURA_RPC_URL;
const TOKEN_ADDRESS = {
    USDC: process.env.USDC,
    USDT: process.env.USDT,
}

//0x API Swaps 
export const send0xSwapTx = async ({ privateKey, quote }) => {
    try {
        const provider = new ethers.JsonRpcProvider(rpc_url);
        const wallet = new ethers.Wallet(privateKey, provider);
        const { to, data, value } = quote.transaction;
        const { allowanceTarget, sellToken} = quote;
        const ETH = process.env.ETH
        
        console.log(allowanceTarget, sellToken);
        if (allowanceTarget && sellToken && (sellToken !== ethers.ZeroAddress && sellToken !== ETH)) {
            const tokenContract = new ethers.Contract(sellToken, erc20Abi, wallet);
            const currentAllowance = await tokenContract.allowance(wallet.address, allowanceTarget);
            if (currentAllowance < BigInt(quote.sellAmount)) {
                // If current allowance > 0, reset to 0 first (for USDT & similar tokens)
                if (currentAllowance > 0n) {
                    console.log("Resetting allowance to 0 before setting new allowance...");
                    const resetTx = await tokenContract.approve(allowanceTarget, 0);
                    console.log("Reset TX Sent:", resetTx.hash);
                    await resetTx.wait();
                    console.log("Allowance reset to 0 confirmed.");
                }

                // Now approve the required amount
                const allowanceTx = await tokenContract.approve(allowanceTarget, BigInt(quote.sellAmount));
                console.log("Approval TX Sent:", allowanceTx.hash);
                await allowanceTx.wait();
                console.log("Approval Confirmed");
            }

        }

        // Send the actual swap transaction
        const tx = await wallet.sendTransaction({
            to,
            data,
            value: value ? BigInt(value) : BigInt(0), // if ETH swap, value > 0; else 0
        });

        console.log("Swap TX Sent:", tx.hash);
        await tx.wait();
        console.log("Swap TX Confirmed!");
        return tx.hash;

    } catch (error) {
        console.error("0x Swap Transaction Failed:", error);
        throw new Error(error);
    }
};

export const getERC20Balance = async (tokenAddress, userAddress) => {
    try {
        console.log(tokenAddress, userAddress);
        const provider = new ethers.JsonRpcProvider(rpc_url);
        const token = new ethers.Contract(tokenAddress, erc20Abi, provider);
        const raw = await token.balanceOf(userAddress);
        console.log("Raw Balance:", raw.toString());
        const balance = ethers.formatUnits(raw, 6);
        console.log("Formatted Balance:", balance);
        return balance;
    }catch (error) {
        console.error("Get ERC20 Balance Failed:", error);
        throw new Error(error);
    }   
}

export const get0xSwapStatus = async ({ txHash }) => {
  try {
    const provider = new ethers.JsonRpcProvider(rpc_url);
    const receipt = await provider.waitForTransaction(txHash, 1);
    if (!receipt) throw new Error('Transaction not found');
    if (receipt.status === 1) {
        return "SUCCESS";
    }else{
        return "REVERTED";
    }
  } catch (error) {
    console.log("Check Status Failed:", error);
    throw new Error(error);
  }
}