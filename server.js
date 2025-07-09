// require('dotenv').config();
// const express = require('express');
// const mysql = require('mysql2');
// const cors = require('cors');
// const cron = require('node-cron');
// const fetch = require('node-fetch');

// const app = express();
// const port = process.env.PORT || 3000;

// app.use(cors());
// app.use(express.json());

// // ✅ MySQL Connection
// const db = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT,
// });

// db.connect((err) => {
//   if (err) {
//     console.error('❌ Database connection failed:', err.message);
//   } else {
//     console.log('✅ Connected to MySQL database');
//   }
// });

// // 🔁 Auto Insert Data Every 30 Minutes
// cron.schedule('*/30 * * * *', () => {
//   console.log('[CRON] Auto insert triggered');
//   insertMachineData();
// });

// // ✅ Dummy Insert Function
// function insertMachineData() {
//   const machines = ['Machine 01', 'Machine 02', 'Machine 03'];
//   const now = new Date();
//   const currentDate = now.toISOString().split('T')[0];

//   // machines table
//   machines.forEach((name) => {
//     const statuses = ['Running', 'Idle', 'Error'];
//     const status = statuses[Math.floor(Math.random() * statuses.length)];
//     const spindleSpeed = Math.floor(Math.random() * (3200 - 2500 + 1)) + 2500;

//     let power = 0;
//     let restTime = 0;

//     if (status === 'Running') {
//       power = (Math.random() * (9.5 - 7.0) + 7.0).toFixed(1);
//       restTime = Math.floor(Math.random() * 20);
//     } else if (status === 'Idle') {
//       power = (Math.random() * 2).toFixed(1);
//       restTime = Math.floor(Math.random() * 60) + 20;
//     } else {
//       power = 0;
//       restTime = Math.floor(Math.random() * 120) + 30;
//     }

//     const query = `
//       INSERT INTO machines (name, status, spindle_speed, power_consumption, rest_time, date)
//       VALUES (?, ?, ?, ?, ?, ?)
//     `;

//     db.query(query, [name, status, spindleSpeed, power, restTime, currentDate], (err) => {
//       if (err) console.error(`❌ Machine insert failed for ${name}:`, err.message);
//     });
//   });

//   // power_logs
//   machines.forEach((machine) => {
//     for (let i = 0; i < 12; i++) {
//       const time = new Date(now);
//       time.setMinutes(time.getMinutes() - i * 5);
//       const powerVal = parseFloat((Math.random() * (9.5 - 6.5) + 6.5).toFixed(2));

//       const query = `INSERT INTO power_logs (machine_name, power_value, timestamp) VALUES (?, ?, ?)`;
//       db.query(query, [machine, powerVal, time], (err) => {
//         if (err) console.error(`❌ Power log failed for ${machine}:`, err.message);
//       });
//     }
//   });

//   // spindle_logs
//   machines.forEach((machine) => {
//     for (let i = 0; i < 12; i++) {
//       const time = new Date(now);
//       time.setMinutes(time.getMinutes() - i * 5);
//       const speed = Math.floor(Math.random() * (3200 - 2500 + 1)) + 2500;

//       const query = `INSERT INTO spindle_logs (name, speed, timestamp) VALUES (?, ?, ?)`;
//       db.query(query, [machine, speed, time], (err) => {
//         if (err) console.error(`❌ Spindle log failed for ${machine}:`, err.message);
//       });
//     }
//   });

//   console.log(`✅ Data inserted at ${now.toLocaleTimeString()} on ${currentDate}`);
// }

// // 🔘 Manual insert route
// app.get('/insert-now', (req, res) => {
//   insertMachineData();
//   res.send('✅ Manual insert triggered');
// });

// // 🟢 Health check
// app.get('/', (req, res) => {
//   res.send('🟢 Indexo backend is running');
// });

// // ✅ Login endpoint
// app.post('/login', (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ success: false, message: 'Email and password are required' });
//   }

//   const query = 'SELECT * FROM login WHERE email = ? AND password = ?';
//   db.query(query, [email, password], (err, results) => {
//     if (err) return res.status(500).json({ success: false, message: 'Server error' });

//     if (results.length > 0) {
//       res.json({ success: true, message: 'Login successful', user: results[0] });
//     } else {
//       res.status(401).json({ success: false, message: 'Invalid credentials' });
//     }
//   });
// });

// // ✅ Get single machine data (for dashboard)
// app.get('/machines', (req, res) => {
//   const { name, date } = req.query;
//   const query = `SELECT * FROM machines WHERE name = ? AND date = ?`;

//   db.query(query, [name, date], (err, results) => {
//     if (err) return res.status(500).send('Server error');
//     res.json(results);
//   });
// });

