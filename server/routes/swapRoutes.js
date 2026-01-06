import express from 'express';
import { executeSwap, getEVMBal, getBTCBal, checkSwapStatus} from '../controller/swapController.js';
import { generateUniversalWallet } from '../controller/walletController.js';
const router = express.Router();

router.post('/execute', executeSwap);
router.get('/get-evm-bal', getEVMBal);
router.get('/get-btc-bal', getBTCBal);
router.get('/status', checkSwapStatus);
router.get('/generate-wallet', generateUniversalWallet);
export default router;
