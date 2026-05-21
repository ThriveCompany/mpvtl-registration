"use client";

import {
  ArrowLeft,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  FileUp,
  GraduationCap,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Wifi,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type Level = "Basic" | "Intermediate" | "Advanced";

type Course = {
  id: string;
  name: string;
  category: string;
  level: Level;
  duration: string;
  certificate: string;
  description: string;
  learn: string[];
  skills: string[];
  careers: string[];
  requirement: string;
  value: string;
};

type LocationOption = {
  id: string;
  name: string;
  address: string;
  hostel: string;
  wifi: string;
};

type UploadedFileData = {
  field: string;
  uploadedFileName: string;
  uploadedFileType: string;
  uploadedFileSize: number;
  file?: File;
};

type EmailVerificationState = {
  email: string;
  verificationId: string;
  verified: boolean;
  codeSent: boolean;
};

type SubmittedRegistrationState = {
  success: true;
  registrationId: string;
  submittedEmail: string;
  submittedCourse: string;
  submittedCenter: string;
  submittedAt: string;
  wasEdited?: boolean;
  editCount?: number;
};

type RegistrationConfig = {
  courses: { name: string; active: boolean }[];
  categories: { name: string; active: boolean }[];
  questions: { level: string; key: string; questionText: string; sortOrder: number }[];
};

const verificationAnswerKeys = [
  "priorExposure",
  "completedBasicCourse",
  "experienceDescription",
  "availableForEntryReview",
  "canReadAndWrite",
  "newToField",
  "reasonForCourse",
  "availableForPracticalTraining",
  "basicWriting",
  "priorTraining",
  "hasPreviousCertificate",
  "practicalExperience",
  "availableForAssessment",
] as const;

type VerificationAnswerKey = (typeof verificationAnswerKeys)[number];
type VerificationAnswers = Record<VerificationAnswerKey, string>;

const supplementalAnswerKeys = {
  reasonForCourseOther: "reasonForCourseOther",
  previousCertificateType: "previousCertificateType",
  previousCertificateTypeOther: "previousCertificateTypeOther",
} as const;

type SupplementalAnswerKey = (typeof supplementalAnswerKeys)[keyof typeof supplementalAnswerKeys];
type AnswerState = VerificationAnswers & Partial<Record<SupplementalAnswerKey, string>>;

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_SIZE_LABEL = "5MB";
const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const DRAFT_STORAGE_KEY = "mpvtlShortCourseRegistrationDraft";
const SUBMISSION_STORAGE_KEY = "mpvtlShortCourseRegistrationSubmission";

const categories = [
  "All Categories",
  "Culinary",
  "Beauty Therapy",
  "ICT",
  "Electrical & Solar",
  "Automobile & Mechatronics",
  "Welding & Fabrication",
  "Building & Construction",
  "Teaching & Assessment",
  "Health & Safety",
];

const trainingSessions = [
  "July - September, 2026 Batch",
  "October - December, 2026 Batch",
];

const shortCourseRequirements: Record<Level, string> = {
  Basic:
    "No formal educational qualification required. Applicants must be at least 14, provide valid identification, complete registration, and show willingness to follow MPVTL rules. Ability to read and write in English is an advantage.",
  Intermediate:
    "Basic knowledge or prior exposure to the trade is required. Completion of a basic course or equivalent experience is recommended. Applicants must provide valid identification and complete the registration process.",
  Advanced:
    "Prior training or demonstrable experience in the relevant field is required. Applicants must provide valid identification, submit supporting evidence where applicable, and attend assessment or interview.",
};

const courses: Course[] = [
  {
    id: "cake-design",
    name: "Cake Design, Decoration & Pastry Masterclass",
    category: "Culinary",
    level: "Intermediate",
    duration: "8 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Eight-week advanced training in cake artistry and pastry creation for events, celebrations, and commercial bakeries.",
    learn: ["Fondant work and buttercream finishing", "Sugar craft, piping, and decorative detailing", "Professional presentation for celebration cakes and pastry displays"],
    skills: ["Cake covering, trimming, stacking, and finishing", "Pastry decoration workflow", "Event-ready packaging and quality control"],
    careers: ["Cake studio or bakery production", "Event dessert table services", "Home-based pastry business"],
    requirement: shortCourseRequirements.Intermediate,
    value: "This course builds the decorative precision and production confidence needed for paid cake orders, bakery work, and event pastry presentation.",
  },
  {
    id: "continental-culinary",
    name: "Continental Culinary Arts - Nigerian & African Cuisine",
    category: "Culinary",
    level: "Intermediate",
    duration: "8 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Practical culinary training covering Nigerian, African, and continental dishes with plating, nutrition, and modern kitchen methods.",
    learn: ["Local and international cooking techniques", "Nigerian, African, and continental menu preparation", "Plating, nutrition basics, and modern culinary methods"],
    skills: ["Ingredient preparation and kitchen timing", "Menu execution across multiple cuisine styles", "Professional plate presentation"],
    careers: ["Restaurant kitchen support", "Catering and meal production", "Food business menu development"],
    requirement: shortCourseRequirements.Intermediate,
    value: "Students strengthen practical kitchen range, presentation standards, and menu confidence for catering, restaurant, and food business work.",
  },
  {
    id: "food-safety",
    name: "Professional Food Safety Compliance & Kitchen Hygiene (C&G Certified)",
    category: "Culinary",
    level: "Advanced",
    duration: "3 weeks",
    certificate: "City & Guilds, MPVTL Vocational Certificate of Completion",
    description: "Internationally certified food safety training covering HACCP, sanitation, contamination control, and professional kitchen compliance.",
    learn: ["HACCP principles and food safety standards", "Sanitation routines for professional kitchens", "Contamination control and safe food handling"],
    skills: ["Kitchen hygiene inspection habits", "Safe storage, preparation, and service control", "Compliance documentation for food operations"],
    careers: ["Professional kitchen supervision", "Catering compliance support", "Food business safety control"],
    requirement: shortCourseRequirements.Advanced,
    value: "This course is valuable for food handlers, caterers, and kitchen teams that need credible safety practice and certification-backed compliance knowledge.",
  },
  {
    id: "hair-styling",
    name: "Hair Styling & Hair Making Technology",
    category: "Beauty Therapy",
    level: "Basic",
    duration: "12 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Three-month training in cutting, braiding, weaving, styling, coloring, and hair treatments for salon work or self-employment.",
    learn: ["Cutting, braiding, weaving, and styling techniques", "Hair coloring and treatment basics", "Salon preparation, client handling, and finishing"],
    skills: ["Sectioning, styling, and protective hair work", "Hair treatment application", "Salon-ready grooming and finishing"],
    careers: ["Salon assistant roles", "Mobile hair styling services", "Self-employment in beauty services"],
    requirement: shortCourseRequirements.Basic,
    value: "Learners build usable salon skills for everyday styling services, beauty business growth, and hands-on client work.",
  },
  {
    id: "pedicure-manicure",
    name: "Professional Pedicure & Manicure Services",
    category: "Beauty Therapy",
    level: "Basic",
    duration: "2 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Focused nail care training covering grooming, hygiene, polishing techniques, and classic to modern salon styles.",
    learn: ["Professional nail grooming and hygiene", "Pedicure and manicure service steps", "Classic and modern polishing styles"],
    skills: ["Nail preparation and finishing", "Client-safe sanitation routines", "Salon-quality hand and foot care"],
    careers: ["Nail technician services", "Beauty salon support", "Mobile manicure and pedicure work"],
    requirement: shortCourseRequirements.Basic,
    value: "Students gain a compact, service-ready skill set for paid nail care work in salons, spas, and mobile beauty service settings.",
  },
  {
    id: "cctv",
    name: "CCTV Camera Installation Program",
    category: "ICT",
    level: "Intermediate",
    duration: "6 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Practical CCTV training in camera setup, cabling, DVR/NVR configuration, and surveillance system troubleshooting.",
    learn: ["Camera positioning and installation planning", "Cabling, connectors, DVR and NVR setup", "Surveillance system testing and fault tracing"],
    skills: ["Security camera installation", "Recorder configuration and basic networking", "Troubleshooting signal, power, and storage issues"],
    careers: ["Security systems installation", "Facility surveillance support", "Independent CCTV service work"],
    requirement: shortCourseRequirements.Intermediate,
    value: "The course prepares learners to install, configure, and support CCTV systems for homes, offices, shops, and facilities.",
  },
  {
    id: "computer-appreciation",
    name: "Computer Appreciation",
    category: "ICT",
    level: "Basic",
    duration: "8 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Beginner digital skills training covering typing, file management, internet use, email, and Microsoft Office tools.",
    learn: ["Keyboarding, file management, and computer navigation", "Internet research and email communication", "Microsoft Office tools for work and study"],
    skills: ["Basic document creation", "Digital communication confidence", "Organized file and folder handling"],
    careers: ["Office support readiness", "Study and workplace digital confidence", "Foundation for further ICT training"],
    requirement: shortCourseRequirements.Basic,
    value: "This course builds practical digital confidence for learners entering office work, business administration, study, or further ICT training.",
  },
  {
    id: "networking",
    name: "Computer Networking",
    category: "ICT",
    level: "Intermediate",
    duration: "8 weeks",
    certificate: "MPVTL Vocational Certificate of Completion, City & Guilds optional",
    description: "Hands-on networking course covering IP addressing, cabling, switching, routing, wireless networking, and security.",
    learn: ["IP addressing and basic network design", "Cabling, switching, routing, and wireless setup", "Network security and connectivity testing"],
    skills: ["LAN setup and troubleshooting", "Router and switch configuration basics", "Network documentation and fault isolation"],
    careers: ["Network support assistant", "ICT support technician", "Small office network installer"],
    requirement: shortCourseRequirements.Intermediate,
    value: "Students gain the practical network setup and troubleshooting skills needed for ICT support, office connectivity, and technical service roles.",
  },
  {
    id: "cyber-security",
    name: "Cyber Security",
    category: "ICT",
    level: "Advanced",
    duration: "8 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Cybersecurity training covering threat detection, ethical hacking basics, password security, and network defense strategies.",
    learn: ["Common cyber threats and attack patterns", "Ethical hacking concepts and defensive thinking", "Password, endpoint, and network protection practices"],
    skills: ["Threat spotting and incident awareness", "Basic vulnerability assessment", "Security hardening for users and small networks"],
    careers: ["Cybersecurity support pathway", "ICT risk awareness roles", "Network defense preparation"],
    requirement: shortCourseRequirements.Advanced,
    value: "This course strengthens defensive thinking and technical awareness for learners progressing into cybersecurity or ICT protection work.",
  },
  {
    id: "hardware-software",
    name: "ICT Hardware and Software Maintenance",
    category: "ICT",
    level: "Intermediate",
    duration: "8 weeks",
    certificate: "MPVTL Vocational Certificate of Completion, City & Guilds optional",
    description: "Computer maintenance training in assembling, upgrading, repairing, and troubleshooting desktop and laptop systems.",
    learn: ["Desktop and laptop component identification", "System installation, upgrades, and configuration", "Preventive maintenance and troubleshooting routines"],
    skills: ["Hardware assembly and component replacement", "Operating system installation", "Fault diagnosis for common computer issues"],
    careers: ["Computer repair technician", "ICT maintenance assistant", "Device support service business"],
    requirement: shortCourseRequirements.Intermediate,
    value: "Learners develop practical repair and maintenance ability for computer workshops, ICT departments, and independent support services.",
  },
  {
    id: "data-science",
    name: "Foundational Data Science & Analytics",
    category: "ICT",
    level: "Intermediate",
    duration: "12 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Practical analytics training using Excel, Python, statistics, visualization, and business data analysis.",
    learn: ["Spreadsheet analytics and data cleaning", "Python basics for data work", "Statistics, visualization, and business insight reporting"],
    skills: ["Data preparation and analysis", "Dashboard and chart interpretation", "Basic business reporting"],
    careers: ["Data analyst foundation", "Business reporting support", "Operations and admin analytics"],
    requirement: shortCourseRequirements.Intermediate,
    value: "This course helps learners turn raw business information into charts, summaries, and useful decisions with modern analytics tools.",
  },
  {
    id: "advanced-electrical",
    name: "Advanced Electrical Installation",
    category: "Electrical & Solar",
    level: "Advanced",
    duration: "8 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Advanced electrical installation training covering three-phase systems, motor controls, panel wiring, and industrial electrical systems.",
    learn: ["Three-phase power systems", "Motor control and panel wiring", "Industrial installation procedures"],
    skills: ["Advanced circuit interpretation", "Panel assembly and wiring control", "Industrial fault tracing"],
    careers: ["Electrical technician advancement", "Industrial maintenance support", "Supervisory installation pathway"],
    requirement: shortCourseRequirements.Advanced,
    value: "Experienced learners build higher-level competence for industrial installations, maintenance work, and supervisory electrical tasks.",
  },
  {
    id: "beginner-electrical",
    name: "Beginner Electrical Installation",
    category: "Electrical & Solar",
    level: "Basic",
    duration: "8 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Foundational electrical installation course covering domestic and industrial wiring, circuit design, distribution boards, testing, and troubleshooting.",
    learn: ["Domestic and industrial wiring basics", "Circuit design and distribution boards", "Testing, safety checks, and troubleshooting"],
    skills: ["Cable handling and wiring layout", "Basic installation and maintenance tasks", "Safe use of electrical tools and testers"],
    careers: ["Electrical assistant roles", "Apprenticeship preparation", "Foundation for advanced installation training"],
    requirement: shortCourseRequirements.Basic,
    value: "Students gain the practical foundation needed to install and maintain safe electrical systems under proper supervision.",
  },
  {
    id: "auto-electrical",
    name: "Automobile Electrical Works",
    category: "Automobile & Mechatronics",
    level: "Intermediate",
    duration: "12 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Vehicle electrical training covering batteries, wiring, sensors, lighting circuits, diagnostics, ECU basics, and fault finding.",
    learn: ["Automotive batteries, wiring, and lighting circuits", "Sensors, ECU basics, and diagnostic flow", "Fault finding with professional tools"],
    skills: ["Vehicle electrical testing", "Circuit tracing and repair", "Diagnostic reporting for cars, buses, and heavy-duty vehicles"],
    careers: ["Automobile electrical technician", "Vehicle diagnostic support", "Workshop service roles"],
    requirement: shortCourseRequirements.Intermediate,
    value: "Learners build the confidence to service and repair modern vehicle electrical systems across common workshop situations.",
  },
  {
    id: "mechatronics",
    name: "Mechatronics System Principles & Fault Finding (C&G Certified)",
    category: "Automobile & Mechatronics",
    level: "Advanced",
    duration: "8 weeks",
    certificate: "City & Guilds, MPVTL Vocational Certificate of Completion",
    description: "City & Guilds mechatronics training in control systems, PLC basics, and fault finding for modern automated equipment.",
    learn: ["Mechatronics system principles", "Control systems and PLC basics", "Fault finding for automated equipment"],
    skills: ["Automation component identification", "Control fault tracing", "Systematic diagnosis of mechanical-electrical faults"],
    careers: ["Industrial automation support", "Mechatronics maintenance pathway", "Advanced manufacturing technician preparation"],
    requirement: shortCourseRequirements.Advanced,
    value: "This course supports progression into automation and maintenance roles where mechanical, electrical, and control systems meet.",
  },
  {
    id: "solar",
    name: "Solar System Installation",
    category: "Electrical & Solar",
    level: "Intermediate",
    duration: "8 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Solar installation training covering panel mounting, battery banks, inverters, charge controllers, system sizing, and troubleshooting.",
    learn: ["Solar panel mounting and wiring", "Battery banks, inverters, and charge controllers", "System sizing and maintenance checks"],
    skills: ["Solar component installation", "Basic load assessment", "Renewable energy fault tracing"],
    careers: ["Solar installation technician", "Renewable energy service support", "Independent solar installation work"],
    requirement: shortCourseRequirements.Intermediate,
    value: "Students gain practical renewable energy skills for installation companies, facility support, and independent solar service work.",
  },
  {
    id: "smaw",
    name: "Manual Arc Welding Technology (SMAW)",
    category: "Welding & Fabrication",
    level: "Basic",
    duration: "8 weeks",
    certificate: "MPVTL Vocational Certificate of Completion, City & Guilds optional",
    description: "Shielded metal arc welding training focused on electrode handling, joint preparation, and strong clean welds for repairs and construction.",
    learn: ["SMAW equipment setup and electrode handling", "Joint preparation and weld positioning", "Clean weld production for repair and construction tasks"],
    skills: ["Arc striking and bead control", "Basic welding safety", "Weld inspection and correction"],
    careers: ["Entry-level welding support", "Repair workshop assistance", "Foundation for fabrication training"],
    requirement: shortCourseRequirements.Basic,
    value: "Learners build the core welding control needed for repair work, construction support, and progression into fabrication.",
  },
  {
    id: "fabrication",
    name: "Welding & Metal Fabrication Technology",
    category: "Welding & Fabrication",
    level: "Intermediate",
    duration: "12 weeks",
    certificate: "MPVTL Vocational Certificate of Completion, City & Guilds optional",
    description: "Hands-on fabrication training in cutting, joining, structural assembly, workshop safety, blueprint reading, and practical welding techniques.",
    learn: ["Metal cutting, joining, and structural assembly", "Workshop safety and blueprint reading", "Fabrication of gates, tanks, frames, and industrial structures"],
    skills: ["Fabrication layout and measurement", "Welding technique selection", "Assembly and finishing of metal projects"],
    careers: ["Fabrication workshop roles", "Construction metalwork services", "Manufacturing and engineering workshop support"],
    requirement: shortCourseRequirements.Intermediate,
    value: "Students gain practical fabrication ability for construction, manufacturing, and engineering workshop projects.",
  },
  {
    id: "autocad",
    name: "AutoCAD Training",
    category: "Building & Construction",
    level: "Intermediate",
    duration: "6 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Computer-aided design and drafting training using AutoCAD for 2D drawings, basic 3D drawings, technical plans, and layout designs.",
    learn: ["AutoCAD interface, drawing tools, and editing commands", "2D drafting and basic 3D drawing", "Technical plans and layout presentation"],
    skills: ["Accurate digital drafting", "Engineering and construction drawing preparation", "Dimensioning, annotation, and layout control"],
    careers: ["Drafting assistant roles", "Construction drawing support", "Engineering and architecture design pathway"],
    requirement: shortCourseRequirements.Intermediate,
    value: "Learners build drafting skills used in engineering, architecture, construction, and technical project communication.",
  },
  {
    id: "plumbing",
    name: "Plumbing & Pipe Fitting",
    category: "Building & Construction",
    level: "Basic",
    duration: "8 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Plumbing course covering domestic and industrial systems, pipe joining methods, drainage, water supply layouts, fittings, and maintenance.",
    learn: ["Pipe joining methods and fittings", "Drainage and water supply layouts", "Domestic and industrial plumbing maintenance"],
    skills: ["Pipe measurement, cutting, and fitting", "Leak checks and basic repairs", "On-site plumbing installation practice"],
    careers: ["Plumbing assistant roles", "Facility maintenance support", "Construction site plumbing pathway"],
    requirement: shortCourseRequirements.Basic,
    value: "Students gain practical plumbing skills for construction sites, facility maintenance, and supervised installation work.",
  },
  {
    id: "masonry",
    name: "Professional Masonry & Construction Technology",
    category: "Building & Construction",
    level: "Intermediate",
    duration: "12 weeks",
    certificate: "MPVTL Vocational Certificate of Completion",
    description: "Practical masonry and construction training covering bricklaying, concrete works, plastering, tiling, and site practice.",
    learn: ["Bricklaying and blockwork", "Concrete works, plastering, and tiling", "Construction site practice and workmanship standards"],
    skills: ["Wall setting and alignment", "Surface preparation and finishing", "Basic site measurement and material handling"],
    careers: ["Masonry and construction roles", "Site assistant progression", "Building trade self-employment"],
    requirement: shortCourseRequirements.Intermediate,
    value: "Learners build construction-site competence for masonry, finishing, and practical building trade work.",
  },
  {
    id: "teaching",
    name: "Teaching, Training & Assessing Learning (C&G Certified)",
    category: "Teaching & Assessment",
    level: "Advanced",
    duration: "8 weeks",
    certificate: "MPVTL Vocational Certificate of Completion, City & Guilds optional",
    description: "Practical programme for professionals who need to teach, train, and assess vocational learners effectively.",
    learn: ["Vocational lesson planning", "Training delivery and learner engagement", "Assessment evidence, feedback, and record keeping"],
    skills: ["Facilitating practical learning sessions", "Designing assessment tasks", "Giving structured learner feedback"],
    careers: ["Vocational trainer roles", "Workplace assessor pathway", "Training centre instructional support"],
    requirement: shortCourseRequirements.Advanced,
    value: "This course helps experienced practitioners convert trade knowledge into structured teaching, assessment, and learner support practice.",
  },
  {
    id: "trade-test",
    name: "Trade Test Preparation",
    category: "Teaching & Assessment",
    level: "Intermediate",
    duration: "12 weeks",
    certificate: "MPVTL Vocational Certificate of Completion, Trade Test Certification",
    description: "Preparation course for engineering trade test certification through practical drills, refresher theory, mock assessment, and exam readiness training.",
    learn: ["Trade test task expectations", "Refresher theory for technical practice", "Mock assessment and practical drills"],
    skills: ["Assessment timing and task completion", "Trade theory revision", "Practical confidence under exam conditions"],
    careers: ["Trade certification readiness", "Technical role advancement", "Workshop and site credibility"],
    requirement: shortCourseRequirements.Intermediate,
    value: "Learners prepare for trade test assessment with guided practice, theory refreshers, and structured exam readiness.",
  },
  {
    id: "engineering-hse",
    name: "Engineering Health and Safety (C&G Certified)",
    category: "Health & Safety",
    level: "Advanced",
    duration: "8 weeks",
    certificate: "City & Guilds, MPVTL Vocational Certificate of Completion",
    description: "Engineering safety course covering hazard identification, basic risk assessment, and safe working procedures in technical environments.",
    learn: ["Engineering workplace hazards", "Basic risk assessment practice", "Safe working procedures and control measures"],
    skills: ["Hazard spotting and reporting", "Safety procedure application", "Practical risk control thinking"],
    careers: ["Engineering safety support", "Workshop supervision pathway", "Technical compliance awareness"],
    requirement: shortCourseRequirements.Advanced,
    value: "This course strengthens safety discipline for engineering workplaces, workshops, technical teams, and supervised practical training spaces.",
  },
];

const locations: LocationOption[] = [
  { id: "L1000", name: "Lagos", address: "Okunola Bus Stop, Egbeda, Idimu, Lagos State, Nigeria", hostel: "Hostel available", wifi: "Campus WiFi available" },
  { id: "L1001", name: "Atan", address: "Atan, Ota, Ogun State", hostel: "No hostel listed", wifi: "WiFi not listed" },
  { id: "L1002", name: "Sagamu", address: "Sagamu Express Bus Stop, Sagamu LGA, Ogun State, Nigeria", hostel: "Hostel available", wifi: "Campus WiFi available" },
  { id: "L1003", name: "Ibadan", address: "Dugbe, Ibadan LGA, Oyo State", hostel: "No hostel listed", wifi: "WiFi not listed" },
  { id: "L1004", name: "Abuja", address: "Ahmadu Bello Way, Area 11, Garki, Abuja", hostel: "No hostel listed", wifi: "WiFi not listed" },
  { id: "L1005", name: "Beauty Therapy Centre", address: "No 2 Gem building adjacent Ventura Mall, Songo, Ibadan.", hostel: "No hostel listed", wifi: "WiFi not listed" },
  { id: "L2000", name: "Online", address: "Online learning mode", hostel: "Not applicable", wifi: "Stable internet required" },
];

const centerWhatsAppNumbers: Record<string, string> = {
  L1000: "+2349024208667",
  L1001: "+2348036545517",
  L1002: "+2347059558727",
  L1003: "+2348036358220",
  L1004: "+2348023041736",
  L1005: "+2348067228580",
};

const courseLocationIds: Record<string, string[]> = {
  "cake-design": ["L1000"],
  "continental-culinary": ["L1000"],
  "food-safety": ["L1000"],
  "hair-styling": ["L1005"],
  "pedicure-manicure": ["L1005"],
  cctv: ["L1002", "L1000"],
  "computer-appreciation": ["L1002", "L1000"],
  networking: ["L1002", "L1000"],
  "cyber-security": ["L1002", "L1000", "L2000"],
  "hardware-software": ["L1002", "L1000"],
  "data-science": ["L2000"],
  "advanced-electrical": ["L1002", "L1000"],
  "beginner-electrical": ["L1002", "L1000"],
  "auto-electrical": ["L1004"],
  mechatronics: ["L1002", "L1000", "L2000"],
  solar: ["L1002", "L1000"],
  smaw: ["L1001"],
  fabrication: ["L1001"],
  autocad: ["L2000"],
  plumbing: ["L1000"],
  masonry: ["L1004"],
  teaching: ["L1003"],
  "trade-test": ["L1003"],
  "engineering-hse": ["L2000"],
};

const basicQuestionKeys = {
  readWriteEnglish: "canReadAndWrite",
  newToField: "newToField",
  courseReason: "reasonForCourse",
  courseReasonOther: supplementalAnswerKeys.reasonForCourseOther,
  practicalAvailability: "availableForPracticalTraining",
} as const;

const intermediateQuestionKeys = {
  priorExposure: "priorExposure",
  completedBasicCourse: "completedBasicCourse",
  experienceBrief: "experienceDescription",
  entryReviewAvailability: "availableForEntryReview",
} as const;

const advancedQuestionKeys = {
  priorTraining: "priorTraining",
  previousCertificate: "hasPreviousCertificate",
  practicalExperience: "practicalExperience",
  assessmentAvailability: "availableForAssessment",
  certificateType: supplementalAnswerKeys.previousCertificateType,
  certificateTypeOther: supplementalAnswerKeys.previousCertificateTypeOther,
} as const;

const questions: Record<Level, VerificationAnswerKey[]> = {
  Basic: [
    basicQuestionKeys.readWriteEnglish,
    basicQuestionKeys.newToField,
    basicQuestionKeys.courseReason,
    basicQuestionKeys.practicalAvailability,
  ],
  Intermediate: [
    intermediateQuestionKeys.priorExposure,
    intermediateQuestionKeys.completedBasicCourse,
    intermediateQuestionKeys.experienceBrief,
    intermediateQuestionKeys.entryReviewAvailability,
  ],
  Advanced: [
    advancedQuestionKeys.priorTraining,
    advancedQuestionKeys.previousCertificate,
    advancedQuestionKeys.practicalExperience,
    advancedQuestionKeys.assessmentAvailability,
  ],
};

const standardSteps = ["Course", "Description", "Centre", "Details", "Verify", "Upload", "Submit"];
const basicSteps = ["Course", "Description", "Centre", "Details", "Verify", "Confirm", "Submit"];

const yesNoOptions = ["Yes", "No"];
const availabilityOptions = ["Yes", "No", "Maybe"];
const courseReasonOptions = [
  "Start a new skill or career",
  "Improve my current work",
  "Start or grow a business",
  "Prepare for employment",
  "Build personal confidence",
  "Other, please describe",
];
const certificateTypeOptions = [
  "City & Guilds",
  "Trade Test",
  "NABTEB",
  "MPVTL Certificate of Completion",
  "National Diploma (ND)",
  "Higher National Diploma (HND)",
  "Degree",
  "Other, please describe",
];

function locationHasHostel(location?: LocationOption) {
  return location?.hostel.toLowerCase() === "hostel available";
}

function sanitizeWhatsAppNumber(phoneNumber: string) {
  return phoneNumber.replace(/\D/g, "");
}

function getCenterWhatsAppUrl(location?: LocationOption) {
  const phoneNumber = location?.id === "L2000"
    ? centerWhatsAppNumbers.L1000
    : centerWhatsAppNumbers[location?.id ?? ""] || centerWhatsAppNumbers.L1000;
  const message = encodeURIComponent(
    "Hello MPVTL, I just submitted a short course registration and need assistance.",
  );

  return `https://wa.me/${sanitizeWhatsAppNumber(phoneNumber)}?text=${message}`;
}

function safeArray<T>(value: readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : [];
}

function createEmptyVerificationAnswers(): VerificationAnswers {
  return Object.fromEntries(safeArray(verificationAnswerKeys).map((key) => [key, ""])) as VerificationAnswers;
}

function createEmptyAnswerState(): AnswerState {
  return createEmptyVerificationAnswers();
}

function normalizeDraftFiles(value: unknown): Record<string, UploadedFileData | undefined> {
  if (typeof value !== "object" || value === null) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        if (typeof item !== "object" || item === null) return [key, undefined];

        const upload = item as Partial<UploadedFileData>;
        if (
          typeof upload.field !== "string"
          || typeof upload.uploadedFileName !== "string"
          || typeof upload.uploadedFileType !== "string"
          || typeof upload.uploadedFileSize !== "number"
        ) {
          return [key, undefined];
        }

        return [key, {
          field: upload.field,
          uploadedFileName: upload.uploadedFileName,
          uploadedFileType: upload.uploadedFileType,
          uploadedFileSize: upload.uploadedFileSize,
        }];
      })
      .filter(([, item]) => Boolean(item)),
  ) as Record<string, UploadedFileData | undefined>;
}

