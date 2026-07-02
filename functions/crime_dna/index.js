const express = require('express');
const catalyst = require('zcatalyst-sdk-node');

const app = express();
app.use(express.json());

// Middleware to initialize the Catalyst SDK for every request
app.use((req, res, next) => {
    const catalystApp = catalyst.initialize(req);
    res.locals.catalyst = catalystApp;
    next();
});

// Basic Health Check Endpoint
app.get('/', (req, res) => {
    res.status(200).send({ message: "CrimeDNA API is running!" });
});

// Example Endpoint: Fetch FIRs from Catalyst Data Store
app.get('/firs', async (req, res) => {
    try {
        const catalystApp = res.locals.catalyst;
        // This query will fail until the CaseMaster table is actually created in the Catalyst Console
        const zcql = catalystApp.zcql();
        const query = `SELECT * FROM CaseMaster`;
        const result = await zcql.executeZCQLQuery(query);
        
        res.status(200).send({ data: result });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch FIRs. Ensure the CaseMaster table is created in Catalyst Data Store.", details: err.message });
    }
});

// Export the Express app as a module so Catalyst can handle the routing
module.exports = app;
