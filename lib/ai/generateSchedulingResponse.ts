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
        return "The next step is usually scheduling a quick call or an on-site visit so we can better understand what you need. Would you prefer to start with a quick call, or would you like us to schedule an on-site visit?";
 
      case "ask_address":
        return "Absolutely. To help us schedule the visit, what is the full project address, including the city and ZIP code?";
  
      case "ask_full_address":
        return "Could you send the full project address, including the city and ZIP code? That will help us schedule everything correctly.";
  
      case "offer_days": {
        if (input.days.length === 0) {
          return generateSchedulingResponse({ type: "fallback_followup" });
        }
      
        return "Great! Here are a few days that currently have openings. You can tap one below, or let me know if another day works better.";
      }

      case "offer_times": {
        if (input.slots.length === 0) {
          return generateSchedulingResponse({ type: "fallback_followup" });
        }
      
        return `Great! Here are the available times for ${input.dayLabel}. You can tap one below, or let me know if none of these work and I'll check another day.`;
      }

      case "reoffer_days": {
        if (input.days.length === 0) {
          return generateSchedulingResponse({ type: "fallback_followup" });
        }
      
        return "No problem at all. Here are a few more available days. Take a look and choose whichever works best for you.";
      }

      case "ask_valid_day": {
        return "I wasn't sure which day you were referring to. Please choose one of the available days below, or let me know if you'd like me to check other availability.";
      }

      case "ask_valid_time": {
        return "I wasn't sure which time you meant. Please choose one of the available times below, or let me know if another day would work better.";
      }
  
      case "confirmed":
        return `Perfect, you’re all set for ${input.dayLabel} at ${input.timeLabel}.`;
  
      case "closed":
        return "Sounds good, we’ll follow up if anything else is needed.";
  
      case "fallback_followup":
        return "I have your request ready. Our online calendar is temporarily unavailable, so someone will follow up directly to confirm a time. In the meantime, please let me know if you have additional questions.";
  
      case "fallback_followup":
        return "I have your request ready. Our online calendar is temporarily unavailable, so someone will follow up directly to confirm a time. In the meantime, please let me know if you have additional questions.";
    }
  }