function serializeDraftFiles(files: Record<string, UploadedFileData | undefined>) {
  return Object.fromEntries(
    Object.entries(files)
      .filter(([, upload]) => Boolean(upload))
      .map(([key, upload]) => [
        key,
        {
          field: upload?.field ?? key,
          uploadedFileName: upload?.uploadedFileName ?? "",
          uploadedFileType: upload?.uploadedFileType ?? "",
          uploadedFileSize: upload?.uploadedFileSize ?? 0,
        },
      ]),
  ) as Record<string, UploadedFileData | undefined>;
}

function normalizeAnswerState(value: unknown): AnswerState {
  const normalized = createEmptyAnswerState();
  if (typeof value !== "object" || value === null) return normalized;

  const source = value as Record<string, unknown>;
  const legacyKeyMap: Record<string, keyof AnswerState> = {
    "Can you read and write in English?": "canReadAndWrite",
    "Are you new to this field?": "newToField",
    "Are you new to the selected course?": "newToField",
    "Why do you want to take this course?": "reasonForCourse",
    "Why do you want to take the selected course?": "reasonForCourse",
    "Course interest details": supplementalAnswerKeys.reasonForCourseOther,
    "Are you available for practical training?": "availableForPracticalTraining",
    "Do you have basic knowledge or prior exposure to this trade?": "priorExposure",
    "Do you have basic knowledge or prior exposure to the selected course?": "priorExposure",
    "Have you completed a basic course before?": "completedBasicCourse",
    "Have you completed a basic course in this field before?": "completedBasicCourse",
    "Describe your experience briefly.": "experienceDescription",
    "Are you available for Entry Review?": "availableForEntryReview",
    "Do you have prior training or demonstrable experience?": "priorTraining",
    "Do you have a previous certificate?": "hasPreviousCertificate",
    "Describe your practical experience.": "practicalExperience",
    "Are you available for assessment/interview?": "availableForAssessment",
    "Previous certificate type": supplementalAnswerKeys.previousCertificateType,
    "Previous certificate type details": supplementalAnswerKeys.previousCertificateTypeOther,
  };

  Object.entries(source).forEach(([key, value]) => {
    if (typeof value !== "string") return;
    const stableKey = (verificationAnswerKeys as readonly string[]).includes(key)
      || (Object.values(supplementalAnswerKeys) as readonly string[]).includes(key)
      ? key as keyof AnswerState
      : legacyKeyMap[key];

    if (stableKey) normalized[stableKey] = value;
  });

  return normalized;
}

