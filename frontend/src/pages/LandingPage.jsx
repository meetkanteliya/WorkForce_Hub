import { useMemo, createElement } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  Users,
  UserCog,
  MessageSquare,
  MessagesSquare,
  Paperclip,
  Activity,
  Bell,
  FileText,
  CalendarCheck2,
  ClipboardCheck,
  WalletCards,
  Download,
  Database,
  Lock,
  Sparkles,
  Layers3,
  Cpu,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200/60 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-900/5 backdrop-blur transition-colors dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
      {children}
    </span>
  );
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-600 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-emerald-400" />
          {eyebrow}
        </div>
      )}
      <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/10 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl dark:bg-emerald-500/10" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl dark:bg-sky-500/10" />
      </div>
      <div className="relative">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600 transition-colors group-hover:bg-indigo-50 dark:border-white/10 dark:bg-white/5 dark:text-emerald-400 dark:group-hover:bg-white/10">
          {createElement(Icon, { className: "h-5 w-5" })}
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      </div>
    </div>
  );
}

function BenefitCard({ title, description }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:shadow-md hover:shadow-slate-900/10 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  );
}

function StackBadge({ label }) {
  return (
    <span className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm shadow-slate-900/5 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
      {label}
    </span>
  );
}

export default function LandingPage() {
  const { isDarkMode, toggleTheme } = useTheme();

  const featureCards = useMemo(
    () => [
      {
        icon: ShieldCheck,
        title: 'Authentication & Roles',
        description:
          'JWT login with token refresh, plus role-based permissions for Admin, HR, Manager, and Employee access.',
      },
      {
        icon: UserCog,
        title: 'Employees & Departments',
        description:
          'Employee and department management, with self-profile (“me”) endpoints and server-side list filtering.',
      },
      {
        icon: MessagesSquare,
        title: 'Chat (REST + WebSockets)',
        description:
          'Company-wide chat with typing, presence, attachments, soft delete broadcasts, and read receipts. Department chat WebSocket consumer + REST history endpoint also exist.',
      },
      {
        icon: CalendarCheck2,
        title: 'Advanced Leave Management',
        description:
          'Leave types, leave requests, leave balances, and manager/admin/hr approve/reject actions with atomic balance deduction.',
      },
      {
        icon: WalletCards,
        title: 'Payroll',
        description:
          'Salary records with computed net salary, plus role-filtered access and a “My Salary” endpoint for employees.',
      },
      {
        icon: Activity,
        title: 'Dashboards, Audit Logs & Notifications',
        description:
          'Admin/HR dashboard summary + drill-down endpoints, audit log activity feed, and in-app notifications with mark-read and clear-all actions.',
      },
    ],
    []
  );

  const benefits = useMemo(
    () => [
      {
        title: 'JWT-secured access',
        description:
          'DRF endpoints are protected by JWT authentication with access + refresh tokens.',
      },
      {
        title: 'Role-based permissions',
        description:
          'Admin-only, Admin/HR, and Manager-or-above permissions are enforced across core modules.',
      },
      {
        title: 'Traceable operations',
        description:
          'Key actions generate audit log entries and employee-facing notifications for visibility.',
      },
      {
        title: 'Self-service profile updates',
        description:
          'Employees can view their profile and update fields (including profile picture via multipart).',
      },
      {
        title: 'Real-time collaboration',
        description:
          'Company chat is delivered via WebSockets (Channels), with an optional Redis channel layer for production-style setups.',
      },
    ],
    []
  );

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-500 dark:bg-[#0B1120] dark:text-slate-100">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur transition-colors dark:border-white/10 dark:bg-[#0B1120]/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/20 ring-1 ring-white/20">
              <span className="text-sm font-black tracking-tight">WH</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                WorkForce Hub
              </p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                HR Management & Collaboration
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={scrollToFeatures}
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white sm:inline-flex"
            >
              Explore Features
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 p-2 text-slate-700 shadow-sm shadow-slate-900/5 transition-all hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className="relative h-5 w-5">
                <Sun className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${isDarkMode ? 'scale-50 opacity-0 -rotate-90' : 'scale-100 opacity-100 rotate-0'}`} />
                <Moon className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${isDarkMode ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 rotate-90'}`} />
              </span>
            </button>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-emerald-500 dark:text-[#07130F] dark:hover:bg-emerald-400 dark:shadow-emerald-500/20"
            >
              Login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-slate-50 to-blue-600/10 transition-colors dark:from-emerald-500/10 dark:via-[#0B1120] dark:to-sky-500/10" />
        <div className="absolute -top-44 right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/15 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute -bottom-48 left-[-10rem] h-[32rem] w-[32rem] rounded-full bg-blue-500/15 blur-3xl dark:bg-sky-500/10" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="animate-fade-in">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>
                  <ShieldCheck className="mr-2 h-4 w-4 text-indigo-600" />
                  Enterprise-ready
                </Badge>
                <Badge>
                  <Lock className="mr-2 h-4 w-4 text-indigo-600" />
                  JWT-secured API
                </Badge>
                <Badge>
                  <Layers3 className="mr-2 h-4 w-4 text-indigo-600" />
                  Role-based access
                </Badge>
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                WorkForce Hub
              </h1>
              <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">
                An all-in-one Human Resource Management and Collaboration Platform designed to streamline organizational workflows.
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
                Bring HR operations, leave approvals, payroll records, and real-time communication into one secure system—built for clarity,
                productivity, and cross-team collaboration.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30 dark:from-emerald-500 dark:to-sky-500 dark:text-[#07130F] dark:shadow-emerald-500/20"
                >
                  Login
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={scrollToFeatures}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm shadow-slate-900/5 transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Explore Features
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm shadow-slate-900/5 backdrop-blur transition-colors dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Users className="h-4 w-4 text-indigo-600 dark:text-emerald-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Workforce</p>
                  </div>
                  <p className="mt-2 text-sm font-extrabold text-slate-900">Employee Directory</p>
                  <p className="mt-1 text-xs text-slate-600">Profiles, roles, departments.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm shadow-slate-900/5 backdrop-blur transition-colors dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ClipboardCheck className="h-4 w-4 text-indigo-600 dark:text-emerald-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Approvals</p>
                  </div>
                  <p className="mt-2 text-sm font-extrabold text-slate-900">Leave Workflows</p>
                  <p className="mt-1 text-xs text-slate-600">Balances and audits.</p>
                </div>
                <div className="hidden rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm shadow-slate-900/5 backdrop-blur transition-colors dark:border-white/10 dark:bg-white/5 sm:block">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-emerald-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Realtime</p>
                  </div>
                  <p className="mt-2 text-sm font-extrabold text-slate-900">Chat & Presence</p>
                  <p className="mt-1 text-xs text-slate-600">Fast team coordination.</p>
                </div>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 transition-colors dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 transition-colors dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-300">WorkForce Hub Console</div>
                  </div>
                </div>

                <div className="p-6 sm:p-7">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Building2 className="h-4 w-4 text-indigo-600 dark:text-emerald-400" />
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Departments</p>
                        </div>
                        <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">12</p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Structured org view.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Bell className="h-4 w-4 text-indigo-600 dark:text-emerald-400" />
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Notifications</p>
                        </div>
                        <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Live</p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Global updates.</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-emerald-400" />
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white">Company Chat</p>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Connected
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/10" />
                          <div className="flex-1 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-200">
                            Your leave request was approved.
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <div className="rounded-2xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white dark:bg-emerald-500 dark:text-[#07130F]">
                            Great—thanks!
                          </div>
                          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-white/10" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                        <Paperclip className="h-4 w-4" />
                        <span className="font-semibold">Attach file</span>
                        <span className="ml-auto font-bold text-slate-400">Enter to send</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-slate-700">
                          <FileText className="h-4 w-4 text-indigo-600" />
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">My Salary</p>
                        </div>
                        <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          View your salary records.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Database className="h-4 w-4 text-indigo-600" />
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Audit</p>
                        </div>
                        <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Trace changes with logs.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Cpu className="h-4 w-4 text-indigo-600" />
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Performance</p>
                        </div>
                        <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Built for scale.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* removed extra floating "upper right" blob visuals to match reference */}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Core capabilities"
          title="Everything your HR operations need — in one hub"
          subtitle="A product-focused toolkit for enterprise teams: structured org management, real-time collaboration, secure workflows, and complete operational visibility."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-slate-200/60 bg-white transition-colors dark:border-white/10 dark:bg-[#0B1120]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeading
                eyebrow="Why WorkForce Hub"
                title="Designed for clarity, control, and collaboration"
                subtitle="WorkForce Hub helps organizations reduce friction, maintain clean records, and enable real-time coordination across roles."
              />

              <div className="mt-8 grid gap-4">
                <BenefitCard title={benefits[0].title} description={benefits[0].description} />
                <BenefitCard title={benefits[1].title} description={benefits[1].description} />
                <BenefitCard title={benefits[2].title} description={benefits[2].description} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50 p-6 shadow-sm shadow-slate-900/5 transition-colors dark:border-white/10 dark:from-white/5 dark:to-white/5">
              <div className="grid gap-4 sm:grid-cols-2">
                <BenefitCard title={benefits[3].title} description={benefits[3].description} />
                <BenefitCard title={benefits[4].title} description={benefits[4].description} />
                <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 transition-colors dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Built for enterprise HR
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    Centralize employee data, streamline approvals, and keep teams connected—without compromising on security.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge>
                      <ShieldCheck className="mr-2 h-4 w-4 text-indigo-600 dark:text-emerald-400" />
                      RBAC
                    </Badge>
                    <Badge>
                      <Lock className="mr-2 h-4 w-4 text-indigo-600 dark:text-emerald-400" />
                      Secure API
                    </Badge>
                    <Badge>
                      <Activity className="mr-2 h-4 w-4 text-indigo-600 dark:text-emerald-400" />
                      Monitoring
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Technology stack"
          title="Modern stack for real-time HR workflows"
          subtitle="A production-grade architecture that blends REST, realtime events, and secure authentication."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <p className="text-sm font-extrabold text-slate-900">Backend</p>
            <p className="mt-1 text-sm text-slate-600">
              API-first services built for security and realtime collaboration.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StackBadge label="Django" />
              <StackBadge label="Django REST Framework" />
              <StackBadge label="Django Channels" />
              <StackBadge label="Redis" />
              <StackBadge label="JWT Auth" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <p className="text-sm font-extrabold text-slate-900">Frontend</p>
            <p className="mt-1 text-sm text-slate-600">
              Fast, responsive UI with a clean component-driven architecture.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StackBadge label="React 19" />
              <StackBadge label="Vite" />
              <StackBadge label="Tailwind CSS" />
              <StackBadge label="React Router" />
              <StackBadge label="Lucide Icons" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-slate-200/60 bg-white transition-colors dark:border-white/10 dark:bg-[#0B1120]">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-white to-blue-600/10 transition-colors dark:from-emerald-500/10 dark:via-[#0B1120] dark:to-sky-500/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-lg shadow-slate-900/10 backdrop-blur transition-colors dark:border-white/10 dark:bg-white/5 dark:shadow-black/40 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Get started</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Start Managing Your Workforce Smarter
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Login and access dashboards, approvals, chat, and payroll tools built for enterprise teams.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-extrabold text-white shadow-sm shadow-slate-900/25 transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-emerald-500 dark:text-[#07130F] dark:hover:bg-emerald-400 dark:shadow-emerald-500/20"
            >
              Login to WorkForce Hub
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-slate-50 transition-colors dark:border-white/10 dark:bg-[#0B1120]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/20">
                  <span className="text-sm font-black tracking-tight">WH</span>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">WorkForce Hub</p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Enterprise HR software for modern teams.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Manage workforce operations, collaboration, and governance in one platform.
              </p>
            </div>

            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Tech stack</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StackBadge label="Django + DRF" />
                <StackBadge label="Channels" />
                <StackBadge label="Redis" />
                <StackBadge label="React + Vite" />
                <StackBadge label="Tailwind" />
              </div>
            </div>

            <div className="md:text-right">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">Product</p>
              <div className="mt-3 flex flex-wrap gap-2 md:justify-end">
                <Badge>HR</Badge>
                <Badge>Collaboration</Badge>
                <Badge>Security</Badge>
                <Badge>Monitoring</Badge>
              </div>
              <p className="mt-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} WorkForce Hub. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

