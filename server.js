const db = require('./database'); // Import the database initialization
const app = require('./app')(db); // Pass the database to your app

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
