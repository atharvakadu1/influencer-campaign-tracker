const express = require('express');
const db = require('./db'); // Your existing db.js
const app = express();

// --- Middleware ---
// To read JSON bodies (for POST/PUT)
app.use(express.json()); 
// To serve your frontend files (index.html, script.js, style.css)
app.use(express.static('.')); 

// --- API Error Handlers ---
// Utility function to send a standard 500 error
const sendError = (res, err, context) => {
  console.error(`Error - ${context}:`, err);
  res.status(500).json({ error: err.message });
};

// Utility function for a standard 404
const sendNotFound = (res) => {
  res.status(404).json({ error: 'Record not found' });
};

// --- READ (GET) ---

/**
 * GET /api/data
 * This is the main data load route.
 * It fetches ALL data from ALL tables in parallel and sends it
 * to the frontend as one single JSON object.
 */
app.get('/api/data', async (req, res) => {
  try {
    // Use Promise.all to run all queries simultaneously for speed
    const [brands] = await db.promise().query('SELECT * FROM brand');
    const [influencers] = await db.promise().query('SELECT * FROM influencer');
    const [campaigns] = await db.promise().query('SELECT * FROM campaign');
    const [collaborations] = await db.promise().query('SELECT * FROM collaboration');
    const [payments] = await db.promise().query('SELECT * FROM payment');
    const [posts] = await db.promise().query('SELECT * FROM post');

    // Send all data back in the structure the frontend expects
    res.json({
      brands,
      influencers,
      campaigns,
      collaborations,
      payments,
      posts
    });
  } catch (err) {
    sendError(res, err, 'loading all data');
  }
});

// --- CREATE (POST) ---

app.post('/api/brands', (req, res) => {
  const { brand_name, industry, contact_person, contact_email, website } = req.body;
  const sql = 'INSERT INTO brand (brand_name, industry, contact_person, contact_email, website, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
  db.query(sql, [brand_name, industry, contact_person, contact_email, website], (err, result) => {
    if (err) return sendError(res, err, 'creating brand');
    res.status(201).json({ newId: result.insertId });
  });
});

app.post('/api/influencers', (req, res) => {
  const { first_name, last_name, email, phone, niche, social_platform, follower_count } = req.body;
  const sql = 'INSERT INTO influencer (first_name, last_name, email, phone, niche, social_platform, follower_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())';
  db.query(sql, [first_name, last_name, email, phone, niche, social_platform, Number(follower_count) || 0], (err, result) => {
    if (err) return sendError(res, err, 'creating influencer');
    res.status(201).json({ newId: result.insertId });
  });
});

app.post('/api/campaigns', (req, res) => {
  const { brand_id, budget, status, start_date, end_date, objective } = req.body;
  const sql = 'INSERT INTO campaign (brand_id, budget, status, start_date, end_date, objective, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())';
  db.query(sql, [brand_id, Number(budget) || 0, status, start_date, end_date, objective], (err, result) => {
    if (err) return sendError(res, err, 'creating campaign');
    res.status(201).json({ newId: result.insertId });
  });
});

app.post('/api/collaborations', (req, res) => {
  const { influencer_id, campaign_id, agreed_amount, approval_status, dead_line, deliverables } = req.body;
  const sql = 'INSERT INTO collaboration (influencer_id, campaign_id, agreed_amount, approval_status, dead_line, deliverables, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())';
  db.query(sql, [influencer_id, campaign_id, Number(agreed_amount) || 0, approval_status, dead_line, deliverables], (err, result) => {
    if (err) return sendError(res, err, 'creating collaboration');
    res.status(201).json({ newId: result.insertId });
  });
});

app.post('/api/payments', (req, res) => {
  const { collab_id, payment_date, amount_paid, status, mode } = req.body;
  const sql = 'INSERT INTO payment (collab_id, payment_date, amount_paid, status, mode, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
  db.query(sql, [collab_id, payment_date, Number(amount_paid) || 0, status, mode], (err, result) => {
    if (err) return sendError(res, err, 'creating payment');
    res.status(201).json({ newId: result.insertId });
  });
});

app.post('/api/posts', (req, res) => {
  const { influencer_id, collab_id, post_date, post_type, likes, shares, comments, reach, engagement_rate } = req.body;
  const sql = 'INSERT INTO post (influencer_id, collab_id, post_date, post_type, likes, shares, comments, reach, engagement_rate, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
  db.query(sql, [influencer_id, collab_id, post_date, post_type, Number(likes) || 0, Number(shares) || 0, Number(comments) || 0, Number(reach) || 0, Number(engagement_rate) || 0], (err, result) => {
    if (err) return sendError(res, err, 'creating post');
    res.status(201).json({ newId: result.insertId });
  });
});

