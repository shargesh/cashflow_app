const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 CONNECT MONGODB
mongoose.connect("YOUR_MONGO_URI", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

// 📦 SCHEMA
const transactionSchema = new mongoose.Schema({
  amount: Number,
  type: String, // credit / debit
  category: String, // saving / investment / expense
  date: {
    type: Date,
    default: Date.now,
  },
});

const limitSchema = new mongoose.Schema({
  debitLimit: Number,
});

const Transaction = mongoose.model("Transaction", transactionSchema);
const Limit = mongoose.model("Limit", limitSchema);


// ➕ ADD TRANSACTION
app.post("/add", async (req, res) => {
  try {
    const { amount, type, category } = req.body;

    const newTransaction = new Transaction({
      amount,
      type,
      category,
    });

    await newTransaction.save();

    res.json({ message: "Transaction added" });
  } catch (err) {
    res.status(500).json(err);
  }
});


// 📊 GET ALL TRANSACTIONS + BALANCE
app.get("/all", async (req, res) => {
  try {
    const data = await Transaction.find();

    let balance = 0;

    data.forEach((item) => {
      if (item.type === "credit") {
        balance += item.amount;
      } else {
        balance -= item.amount;
      }
    });

    res.json({ data, balance });
  } catch (err) {
    res.status(500).json(err);
  }
});


// ⚠️ SET DEBIT LIMIT
app.post("/set-limit", async (req, res) => {
  try {
    const { debitLimit } = req.body;

    await Limit.deleteMany(); // keep only one limit
    const newLimit = new Limit({ debitLimit });
    await newLimit.save();

    res.json({ message: "Limit set" });
  } catch (err) {
    res.status(500).json(err);
  }
});


// 🚨 CHECK LIMIT EXCEEDED
app.get("/check-limit", async (req, res) => {
  try {
    const limitData = await Limit.findOne();
    const transactions = await Transaction.find();

    let totalDebit = 0;

    transactions.forEach((item) => {
      if (item.type === "debit") {
        totalDebit += item.amount;
      }
    });

    if (limitData && totalDebit > limitData.debitLimit) {
      res.json({
        exceeded: true,
        message: "⚠️ Debit limit exceeded!",
      });
    } else {
      res.json({ exceeded: false });
    }
  } catch (err) {
    res.status(500).json(err);
  }
});


// 💰 SAVINGS SUMMARY
app.get("/savings", async (req, res) => {
  try {
    const data = await Transaction.find({ category: "saving" });

    let total = 0;
    data.forEach((item) => (total += item.amount));

    res.json({ savings: total });
  } catch (err) {
    res.status(500).json(err);
  }
});


// 📈 INVESTMENT SUMMARY
app.get("/investments", async (req, res) => {
  try {
    const data = await Transaction.find({ category: "investment" });

    let total = 0;
    data.forEach((item) => (total += item.amount));

    res.json({ investments: total });
  } catch (err) {
    res.status(500).json(err);
  }
});


// ❌ DELETE TRANSACTION
app.delete("/delete/:id", async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json(err);
  }
});


// 🚀 START SERVER
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
