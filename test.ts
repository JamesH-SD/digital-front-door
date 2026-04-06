import "dotenv/config";
import { sendSms } from "./lib/notifications/sendSms";

async function test() {
  console.log("TWILIO_ACCOUNT_SID exists:", Boolean(process.env.TWILIO_ACCOUNT_SID));
  console.log("TWILIO_AUTH_TOKEN exists:", Boolean(process.env.TWILIO_AUTH_TOKEN));
  console.log("TWILIO_PHONE_NUMBER exists:", Boolean(process.env.TWILIO_PHONE_NUMBER));

  const result = await sendSms({
    to: "+16195490891",
    body: "Test SMS from Digital Front Door 🚀",
  });

  console.log(result);
}

test().catch((error) => {
  console.error("Test failed:", error);
});