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
          return "Got it. Would you prefer a quick call, or would you like us to come out for an on-site visit?"; 
        
        // case "ask_appointment_type":
        //     return "The next step is usually a quick call or an on-site visit so we can understand what you’re looking for. Would you prefer us to come out, or start with a call?";

        // case "ask_appointment_type":
        //     return "Got it, we can definitely come take a look. Do you want us to stop by in person, or would you rather start with a quick call?";
  
      case "ask_address":
        return "Great, what’s the full address, including city and ZIP code?";
  
      case "ask_full_address":
        return "Can you send the full address, including city and ZIP code? That helps us schedule accurately.";
  
      case "offer_days": {
        if (input.days.length === 0) {
          return generateSchedulingResponse({ type: "fallback_followup" });
        }
      
        return "I found some available days. Tap one below, or reply with a day that works best.";
      }

      case "offer_times": {
        if (input.slots.length === 0) {
          return generateSchedulingResponse({ type: "fallback_followup" });
        }
      
        return `Here are some available times for ${input.dayLabel}. Tap one below, or reply with the time that works best.`;
      }

      case "reoffer_days": {
        if (input.days.length === 0) {
          return generateSchedulingResponse({ type: "fallback_followup" });
        }
      
        return "No problem. Here are the available days again, tap one below to check times.";
      }

      case "ask_valid_day": {
        return "I didn’t catch which day you wanted. Please tap one of the available days below.";
      }

      case "ask_valid_time": {
        return "I didn’t catch which time you wanted. Please tap one of the available times below.";
      }
  
      case "confirmed":
        return `Perfect, you’re scheduled for ${input.dayLabel} at ${input.timeLabel}.`;
  
      case "closed":
        return "Sounds good, we’ll follow up if anything else is needed.";
  
      case "fallback_followup":
        return "I have your request ready. Our online calendar is temporarily unavailable, so someone will follow up directly to confirm a time. In the meantime, please let me know if you have additional questions.";
  
      case "fallback_followup":
        return "I have your request ready. Our online calendar is temporarily unavailable, so someone will follow up directly to confirm a time. In the meantime, please let me know if you have additional questions.";
    }
  }