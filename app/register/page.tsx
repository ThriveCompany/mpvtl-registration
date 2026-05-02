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
import type { FormEvent, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";

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
  { id: "L1005", name: "Beauty Therapy Centre", address: "Beauty Therapy Centre, Oyo State", hostel: "Facility details not listed", wifi: "WiFi not listed" },
  { id: "L2000", name: "Online", address: "Online learning mode", hostel: "Not applicable", wifi: "Stable internet required" },
];

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
  readWriteEnglish: "Can you read and write in English?",
  newToField: "Are you new to this field?",
  courseReason: "Why do you want to take this course?",
  courseReasonOther: "Course interest details",
  practicalAvailability: "Are you available for practical training?",
};

const intermediateQuestionKeys = {
  priorExposure: "Do you have basic knowledge or prior exposure to this trade?",
  completedBasicCourse: "Have you completed a basic course in this field before?",
  experienceBrief: "Describe your experience briefly.",
  screeningAvailability: "Are you available for screening?",
};

const advancedQuestionKeys = {
  priorTraining: "Do you have prior training or demonstrable experience?",
  previousCertificate: "Do you have a previous certificate?",
  practicalExperience: "Describe your practical experience.",
  assessmentAvailability: "Are you available for assessment/interview?",
  certificateType: "Previous certificate type",
  certificateTypeOther: "Previous certificate type details",
};

const questions: Record<Level, string[]> = {
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
    intermediateQuestionKeys.screeningAvailability,
  ],
  Advanced: [
    advancedQuestionKeys.priorTraining,
    advancedQuestionKeys.previousCertificate,
    advancedQuestionKeys.practicalExperience,
    advancedQuestionKeys.assessmentAvailability,
  ],
};

const standardSteps = ["Course", "Description", "Centre", "Details", "Verify", "Upload", "Action"];
const basicSteps = ["Course", "Description", "Centre", "Details", "Verify", "Confirm", "Action"];

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

