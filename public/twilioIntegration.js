const twilio = require('twilio');
const accountSid = 'AC391fe03c4c8c25c748f453b803fcd3c2'; // Your Account SID from www.twilio.com/console
const authToken = '1554d6516eb1b6b5a5db3c9c5506c63d';   // Your Auth Token from www.twilio.com/console

const client = new twilio(accountSid, authToken);

function sendWhatsAppMessage(phoneNumber, unit) {
  const message = `برجاء سداد مبلغ الصيانة السابق عن الوحدة رقم ${unit} بعمارة 12 حسب التفاصيل على جروب العمارة. تجاهل الرسالة في حالة الدفع. شكراً لكم`;
  client.messages.create({
    body: message,
    from: 'whatsapp:+YOUR_TWILIO_SANDBOX_NUMBER',
    to: `whatsapp:${phoneNum`ber}`
  })
  .then(message => console.log('Message sent successfully:', message.sid))
  .catch(error => console.error('Error sending message:', error));
}

// Example usage
sendWhatsAppMessage('+201234567890', '1');
