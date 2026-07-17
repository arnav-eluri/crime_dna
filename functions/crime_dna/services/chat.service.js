const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "data_processing",
    "data",
    "03_processed"
);

function loadDashboardSummary() {
    const filePath = path.join(DATA_DIR, "dashboard_summary.json");

    if (!fs.existsSync(filePath)) {
        return null;
    }

    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function processChatMessage(message) {

    const data = loadDashboardSummary();

    if (!data) {
        return {
            success: false,
            response: "Crime data is currently unavailable."
        };
    }

    return {
        success: true,
        response: `I received your question: "${message}".`
    };
}

module.exports = {
    processChatMessage
};