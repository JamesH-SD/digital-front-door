import type {
    BookableAppointmentSlot,
  } from "@/lib/scheduling/getBookableAppointmentSlots";
  
  type SchedulingResponseDay = {
    optionNumber: number;
    displayLabel: string;
  };
  
  type SchedulingResponseSlot = BookableAppointmentSlot & {
    optionNumber: number;
  };
  
  export type SchedulingResponseInput =
    | {
        type: "ask_appointment_type";
      }
    | {
        type: "ask_address";
      }
    | {
        type: "ask_full_address";
      }
    | {
        type: "offer_days";
        days: SchedulingResponseDay[];
      }
    | {
        type: "offer_times";
        dayLabel: string;
        slots: SchedulingResponseSlot[];
      }
    | {
        type: "reoffer_days";
        days: SchedulingResponseDay[];
      }
    | {
        type: "ask_valid_day";
        days: SchedulingResponseDay[];
      }
    | {
        type: "ask_valid_time";
        slots: SchedulingResponseSlot[];
      }
    | {
        type: "confirmed";
        dayLabel: string;
        timeLabel: string;
      }
    | {
        type: "fallback_followup";
      }
    | {
        type: "closed";
      };
  
  /**
   * Scheduling response layer.
   *
   * Why this exists:
   * - scheduling logic should decide WHAT is true
   * - this file decides HOW that truth is explained to the customer
   * - later, we can replace this deterministic wording with OpenAI while keeping
   *   scheduling state and availability safe
   *
   * Important:
   * - this file must never invent availability
   * - it only presents structured options created by the scheduling engine
   */
  export function generateSchedulingResponse(input: SchedulingResponseInput) {
    switch (input.type) {
        case "ask_appointment_type":
          return "Got it. Would you prefer a quick call to confirm the details, or would you like us to help coordinate the next step another way?";
        
        // case "ask_appointment_type":
        //     return "The next step is usually a quick call or an on-site visit so we can understand what you’re looking for. Would you prefer us to come out, or start with a call?";

        // case "ask_appointment_type":
        //     return "Got it, we can definitely come take a look. Do you want us to stop by in person, or would you rather start with a quick call?";
  
      case "ask_address":
        return "Great, what’s the full project address, including city and ZIP code?";
  
      case "ask_full_address":
        return "Can you send the full project address, including city and ZIP code? That helps us schedule the visit accurately.";
  
      case "offer_days": {
        if (input.days.length === 0) {
          return generateSchedulingResponse({ type: "fallback_followup" });
        }
  
        const options = input.days
          .map((day) => `${day.optionNumber}. ${day.displayLabel}`)
          .join("\n");
  
        return `I found openings on these days:\n\n${options}\n\nWhich day works best for you?`;
      }
  
      case "offer_times": {
        if (input.slots.length === 0) {
          return generateSchedulingResponse({ type: "fallback_followup" });
        }
  
        const options = input.slots
          .map((slot) => `${slot.optionNumber}. ${slot.displayTime}`)
          .join("\n");
  
        return `Great, for ${input.dayLabel}, I have:\n\n${options}\n\nWhich of those works best for you?`;
      }
  
      case "reoffer_days": {
        if (input.days.length === 0) {
          return generateSchedulingResponse({ type: "fallback_followup" });
        }
  
        const options = input.days
          .map((day) => `${day.optionNumber}. ${day.displayLabel}`)
          .join("\n");
  
        return `No problem, here are the available days again:\n\n${options}\n\nWhich day would you like to check?`;
      }
  
      case "ask_valid_day": {
        const options = input.days
          .map((day) => `${day.optionNumber}. ${day.displayLabel}`)
          .join("\n");
  
        return `Please reply with one of the day option numbers:\n\n${options}`;
      }
  
      case "ask_valid_time": {
        const options = input.slots
          .map((slot) => `${slot.optionNumber}. ${slot.displayTime}`)
          .join("\n");
  
        return `Please reply with one of the time option numbers:\n\n${options}`;
      }
  
      case "confirmed":
        return `Perfect, you’re scheduled for ${input.dayLabel} at ${input.timeLabel}.`;
  
      case "closed":
        return "Sounds good, we’ll follow up if anything else is needed.";
  
      case "fallback_followup":
        return "No problem, I’ll have someone follow up directly to find a time that works.";
  
      default:
        return "No problem, I’ll have someone follow up directly to find a time that works.";
    }
  }