// --- UPDATE (PUT) ---

app.put('/api/brands/:id', (req, res) => {
  const { id } = req.params;
  const { brand_name, industry, contact_person, contact_email, website } = req.body;
  const sql = 'UPDATE brand SET brand_name = ?, industry = ?, contact_person = ?, contact_email = ?, website = ? WHERE brand_id = ?';
  db.query(sql, [brand_name, industry, contact_person, contact_email, website, id], (err, result) => {
    if (err) return sendError(res, err, 'updating brand');
    if (result.affectedRows === 0) return sendNotFound(res);
    res.json({ message: 'Brand updated' });
  });
});

app.put('/api/influencers/:id', (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, niche, social_platform, follower_count } = req.body;
  const sql = 'UPDATE influencer SET first_name = ?, last_name = ?, email = ?, phone = ?, niche = ?, social_platform = ?, follower_count = ? WHERE influencer_id = ?';
  db.query(sql, [first_name, last_name, email, phone, niche, social_platform, Number(follower_count) || 0, id], (err, result) => {
    if (err) return sendError(res, err, 'updating influencer');
    if (result.affectedRows === 0) return sendNotFound(res);
    res.json({ message: 'Influencer updated' });
  });
});

app.put('/api/campaigns/:id', (req, res) => {
  const { id } = req.params;
  const { brand_id, budget, status, start_date, end_date, objective } = req.body;
  const sql = 'UPDATE campaign SET brand_id = ?, budget = ?, status = ?, start_date = ?, end_date = ?, objective = ? WHERE campaign_id = ?';
  db.query(sql, [brand_id, Number(budget) || 0, status, start_date, end_date, objective, id], (err, result) => {
    if (err) return sendError(res, err, 'updating campaign');
    if (result.affectedRows === 0) return sendNotFound(res);
    res.json({ message: 'Campaign updated' });
  });
});

app.put('/api/collaborations/:id', (req, res) => {
  const { id } = req.params;
  const { influencer_id, campaign_id, agreed_amount, approval_status, dead_line, deliverables } = req.body;
  const sql = 'UPDATE collaboration SET influencer_id = ?, campaign_id = ?, agreed_amount = ?, approval_status = ?, dead_line = ?, deliverables = ? WHERE collab_id = ?';
  db.query(sql, [influencer_id, campaign_id, Number(agreed_amount) || 0, approval_status, dead_line, deliverables, id], (err, result) => {
    if (err) return sendError(res, err, 'updating collaboration');
    if (result.affectedRows === 0) return sendNotFound(res);
    res.json({ message: 'Collaboration updated' });
  });
});

app.put('/api/payments/:id', (req, res) => {
  const { id } = req.params;
  const { collab_id, payment_date, amount_paid, status, mode } = req.body;
  const sql = 'UPDATE payment SET collab_id = ?, payment_date = ?, amount_paid = ?, status = ?, mode = ? WHERE payment_id = ?';
  db.query(sql, [collab_id, payment_date, Number(amount_paid) || 0, status, mode, id], (err, result) => {
    if (err) return sendError(res, err, 'updating payment');
    if (result.affectedRows === 0) return sendNotFound(res);
    res.json({ message: 'Payment updated' });
  });
});

app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { influencer_id, collab_id, post_date, post_type, likes, shares, comments, reach, engagement_rate } = req.body;
  const sql = 'UPDATE post SET influencer_id = ?, collab_id = ?, post_date = ?, post_type = ?, likes = ?, shares = ?, comments = ?, reach = ?, engagement_rate = ? WHERE post_id = ?';
  db.query(sql, [influencer_id, collab_id, post_date, post_type, Number(likes) || 0, Number(shares) || 0, Number(comments) || 0, Number(reach) || 0, Number(engagement_rate) || 0, id], (err, result) => {
    if (err) return sendError(res, err, 'updating post');
    if (result.affectedRows === 0) return sendNotFound(res);
    res.json({ message: 'Post updated' });
  });
});

// --- DELETE (DELETE) ---