// // ✅ Range-based machine data (for trends)
// app.get('/machines/range', (req, res) => {
//   const { name, from, to } = req.query;
//   const query = `
//     SELECT * FROM machines
//     WHERE name = ? AND date BETWEEN ? AND ?
//     ORDER BY date ASC
//   `;

//   db.query(query, [name, from, to], (err, results) => {
//     if (err) return res.status(500).json({ error: 'Server error' });
//     res.json(results);
//   });
// });

// // ✅ Spindle logs
// app.get('/spindle-data', (req, res) => {
//   const { name, date } = req.query;
//   const query = `
//     SELECT * FROM spindle_logs
//     WHERE name = ? AND DATE(timestamp) = ?
//     ORDER BY timestamp ASC
//   `;

//   db.query(query, [name, date], (err, results) => {
//     if (err) return res.status(500).send('Server error');

//     const cleaned = results.filter(
//       (entry) => typeof entry.speed === 'number' && isFinite(entry.speed)
//     );

//     res.json(cleaned);
//   });
// });

// // ✅ Power logs
// app.get('/power-data', (req, res) => {
//   const { machine, date } = req.query;
//   const query = `
//     SELECT * FROM power_logs
//     WHERE machine_name = ? AND DATE(timestamp) = ?
//     ORDER BY timestamp ASC
//   `;

//   db.query(query, [machine, date], (err, results) => {
//     if (err) return res.status(500).json({ error: 'Server error' });
//     res.json(results);
//   });
// });

// // ✅ Alarm logs
// app.get('/alarms', (req, res) => {
//   const { machine, date } = req.query;

//   let query = 'SELECT * FROM alarm_logs WHERE 1=1';
//   const params = [];

//   if (machine) {
//     query += ' AND machine_name = ?';
//     params.push(machine);
//   }

//   if (date) {
//     query += ' AND DATE(timestamp) = ?';
//     params.push(date);
//   }

//   query += ' ORDER BY timestamp DESC';

//   db.query(query, params, (err, results) => {
//     if (err) return res.status(500).json({ error: 'Server error' });
//     res.json(results);
//   });
// });

// // ✅ All machine data
// app.get('/machine-details', (req, res) => {
//   const query = `SELECT * FROM machines ORDER BY date DESC`;

//   db.query(query, (err, results) => {
//     if (err) return res.status(500).json({ error: 'Server error' });
//     res.json(results);
//   });
// });

// // ✅ Keep server alive on Render
// setInterval(() => {
//   fetch('https://indxoapp.onrender.com/')
//     .then(() => console.log('⏳ Self-ping to prevent Render sleep'))
//     .catch((err) => console.error('❌ Self-ping failed:', err.message));
// }, 14 * 60 * 1000);

// // ✅ Start the server
// app.listen(port, () => {
//   console.log(`🚀 Server is running on http://localhost:${port}`);
// });

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const cron = require('node-cron');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to MySQL database');
  }
});

// Auto insert dummy data every 30 minutes
cron.schedule('*/30 * * * *', () => {
  console.log('[CRON] Auto insert triggered');
  insertMachineData();
});

