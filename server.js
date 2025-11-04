const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());

// Example route to test connection
app.get('/students', (req, res) => {
  db.query('SELECT * FROM students', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
