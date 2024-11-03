const twilio = require("twilio");
const cron = require("node-cron");
const sqlite3 = require("sqlite3").verbose();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

const db = new sqlite3.Database("./.data/database.db");

function sendWhatsAppMessage(phoneNumber, unit) {
  const message = `برجاء سداد مبلغ الصيانة السابق عن الوحدة رقم ${unit} بعمارة 12 حسب التفاصيل على جروب العمارة. تجاهل الرسالة في حالة الدفع. شكراً لكم`;
  client.messages
    .create({
      body: message,
      from: "whatsapp:+14155238886",
      to: `whatsapp:${phoneNumber}`,
    })
    .then((message) => console.log("Message sent successfully:", message.sid))
    .catch((error) => console.error("Error sending message:", error));
}

// Check payments and send reminders
function checkPaymentsAndSendReminders(day) {
  db.all(
    `SELECT units.unit_number, owners.owner_phone, tenants.tenant_phone 
          FROM units 
          JOIN owners ON units.owner_id = owners.owner_id 
          LEFT JOIN tenants ON units.tenant_id = tenants.tenant_id 
          WHERE units.unit_id IN (
            SELECT unit_id FROM payments 
            WHERE year = strftime('%Y', 'now') 
            AND month = strftime('%m', 'now') 
            AND amount = 0
          )`,
    [],
    (err, rows) => {
      if (err) {
        console.error(err.message);
        return;
      }
      rows.forEach((row) => {
        sendWhatsAppMessage(row.owner_phone, row.unit_number);
        if (row.tenant_phone) {
          sendWhatsAppMessage(row.tenant_phone, row.unit_number);
        }
      });
    }
  );
}

// Schedule tasks (Cairo Time)
cron.schedule(
  "0 12 10 * *",
  () => {
    console.log("Running task on 10th of the month at 12 PM Cairo Local Time");
    checkPaymentsAndSendReminders(10);
  },
  {
    scheduled: true,
    timezone: "Africa/Cairo",
  }
);

cron.schedule(
  "0 12 25 * *",
  () => {
    console.log("Running task on 25th of the month at 12 PM Cairo Local Time");
    checkPaymentsAndSendReminders(25);
  },
  {
    scheduled: true,
    timezone: "Africa/Cairo",
  }
);

module.exports = { sendWhatsAppMessage };