function buildVerificationAnswers(rawAnswers: AnswerState): VerificationAnswers {
  const stableAnswers = createEmptyVerificationAnswers();

  verificationAnswerKeys.forEach((key) => {
    stableAnswers[key] = rawAnswers[key]?.trim() ?? "";
  });

  if (rawAnswers.reasonForCourse === "Other, please describe") {
    stableAnswers.reasonForCourse = rawAnswers.reasonForCourseOther?.trim()
      ? `Other: ${rawAnswers.reasonForCourseOther.trim()}`
      : "Other, please describe";
  }

  return stableAnswers;
}

function buildVerificationQuestionSnapshot(level: Level, courseName: string) {
  const course = courseName || "selected course";
  if (level === "Basic") {
    return {
      canReadAndWrite: "Can you read and write in English?",
      newToField: `Are you new to ${course}?`,
      reasonForCourse: `Why are you registering for ${course}?`,
      availableForPracticalTraining: `Are you available for practical training in ${course}?`,
      basicWriting: "Writing sample typed by applicant.",
    };
  }

  if (level === "Intermediate") {
    return {
      priorExposure: `Do you have basic knowledge or prior exposure to ${course}?`,
      completedBasicCourse: `Have you completed a basic course in ${course} before?`,
      experienceDescription: `Describe your experience with ${course} briefly.`,
      availableForEntryReview: `Are you available for ${course} Entry Review?`,
    };
  }

  return {
    priorTraining: `Do you have prior training or demonstrable experience in ${course}?`,
    hasPreviousCertificate: `Do you have a previous certificate in ${course}?`,
    practicalExperience: `Describe your practical experience in ${course}.`,
    availableForAssessment: `Are you available for ${course} assessment/interview?`,
  };
}

function clampStep(value: unknown, maxStep: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(Math.round(value), 0), maxStep)
    : 0;
}

function readRegistrationDraft() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY) || "null") as {
      step?: number;
      search?: string;
      category?: string;
      selectedCourseId?: string;
      selectedLocation?: string;
      selectedSession?: string;
      details?: { fullName?: string; email?: string; phone?: string; hostel?: string };
      answers?: Record<string, string>;
      files?: Record<string, UploadedFileData | undefined>;
      basicDeclaration?: string;
      receiveUpdates?: boolean;
      showIntro?: boolean;
      emailVerification?: Partial<EmailVerificationState>;
    } | null;
  } catch {
    return null;
  }
}

function readSubmittedRegistration() {
  if (typeof window === "undefined") return null;

  try {
    const value = JSON.parse(window.localStorage.getItem(SUBMISSION_STORAGE_KEY) || "null") as Partial<SubmittedRegistrationState> | null;
    if (!value?.success || !value.registrationId) return null;

    return {
      success: true,
      registrationId: value.registrationId,
      submittedEmail: value.submittedEmail ?? "",
      submittedCourse: value.submittedCourse ?? "",
      submittedCenter: value.submittedCenter ?? "",
      submittedAt: value.submittedAt ?? "",
      wasEdited: Boolean(value.wasEdited),
      editCount: typeof value.editCount === "number" ? value.editCount : 0,
    } satisfies SubmittedRegistrationState;
  } catch {
    return null;
  }
}

function writeSubmittedRegistration(value: SubmittedRegistrationState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // The success screen still works even if the browser blocks persistence.
  }
}

function writeRegistrationDraft(draft: {
  step: number;
  search: string;
  category: string;
  selectedCourseId: string;
  selectedLocation: string;
  selectedSession: string;
  details: { fullName: string; email: string; phone: string; hostel: string };
  answers: AnswerState;
  files: Record<string, UploadedFileData | undefined>;
  basicDeclaration: string;
  receiveUpdates: boolean;
  showIntro: boolean;
  emailVerification: EmailVerificationState;
}) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, files: {} }));
    } catch {
      // Some private browser modes block localStorage; the form still works.
    }
  }
}

