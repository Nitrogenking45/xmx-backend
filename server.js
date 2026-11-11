const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const transactions = {};

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'xmx-backend' });
});

app.post('/api/deposit', async (req, res) => {
  try {
    const { amount, phone, network, userId } = req.body;
    if (!amount || !phone || !network) {
      return res.status(400).json({ success: false, message: 'amount, phone and network required' });
    }
    const txId = uuidv4();
    const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+/, '');
    transactions[txId] = {
      id: txId,
      amount,
      phone: cleanPhone,
      network: network.toLowerCase(),
      userId: userId || 'guest',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    console.log('New deposit:', transactions[txId]);
    return res.json({
      success: true,
      transactionId: txId,
      message: `STK push sent to ${cleanPhone} via ${network}. Please approve on your phone.`,
      status: 'pending'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/transaction/:id', (req, res) => {
  const tx = transactions[req.params.id];
  if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
  return res.json({ success: true, transaction: tx });
});

app.post('/api/callback/:network', (req, res) => {
  console.log(`Callback ${req.params.network}:`, req.body);
  const { transactionId, status } = req.body;
  if (transactionId && transactions[transactionId]) {
    transactions[transactionId].status = status || 'completed';
    transactions[transactionId].callback = req.body;
  }
  return res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`XMX Backend running on port ${PORT}`);
});
