export type ExperienceCategory = 'all' | 'sales' | 'hr' | 'digital';

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  industry: string;
  period: string;
  category: Exclude<ExperienceCategory, 'all'>;
  subtitle?: string;
  highlights: string[];
  tools: string[];
}

export interface CaseStudyItem {
  id: string;
  title: string;
  organization: string;
  period: string;
  category: Exclude<ExperienceCategory, 'all'>;
  metricValue: string;
  metricLabel: string;
  summary: string;
  challenge: string;
  execution: string[];
  outcomes: string[];
  stack: string[];
}

export interface MetricHighlight {
  value: string;
  label: string;
  detail: string;
}

export const PROFILE = {
  name: 'Emam Hossan',
  headline: 'Connecting Global Talent, B2B Revenue & AI-Driven Operations',
  title: 'Sales & Marketing Specialist · HR & Recruitment Professional',
  summary:
    'Results-driven specialist with 4+ years across multi-country recruitment, HR operations, and digital marketing, now driving remote B2B sales and client outreach. Proven in cross-border collaboration with US-based teams, CRM pipeline governance, and AI-accelerated execution.',
  location: 'Mirpur, Dhaka · Remote Worldwide',
  phone: '+880-1706-558256',
  email: 'hr.emamhossan@gmail.com',
  linkedinUrl: 'https://www.linkedin.com/in/emam-hossan-recruiter',
  linkedinLabel: 'linkedin.com/in/emam-hossan-recruiter',
  googlePortfolioUrl: 'https://sites.google.com/view/emamhossan',
  resumePdfPath: '/assets/aistudio/Emam_Hossan_147388ff.pdf',
};

export const HERO_METRICS: MetricHighlight[] = [
  {
    value: '4+ Years',
    label: 'Cross-Border Experience',
    detail: 'Remote B2B sales, HR ops & digital growth',
  },
  {
    value: '4 Projects',
    label: 'Gov-Funded Delivery',
    detail: 'Including Her Power & LMS on time',
  },
  {
    value: 'Multi-Country',
    label: 'Full-Cycle Hiring',
    detail: 'US-aligned ATS, sourcing & onboarding',
  },
  {
    value: '8+ AI Models',
    label: 'AI-First Workflow',
    detail: 'Applied across QA, outreach & content',
  },
];

export const EXPERIENCES: ExperienceItem[] = [
  {
    id: 'tribune-sales',
    role: 'Sales and Marketing Specialist',
    company: 'Tribune Training Academy',
    location: 'Remote',
    industry: 'Corporate Training & EdTech',
    period: 'Apr 2026 – Present',
    category: 'sales',
    highlights: [
      'Conduct outbound and follow-up calls to existing clients to sustain relationships and drive repeat sales.',
      'Generate new B2B business through targeted cold calling and direct outreach to prospective companies.',
      'Convert qualified leads into paying clients through consultative discovery and structured follow-ups.',
      'Maintain Monday.com CRM with complete client records, call notes, and scheduled touchpoints.',
      'Track outreach volume and sales funnel velocity in Excel to monitor weekly pipeline progress.',
    ],
    tools: ['Monday.com CRM', 'B2B Cold Calling', 'Microsoft Excel', 'Consultative Sales'],
  },
  {
    id: 'ray-advertising',
    role: 'HR Specialist (Project-Based)',
    company: 'Ray Advertising',
    location: 'USA-Based (Remote)',
    industry: 'Insurance & Marketing Agency',
    period: 'Jan 2026 – Feb 2026',
    category: 'hr',
    subtitle: 'AI-Based HRMS & ERP System Implementation',
    highlights: [
      'Led multi-country full-cycle recruitment spanning ATS management, sourcing, interviews, offer letters, and onboarding.',
      'Identified and resolved critical bugs in an AI-based HRMS and ERP system, improving operational accuracy and reliability.',
      'Built diverse international talent pipelines meeting strict company timelines and quality benchmarks.',
      'Oversaw payroll processing, attendance tracking, performance monitoring, and retention initiatives.',
      'Maintained regional HR compliance, resolved employee conflicts, and bridged leadership with distributed teams.',
    ],
    tools: ['AI HRMS / ERP', 'Multi-Country ATS', 'Payroll & Compliance', 'Cross-Border Ops'],
  },
  {
    id: 'coderstrust-hr',
    role: 'Sr. Executive – HR & Administration',
    company: 'CodersTrust',
    location: 'Dhaka, Bangladesh',
    industry: 'Global EdTech Company',
    period: 'Oct 2023 – Dec 2025',
    category: 'hr',
    highlights: [
      'Directed end-to-end recruitment covering job postings, candidate screening, interview coordination, and onboarding.',
      'Successfully delivered 4 government-funded projects, including the Her Power Project and LMS Project, on schedule.',
      'Managed daily HR operations to sustain smooth cross-departmental workflows and employee satisfaction.',
      'Handled vendor management, contract negotiations, and procurement for administrative cost efficiency.',
      'Maintained structured HR compliance records, documentation workflows, and internal audit readiness.',
    ],
    tools: ['Full-Cycle Hiring', 'Vendor Negotiation', 'Gov-Project Ops', 'HR Compliance'],
  },
  {
    id: 'career-hive',
    role: 'Management Trainee Officer – HR & Recruitment',
    company: 'Career Hive Dot Com',
    location: 'Dhaka, Bangladesh',
    industry: 'Recruiting Agency',
    period: 'Jun 2022 – Dec 2024',
    category: 'hr',
    highlights: [
      'Served as Team Lead – Campus Pioneer, driving student engagement, employer branding, and campus talent acquisition.',
      'Managed full-cycle recruitment and onboarding workflows to shorten integration time for new joiners.',
      'Supported staff training and professional development initiatives to elevate team performance.',
      'Directed social media content strategy, significantly expanding employer brand visibility and candidate outreach.',
    ],
    tools: ['Campus Hiring', 'Employer Branding', 'Social Media Strategy', 'Team Leadership'],
  },
  {
    id: 'idiottbox',
    role: 'Picture Researcher',
    company: 'IdiottBox',
    location: 'Dhaka, Bangladesh',
    industry: 'Digital Marketing Agency',
    period: 'Nov 2021 – May 2022',
    category: 'digital',
    highlights: [
      'Wrote and curated multimedia content aligned directly with client marketing campaign objectives.',
      'Used Airtable to assign tasks, track team progress, and keep multi-editor timelines on schedule.',
      'Partnered with video editors to source high-impact footage tailored to campaign briefs.',
    ],
    tools: ['Airtable', 'Content Curation', 'Campaign Ops', 'Editorial Research'],
  },
  {
    id: 'local-marketplace',
    role: 'WordPress Project Contributor',
    company: 'Local Market Place',
    location: 'Dhaka, Bangladesh',
    industry: 'E-Commerce Operations',
    period: 'Feb 2021 – Apr 2021',
    category: 'digital',
    highlights: [
      'Developed and published engaging articles and product features across multiple WordPress properties.',
      'Conducted product research to identify high-potential items and managed structured product publication.',
    ],
    tools: ['WordPress', 'Product Research', 'E-Commerce Publishing'],
  },
];

