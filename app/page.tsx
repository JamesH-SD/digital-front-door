"use client";

import Script from "next/script"; 
import { useState } from "react";
import Link from "next/link";
import {
  Bot,
  CalendarCheck,
  CheckCircle2,
  Image as ImageIcon,
  LogIn,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

const features = [
  ["AI Receptionist", "Answers questions and guides customers to the next step.", Bot],
  ["Lead Capture", "Collects names, phones, emails, details, and photos.", Users],
  ["Scheduling", "Connect Google Calendar and book appointments.", CalendarCheck],
  ["Website", "A clean website for service pros who need one.", Sparkles],
  ["Project Gallery", "Show finished work and build trust.", ImageIcon],
  ["QR Codes", "Turn signs, trucks, and cards into lead sources.", QrCode],
] as const;

const faqs = [
  {
    q: "Who is Contactor for?",
    a: "Service businesses that need a simple way to answer questions, capture leads, and book appointments.",
  },
  {
    q: "Do I need a website?",
    a: "No. If you already have one, you can add the Contactor chat widget. If you need one, Contactor can help you create one.",
  },
  {
    q: "Are there hidden fees?",
    a: "No. Contactor is $49.99 per month and includes the current feature set.",
  },
  {
    q: "Is this a complicated CRM?",
    a: "No. Contactor is built to stay simple and help service pros avoid missed opportunities.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white pt-10 text-gray-950">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-stone-200 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/branding/contactor-logo.png"
              alt="Contactor"
              width={260}
              height={70}
              priority
              className="h-auto w-[170px] sm:w-[210px]"
            />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-gray-600 md:flex">
            <a href="#why-us" className="hover:text-orange-700">Why Us</a>
            <a href="#features" className="hover:text-orange-700">Features</a>
            <a href="#pricing" className="hover:text-orange-700">Pricing</a>
            <a href="#faq" className="hover:text-orange-700">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Link>

            <Link
              href="/signup"
              className="saas-button-accent px-4 py-2 text-sm font-semibold shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="saas-shell pt-6">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1fr_0.75fr] lg:items-center lg:py-14">
          <div>
            <p className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700">
              Veteran Owned • Built for Service Pros
            </p>

            <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              Stop missing customers when you are busy working.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-gray-600">
              Contactor gives service businesses an AI receptionist that answers
              questions, captures leads, collects project details, and helps book
              appointments.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="saas-button-accent px-5 py-3 text-center text-sm font-semibold shadow-sm"
              >
                Get Started
              </Link>

              <a
                href="#demo"
                className="saas-button-secondary px-5 py-3 text-center text-sm font-semibold shadow-sm"
              >
                See It In Action
              </a>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md rounded-3xl border border-stone-200 bg-white p-4 shadow-[0_18px_45px_rgba(17,24,39,0.08)]">
            <div className="rounded-2xl bg-stone-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-700 text-white">
                  <MessageCircle className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-bold">AI Receptionist</p>
                  <p className="text-xs text-gray-500">Online and ready</p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <ChatBubble text="Do you do bathroom remodels?" />
                <ChatBubble fromAi text="Yes. What city is the project in?" />
                <ChatBubble text="Vista. Can someone come look next week?" />
                <ChatBubble fromAi text="Absolutely. I can help schedule the next step." />
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:col-span-2">
            <div className="grid w-full max-w-2xl gap-3 text-sm font-semibold text-gray-700 sm:grid-cols-3">
              <TrustPill text="$49.99/month" />
              <TrustPill text="No hidden fees" />
              <TrustPill text="No usage billing" />
            </div>
          </div>
        </div>
      </section>

      <section id="why-us" className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
              Why Contactor
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              Built for simplicity, not software complexity.
            </h2>
            <p className="mt-5 text-sm leading-7 text-gray-600">
              Service pros do not need another complicated system. They need a
              simple way to capture opportunities, answer common questions, and
              keep customers moving forward.
            </p>
          </div>

          <div className="space-y-4">
            <CheckRow text="One simple monthly price." />
            <CheckRow text="No hidden AI usage charges." />
            <CheckRow text="No bloated CRM to learn." />
            <CheckRow text="Designed for service businesses, not enterprise teams." />
          </div>
        </div>
      </section>

      <section id="mission" className="bg-gray-950 py-14 text-white">
        <div className="mx-auto max-w-6xl px-5 text-center sm:px-6">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-400">
            Our Mission
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Help service professionals spend less time chasing leads.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-sm leading-8 text-white/70">
            Contactor is veteran owned and built around a simple belief: technology
            should help small businesses, not overwhelm them. We want service pros to
            look professional, respond faster, and win more opportunities without
            adding more office work.
          </p>
        </div>
      </section>

      <section id="features" className="border-t border-stone-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              Everything needed to capture the next customer.
            </h2>
          </div>

          <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, text, Icon]) => (
              <div key={title} className="flex gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-950">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="bg-stone-50 py-16">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl bg-gray-950 p-8 text-white">
              <p className="text-xs font-bold uppercase tracking-wide text-orange-400">
                The Problem
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Service pros lose leads when they are busy working.
              </h2>

              <div className="mt-7 space-y-4">
                <DarkCheckRow text="Missed calls turn into missed jobs." />
                <DarkCheckRow text="Customers move on when follow-up is slow." />
                <DarkCheckRow text="Project details get scattered across texts, calls, and emails." />
                <DarkCheckRow text="Small teams do not have time for complicated software." />
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-8">
              <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                The Solution
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
                Contactor helps customers take the next step.
              </h2>

              <div className="mt-7 space-y-4">
                <CheckRow text="Answers common questions instantly." />
                <CheckRow text="Captures names, phone numbers, emails, and project details." />
                <CheckRow text="Collects photos before the first conversation." />
                <CheckRow text="Helps book calls, estimates, or appointments." />
              </div>
            </div>
          </div>

          <div
            id="pricing"
            className="mt-5 rounded-3xl border border-orange-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                  Simple Pricing
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                  $49.99/month. Everything included.
                </h2>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  No hidden fees. No usage billing. No complicated tiers while we help
                  early customers get started.
                </p>
              </div>

              <Link
                href="/signup"
                className="saas-button-accent inline-flex shrink-0 justify-center px-5 py-3 text-sm font-semibold shadow-sm"
              >
                Get Started
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MiniCheck text="AI Receptionist" />
              <MiniCheck text="Website tools" />
              <MiniCheck text="Lead capture" />
              <MiniCheck text="Scheduling" />
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
              About Us
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              Built by people who understand work, service, and follow-through.
            </h2>
            <p className="mt-5 text-sm leading-7 text-gray-600">
              Contactor was created to help small service businesses look
              professional, stay responsive, and capture opportunities even when
              they are busy in the field.
            </p>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              We are not trying to build complicated enterprise software. We are
              building practical tools that help real businesses.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-stone-200 bg-stone-50 p-8">
            <CheckRow text="Veteran owned" />
            <CheckRow text="Built for service pros" />
            <CheckRow text="Focused on simplicity" />
            <CheckRow text="Made to help small businesses win more work" />
          </div>
        </div>
      </section>

      <section className="bg-gray-950 py-16 text-white">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to stop missing customers?
          </h2>

          <p className="mt-4 text-sm leading-7 text-white/70">
            Let Contactor answer questions, capture leads, and help customers take the next step.
          </p>

          <Link
            href="/signup"
            className="saas-button-accent mt-8 inline-flex px-5 py-3 text-sm font-semibold shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </section>

      <section id="faq" className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
              FAQ
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              Frequently asked questions.
            </h2>

            <p className="mt-4 text-sm leading-7 text-gray-600">
              Still have questions? Ask Contactor and we’ll help you understand how it works.
            </p>

            <Link
              href="/signup"
              className="saas-button-accent mt-6 inline-flex px-5 py-3 text-sm font-semibold"
            >
              Get Started
            </Link>
          </div>

          <div className="divide-y divide-stone-200 rounded-3xl border border-stone-200 bg-white">
          {faqs.map((faq) => (
            <FAQItem
              key={faq.q}
              question={faq.q}
              answer={faq.a}
            />
          ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-gray-950 text-white">
        <div className="mx-auto grid max-w-5xl grid-cols-[2.5fr_1fr_1fr_1fr] gap-10 px-5 py-8">

          {/* Contactor */}
          <div>
            <div className="flex items-center gap-3">
            <Image
                src="/branding/contactor-logo.png"
                alt="Contactor"
                width={220}
                height={60}
                className="h-auto w-[180px]"
            />
            </div>

            <p className="mt-4 max-w-sm text-sm leading-7 text-white/60">
              AI receptionist, lead capture, scheduling, and website tools for
              service businesses.
            </p>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-orange-400">
              Veteran Owned
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-sm font-bold">Product</p>

            <div className="mt-4 space-y-3 text-sm text-white/60">
              <a href="#features" className="block hover:text-white">
                Features
              </a>

              <a href="#pricing" className="block hover:text-white">
                Pricing
              </a>

              <a href="#faq" className="block hover:text-white">
                FAQ
              </a>

              <Link href="/signup" className="block hover:text-white">
                Get Started
              </Link>
            </div>
          </div>

          {/* Account */}
          <div>
            <p className="text-sm font-bold">Account</p>

            <div className="mt-4 space-y-3 text-sm text-white/60">
              <Link href="/login" className="block hover:text-white">
                Login
              </Link>

              <Link href="/signup" className="block hover:text-white">
                Create Account
              </Link>

              <Link href="/forgot-password" className="block hover:text-white">
                Forgot Password
              </Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="text-sm font-bold">Legal</p>

            <div className="mt-4 space-y-3 text-sm text-white/60">
              <Link href="/terms" className="block hover:text-white">
                Terms
              </Link>

              <Link href="/privacy" className="block hover:text-white">
                Privacy
              </Link>

              <Link href="/ai-policy" className="block hover:text-white">
                AI Policy
              </Link>
            </div>
          </div>

        </div>

        <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/40">
          © {new Date().getFullYear()} Contactor. All rights reserved.
        </div>
      </footer>
      <Script src="/widget.js" strategy="afterInteractive" data-tenant="contactor" />
    </main>
  );
}

function TrustPill({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 py-3 text-center shadow-sm">
      {text}
    </div>
  );
}

function ChatBubble({ text, fromAi = false }: { text: string; fromAi?: boolean }) {
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
        fromAi
          ? "bg-white text-gray-700 shadow-sm"
          : "ml-auto max-w-[85%] bg-orange-700 text-white"
      }`}
    >
      {text}
    </div>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-stone-200">
      <button
        className="flex w-full items-center justify-between p-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-bold text-gray-950">
          {question}
        </span>

        {open ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm leading-7 text-gray-600">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

function CheckRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 text-sm font-semibold text-gray-800">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
      <span>{text}</span>
    </div>
  );
}
function DarkCheckRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 text-sm font-semibold text-white/85">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
      <span>{text}</span>
    </div>
  );
}

function MiniCheck({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
      <span>{text}</span>
    </div>
  );
}

function DemoLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 transition hover:text-orange-700"
    >
      <CheckCircle2 className="h-4 w-4 text-orange-700" />
      {label}
    </Link>
  );
}


