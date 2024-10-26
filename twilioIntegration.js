const twilio = require('twilio');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

function sendWhatsAppMessage(phoneNumber, unit) {
  const message = `برجاء سداد مبلغ الصيانة السابق عن الوحدة رقم ${unit} بعمارة 12 حسب التفاصيل على جروب العمارة. تجاهل الرسالة في حالة الدفع. شكراً لكم`;
  client.messages.create({
    body: message,
    from: 'whatsapp:+14155238886',
    to: `whatsapp:${phoneNumber}`
  })
  .then(message => console.log('Message sent successfully:', message.sid))
  .catch(error => console.error('Error sending message:', error));
}

// Example usage
sendWhatsAppMessage('+201000094586', '1');

module.exports = { sendWhatsAppMessage };