// Dummy data insert function
function insertMachineData() {
  const machines = ['Machine 01', 'Machine 02', 'Machine 03'];
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];

  // Insert into machines table
  machines.forEach((name) => {
    const statuses = ['Running', 'Idle', 'Error'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const spindleSpeed = Math.floor(Math.random() * (3200 - 2500 + 1)) + 2500;

    let power = 0;
    let restTime = 0;

    if (status === 'Running') {
      power = (Math.random() * (9.5 - 7.0) + 7.0).toFixed(1);
      restTime = Math.floor(Math.random() * 20);
    } else if (status === 'Idle') {
      power = (Math.random() * 2).toFixed(1);
      restTime = Math.floor(Math.random() * 60) + 20;
    } else {
      power = 0;
      restTime = Math.floor(Math.random() * 120) + 30;
    }

    const query = `
      INSERT INTO machines (name, status, spindle_speed, power_consumption, rest_time, date, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(query, [name, status, spindleSpeed, power, restTime, currentDate], (err) => {
      if (err) console.error(`Insert failed for ${name}:`, err.message);
    });
  });

  // Insert power logs
  machines.forEach((machine) => {
    for (let i = 0; i < 12; i++) {
      const time = new Date(now);
      time.setMinutes(time.getMinutes() - i * 5);
      const powerVal = parseFloat((Math.random() * (9.5 - 6.5) + 6.5).toFixed(2));

      const query = `INSERT INTO power_logs (machine_name, power_value, timestamp) VALUES (?, ?, ?)`;
      db.query(query, [machine, powerVal, time], (err) => {
        if (err) console.error(`Power log insert failed for ${machine}:`, err.message);
      });
    }
  });

  // Insert spindle logs
  machines.forEach((machine) => {
    for (let i = 0; i < 12; i++) {
      const time = new Date(now);
      time.setMinutes(time.getMinutes() - i * 5);
      const speed = Math.floor(Math.random() * (3200 - 2500 + 1)) + 2500;

      const query = `INSERT INTO spindle_logs (name, speed, timestamp) VALUES (?, ?, ?)`;
      db.query(query, [machine, speed, time], (err) => {
        if (err) console.error(`Spindle log insert failed for ${machine}:`, err.message);
      });
    }
  });

  // 🔔 Insert random alarms
  const alarmTypes = [
    { type: 'Overheat', message: 'Overheat detected on spindle head' },
    { type: 'SpeedLimit', message: 'Spindle speed exceeded safety limit' },
    { type: 'UnexpectedStop', message: 'Machine stopped unexpectedly during operation' },
    { type: 'PowerSurge', message: 'Voltage fluctuation detected' },
  ];

  machines.forEach((machine) => {
    const count = Math.floor(Math.random() * 3); // 0 to 2 alarms
    for (let i = 0; i < count; i++) {
      const alarm = alarmTypes[Math.floor(Math.random() * alarmTypes.length)];
      const time = new Date();
      const query = `
        INSERT INTO alarm_logs (machine_name, alarm_type, message, timestamp)
        VALUES (?, ?, ?, ?)
      `;
      db.query(query, [machine, alarm.type, alarm.message, time], (err) => {
        if (err) console.error(`Alarm log insert failed for ${machine}:`, err.message);
      });
    }
  });

  console.log(`Dummy data inserted at ${now.toLocaleTimeString()} on ${currentDate}`);
}

// Manual trigger for data insertion
app.get('/insert-now', (req, res) => {
  insertMachineData();
  res.send('Manual insert triggered');
});

// Health check
app.get('/', (req, res) => {
  res.send('Indexo backend is running');
});

// Login API
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const query = 'SELECT * FROM login WHERE email = ? AND password = ?';
  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Server error' });

    if (results.length > 0) {
      res.json({ success: true, message: 'Login successful', user: results[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });
});

// Machine data endpoints
app.get('/machines', (req, res) => {
  const { name, date } = req.query;
  const query = `SELECT * FROM machines WHERE name = ? AND date = ?`;

  db.query(query, [name, date], (err, results) => {
    if (err) return res.status(500).send('Server error');
    res.json(results);
  });
});

app.get('/machines/range', (req, res) => {
  const { name, from, to } = req.query;
  const query = `
    SELECT * FROM machines
    WHERE name = ? AND date BETWEEN ? AND ?
    ORDER BY date ASC
  `;

  db.query(query, [name, from, to], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});

app.get('/machines/latest', (req, res) => {
  const { name, date } = req.query;
  if (!name || !date) return res.status(400).json({ error: 'Missing name or date' });

  const query = `
    SELECT *
    FROM machines
    WHERE name = ? AND date = ?
    ORDER BY timestamp DESC
    LIMIT 1
  `;
  db.query(query, [name, date], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results[0] || {});
  });
});

// Spindle and power logs
app.get('/spindle-data', (req, res) => {
  const { name, date } = req.query;
  const query = `
    SELECT * FROM spindle_logs
    WHERE name = ? AND DATE(timestamp) = ?
    ORDER BY timestamp ASC
  `;

  db.query(query, [name, date], (err, results) => {
    if (err) return res.status(500).send('Server error');

    const cleaned = results.filter(
      (entry) => typeof entry.speed === 'number' && isFinite(entry.speed)
    );

    res.json(cleaned);
  });
});

app.get('/power-data', (req, res) => {
  const { machine, date } = req.query;
  const query = `
    SELECT * FROM power_logs
    WHERE machine_name = ? AND DATE(timestamp) = ?
    ORDER BY timestamp ASC
  `;

  db.query(query, [machine, date], (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});

// Alarm logs
app.get('/alarms', (req, res) => {
  const { machine, date } = req.query;
  let query = 'SELECT * FROM alarm_logs WHERE 1=1';
  const params = [];

  if (machine) {
    query += ' AND machine_name = ?';
    params.push(machine);
  }

  if (date) {
    query += ' AND DATE(timestamp) = ?';
    params.push(date);
  }

  query += ' ORDER BY timestamp DESC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});

// All machine logs
app.get('/machine-details', (req, res) => {
  const query = `SELECT * FROM machines ORDER BY date DESC`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    res.json(results);
  });
});

// Prevent Render from sleeping
setInterval(() => {
  fetch('https://indxoapp.onrender.com/')
    .then(() => console.log('Self-ping sent to prevent Render sleep'))
    .catch((err) => console.error('Self-ping failed:', err.message));
}, 14 * 60 * 1000);

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
