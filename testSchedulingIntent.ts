import { detectSchedulingIntent } from "./lib/chat/detectSchedulingIntent";

const tests = [
  "I want to schedule an appointment",
  "Can someone come out this week?",
  "What times are you available?",
  "I need to reschedule my appointment",
  "I can't make it tomorrow",
  "How much do you charge?",
  "Do you service San Diego?",
  "I need a quote for windows",
];

for (const input of tests) {
  const result = detectSchedulingIntent(input);
  console.log(`\n"${input}"`);
  console.log(result);
}