export default function RegisterPage() {
  const formRef = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [details, setDetails] = useState({
    fullName: "",
    email: "",
    phone: "",
    hostel: "",
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, string>>({});
  const [basicDeclaration, setBasicDeclaration] = useState("");
  const [receiveUpdates, setReceiveUpdates] = useState(true);
  const [finalAction, setFinalAction] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId);
  const availableLocations = selectedCourse
    ? locations.filter((location) => courseLocationIds[selectedCourse.id]?.includes(location.id))
    : [];
  const selectedLocationData = locations.find((location) => location.id === selectedLocation);
  const selectedLevel = selectedCourse?.level ?? "Basic";
  const activeQuestions = questions[selectedLevel];
  const activeSteps = selectedLevel === "Basic" ? basicSteps : standardSteps;

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesCategory = category === "All Categories" || course.category === category;
      const matchesSearch = course.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectCourse(courseId: string) {
    setSelectedCourseId(courseId);
    setSelectedLocation("");
    setAnswers({});
    setBasicDeclaration("");
    setFinalAction("");
    setSubmitError("");
  }

  function validateStep(targetStep = step) {
    const nextErrors: Record<string, string> = {};

    if (targetStep >= 0 && !selectedCourse) nextErrors.course = "Please select a course.";
    if (targetStep >= 2 && !selectedLocation) nextErrors.location = "Please select a centre or mode.";
    if (targetStep >= 3) {
      if (!details.fullName.trim()) nextErrors.fullName = "Full name is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) nextErrors.email = "Enter a valid email address.";
      if (!details.phone.trim()) nextErrors.phone = "Phone number is required.";
      if (!details.hostel) nextErrors.hostel = "Please choose Yes or No.";
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
      nextErrors.basicDeclaration = "Please write your declaration before continuing.";
    }
    if (targetStep >= 6 && !finalAction) nextErrors.finalAction = "Please choose a final action.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function nextStep() {
    if (!validateStep(step)) return;
    if (step === 0) setShowIntro(false);
    setStep((current) => Math.min(current + 1, activeSteps.length - 1));
    setErrors({});
    setSubmitError("");
  }

  function previousStep() {
    setStep((current) => Math.max(current - 1, 0));
    setErrors({});
    setSubmitError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !validateStep(6) || !selectedCourse) return;

    const payload = {
      course: selectedCourse,
      location: selectedLocationData,
      applicant: details,
      verification: answers,
      uploads: files,
      basicDeclaration: selectedLevel === "Basic" ? basicDeclaration : "",
      receiveUpdates,
      finalAction,
      submittedAt: new Date().toISOString(),
    };

    // Power Automate receives the registration JSON now. Future phases can add
    // secure file storage, email workflows, Excel exports, and payment checks.
    localStorage.setItem("mpvtlShortCourseRegistration", JSON.stringify(payload));
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submit-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(result?.message || "We could not submit your registration right now.");
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
        <div className="mx-auto max-w-7xl">
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
            <SuccessScreen />
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <Stepper currentStep={step} steps={activeSteps} />

              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-premium">
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
                        selectedLocation={selectedLocation}
                        setSelectedLocation={setSelectedLocation}
                        error={errors.location}
                      />
                    )}
                    {step === 3 && (
                      <DetailsStep details={details} setDetails={setDetails} errors={errors} />
                    )}
                    {step === 4 && (
                      <VerificationStep
                        level={selectedLevel}
                        questions={activeQuestions}
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
                    {step === 5 && selectedLevel !== "Basic" && <EvidenceStep files={files} setFiles={setFiles} />}
                    {step === 6 && (
                      <FinalStep
                        level={selectedLevel}
                        finalAction={finalAction}
                        setFinalAction={setFinalAction}
                        receiveUpdates={receiveUpdates}
                        setReceiveUpdates={setReceiveUpdates}
                        error={errors.finalAction}
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

                  {step < activeSteps.length - 1 ? (
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
                      disabled={isSubmitting}
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
        </div>
      </section>
    </main>
  );
}

function IntroCard({ onRegister }: { onRegister: () => void }) {
  return (
    <motion.section
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-premium sm:p-10"
      >
        <div className="absolute inset-x-0 top-0 h-2 bg-brand-700" />
        <motion.div
          aria-hidden="true"
          animate={{ y: [0, 14, 0], opacity: [0.5, 0.85, 0.5] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="absolute -right-16 top-8 h-56 w-56 rounded-full bg-brand-100 blur-3xl"
        />
        <motion.div
          aria-hidden="true"
          animate={{ x: [0, 18, 0], opacity: [0.28, 0.5, 0.28] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-navy-50 blur-3xl"
        />

        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-bold text-navy-950 sm:gap-3 sm:px-4">
              <GraduationCap size={16} className="text-brand-700 sm:h-[18px] sm:w-[18px]" />
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

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { icon: <BriefcaseBusiness size={18} />, title: "Practical Training", text: "Skill-focused learning for real work." },
              { icon: <Award size={18} />, title: "Certification Pathways", text: "MPVTL and international routes." },
              { icon: <Building2 size={18} />, title: "Training Centres", text: "Course Training centres matched to your choice." },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0, y: index === 1 ? [0, -8, 0] : [0, 6, 0] }}
                transition={{
                  opacity: { duration: 0.35, delay: 0.18 + index * 0.12 },
                  x: { duration: 0.35, delay: 0.18 + index * 0.12 },
                  y: { repeat: Infinity, duration: 4.8 + index * 0.5, ease: "easeInOut" },
                }}
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
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

function Stepper({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-6 lg:h-fit">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-700">
          Progress
        </p>
        <p className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-navy-950">
          Step {currentStep + 1} of {steps.length}
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
          {steps.map((label, index) => {
            const active = index === currentStep;
            const done = index < currentStep;

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
            {steps[currentStep]}
          </p>
        </div>
      </div>

      <div className="mt-5 hidden gap-3 lg:grid">
        {steps.map((label, index) => {
          const active = index === currentStep;
          const done = index < currentStep;

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
  filteredCourses: Course[];
  selectedCourseId: string;
  setSelectedCourseId: (value: string) => void;
  selectedCourse?: Course;
  onContinue: () => void;
  error?: string;
}) {
  return (
    <div>
      <StepHeader icon={<Search />} title="Choose Your Course" subtitle="Search, filter, and select the MPVTL short course you want to register for." />

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
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      {props.error && <p className="mt-3 text-sm font-semibold text-brand-700">{props.error}</p>}

      {props.selectedCourse && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
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

      <motion.div
        className="mt-7 grid gap-4 md:grid-cols-2"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.035 } },
        }}
      >
        {props.filteredCourses.map((course) => {
          const selected = props.selectedCourseId === course.id;

          return (
            <motion.article
              key={course.id}
              onClick={() => props.setSelectedCourseId(course.id)}
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.99 }}
              className={`cursor-pointer rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg ${
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
            </motion.article>
          );
        })}
      </motion.div>

      {props.filteredCourses.length === 0 && (
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
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <StepHeader icon={<MapPin />} title="Choose Centre / Mode" subtitle="Pick a training centre or online mode using MPVTL centre and facility information." />
      {props.error && <p className="mt-4 text-sm font-semibold text-brand-700">{props.error}</p>}

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {props.locations.map((location) => {
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

      {props.locations.length === 0 && (
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
  errors: Record<string, string>;
}) {
  const update = (key: keyof typeof props.details, value: string) => {
    props.setDetails({ ...props.details, [key]: value });
  };

  return (
    <div>
      <StepHeader icon={<BriefcaseBusiness />} title="Personal Details" subtitle="Enter your details so MPVTL can follow up when the next phase is connected." />

      <div className="mt-7 grid gap-5">
        <TextField label="Full Name" value={props.details.fullName} onChange={(value) => update("fullName", value)} error={props.errors.fullName} />
        <TextField label="Email Address" value={props.details.email} onChange={(value) => update("email", value)} error={props.errors.email} />
        <TextField label="Phone Number" value={props.details.phone} onChange={(value) => update("phone", value)} error={props.errors.phone} />

        <div>
          <p className="mb-3 text-sm font-bold text-navy-950">Need hostel?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Yes", "No"].map((option) => (
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
      </div>
    </div>
  );
}

function VerificationStep(props: {
  level: Level;
  questions: string[];
  answers: Record<string, string>;
  setAnswers: (value: Record<string, string>) => void;
  errors: Record<string, string>;
}) {
  const updateAnswer = (key: string, value: string, clearKeys: string[] = []) => {
    const nextAnswers = { ...props.answers, [key]: value };
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
          <SelectField
            label={basicQuestionKeys.readWriteEnglish}
            value={props.answers[basicQuestionKeys.readWriteEnglish] ?? ""}
            onChange={(value) => updateAnswer(basicQuestionKeys.readWriteEnglish, value)}
            options={yesNoOptions}
            error={props.errors[basicQuestionKeys.readWriteEnglish]}
          />
          <SelectField
            label={basicQuestionKeys.newToField}
            value={props.answers[basicQuestionKeys.newToField] ?? ""}
            onChange={(value) => updateAnswer(basicQuestionKeys.newToField, value)}
            options={yesNoOptions}
            error={props.errors[basicQuestionKeys.newToField]}
          />
          <SelectField
            label={basicQuestionKeys.courseReason}
            value={props.answers[basicQuestionKeys.courseReason] ?? ""}
            onChange={(value) => updateAnswer(basicQuestionKeys.courseReason, value, [basicQuestionKeys.courseReasonOther])}
            options={courseReasonOptions}
            error={props.errors[basicQuestionKeys.courseReason]}
          />
          {props.answers[basicQuestionKeys.courseReason] === "Other, please describe" && (
            <AnswerTextArea
              label="Please describe your reason"
              value={props.answers[basicQuestionKeys.courseReasonOther] ?? ""}
              onChange={(value) => updateAnswer(basicQuestionKeys.courseReasonOther, value)}
              error={props.errors[basicQuestionKeys.courseReasonOther]}
            />
          )}
          <SelectField
            label={basicQuestionKeys.practicalAvailability}
            value={props.answers[basicQuestionKeys.practicalAvailability] ?? ""}
            onChange={(value) => updateAnswer(basicQuestionKeys.practicalAvailability, value)}
            options={availabilityOptions}
            error={props.errors[basicQuestionKeys.practicalAvailability]}
          />
        </div>
      </div>
    );
  }

  if (props.level === "Intermediate") {
    return (
      <div>
        <StepHeader icon={<ShieldCheck />} title="Intermediate Verification Questions" subtitle="These questions capture screening-ready information in a structured format." />

        <div className="mt-7 grid gap-5">
          <SelectField
            label={intermediateQuestionKeys.priorExposure}
            value={props.answers[intermediateQuestionKeys.priorExposure] ?? ""}
            onChange={(value) => updateAnswer(intermediateQuestionKeys.priorExposure, value)}
            options={yesNoOptions}
            error={props.errors[intermediateQuestionKeys.priorExposure]}
          />
          <SelectField
            label={intermediateQuestionKeys.completedBasicCourse}
            value={props.answers[intermediateQuestionKeys.completedBasicCourse] ?? ""}
            onChange={(value) => updateAnswer(intermediateQuestionKeys.completedBasicCourse, value)}
            options={yesNoOptions}
            error={props.errors[intermediateQuestionKeys.completedBasicCourse]}
          />
          <AnswerTextArea
            label={intermediateQuestionKeys.experienceBrief}
            value={props.answers[intermediateQuestionKeys.experienceBrief] ?? ""}
            onChange={(value) => updateAnswer(intermediateQuestionKeys.experienceBrief, value)}
            error={props.errors[intermediateQuestionKeys.experienceBrief]}
          />
          <SelectField
            label={intermediateQuestionKeys.screeningAvailability}
            value={props.answers[intermediateQuestionKeys.screeningAvailability] ?? ""}
            onChange={(value) => updateAnswer(intermediateQuestionKeys.screeningAvailability, value)}
            options={availabilityOptions}
            error={props.errors[intermediateQuestionKeys.screeningAvailability]}
          />
        </div>
      </div>
    );
  }

  if (props.level === "Advanced") {
    return (
      <div>
        <StepHeader icon={<ShieldCheck />} title="Advanced Verification Questions" subtitle="These questions capture screening-ready information in a structured format." />

        <div className="mt-7 grid gap-5">
          <SelectField
            label={advancedQuestionKeys.priorTraining}
            value={props.answers[advancedQuestionKeys.priorTraining] ?? ""}
            onChange={(value) => updateAnswer(advancedQuestionKeys.priorTraining, value)}
            options={yesNoOptions}
            error={props.errors[advancedQuestionKeys.priorTraining]}
          />

          <SelectField
            label={advancedQuestionKeys.previousCertificate}
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
          />
          {props.answers[advancedQuestionKeys.previousCertificate] === "Yes" && (
            <SelectField
              label="Type of certification"
              value={props.answers[advancedQuestionKeys.certificateType] ?? ""}
              onChange={(value) => updateAnswer(advancedQuestionKeys.certificateType, value, [advancedQuestionKeys.certificateTypeOther])}
              options={certificateTypeOptions}
              error={props.errors[advancedQuestionKeys.certificateType]}
            />
          )}
          {props.answers[advancedQuestionKeys.certificateType] === "Other, please describe" && (
            <AnswerTextArea
              label="Please describe the certification type"
              value={props.answers[advancedQuestionKeys.certificateTypeOther] ?? ""}
              onChange={(value) => updateAnswer(advancedQuestionKeys.certificateTypeOther, value)}
              error={props.errors[advancedQuestionKeys.certificateTypeOther]}
            />
          )}

          <AnswerTextArea
            label={advancedQuestionKeys.practicalExperience}
            value={props.answers[advancedQuestionKeys.practicalExperience] ?? ""}
            onChange={(value) => updateAnswer(advancedQuestionKeys.practicalExperience, value)}
            error={props.errors[advancedQuestionKeys.practicalExperience]}
          />

          <SelectField
            label={advancedQuestionKeys.assessmentAvailability}
            value={props.answers[advancedQuestionKeys.assessmentAvailability] ?? ""}
            onChange={(value) => updateAnswer(advancedQuestionKeys.assessmentAvailability, value)}
            options={availabilityOptions}
            error={props.errors[advancedQuestionKeys.assessmentAvailability]}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepHeader icon={<ShieldCheck />} title={`${props.level} Verification Questions`} subtitle="These questions adjust to the selected course level." />

      <div className="mt-7 grid gap-5">
        {props.questions.map((question) => (
          <AnswerTextArea
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
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-navy-950">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100"
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {error && <span className="mt-2 block text-sm font-semibold text-brand-700">{error}</span>}
    </label>
  );
}

function AnswerTextArea({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="block">
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
    ? `I am ${props.fullName}, and I am interested in ${props.courseName}.`
    : "I am [Full Name], and I am interested in [Selected Course].";

  return (
    <div>
      <StepHeader icon={<GraduationCap />} title="Applicant Declaration" subtitle="For Basic courses, write a simple declaration before final submission." />

      <div className="mt-7 rounded-3xl border border-brand-100 bg-brand-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
          Write this statement
        </p>
        <p className="mt-3 text-base font-semibold leading-7 text-navy-950">
          {suggestedDeclaration}
        </p>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-bold text-navy-950">Your declaration</span>
        <textarea
          value={props.declaration}
          onChange={(event) => props.setDeclaration(event.target.value)}
          rows={4}
          placeholder={suggestedDeclaration}
          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none transition focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100"
        />
        {props.error && <span className="mt-2 block text-sm font-semibold text-brand-700">{props.error}</span>}
      </label>
    </div>
  );
}

function EvidenceStep(props: {
  files: Record<string, string>;
  setFiles: (value: Record<string, string>) => void;
}) {
  const fields = ["ID Document", "Previous Certificate / Supporting Document"];

  return (
    <div>
      <StepHeader icon={<FileUp />} title="Upload Evidence" subtitle="Select supporting files for MPVTL review." />

      <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm font-semibold text-brand-800">
        File names are captured for now. Secure storage will be connected in the next development phase.
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field} className="group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-brand-600 hover:bg-white sm:min-h-52 sm:p-6">
            <FileUp className="h-8 w-8 text-brand-700 sm:h-9 sm:w-9" />
            <span className="mt-4 font-bold text-navy-950">{field}</span>
            <span className="mt-2 text-sm text-slate-500">{props.files[field] || "Click to choose a file"}</span>
            <input
              type="file"
              className="sr-only"
              onChange={(event) => {
                const fileName = event.target.files?.[0]?.name ?? "";
                props.setFiles({ ...props.files, [field]: fileName });
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function FinalStep(props: {
  level: Level;
  finalAction: string;
  setFinalAction: (value: string) => void;
  receiveUpdates: boolean;
  setReceiveUpdates: (value: boolean) => void;
  error?: string;
}) {
  const actions = props.level === "Basic"
    ? ["Pay Registration Fee / Transfer Option Coming Soon", "Request Assistance / Contact Centre"]
    : ["Submit for Screening"];

  return (
    <div>
      <StepHeader icon={<CheckCircle2 />} title="Final Action" subtitle="Choose how MPVTL should proceed with your registration." />
      {props.error && <p className="mt-4 text-sm font-semibold text-brand-700">{props.error}</p>}

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {actions.map((action) => {
          const selected = props.finalAction === action;

          return (
            <button
              type="button"
              key={action}
              onClick={() => props.setFinalAction(action)}
              className={`rounded-3xl border p-6 text-left transition hover:-translate-y-1 hover:shadow-lg ${
                selected ? "border-brand-600 bg-brand-50 shadow-redGlow" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-navy-950 text-white sm:h-12 sm:w-12 [&_svg]:h-5 [&_svg]:w-5 sm:[&_svg]:h-6 sm:[&_svg]:w-6">
                {props.level === "Basic" ? <Award /> : <ShieldCheck />}
              </div>
              <h3 className="mt-5 text-lg font-bold text-navy-950">{action}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Your choice will be submitted with your registration so MPVTL can follow up clearly.
              </p>
            </button>
          );
        })}
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

function SuccessScreen() {
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
      <h2 className="mt-8 text-[1.75rem] font-semibold leading-tight text-navy-950 sm:text-[2.125rem]">Registration submitted successfully.</h2>
      <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-600">
        Your registration has been sent to MPVTL. A backup copy is also saved on this device.
      </p>
    </motion.div>
  );
}

function StepHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-navy-950 text-white sm:h-14 sm:w-14 [&_svg]:h-5 [&_svg]:w-5 sm:[&_svg]:h-6 sm:[&_svg]:w-6">
          {icon}
        </div>
        <h3 className="text-[1.5rem] font-semibold leading-tight text-navy-950 sm:text-[1.75rem]">{title}</h3>
      </div>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600 sm:ml-[4.5rem]">{subtitle}</p>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <h4 className="text-sm font-bold text-navy-950">{title}</h4>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
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
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <label className="block">
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