export default function RegisterPage() {
  const formRef = useRef<HTMLElement | null>(null);
  const stepPanelRef = useRef<HTMLDivElement | null>(null);
  const previousStepRef = useRef(0);
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [details, setDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    hostel: "",
  });
  const [answers, setAnswers] = useState<AnswerState>(createEmptyAnswerState());
  const [files, setFiles] = useState<Record<string, UploadedFileData | undefined>>({});
  const [basicDeclaration, setBasicDeclaration] = useState("");
  const [receiveUpdates, setReceiveUpdates] = useState(true);
  const finalAction = "Submit Registration";
  const [emailVerification, setEmailVerification] = useState<EmailVerificationState>({
    email: "",
    verificationId: "",
    verified: false,
    codeSent: false,
  });
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [emailVerificationLoading, setEmailVerificationLoading] = useState<"" | "send" | "verify">("");
  const [emailVerificationMessage, setEmailVerificationMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<SubmittedRegistrationState | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [draftReady, setDraftReady] = useState(false);
  const [registrationConfig, setRegistrationConfig] = useState<RegistrationConfig | null>(null);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId);
  const availableLocations = selectedCourse
    ? locations.filter((location) => courseLocationIds[selectedCourse.id]?.includes(location.id))
    : [];
  const selectedLocationData = locations.find((location) => location.id === selectedLocation);
  const shouldAskHostel = locationHasHostel(selectedLocationData);
  const selectedLevel = selectedCourse?.level ?? "Basic";
  const configuredQuestions = (registrationConfig?.questions ?? [])
    .filter((question) => question.level === selectedLevel && (verificationAnswerKeys as readonly string[]).includes(question.key))
    .sort((first, second) => first.sortOrder - second.sortOrder);
  const questionTextByKey = Object.fromEntries(
    configuredQuestions.map((question) => [question.key, question.questionText.replaceAll("{course}", selectedCourse?.name ?? "selected course")]),
  ) as Partial<Record<VerificationAnswerKey, string>>;
  const activeQuestions = configuredQuestions.length > 0
    ? configuredQuestions.map((question) => question.key as VerificationAnswerKey)
    : Array.isArray(questions[selectedLevel]) ? questions[selectedLevel] : [];
  const activeSteps = selectedLevel === "Basic" ? basicSteps : standardSteps;
  const stepItems = Array.isArray(activeSteps) ? activeSteps : [];
  const uploadedFiles = Object.values(files ?? {}).filter(Boolean) as UploadedFileData[];
  const selectedEvidenceFiles = uploadedFiles.filter((upload) => upload.file);
  const editingExistingSubmission = Boolean(submittedRecord?.registrationId);
  const centerWhatsAppUrl = getCenterWhatsAppUrl(selectedLocationData);
  const normalizedApplicantEmail = details.email.trim().toLowerCase();
  const verifiedEmail = emailVerification.email.trim().toLowerCase();
  const emailVerified = Boolean(
    emailVerification.verified &&
      emailVerification.verificationId &&
      verifiedEmail === normalizedApplicantEmail,
  );
  const verifiedEmailVerificationId = emailVerified ? emailVerification.verificationId : "";

  const filteredCourses = useMemo(() => {
    const courseRows = registrationConfig?.courses ?? [];
    const categoryRows = registrationConfig?.categories ?? [];
    const inactiveCourseNames = new Set(courseRows.filter((item) => !item.active).map((item) => item.name.toLowerCase()));
    const inactiveCategoryNames = new Set(categoryRows.filter((item) => !item.active).map((item) => item.name.toLowerCase()));

    return courses.filter((course) => {
      if (inactiveCourseNames.has(course.name.toLowerCase())) return false;
      if (inactiveCategoryNames.has(course.category.toLowerCase())) return false;
      const matchesCategory = category === "All Categories" || course.category === category;
      const matchesSearch = course.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, registrationConfig, search]);
  const visibleCategories = useMemo(() => {
    const categoryRows = registrationConfig?.categories ?? [];
    const inactiveCategoryNames = new Set(categoryRows.filter((item) => !item.active).map((item) => item.name.toLowerCase()));
    return categories.filter((item) => item === "All Categories" || !inactiveCategoryNames.has(item.toLowerCase()));
  }, [registrationConfig]);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToStepTop(delay = 35) {
    window.setTimeout(() => {
      requestAnimationFrame(() => {
        const target = stepPanelRef.current;
        if (!target) return;

        const top = target.getBoundingClientRect().top + window.scrollY - 12;
        window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
      });
    }, delay);
  }

  function getStepForError(errorKey: string) {
    if (errorKey === "course") return 0;
    if (errorKey === "location") return 2;
    if (["session", "fullName", "email", "phone", "hostel"].includes(errorKey)) return 3;
    if (
      activeQuestions.includes(errorKey as VerificationAnswerKey)
      || Object.values(supplementalAnswerKeys).includes(errorKey as SupplementalAnswerKey)
    ) {
      return 4;
    }
    if (errorKey === "basicDeclaration" || errorKey === "uploads") return 5;
    if (errorKey === "emailVerification") return 6;
    return step;
  }

  function scrollToErrorKey(errorKey: string, delay = 80) {
    window.setTimeout(() => {
      requestAnimationFrame(() => {
        const target = document.querySelector<HTMLElement>(`[data-error-key="${errorKey}"]`);
        if (!target) {
          scrollToStepTop(0);
          return;
        }

        const top = target.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
        target.querySelector<HTMLElement>("input, select, textarea, button")?.focus({ preventScroll: true });
      });
    }, delay);
  }

  function guideToFirstError(nextErrors: Record<string, string>) {
    const firstErrorKey = Object.keys(nextErrors)[0];
    if (!firstErrorKey) return;

    const errorStep = getStepForError(firstErrorKey);
    if (errorStep !== step) {
      setStep(errorStep);
      scrollToErrorKey(firstErrorKey, 180);
      return;
    }

    scrollToErrorKey(firstErrorKey);
  }

  function persistEmailVerificationState(nextEmailVerification: EmailVerificationState) {
    if (!draftReady) return;

    writeRegistrationDraft({
      step,
      search,
      category,
      selectedCourseId,
      selectedLocation,
      selectedSession,
      details,
      answers,
      files: serializeDraftFiles(files),
      basicDeclaration,
      receiveUpdates,
      showIntro,
      emailVerification: nextEmailVerification,
    });
  }

  useEffect(() => {
    const draft = readRegistrationDraft();
    const savedSubmission = readSubmittedRegistration();

    if (draft) {
      const draftCourse = courses.find((course) => course.id === draft.selectedCourseId);
      const draftSteps = draftCourse?.level === "Basic" ? basicSteps : standardSteps;

      setStep(clampStep(draft.step, draftSteps.length - 1));
      setSearch(draft.search ?? "");
      setCategory(categories.includes(draft.category ?? "") ? draft.category ?? "All Categories" : "All Categories");
      setSelectedCourseId(draft.selectedCourseId ?? "");
      setSelectedLocation(draft.selectedLocation ?? "");
      setSelectedSession(trainingSessions.includes(draft.selectedSession ?? "") ? draft.selectedSession ?? "" : "");
      setDetails({
        fullName: draft.details?.fullName ?? "",
        email: draft.details?.email ?? "",
        phone: draft.details?.phone ?? "",
        hostel: draft.details?.hostel ?? "",
      });
      setAnswers(normalizeAnswerState(draft.answers));
      setFiles(normalizeDraftFiles(draft.files));
      setBasicDeclaration(draft.basicDeclaration ?? "");
      setReceiveUpdates(draft.receiveUpdates ?? true);
      setEmailVerification({
        email: draft.emailVerification?.email ?? "",
        verificationId: draft.emailVerification?.verificationId ?? "",
        verified: Boolean(draft.emailVerification?.verified),
        codeSent: Boolean(draft.emailVerification?.codeSent),
      });
      setShowIntro(draft.showIntro ?? !draft.step);
    }

    if (savedSubmission) {
      setSubmittedRecord(savedSubmission);
      setSubmitted(true);
      setShowIntro(false);
    }

    setDraftReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/registration-config", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: RegistrationConfig) => {
        if (!active) return;
        setRegistrationConfig({
          courses: Array.isArray(result?.courses) ? result.courses : [],
          categories: Array.isArray(result?.categories) ? result.categories : [],
          questions: Array.isArray(result?.questions) ? result.questions : [],
        });
      })
      .catch(() => {
        if (active) setRegistrationConfig({ courses: [], categories: [], questions: [] });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!draftReady) return;

    writeRegistrationDraft({
      step,
      search,
      category,
      selectedCourseId,
      selectedLocation,
      selectedSession,
      details,
      answers,
      files: serializeDraftFiles(files),
      basicDeclaration,
      receiveUpdates,
      showIntro,
      emailVerification,
    });
  }, [
    answers,
    basicDeclaration,
    category,
    details,
    draftReady,
    emailVerification,
    files,
    receiveUpdates,
    search,
    selectedCourseId,
    selectedLocation,
    selectedSession,
    showIntro,
    step,
  ]);

  useEffect(() => {
    if (!draftReady) return;

    const previousStep = previousStepRef.current;
    previousStepRef.current = step;

    if (previousStep === step) return;
    scrollToStepTop(previousStep === 0 && step === 1 ? 340 : 45);
  }, [draftReady, step]);

  useEffect(() => {
    if (!draftReady) return;
    if (!emailVerification.email && !emailVerification.verified && !emailVerification.verificationId && !emailVerification.codeSent) return;
    if (verifiedEmail === normalizedApplicantEmail) return;

    setEmailVerification({
      email: "",
      verificationId: "",
      verified: false,
      codeSent: false,
    });
    setEmailVerificationCode("");
    setEmailVerificationMessage("");
  }, [
    draftReady,
    emailVerification.codeSent,
    emailVerification.email,
    emailVerification.verificationId,
    emailVerification.verified,
    normalizedApplicantEmail,
    verifiedEmail,
  ]);

  useEffect(() => {
    if (emailVerified !== true) return;

    setEmailVerificationMessage((current) => current || "Email verified.");
    setErrors((current) => {
      if (!current.emailVerification) return current;
      const next = { ...current };
      delete next.emailVerification;
      return next;
    });
  }, [emailVerified]);

  useEffect(() => {
    if (!visibleCategories.includes(category)) setCategory("All Categories");
  }, [category, visibleCategories]);

  function selectCourse(courseId: string) {
    setSelectedCourseId(courseId);
    setSelectedLocation("");
    setDetails((current) => ({ ...current, hostel: "" }));
    setAnswers(createEmptyAnswerState());
    setFiles({});
    setBasicDeclaration("");
    setSubmitError("");
  }

  function selectLocation(locationId: string) {
    const location = locations.find((item) => item.id === locationId);
    const nextHasHostel = locationHasHostel(location);
    const previousHasHostel = locationHasHostel(selectedLocationData);

    setSelectedLocation(locationId);
    setDetails((current) => ({
      ...current,
      hostel: nextHasHostel ? (previousHasHostel ? current.hostel : "") : "No",
    }));
  }

  function validateStep(targetStep = step) {
    const nextErrors: Record<string, string> = {};

    if (targetStep >= 0 && !selectedCourse) nextErrors.course = "Please select a course.";
    if (targetStep >= 2 && !selectedLocation) nextErrors.location = "Please select a centre or mode.";
    if (targetStep >= 3) {
      if (!selectedSession) nextErrors.session = "Please choose a training session.";
      if (!details.fullName.trim()) nextErrors.fullName = "Full name is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) nextErrors.email = "Enter a valid email address.";
      if (!details.phone.trim()) nextErrors.phone = "Phone number is required.";
      if (shouldAskHostel && !details.hostel) nextErrors.hostel = "Please choose Yes or No.";
    }
    if (targetStep >= 4) {
      activeQuestions.forEach((question) => {
        if (!answers[question]?.trim()) nextErrors[question] = "This answer is required.";
      });

      if (selectedLevel === "Advanced") {
        if (answers[advancedQuestionKeys.previousCertificate] === "Yes") {
          if (!answers[advancedQuestionKeys.certificateType]?.trim()) {
            nextErrors[advancedQuestionKeys.certificateType] = "Please choose the certification type.";
          }
          if (answers[advancedQuestionKeys.certificateType] === "Other, please describe" && !answers[advancedQuestionKeys.certificateTypeOther]?.trim()) {
            nextErrors[advancedQuestionKeys.certificateTypeOther] = "Please describe the certification type.";
          }
        }
      }

      if (selectedLevel === "Basic") {
        if (answers[basicQuestionKeys.courseReason] === "Other, please describe" && !answers[basicQuestionKeys.courseReasonOther]?.trim()) {
          nextErrors[basicQuestionKeys.courseReasonOther] = "Please describe your reason.";
        }
      }
    }
    if (targetStep >= 5 && selectedLevel === "Basic" && !basicDeclaration.trim()) {
      nextErrors.basicDeclaration = "Please complete your writing sample before continuing.";
    }
    if (targetStep >= 5 && selectedLevel !== "Basic" && selectedEvidenceFiles.length === 0 && !(editingExistingSubmission && uploadedFiles.length > 0)) {
      nextErrors.uploads = uploadedFiles.length > 0
        ? "Please reselect the uploaded document before continuing."
        : "Please upload at least one document before continuing.";
    }
    if (targetStep >= 6 && emailVerified !== true) {
      nextErrors.emailVerification = "Please verify your email address before submitting.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      guideToFirstError(nextErrors);
      return false;
    }

    return true;
  }

  function nextStep() {
    if (!validateStep(step)) return;
    if (step === 0) setShowIntro(false);
    setStep((current) => stepItems.length > 0 ? Math.min(current + 1, stepItems.length - 1) : current);
    setErrors({});
    setSubmitError("");
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0));
    setErrors({});
    setSubmitError("");
  }

  async function sendEmailVerificationCode() {
    setEmailVerificationMessage("");
    setErrors((current) => {
      const next = { ...current };
      delete next.emailVerification;
      return next;
    });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      setErrors((current) => ({ ...current, emailVerification: "Enter a valid email address before requesting a code." }));
      scrollToErrorKey("emailVerification");
      return;
    }

    const emailToVerify = normalizedApplicantEmail;
    setEmailVerificationLoading("send");

    try {
      const response = await fetch("/api/email-verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToVerify }),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(result?.message || "We could not send a verification code right now.");
      }

      setEmailVerification({
        email: emailToVerify,
        verificationId: "",
        verified: false,
        codeSent: true,
      });
      setEmailVerificationCode("");
      setEmailVerificationMessage(result?.message || "A verification code has been sent to your email.");
    } catch (error) {
      setErrors((current) => ({
        ...current,
        emailVerification: error instanceof Error ? error.message : "We could not send a verification code right now.",
      }));
      scrollToErrorKey("emailVerification");
    } finally {
      setEmailVerificationLoading("");
    }
  }

  async function verifyEmailCode() {
    setEmailVerificationMessage("");
    setErrors((current) => {
      const next = { ...current };
      delete next.emailVerification;
      return next;
    });

    if (!/^\d{6}$/.test(emailVerificationCode.trim())) {
      setErrors((current) => ({ ...current, emailVerification: "Enter the 6-digit verification code sent to your email." }));
      scrollToErrorKey("emailVerification");
      return;
    }

    const emailToVerify = normalizedApplicantEmail;
    setEmailVerificationLoading("verify");

    try {
      const response = await fetch("/api/email-verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToVerify, code: emailVerificationCode }),
      });
      const result = await response.json().catch(() => null) as {
        email?: string;
        message?: string;
        verificationId?: string;
      } | null;

      if (!response.ok || !result?.verificationId) {
        throw new Error(result?.message || "We could not verify that code.");
      }

      const nextEmailVerification = {
        email: (result.email || emailToVerify).trim().toLowerCase(),
        verificationId: result.verificationId,
        verified: true,
        codeSent: true,
      } satisfies EmailVerificationState;

      setEmailVerification(nextEmailVerification);
      persistEmailVerificationState(nextEmailVerification);
      setEmailVerificationCode("");
      setEmailVerificationMessage("Email verified.");
      setErrors((current) => {
        const next = { ...current };
        delete next.emailVerification;
        return next;
      });
    } catch (error) {
      setErrors((current) => ({
        ...current,
        emailVerification: error instanceof Error ? error.message : "We could not verify that code.",
      }));
      scrollToErrorKey("emailVerification");
    } finally {
      setEmailVerificationLoading("");
    }
  }

  function useAnotherEmail() {
    setEmailVerification({
      email: "",
      verificationId: "",
      verified: false,
      codeSent: false,
    });
    setEmailVerificationCode("");
    setEmailVerificationMessage("");
    setStep(3);
    window.setTimeout(() => scrollToErrorKey("email"), 160);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !validateStep(6) || !selectedCourse) return;
    if (emailVerified !== true || !verifiedEmailVerificationId) {
      setErrors((current) => ({ ...current, emailVerification: "Please verify your email address before submitting." }));
      scrollToErrorKey("emailVerification");
      return;
    }

    const verificationAnswers = buildVerificationAnswers(answers);
    verificationAnswers.basicWriting = selectedLevel === "Basic" ? basicDeclaration.trim() : "";
    const submittedAt = new Date().toISOString();
    const verificationQuestionSnapshot = {
      ...buildVerificationQuestionSnapshot(selectedLevel, selectedCourse.name),
      ...questionTextByKey,
    };
    const payload = {
      registrationId: submittedRecord?.registrationId ?? "",
      course: selectedCourse,
      location: selectedLocationData,
      session: selectedSession,
      trainingSession: selectedSession,
      applicant: { ...details, hostel: shouldAskHostel ? details.hostel : "No" },
      verification: answers,
      verificationAnswers,
      verificationQuestionSnapshot,
      ...verificationAnswers,
      uploads: safeArray(uploadedFiles).map(({ file, ...upload }) => upload),
      basicDeclaration: selectedLevel === "Basic" ? basicDeclaration : "",
      receiveUpdates,
      finalAction,
      emailVerification: {
        email: emailVerification.email,
        verified: emailVerified,
      },
      submittedAt,
    };

    // Keep a local backup so applicants can edit their response after submitting.
    try {
      localStorage.setItem("mpvtlShortCourseRegistration", JSON.stringify(payload));
    } catch {
      // Keep submission moving even if this browser blocks localStorage.
    }
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("fullName", details.fullName);
      formData.append("email", details.email);
      formData.append("phone", details.phone);
      formData.append("course", selectedCourse.name);
      formData.append("category", selectedCourse.category);
      formData.append("level", selectedCourse.level);
      formData.append("center", selectedLocationData?.name || "");
      formData.append("location", selectedLocationData?.name || "");
      formData.append("session", selectedSession);
      formData.append("trainingSession", selectedSession);
      formData.append("hostel", shouldAskHostel ? details.hostel : "No");
      formData.append("action", finalAction);
      formData.append("receiveUpdates", String(receiveUpdates));
      formData.append("emailVerificationId", verifiedEmailVerificationId);
      if (submittedRecord?.registrationId) formData.append("registrationId", submittedRecord.registrationId);
      formData.append("verificationQuestionSnapshot", JSON.stringify(verificationQuestionSnapshot));
      formData.append("basicDeclaration", selectedLevel === "Basic" ? basicDeclaration : "");
      formData.append("basicWriting", selectedLevel === "Basic" ? basicDeclaration.trim() : "");
      verificationAnswerKeys.forEach((key) => {
        formData.append(key, verificationAnswers[key]);
      });
      selectedEvidenceFiles.forEach((upload) => {
        if (upload.file) formData.append("evidenceFiles", upload.file, upload.uploadedFileName);
      });

      const response = await fetch("/api/registrations", {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => null) as {
        id?: string;
        message?: string;
        updated?: boolean;
        wasEdited?: boolean;
        editCount?: number;
      } | null;

      if (!response.ok) {
        throw new Error(result?.message || "We could not submit your registration right now.");
      }

      const nextSubmittedRecord = {
        success: true,
        registrationId: result?.id || submittedRecord?.registrationId || "",
        submittedEmail: details.email,
        submittedCourse: selectedCourse.name,
        submittedCenter: selectedLocationData?.name || "",
        submittedAt,
        wasEdited: Boolean(result?.wasEdited || result?.updated),
        editCount: typeof result?.editCount === "number" ? result.editCount : submittedRecord?.editCount,
      } satisfies SubmittedRegistrationState;
      writeSubmittedRegistration(nextSubmittedRecord);
      setSubmittedRecord(nextSubmittedRecord);
      try {
        localStorage.setItem("mpvtlShortCourseRegistration", JSON.stringify({
          ...payload,
          registrationId: nextSubmittedRecord.registrationId,
          submittedAt: nextSubmittedRecord.submittedAt,
          success: true,
          wasEdited: nextSubmittedRecord.wasEdited,
        }));
      } catch {
        // Keep the success screen available even if this backup write fails.
      }
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We could not submit your registration right now. Your details are still saved on this device.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_55%,#eef2f7_100%)] text-slate-900">
      <AnimatePresence initial={false}>
        {showIntro && <IntroCard onRegister={scrollToForm} />}
      </AnimatePresence>

      <section ref={formRef} id="registration-form" className="px-4 pb-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.08, ease: "easeOut" }}
          className="mx-auto max-w-7xl"
        >
          <div className="mb-6 rounded-[1.75rem] bg-navy-950 p-5 text-white shadow-premium sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-brand-200">
              MPVTL Application Form
            </p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-3xl text-[1.5rem] font-semibold leading-tight sm:text-[2.125rem]">
                Select your course and complete your registration.
              </h2>
            </div>
          </div>

          {submitted ? (
            <SuccessScreen
              onEditResponse={() => {
                setSubmitted(false);
                setShowIntro(false);
                requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
              }}
              submittedRecord={submittedRecord}
              fallbackCourse={selectedCourse?.name || ""}
              fallbackCenter={selectedLocationData?.name || ""}
              whatsappUrl={centerWhatsAppUrl}
            />
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <Stepper currentStep={step} steps={stepItems} />

              <div ref={stepPanelRef} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-premium">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="min-h-[620px] p-5 sm:p-8 lg:p-10"
                  >
                    {step === 0 && (
                      <CourseStep
                        search={search}
                        setSearch={setSearch}
                        category={category}
                        setCategory={setCategory}
                        categories={visibleCategories}
                        filteredCourses={filteredCourses}
                        selectedCourseId={selectedCourseId}
                        setSelectedCourseId={selectCourse}
                        selectedCourse={selectedCourse}
                        onContinue={nextStep}
                        error={errors.course}
                      />
                    )}
                    {step === 1 && selectedCourse && <ValueStep course={selectedCourse} />}
                    {step === 2 && (
                      <LocationStep
                        locations={availableLocations}
                        courseName={selectedCourse?.name ?? "selected course"}
                        selectedLocation={selectedLocation}
                        setSelectedLocation={selectLocation}
                        error={errors.location}
                      />
                    )}
                    {step === 3 && (
                      <DetailsStep
                        details={details}
                        setDetails={setDetails}
                        selectedSession={selectedSession}
                        setSelectedSession={setSelectedSession}
                        errors={errors}
                        showHostelQuestion={shouldAskHostel}
                      />
                    )}
                    {step === 4 && (
                      <VerificationStep
                        level={selectedLevel}
                        courseName={selectedCourse?.name ?? "selected course"}
                        questions={activeQuestions}
                        questionTextByKey={questionTextByKey}
                        answers={answers}
                        setAnswers={setAnswers}
                        errors={errors}
                      />
                    )}
                    {step === 5 && selectedLevel === "Basic" && (
                      <BasicDeclarationStep
                        declaration={basicDeclaration}
                        setDeclaration={setBasicDeclaration}
                        fullName={details.fullName}
                        courseName={selectedCourse?.name ?? ""}
                        error={errors.basicDeclaration}
                      />
                    )}
                    {step === 5 && selectedLevel !== "Basic" && (
                      <EvidenceStep
                        files={files}
                        setFiles={setFiles}
                        error={errors.uploads}
                        setUploadError={(message) => setErrors((current) => ({ ...current, uploads: message }))}
                      />
                    )}
                    {step === 6 && (
                      <FinalStep
                        receiveUpdates={receiveUpdates}
                        setReceiveUpdates={setReceiveUpdates}
                        applicantEmail={details.email}
                        code={emailVerificationCode}
                        setCode={setEmailVerificationCode}
                        codeSent={emailVerification.codeSent && emailVerification.email === normalizedApplicantEmail}
                        emailVerified={emailVerified}
                        loading={emailVerificationLoading}
                        message={emailVerificationMessage}
                        error={errors.emailVerification}
                        onSendCode={sendEmailVerificationCode}
                        onVerifyCode={verifyEmailCode}
                        onUseAnotherEmail={useAnotherEmail}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                  <button
                    type="button"
                    onClick={previousStep}
                    disabled={step === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-navy-900 transition hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft size={18} />
                    Back
                  </button>

                  {submitError && (
                    <p className="text-sm font-semibold leading-6 text-brand-700 sm:max-w-md">
                      {submitError}
                    </p>
                  )}

                  {step < stepItems.length - 1 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-sm font-bold text-white shadow-redGlow transition hover:bg-brand-600"
                    >
                      Continue
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || emailVerified !== true}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-sm font-bold text-white shadow-redGlow transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Registration"}
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </section>
    </main>
  );
}

function IntroCard({ onRegister }: { onRegister: () => void }) {
  const trustCards = safeArray([
    { icon: <BriefcaseBusiness size={18} />, title: "Hands-On Training", text: "Learn by doing with real tools and real tasks." },
    { icon: <Award size={18} />, title: "Global Certification Pathways", text: "Aligned with international standards for recognised credentials." },
    { icon: <CheckCircle2 size={18} />, title: "Job-Ready Skills", text: "Gain practical competence you can apply immediately." },
  ]);

  return (
    <motion.section
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.975 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          boxShadow: [
            "0 24px 80px rgba(2, 10, 22, 0.18)",
            "0 30px 96px rgba(127, 29, 45, 0.16)",
            "0 24px 80px rgba(2, 10, 22, 0.18)",
          ],
        }}
        transition={{
          opacity: { duration: 0.58, ease: "easeOut" },
          y: { duration: 0.58, ease: "easeOut" },
          scale: { duration: 0.58, ease: "easeOut" },
          boxShadow: { repeat: Infinity, duration: 5.8, ease: "easeInOut" },
        }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-premium sm:p-10"
      >
        <div className="absolute inset-x-0 top-0 h-2 bg-brand-700" />
        <motion.div
          aria-hidden="true"
          animate={{ opacity: [0.45, 0.78, 0.45] }}
          transition={{ repeat: Infinity, duration: 6.4, ease: "easeInOut" }}
          className="absolute -right-16 top-8 h-56 w-56 rounded-full bg-brand-100 blur-3xl"
        />
        <motion.div
          aria-hidden="true"
          animate={{ opacity: [0.22, 0.42, 0.22] }}
          transition={{ repeat: Infinity, duration: 7.2, ease: "easeInOut" }}
          className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-navy-50 blur-3xl"
        />

        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-navy-950 sm:gap-3 sm:px-4 sm:text-sm">
              <Image
                src="/MPVTL Logo new (Image).jpg"
                alt="MPVTL logo"
                width={18}
                height={18}
                className="h-4 w-4 object-contain sm:h-[18px] sm:w-[18px]"
                priority
              />
              MPVTL Short Course Registration
            </div>
            <h1 className="mt-6 max-w-3xl text-[1.875rem] font-semibold leading-tight text-navy-950 sm:text-[2.875rem]">
              Begin Your Professional Skills Journey with MPVTL
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Register for practical short courses designed to build real competence,
              career confidence, and professional growth.
            </p>
            <motion.button
              type="button"
              onClick={onRegister}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{ boxShadow: ["0 0 0 rgba(127,29,45,0)", "0 18px 55px rgba(127,29,45,0.22)", "0 0 0 rgba(127,29,45,0)"] }}
              transition={{ repeat: Infinity, duration: 2.6 }}
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-brand-700 px-7 py-4 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              Register Now
              <ChevronDown size={19} />
            </motion.button>
          </div>

          <div className="hidden gap-3 xl:grid xl:grid-cols-1">
            {safeArray(trustCards).map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-950 text-white">
                  {item.icon}
                </div>
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-brand-700">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

function Stepper({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  const stepItems = Array.isArray(steps) ? steps : [];
  const boundedStep = stepItems.length > 0
    ? Math.min(Math.max(currentStep, 0), stepItems.length - 1)
    : 0;
  const progress = stepItems.length > 0 ? ((boundedStep + 1) / stepItems.length) * 100 : 0;

  return (
    <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-6 lg:h-fit">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-700">
          Progress
        </p>
        <p className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-navy-950">
          Step {stepItems.length > 0 ? boundedStep + 1 : 0} of {stepItems.length}
        </p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-brand-700"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        />
      </div>

      <div className="mt-5 lg:hidden">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {safeArray(stepItems).map((label, index) => {
            const active = index === boundedStep;
            const done = index < boundedStep;

            return (
              <div key={label} className="min-w-0 text-center" aria-label={`Step ${index + 1}: ${label}`}>
                <span
                  className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition sm:h-10 sm:w-10 sm:text-sm ${
                    active
                      ? "bg-brand-700 text-white shadow-redGlow"
                      : done
                        ? "bg-navy-950 text-white"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {done ? <Check size={16} /> : index + 1}
                </span>
                <span
                  className={`mt-2 hidden truncate text-[11px] font-bold md:block ${
                    active ? "text-brand-700" : done ? "text-navy-950" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Current step
          </p>
          <p className="mt-1 text-base font-bold text-navy-950">
            {stepItems[boundedStep] ?? "Registration"}
          </p>
        </div>
      </div>

      <div className="mt-5 hidden gap-3 lg:grid">
        {safeArray(stepItems).map((label, index) => {
          const active = index === boundedStep;
          const done = index < boundedStep;

          return (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-2xl p-3 transition ${
                active ? "bg-brand-700 text-white" : done ? "bg-navy-950 text-white" : "bg-slate-50 text-slate-500"
              }`}
            >
              <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${
                active ? "bg-white text-brand-700" : done ? "bg-white text-navy-950" : "bg-white text-slate-500"
              }`}>
                {done ? <Check size={16} /> : index + 1}
              </span>
              <span className="text-sm font-semibold">{label}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function CourseStep(props: {
  search: string;
  setSearch: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  categories: string[];
  filteredCourses: Course[];
  selectedCourseId: string;
  setSelectedCourseId: (value: string) => void;
  selectedCourse?: Course;
  onContinue: () => void;
  error?: string;
}) {
  const filteredCourses = Array.isArray(props.filteredCourses) ? props.filteredCourses : [];

  return (
    <div>
      <StepHeader icon={<Search />} title="Choose Your Course" compactIcon />
      <p className="mt-3 max-w-3xl leading-7 text-slate-600 sm:ml-[4.5rem] xl:hidden">
        Search, filter, and select the MPVTL short course you want to register for.
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-[1fr_280px]">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          <input
            value={props.search}
            onChange={(event) => props.setSearch(event.target.value)}
            placeholder="Search course"
            className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100"
          />
        </label>
        <select
          value={props.category}
          onChange={(event) => props.setCategory(event.target.value)}
          className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100"
        >
          {safeArray(props.categories).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      {props.error && <p data-error-key="course" className="mt-3 text-sm font-semibold text-brand-700">{props.error}</p>}

      {props.selectedCourse && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="mt-6 flex flex-col gap-4 rounded-3xl border border-brand-100 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
              Selected Course
            </p>
            <p className="mt-2 text-[15px] font-bold uppercase text-navy-950 sm:text-[17px]">{props.selectedCourse.name}</p>
            <p className="mt-1 text-sm text-slate-600">
              {props.selectedCourse.duration} - {props.selectedCourse.certificate}
            </p>
          </div>
          <button
            type="button"
            onClick={props.onContinue}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-3 text-sm font-bold text-white shadow-redGlow transition hover:bg-brand-600"
          >
            Continue
            <ArrowRight size={17} />
          </button>
        </motion.div>
      )}

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {safeArray(filteredCourses).map((course) => {
          const selected = props.selectedCourseId === course.id;

          return (
            <article
              key={course.id}
              onClick={() => props.setSelectedCourseId(course.id)}
              className={`cursor-pointer rounded-3xl border p-5 text-left transition hover:border-brand-300 ${
                selected ? "border-brand-600 bg-brand-50 shadow-redGlow" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[15px] font-bold uppercase text-navy-950 sm:text-[17px]">{course.name}</h3>
                {selected && <CheckCircle2 className="shrink-0 text-brand-700" size={20} />}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide">
                <span className="rounded-full bg-navy-950 px-3 py-1 text-white">{course.category}</span>
                <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-brand-700">{course.level}</span>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <span>{course.duration}</span>
                <span>{course.certificate}</span>
              </div>
              <div className="mt-5">
                {selected ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      props.onContinue();
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
                  >
                    Continue
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      props.setSelectedCourseId(course.id);
                    }}
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-navy-900 transition hover:border-brand-500 hover:text-brand-700"
                  >
                    Select Course
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="mt-7 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
          No courses match your search yet.
        </div>
      )}
    </div>
  );
}

function ValueStep({ course }: { course: Course }) {
  return (
    <div>
      <StepHeader icon={<Sparkles />} title="Course Description" subtitle={course.description} />

      <div className="mt-7 rounded-3xl bg-navy-950 p-6 text-white">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-200">{course.level} Level</p>
        <h3 className="mt-3 text-[1.5rem] font-semibold uppercase leading-tight sm:text-[1.75rem]">{course.name}</h3>
        <p className="mt-4 max-w-3xl text-slate-300">{course.value}</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <InfoList title="What you will learn" items={course.learn} />
        <InfoList title="Practical skills gained" items={course.skills} />
        <InfoList title="Career benefits" items={course.careers} />
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h4 className="text-sm font-bold text-navy-950">Entry requirements</h4>
          <p className="mt-4 leading-7 text-slate-600">{course.requirement}</p>
        </div>
      </div>
    </div>
  );
}

function LocationStep(props: {
  locations: LocationOption[];
  courseName: string;
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
  error?: string;
}) {
  const locations = Array.isArray(props.locations) ? props.locations : [];

  return (
    <div>
      <StepHeader
        icon={<MapPin />}
        title={(
          <>
            <span className="sm:hidden">Select Location</span>
            <span className="hidden sm:inline">Choose Centre / Mode</span>
          </>
        )}
        subtitle={`Pick a training center or online mode for training on ${props.courseName}.`}
      />
      {props.error && <p data-error-key="location" className="mt-4 text-sm font-semibold text-brand-700">{props.error}</p>}

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {safeArray(locations).map((location) => {
          const selected = props.selectedLocation === location.id;

          return (
            <button
              type="button"
              key={location.id}
              onClick={() => props.setSelectedLocation(location.id)}
              className={`rounded-3xl border p-6 text-left transition hover:-translate-y-1 hover:shadow-lg ${
                selected ? "border-brand-600 bg-brand-50 shadow-redGlow" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold leading-tight text-navy-950 sm:text-[1.375rem]">{location.name}</h3>
                {selected && <CheckCircle2 className="text-brand-700" size={20} />}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{location.address}</p>
              <div className="mt-5 grid gap-3 text-sm text-slate-700">
                <span className="flex items-center gap-2"><Building2 size={16} /> {location.hostel}</span>
                <span className="flex items-center gap-2"><Wifi size={16} /> {location.wifi}</span>
              </div>
            </button>
          );
        })}
      </div>

      {locations.length === 0 && (
        <div className="mt-7 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
          Select a course first to view its available centres.
        </div>
      )}
    </div>
  );
}

function DetailsStep(props: {
  details: { fullName: string; email: string; phone: string; hostel: string };
  setDetails: (value: { fullName: string; email: string; phone: string; hostel: string }) => void;
  selectedSession: string;
  setSelectedSession: (value: string) => void;
  errors: Record<string, string>;
  showHostelQuestion: boolean;
}) {
  const update = (key: keyof typeof props.details, value: string) => {
    props.setDetails({ ...props.details, [key]: value });
  };

  return (
    <div>
      <StepHeader icon={<BriefcaseBusiness />} title="Personal Details" subtitle="Enter your details so MPVTL can follow up when the next phase is connected." />

      <div className="mt-7 grid gap-5">
        <div data-error-key="session">
          <p className="mb-3 text-sm font-bold text-navy-950">Which session are you registering for?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {safeArray(trainingSessions).map((session) => (
              <button
                type="button"
                key={session}
                onClick={() => props.setSelectedSession(session)}
                className={`rounded-2xl border px-5 py-4 text-left font-bold transition ${
                  props.selectedSession === session ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                {session}
              </button>
            ))}
          </div>
          {props.errors.session && <p className="mt-2 text-sm font-semibold text-brand-700">{props.errors.session}</p>}
        </div>

        <TextField errorKey="fullName" label="Full Name" value={props.details.fullName} onChange={(value) => update("fullName", value)} error={props.errors.fullName} />
        <TextField errorKey="email" label="Email Address" value={props.details.email} onChange={(value) => update("email", value)} error={props.errors.email} />
        <TextField errorKey="phone" label="Phone Number" value={props.details.phone} onChange={(value) => update("phone", value)} error={props.errors.phone} />

        {props.showHostelQuestion && (
          <div data-error-key="hostel">
            <p className="mb-3 text-sm font-bold text-navy-950">Need hostel?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {safeArray(["Yes", "No"]).map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => update("hostel", option)}
                  className={`rounded-2xl border px-5 py-4 text-left font-bold transition ${
                    props.details.hostel === option ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {props.errors.hostel && <p className="mt-2 text-sm font-semibold text-brand-700">{props.errors.hostel}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function VerificationStep(props: {
  level: Level;
  courseName: string;
  questions: VerificationAnswerKey[];
  questionTextByKey: Partial<Record<VerificationAnswerKey, string>>;
  answers: AnswerState;
  setAnswers: (value: AnswerState) => void;
  errors: Record<string, string>;
}) {
  const courseName = props.courseName || "selected course";
  const questions = Array.isArray(props.questions) ? props.questions : [];
  const showQuestion = (key: VerificationAnswerKey) => questions.includes(key);
  const labelFor = (key: VerificationAnswerKey, fallback: string) => props.questionTextByKey[key] || fallback;
  const updateAnswer = (key: keyof AnswerState, value: string, clearKeys: (keyof AnswerState)[] = []) => {
    const nextAnswers = { ...props.answers, [key]: value } as AnswerState;
    clearKeys.forEach((clearKey) => {
      delete nextAnswers[clearKey];
    });
    props.setAnswers(nextAnswers);
  };

  if (props.level === "Basic") {
    return (
      <div>
        <StepHeader icon={<ShieldCheck />} title="Basic Verification Questions" subtitle="These questions capture clear entry information before registration." />

        <div className="mt-7 grid gap-5">
          {showQuestion(basicQuestionKeys.readWriteEnglish) && <SelectField
            errorKey={basicQuestionKeys.readWriteEnglish}
            label={labelFor(basicQuestionKeys.readWriteEnglish, "Can you read and write in English?")}
            value={props.answers[basicQuestionKeys.readWriteEnglish] ?? ""}
            onChange={(value) => updateAnswer(basicQuestionKeys.readWriteEnglish, value)}
            options={yesNoOptions}
            error={props.errors[basicQuestionKeys.readWriteEnglish]}
          />}
          {showQuestion(basicQuestionKeys.newToField) && <SelectField
            errorKey={basicQuestionKeys.newToField}
            label={labelFor(basicQuestionKeys.newToField, `Are you new to ${courseName}?`)}
            value={props.answers[basicQuestionKeys.newToField] ?? ""}
            onChange={(value) => updateAnswer(basicQuestionKeys.newToField, value)}
            options={yesNoOptions}
            error={props.errors[basicQuestionKeys.newToField]}
          />}
          {showQuestion(basicQuestionKeys.courseReason) && <SelectField
            errorKey={basicQuestionKeys.courseReason}
            label={labelFor(basicQuestionKeys.courseReason, `Why are you registering for ${courseName}?`)}
            value={props.answers[basicQuestionKeys.courseReason] ?? ""}
            onChange={(value) => updateAnswer(basicQuestionKeys.courseReason, value, [basicQuestionKeys.courseReasonOther])}
            options={courseReasonOptions}
            error={props.errors[basicQuestionKeys.courseReason]}
          />}
          {props.answers[basicQuestionKeys.courseReason] === "Other, please describe" && (
            <AnswerTextArea
              errorKey={basicQuestionKeys.courseReasonOther}
              label="Please describe your reason"
              value={props.answers[basicQuestionKeys.courseReasonOther] ?? ""}
              onChange={(value) => updateAnswer(basicQuestionKeys.courseReasonOther, value)}
              error={props.errors[basicQuestionKeys.courseReasonOther]}
            />
          )}
          {showQuestion(basicQuestionKeys.practicalAvailability) && <SelectField
            errorKey={basicQuestionKeys.practicalAvailability}
            label={labelFor(basicQuestionKeys.practicalAvailability, `Are you available for practical training in ${courseName}?`)}
            value={props.answers[basicQuestionKeys.practicalAvailability] ?? ""}
            onChange={(value) => updateAnswer(basicQuestionKeys.practicalAvailability, value)}
            options={availabilityOptions}
            error={props.errors[basicQuestionKeys.practicalAvailability]}
          />}
        </div>
      </div>
    );
  }

  if (props.level === "Intermediate") {
    return (
      <div>
        <StepHeader icon={<ShieldCheck />} title="Intermediate Verification Questions" subtitle="These questions capture entry review information in a structured format." />

        <div className="mt-7 grid gap-5">
          {showQuestion(intermediateQuestionKeys.priorExposure) && <SelectField
            errorKey={intermediateQuestionKeys.priorExposure}
            label={labelFor(intermediateQuestionKeys.priorExposure, `Do you have basic knowledge or prior exposure to ${courseName}?`)}
            value={props.answers[intermediateQuestionKeys.priorExposure] ?? ""}
            onChange={(value) => updateAnswer(intermediateQuestionKeys.priorExposure, value)}
            options={yesNoOptions}
            error={props.errors[intermediateQuestionKeys.priorExposure]}
          />}
          {showQuestion(intermediateQuestionKeys.completedBasicCourse) && <SelectField
            errorKey={intermediateQuestionKeys.completedBasicCourse}
            label={labelFor(intermediateQuestionKeys.completedBasicCourse, `Have you completed a basic course in ${courseName} before?`)}
            value={props.answers[intermediateQuestionKeys.completedBasicCourse] ?? ""}
            onChange={(value) => updateAnswer(intermediateQuestionKeys.completedBasicCourse, value)}
            options={yesNoOptions}
            error={props.errors[intermediateQuestionKeys.completedBasicCourse]}
          />}
          {showQuestion(intermediateQuestionKeys.experienceBrief) && <AnswerTextArea
            errorKey={intermediateQuestionKeys.experienceBrief}
            label={labelFor(intermediateQuestionKeys.experienceBrief, `Describe your experience with ${courseName} briefly.`)}
            value={props.answers[intermediateQuestionKeys.experienceBrief] ?? ""}
            onChange={(value) => updateAnswer(intermediateQuestionKeys.experienceBrief, value)}
            error={props.errors[intermediateQuestionKeys.experienceBrief]}
          />}
          {showQuestion(intermediateQuestionKeys.entryReviewAvailability) && <SelectField
            errorKey={intermediateQuestionKeys.entryReviewAvailability}
            label={labelFor(intermediateQuestionKeys.entryReviewAvailability, `Are you available for ${courseName} Entry Review?`)}
            value={props.answers[intermediateQuestionKeys.entryReviewAvailability] ?? ""}
            onChange={(value) => updateAnswer(intermediateQuestionKeys.entryReviewAvailability, value)}
            options={availabilityOptions}
            error={props.errors[intermediateQuestionKeys.entryReviewAvailability]}
          />}
        </div>
      </div>
    );
  }

  if (props.level === "Advanced") {
    return (
      <div>
        <StepHeader icon={<ShieldCheck />} title="Advanced Verification Questions" subtitle="These questions capture entry review information in a structured format." />

        <div className="mt-7 grid gap-5">
          {showQuestion(advancedQuestionKeys.priorTraining) && <SelectField
            errorKey={advancedQuestionKeys.priorTraining}
            label={labelFor(advancedQuestionKeys.priorTraining, `Do you have prior training or demonstrable experience in ${courseName}?`)}
            value={props.answers[advancedQuestionKeys.priorTraining] ?? ""}
            onChange={(value) => updateAnswer(advancedQuestionKeys.priorTraining, value)}
            options={yesNoOptions}
            error={props.errors[advancedQuestionKeys.priorTraining]}
          />}

          {showQuestion(advancedQuestionKeys.previousCertificate) && <SelectField
            errorKey={advancedQuestionKeys.previousCertificate}
            label={labelFor(advancedQuestionKeys.previousCertificate, `Do you have a previous certificate in ${courseName}?`)}
            value={props.answers[advancedQuestionKeys.previousCertificate] ?? ""}
            onChange={(value) => updateAnswer(
              advancedQuestionKeys.previousCertificate,
              value,
              [
                advancedQuestionKeys.certificateType,
                advancedQuestionKeys.certificateTypeOther,
              ],
            )}
            options={yesNoOptions}
            error={props.errors[advancedQuestionKeys.previousCertificate]}
          />}
          {props.answers[advancedQuestionKeys.previousCertificate] === "Yes" && (
            <SelectField
              errorKey={advancedQuestionKeys.certificateType}
              label="Type of certification"
              value={props.answers[advancedQuestionKeys.certificateType] ?? ""}
              onChange={(value) => updateAnswer(advancedQuestionKeys.certificateType, value, [advancedQuestionKeys.certificateTypeOther])}
              options={certificateTypeOptions}
              error={props.errors[advancedQuestionKeys.certificateType]}
            />
          )}
          {props.answers[advancedQuestionKeys.certificateType] === "Other, please describe" && (
            <AnswerTextArea
              errorKey={advancedQuestionKeys.certificateTypeOther}
              label="Please describe the certification type"
              value={props.answers[advancedQuestionKeys.certificateTypeOther] ?? ""}
              onChange={(value) => updateAnswer(advancedQuestionKeys.certificateTypeOther, value)}
              error={props.errors[advancedQuestionKeys.certificateTypeOther]}
            />
          )}

          {showQuestion(advancedQuestionKeys.practicalExperience) && <AnswerTextArea
            errorKey={advancedQuestionKeys.practicalExperience}
            label={labelFor(advancedQuestionKeys.practicalExperience, `Describe your practical experience in ${courseName}.`)}
            value={props.answers[advancedQuestionKeys.practicalExperience] ?? ""}
            onChange={(value) => updateAnswer(advancedQuestionKeys.practicalExperience, value)}
            error={props.errors[advancedQuestionKeys.practicalExperience]}
          />}

          {showQuestion(advancedQuestionKeys.assessmentAvailability) && <SelectField
            errorKey={advancedQuestionKeys.assessmentAvailability}
            label={labelFor(advancedQuestionKeys.assessmentAvailability, `Are you available for ${courseName} assessment/interview?`)}
            value={props.answers[advancedQuestionKeys.assessmentAvailability] ?? ""}
            onChange={(value) => updateAnswer(advancedQuestionKeys.assessmentAvailability, value)}
            options={availabilityOptions}
            error={props.errors[advancedQuestionKeys.assessmentAvailability]}
          />}
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepHeader icon={<ShieldCheck />} title={`${props.level} Verification Questions`} subtitle="These questions adjust to the selected course level." />

      <div className="mt-7 grid gap-5">
        {safeArray(questions).map((question) => (
          <AnswerTextArea
            errorKey={question}
            key={question}
            label={question}
            value={props.answers[question] ?? ""}
            onChange={(value) => updateAnswer(question, value)}
            error={props.errors[question]}
          />
        ))}
      </div>
    </div>
  );
}

function SelectField({
  errorKey,
  label,
  value,
  onChange,
  options,
  error,
}: {
  errorKey?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  error?: string;
}) {
  const optionItems = Array.isArray(options) ? options : [];

  return (
    <label data-error-key={errorKey} className="block">
      <span className="text-sm font-bold text-navy-950">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100"
      >
        <option value="">Select an option</option>
        {safeArray(optionItems).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {error && <span className="mt-2 block text-sm font-semibold text-brand-700">{error}</span>}
    </label>
  );
}

function AnswerTextArea({
  errorKey,
  label,
  value,
  onChange,
  error,
}: {
  errorKey?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label data-error-key={errorKey} className="block">
      <span className="text-sm font-bold text-navy-950">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
      {error && <span className="mt-2 block text-sm font-semibold text-brand-700">{error}</span>}
    </label>
  );
}

function BasicDeclarationStep(props: {
  declaration: string;
  setDeclaration: (value: string) => void;
  fullName: string;
  courseName: string;
  error?: string;
}) {
  const suggestedDeclaration = props.fullName && props.courseName
    ? `I am ${props.fullName}, and I am registering for ${props.courseName}.`
    : "I am [Full Name], and I am registering for [Selected Course].";

  return (
    <div>
      <StepHeader icon={<GraduationCap />} title="Your Writing" subtitle="For Basic courses, type the statement manually before final submission." />

      <div className="mt-7 rounded-3xl border border-brand-100 bg-brand-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
          Write this statement
        </p>
        <p
          className="mt-3 select-none text-base font-semibold leading-7 text-navy-950"
          style={{ userSelect: "none" }}
          onCopy={(event) => event.preventDefault()}
          onCut={(event) => event.preventDefault()}
        >
          {suggestedDeclaration}
        </p>
      </div>

      <label data-error-key="basicDeclaration" className="mt-5 block">
        <span className="text-sm font-bold text-navy-950">Your Writing</span>
        <textarea
          value={props.declaration}
          onChange={(event) => props.setDeclaration(event.target.value)}
          onPaste={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
          rows={4}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          placeholder="Type the statement exactly as shown above."
          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100"
        />
        {props.error && <span className="mt-2 block text-sm font-semibold text-brand-700">{props.error}</span>}
      </label>
    </div>
  );
}

function EvidenceStep(props: {
  files: Record<string, UploadedFileData | undefined>;
  setFiles: (value: Record<string, UploadedFileData | undefined>) => void;
  error?: string;
  setUploadError: (message: string) => void;
}) {
  const fields = ["ID Document", "Previous Certificate / Supporting Document"];

  function handleFileChange(field: string, file?: File) {
    if (!file) return;

    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      props.setUploadError(`"${file.name}" is not supported. Please upload a JPG, PNG, or PDF file.`);
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      props.setUploadError(`"${file.name}" is too large. Please upload a file under ${MAX_UPLOAD_SIZE_LABEL}.`);
      return;
    }

    props.setFiles({
      ...props.files,
      [field]: {
        field,
        uploadedFileName: file.name,
        uploadedFileType: file.type || "application/octet-stream",
        uploadedFileSize: file.size,
        file,
      },
    });
    props.setUploadError("");
  }

  return (
    <div>
      <StepHeader icon={<FileUp />} title="Upload Evidence" subtitle="Select supporting files for MPVTL review." />

      <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm font-semibold text-brand-800">
        Upload at least one JPG, PNG, or PDF document. Each file must be {MAX_UPLOAD_SIZE_LABEL} or smaller.
      </div>
      {props.error && <p data-error-key="uploads" className="mt-3 text-sm font-semibold text-brand-700">{props.error}</p>}

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {safeArray(fields).map((field) => {
          const selectedFile = props.files[field];

          return (
            <label
              key={field}
              className={`group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed p-5 text-center transition hover:border-brand-600 hover:bg-white sm:min-h-52 sm:p-6 ${
                selectedFile ? "border-brand-300 bg-brand-50" : "border-slate-300 bg-slate-50"
              }`}
            >
              <FileUp className="h-8 w-8 text-brand-700 sm:h-9 sm:w-9" />
              <span className="mt-4 font-bold text-navy-950">{field}</span>
              <span className="mt-2 text-sm font-semibold text-slate-600">
                {selectedFile?.uploadedFileName || "Click to choose a file"}
              </span>
              {selectedFile && (
                <>
                  <span className="mt-1 text-xs text-slate-500">
                    {selectedFile.uploadedFileType} - {Math.ceil(selectedFile.uploadedFileSize / 1024)}KB
                  </span>
                  {!selectedFile.file && (
                    <span className="mt-2 text-xs font-semibold text-brand-700">
                      Reselect this file before submitting.
                    </span>
                  )}
                </>
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                className="sr-only"
                onChange={(event) => handleFileChange(field, event.target.files?.[0])}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function FinalStep(props: {
  receiveUpdates: boolean;
  setReceiveUpdates: (value: boolean) => void;
  applicantEmail: string;
  code: string;
  setCode: (value: string) => void;
  codeSent: boolean;
  emailVerified: boolean;
  loading: "" | "send" | "verify";
  message: string;
  error?: string;
  onSendCode: () => void;
  onVerifyCode: () => void;
  onUseAnotherEmail: () => void;
}) {
  return (
    <div>
      <StepHeader icon={<CheckCircle2 />} title="Submit Registration" subtitle="Confirm your update preference, then submit your registration to MPVTL." />

      <div className="mt-7 rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-950 text-white [&_svg]:h-5 [&_svg]:w-5">
          <ShieldCheck />
        </div>
        <h3 className="mt-5 text-lg font-bold text-navy-950">Ready to submit</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          MPVTL will receive your course, centre, applicant details, verification answers, and uploaded evidence where required.
        </p>
      </div>

      <div data-error-key="emailVerification" className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(6,19,33,0.07)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-navy-950">Verify your email address</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              We will send a 6-digit code to <span className="font-bold text-navy-950">{props.applicantEmail || "your email address"}</span>.
            </p>
          </div>
          {props.emailVerified && (
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-navy-950 px-3 py-1.5 text-xs font-bold text-white">
              <Check size={14} />
              Email verified
            </span>
          )}
        </div>

        {!props.emailVerified && (
          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={props.onSendCode}
              disabled={props.loading === "send"}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-navy-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit"
            >
              {props.loading === "send" ? "Sending..." : props.codeSent ? "Send New Code" : "Send Verification Code"}
            </button>

            {props.codeSent && (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={props.code}
                  onChange={(event) => props.setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold tracking-[0.18em] outline-none transition focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={props.onVerifyCode}
                  disabled={props.loading === "verify"}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-bold text-white shadow-redGlow transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {props.loading === "verify" ? "Verifying..." : "Verify Code"}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {props.message && <p className="text-sm font-semibold text-navy-950">{props.message}</p>}
            {props.error && <p className="text-sm font-semibold text-brand-700">{props.error}</p>}
          </div>
          <button
            type="button"
            onClick={props.onUseAnotherEmail}
            className="text-left text-sm font-bold text-brand-700 hover:text-brand-800 sm:text-right"
          >
            Use another email
          </button>
        </div>
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={props.receiveUpdates}
          onChange={(event) => props.setReceiveUpdates(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 accent-brand-700"
        />
        <span>Receive updates from MPVTL</span>
      </label>
    </div>
  );
}

function SuccessScreen({
  onEditResponse,
  submittedRecord,
  fallbackCourse,
  fallbackCenter,
  whatsappUrl,
}: {
  onEditResponse: () => void;
  submittedRecord: SubmittedRegistrationState | null;
  fallbackCourse: string;
  fallbackCenter: string;
  whatsappUrl: string;
}) {
  const [showPaymentNote, setShowPaymentNote] = useState(false);
  const submittedCourse = submittedRecord?.submittedCourse || fallbackCourse;
  const submittedCenter = submittedRecord?.submittedCenter || fallbackCenter;
  const submittedDate = submittedRecord?.submittedAt
    ? new Date(submittedRecord.submittedAt).toLocaleString()
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-premium sm:p-14"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 14 }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-700 text-white shadow-redGlow sm:h-24 sm:w-24 [&_svg]:h-10 [&_svg]:w-10 sm:[&_svg]:h-12 sm:[&_svg]:w-12"
      >
        <CheckCircle2 size={48} />
      </motion.div>
      <h2 className="mt-8 text-[1.75rem] font-semibold leading-tight text-navy-950 sm:text-[2.125rem]">Registration Submitted Successfully</h2>
      <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-600">
        Your registration has been submitted.
      </p>
      <div className="mx-auto mt-6 grid max-w-2xl gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left">
        {submittedCourse && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Course</p>
            <p className="mt-1 text-sm font-bold leading-6 text-navy-950">{submittedCourse}</p>
          </div>
        )}
        {submittedCenter && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Centre / mode</p>
            <p className="mt-1 text-sm font-bold leading-6 text-navy-950">{submittedCenter}</p>
          </div>
        )}
        {submittedDate && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Submitted</p>
            <p className="mt-1 text-sm font-bold leading-6 text-navy-950">{submittedDate}</p>
          </div>
        )}
        {submittedRecord?.wasEdited && (
          <p className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-bold text-brand-700">
            Your edited response has been saved.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onEditResponse}
        className="mt-6 text-sm font-bold text-brand-700 underline decoration-2 underline-offset-4 transition hover:text-brand-800"
      >
        Edit Response
      </button>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setShowPaymentNote(true)}
          className="inline-flex items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-bold text-white shadow-redGlow transition hover:bg-brand-600"
        >
          Pay Registration Fee
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-navy-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-navy-800"
        >
          Request Assistance
        </a>
      </div>
      {showPaymentNote && (
        <div className="mx-auto mt-7 max-w-2xl rounded-3xl border border-brand-100 bg-brand-50 p-5 text-left">
          <p className="text-sm font-bold text-navy-950">Payment setup coming soon.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            For now, please use Request Assistance to contact the centre manager for registration fee guidance.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function StepHeader({
  icon,
  title,
  subtitle,
  compactIcon = false,
}: {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: string;
  compactIcon?: boolean;
}) {
  const iconSizeClass = compactIcon
    ? "[&_svg]:h-[19px] [&_svg]:w-[19px] sm:[&_svg]:h-[23px] sm:[&_svg]:w-[23px]"
    : "[&_svg]:h-5 [&_svg]:w-5 sm:[&_svg]:h-6 sm:[&_svg]:w-6";

  return (
    <div>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-navy-950 text-white sm:h-14 sm:w-14 ${iconSizeClass}`}>
          {icon}
        </div>
        <h3 className="text-[1.5rem] font-semibold leading-tight text-navy-950 sm:text-[1.75rem]">{title}</h3>
      </div>
      {subtitle && <p className="mt-3 max-w-3xl leading-7 text-slate-600 sm:ml-[4.5rem]">{subtitle}</p>}
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  const listItems = Array.isArray(items) ? items : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <h4 className="text-sm font-bold text-navy-950">{title}</h4>
      <ul className="mt-4 space-y-3">
        {safeArray(listItems).map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
            <CheckCircle2 className="mt-0.5 shrink-0 text-brand-700" size={17} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TextField({
  errorKey,
  label,
  value,
  onChange,
  error,
}: {
  errorKey?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label data-error-key={errorKey} className="block">
      <span className="text-sm font-bold text-navy-950">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
      {error && <span className="mt-2 block text-sm font-semibold text-brand-700">{error}</span>}
    </label>
  );
}
