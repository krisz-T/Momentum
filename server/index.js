const express = require('express');
const app = express();
const port = 3001; // Using a port other than the React default

app.get('/api', (req, res) => {
  res.json({ message: "Hello from the Momentum API!" });
});

app.listen(port, () => {
  console.log(`✅ Server is running at http://localhost:${port}`);
});