export const CASE_STUDIES: CaseStudyItem[] = [
  {
    id: 'ray-hrms-case',
    title: 'Multi-Country Recruitment & AI HRMS/ERP Rollout',
    organization: 'Ray Advertising (USA)',
    period: 'Jan 2026 – Feb 2026',
    category: 'hr',
    metricValue: 'Multi-Country',
    metricLabel: 'Global Talent & QA Delivery',
    summary:
      'Executed international full-cycle hiring while diagnosing and resolving critical system defects during an AI-based HRMS/ERP implementation.',
    challenge:
      'A fast-moving US insurance and marketing agency needed simultaneous multi-country recruitment pipelines while rolling out an AI-powered HRMS/ERP platform that still contained workflow-blocking defects.',
    execution: [
      'Managed global ATS pipelines from job scoping and candidate sourcing through interviews, offer letters, and onboarding.',
      'Audited live HRMS/ERP workflows across payroll, attendance, and compliance modules, logging and resolving critical system bugs.',
      'Standardized regional policy documentation and served as the operational bridge between leadership and distributed staff.',
    ],
    outcomes: [
      'Improved HR operational accuracy and system reliability across payroll and attendance tracking.',
      'Delivered compliant, on-schedule international hiring across distributed time zones.',
      'Established transparent employee relations and retention monitoring across remote teams.',
    ],
    stack: ['AI HRMS / ERP', 'ATS Management', 'Regional Compliance', 'Cross-Border Comms'],
  },
  {
    id: 'coderstrust-gov-projects',
    title: 'Delivery of 4 Government-Funded EdTech Initiatives',
    organization: 'CodersTrust',
    period: 'Oct 2023 – Dec 2025',
    category: 'hr',
    metricValue: '4 / 4',
    metricLabel: 'On-Time & Within-Scope Delivery',
    summary:
      'Directed end-to-end talent acquisition, vendor procurement, and administrative governance for four high-accountability public-sector programs.',
    challenge:
      'Government-funded initiatives including the Her Power Project and LMS Project required rapid bulk hiring, strict documentation compliance, and tight vendor coordination under fixed deadlines.',
    execution: [
      'Built structured recruitment and onboarding pipelines to staff instructors, coordinators, and operational teams.',
      'Negotiated vendor contracts and managed procurement cycles to protect program budgets.',
      'Maintained audit-ready HR compliance records and cross-departmental reporting.',
    ],
    outcomes: [
      'Delivered all 4 government-funded projects on time and within scope.',
      'Reduced integration friction for new joiners through streamlined onboarding documentation.',
      'Improved administrative cost efficiency via disciplined vendor contract governance.',
    ],
    stack: ['Bulk Recruitment', 'Vendor Management', 'Compliance Audits', 'HR Operations'],
  },
  {
    id: 'tribune-b2b-engine',
    title: 'Remote B2B Sales & Monday.com Pipeline Architecture',
    organization: 'Tribune Training Academy',
    period: 'Apr 2026 – Present',
    category: 'sales',
    metricValue: 'End-to-End',
    metricLabel: 'Outbound & Retention Funnel',
    summary:
      'Driving remote B2B lead generation, consultative cold calling, client retention, and structured CRM pipeline tracking.',
    challenge:
      'Expand corporate training revenue remotely by balancing new B2B logo acquisition with consistent follow-ups on existing accounts.',
    execution: [
      'Executed daily cold calling and direct B2B outreach paired with consultative discovery calls.',
      'Structured Monday.com CRM records with detailed call logs, lead stages, and automated follow-up cadence.',
      'Built Excel pipeline trackers to surface conversion bottlenecks and prioritize warm opportunities.',
    ],
    outcomes: [
      'Converted cold and inbound prospects into paying corporate training clients.',
      'Increased repeat business through disciplined account follow-up schedules.',
      'Established single-source visibility across outreach volume and deal progression.',
    ],
    stack: ['Monday.com CRM', 'Cold Calling', 'Microsoft Excel', 'B2B Outreach'],
  },
  {
    id: 'career-hive-campus',
    title: 'Campus Pioneer Employer Branding & Talent Pipeline',
    organization: 'Career Hive Dot Com',
    period: 'Jun 2022 – Dec 2024',
    category: 'digital',
    metricValue: 'Team Lead',
    metricLabel: 'Campus & Digital Brand Growth',
    summary:
      'Led the Campus Pioneer initiative, uniting social media employer branding with high-velocity campus recruitment.',
    challenge:
      'Boost employer brand visibility among university talent while streamlining candidate intake and onboarding for client placements.',
    execution: [
      'Directed campus outreach events and student engagement programs as Team Lead – Campus Pioneer.',
      'Aligned social media content campaigns and print communications with active recruitment drives.',
      'Standardized candidate screening and onboarding handoffs across recruiting cohorts.',
    ],
    outcomes: [
      'Achieved measurable growth in employer brand print circulation and digital reach.',
      'Accelerated campus-to-hire pipeline velocity with cleaner onboarding workflows.',
      'Elevated team capability through structured training and development support.',
    ],
    stack: ['Employer Branding', 'Social Media Strategy', 'Canva & Adobe Suite', 'Campus Recruiting'],
  },
];