// Generic delete function
const addDeleteRoute = (entity, idField) => {
  app.delete(`/api/${entity}s/:id`, (req, res) => {
    const { id } = req.params;
    db.query(`DELETE FROM ${entity} WHERE ${idField} = ?`, [id], (err, result) => {
      if (err) return sendError(res, err, `deleting ${entity}`);
      if (result.affectedRows === 0) return sendNotFound(res);
      res.json({ message: `${entity} deleted` });
    });
  });
};

addDeleteRoute('brand', 'brand_id');
addDeleteRoute('influencer', 'influencer_id');
addDeleteRoute('campaign', 'campaign_id');
addDeleteRoute('collaboration', 'collab_id');
addDeleteRoute('payment', 'payment_id');
addDeleteRoute('post', 'post_id');


// --- SPECIAL: RESET DATA ---
// This route will delete all data and re-insert the sample data
app.post('/api/reset-data', async (req, res) => {
  console.log('Attempting to reset data...');
  const
    conn = await db.promise().getConnection();
  try {
    await conn.beginTransaction();
    // Delete in reverse order of creation to respect foreign keys
    await conn.query('DELETE FROM post');
    await conn.query('DELETE FROM payment');
    await conn.query('DELETE FROM collaboration');
    await conn.query('DELETE FROM campaign');
    await conn.query('DELETE FROM influencer');
    await conn.query('DELETE FROM brand');

    // Reset auto-increment counters
    await conn.query('ALTER TABLE brand AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE influencer AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE campaign AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE collaboration AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE payment AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE post AUTO_INCREMENT = 1');

    // Re-insert sample data (copied from your database.sql)
    await conn.query(`INSERT INTO brand (brand_name, website, industry, contact_person, contact_email) VALUES
      ('TechNova Solutions', 'http://www.technovasolutions.com', 'Technology', 'Jane Doe', 'jane.doe@technovasolutions.com'),
      ('Green Living Co.', 'http://www.greenlivingco.com', 'Lifestyle', 'John Smith', 'john.smith@greenlivingco.com'),
      ('Gourmet Eats Inc.', 'http://www.gourmeteats.com', 'Food & Beverage', 'Emily White', 'emily.white@gourmeteats.com')`);

    await conn.query(`INSERT INTO influencer (first_name, last_name, email, phone, niche, social_platform, follower_count) VALUES
      ('Alex', 'Chen', 'alex.chen@example.com', '555-1234', 'Technology', 'YouTube', 500000),
      ('Maria', 'Garcia', 'maria.garcia@example.com', '555-5678', 'Lifestyle', 'Instagram', 120000),
      ('Tom', 'Wilson', 'tom.wilson@example.com', '555-8765', 'Food', 'TikTok', 75000)`);

    await conn.query(`INSERT INTO campaign (brand_id, budget, status, start_date, end_date, objective) VALUES
      (1, 15000.00, 'Active', '2025-10-01', '2025-11-30', 'Promote new software product to tech enthusiasts.'),
      (2, 5000.00, 'Planning', '2025-11-15', '2025-12-31', 'Increase brand awareness for eco-friendly products.'),
      (3, 8000.00, 'Completed', '2025-09-01', '2025-09-30', 'Drive sales for a new line of gourmet snacks.')`);

    await conn.query(`INSERT INTO collaboration (influencer_id, campaign_id, agreed_amount, approval_status, dead_line, deliverables) VALUES
      (1, 1, 1200.00, 'Approved', '2025-10-25', 'One dedicated YouTube video and three Instagram stories.'),
      (2, 2, 400.00, 'Pending', '2025-11-20', 'Five high-quality Instagram posts with product placement.'),
      (3, 3, 750.00, 'Approved', '2025-09-15', 'Two TikTok videos showcasing the new snacks.')`);

    await conn.query(`INSERT INTO payment (collab_id, payment_date, amount_paid, status, mode) VALUES
      (1, '2025-10-25', 1200.00, 'Completed', 'Bank Transfer'),
      (3, '2025-09-15', 750.00, 'Completed', 'PayPal')`);

    await conn.query(`INSERT INTO post (influencer_id, collab_id, post_date, post_type, likes, shares, comments, reach, engagement_rate) VALUES
      (1, 1, '2025-10-20', 'YouTube Video', 25000, 500, 1200, 150000, 0.0800),
      (3, 3, '2025-09-10', 'TikTok Video', 8000, 200, 300, 50000, 0.0600)`);

    await conn.commit();
    conn.release();
    console.log('Data reset successfully.');
    res.json({ message: 'Data reset successfully' });
  } catch (err) {
    await conn.rollback();
    conn.release();
    sendError(res, err, 'resetting data');
  }
});


// --- Start Server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
