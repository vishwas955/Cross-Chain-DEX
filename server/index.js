import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import swapRoutes from './routes/swapRoutes.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/swap', swapRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
 