export const CORE_COMPETENCIES = [
  'Cold Calling',
  'B2B Communication',
  'Client Follow-ups',
  'CRM Management',
  'Sales & Lead Generation',
  'Full-Cycle Recruitment',
  'ATS Management',
  'Talent Acquisition',
  'Bulk / Mass Hiring',
  'Onboarding & Offboarding',
  'HR Operations',
  'HRMS / ERP Systems',
  'Employer Branding',
  'Employee Relations',
  'Vendor Management',
  'Conflict Resolution',
];

export const SOFTWARE_TOOLS = [
  'Microsoft Office (Excel)',
  'Google Workspace',
  'CRM Tools',
  'Monday.com',
  'ERP Systems',
  'HRMS Systems',
  'Canva',
  'Photoshop & Illustrator',
  'WordPress',
  'Airtable',
  'Social Media Management',
  'Digital Marketing',
];

export const AI_TOOLS = [
  'Claude (Anthropic)',
  'ChatGPT (OpenAI)',
  'Google Gemini',
  'Google AI Studio',
  'Perplexity AI',
  'Lovable AI',
  'Nanobanana',
  'Chathub',
];

export const EDUCATION = [
  {
    degree: 'BBA in Human Resources Management',
    institution: 'BGMEA University of Fashion & Technology, Dhaka',
    period: 'Jan 2019 – Jun 2023',
  },
  {
    degree: 'Higher Secondary Certificate (HSC)',
    institution: 'Dhaka Commerce College, Dhaka',
    period: 'Jun 2016 – Dec 2018',
  },
  {
    degree: 'Secondary School Certificate (SSC)',
    institution: 'Mirpur Bangla School & College, Dhaka',
    period: 'Jan 2009 – Feb 2016',
  },
];

export const CERTIFICATIONS_AND_EXTRAS = {
  certification: 'Digital Marketing & AI: Certificate Course – Social Media Strategist',
  languages: [
    { name: 'Bengali', level: 'Native' },
    { name: 'English', level: 'Advanced' },
  ],
  interests: ['Volunteer Work at Community Organizations', 'Football Enthusiast'],
};
