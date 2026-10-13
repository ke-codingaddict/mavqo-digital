import type { Product, ProductStatus } from "./types";

/**
 * Software product catalogue (spec §6).
 *
 * ⚠️  Before launch: confirm that every feature listed below is implemented and
 *     working in the version you demo. Remove anything that isn't — the spec
 *     forbids advertising unverified capabilities. Integrations (e.g. M-Pesa,
 *     SMS, booking channels) are intentionally NOT listed as features until
 *     they are implemented, tested and approved.
 */

const commonOnboarding = [
  "Discovery call to understand your workflows, users and data.",
  "A live demo using sample data, tailored to your organization.",
  "A written proposal with scope, timelines and pricing.",
  "Configuration, data migration support and staff training.",
  "Go-live support, followed by ongoing help when you need it.",
];

export const products: Product[] = [
  {
    id: "prd_school",
    name: "School Management System",
    shortName: "School",
    slug: "school-management-system-kenya",
    icon: "school",
    showcaseImage: { src: "/images/school-showcase.webp", alt: "Schoolgirl in glasses holding books, thinking", position: "50% 62%" },
    image: { src: "/images/school-books.webp", alt: "Graduation cap on a stack of books with pencils, a diploma and an apple in front of a chalkboard" },
    industry: "Education",
    summary:
      "Manage admissions, fees, attendance, assessments and parent communication for CBC schools, in one place.",
    description:
      "A school management system for Kenyan schools under the Competency-Based Curriculum (CBC) — from Pre-primary to Senior School. It brings learner records, fee collection, attendance, assessments and reporting together, so your team spends less time on paperwork and more time on learners.",
    audience: [
      "CBC schools, from Pre-primary to Senior School",
      "Pre-primary (PP1–PP2) and Primary School (Grades 1–6)",
      "Junior School (Grades 7–9)",
      "Senior School (Grades 10–12)",
      "Private academies and international schools",
      "School owners, head teachers, bursars and administrators",
    ],
    problems: [
      "Student records scattered across paper files and spreadsheets",
      "Hard-to-track fee balances and manual receipting",
      "Time-consuming assessment records and term-end learner reports",
      "Slow, inconsistent communication with parents",
    ],
    features: [
      { title: "Admissions & learner records", description: "Enrol learners and keep complete, searchable records for every learner." },
      { title: "Grades, streams & learning areas", description: "Organize grades, streams, learning areas and teacher allocations." },
      { title: "Attendance", description: "Record daily attendance and spot patterns early." },
      { title: "Fee structures & invoices", description: "Set fee structures per grade or term and generate invoices." },
      { title: "Payment tracking", description: "Record payments and see outstanding balances at a glance." },
      { title: "Assessments", description: "Capture assessment results and apply your school's grading rules." },
      { title: "Learner progress reports", description: "Produce term reports and performance summaries in minutes." },
      { title: "Parent communication", description: "Keep parents informed about fees, events and performance." },
      { title: "Staff records", description: "Maintain teaching and support staff information securely." },
      { title: "Administrative reporting", description: "Get enrolment, finance and academic reports for decision-making." },
    ],
    screenshots: [],
    onboarding: commonOnboarding,
    status: "available_for_demo",
    demoAvailable: true,
    pricingModel: "custom_quote",
    faqs: [
      { question: "Can we see the system before we commit?", answer: "Yes. We run a live demo with sample data so you can see how admissions, fees, attendance and assessments work for a school like yours before you make any decision." },
      { question: "Is it suitable for CBC schools?", answer: "It's aimed at Kenyan schools organized under CBC — Pre-primary, Primary, Junior School and Senior School. Bring your grades, streams and assessment approach to the demo and we'll show you exactly how they would be set up." },
      { question: "Can you move our existing records into the system?", answer: "We help you import existing student and fee records during onboarding. The exact approach depends on the format your data is in today, which we review during discovery." },
      { question: "How is pricing calculated?", answer: "Pricing depends on the modules you need, the number of learners and users, and the level of support. You'll get a clear written quote after the demo." },
      { question: "Will our staff be trained?", answer: "Yes. Training for administrators and staff is part of onboarding." },
    ],
    related: ["hospital-management-system-kenya", "business-management-software-kenya"],
    seoTitle: "CBC School Management System in Kenya",
    seoDescription:
      "School management software for Kenyan CBC schools — learner records, fees, attendance, assessments and term reports, from Pre-primary to Senior School.",
    published: true,
  },
  {
    id: "prd_hospital",
    name: "Hospital & Clinic Management System",
    shortName: "Hospital & Clinic",
    slug: "hospital-management-system-kenya",
    icon: "hospital",
    image: { src: "/images/hospital-doctor.webp", alt: "Healthcare worker in scrubs and a face mask working on a laptop at a clinic desk" },
    industry: "Healthcare",
    summary:
      "Run registration, appointments, queues, billing, pharmacy and lab workflows with strict access control.",
    description:
      "A hospital and clinic management system designed around patient flow — from registration and appointments to billing, pharmacy and laboratory — with role-based permissions and audit trails to protect sensitive health information.",
    audience: [
      "Private clinics and medical centres",
      "Hospitals and nursing homes",
      "Dental, eye and specialist clinics",
      "Facility administrators, front-office and billing teams",
    ],
    problems: [
      "Long queues and poor visibility of patient flow",
      "Paper files that are hard to find and easy to lose",
      "Billing errors and revenue leakage",
      "Little control over who can see sensitive patient information",
    ],
    features: [
      { title: "Patient registration", description: "Register patients once and find their records quickly on every visit." },
      { title: "Appointment scheduling", description: "Book and manage appointments across practitioners." },
      { title: "Queue management", description: "See who is waiting, where, and for how long." },
      { title: "Clinical documentation", description: "Capture consultation notes in a structured way." },
      { title: "Billing", description: "Generate accurate bills from services, consultations and items." },
      { title: "Pharmacy workflows", description: "Manage dispensing and pharmacy stock." },
      { title: "Laboratory workflows", description: "Track lab requests and results." },
      { title: "Insurance administration", description: "Record insurance details and manage claims-related billing." },
      { title: "Reporting", description: "Operational and financial reports for management." },
      { title: "Role-based permissions & audit logs", description: "Control access by role and keep a record of who did what." },
    ],
    screenshots: [],
    onboarding: [
      ...commonOnboarding.slice(0, 3),
      "Role and permission set-up agreed with your facility's leadership.",
      ...commonOnboarding.slice(3),
    ],
    status: "available_for_demo",
    demoAvailable: true,
    pricingModel: "custom_quote",
    faqs: [
      { question: "Do your demos use real patient data?", answer: "No. Every demo uses synthetic sample data. We never use real patient information for demonstrations." },
      { question: "How is patient information protected?", answer: "Access is controlled by role, actions are recorded in audit logs, and data is encrypted in transit. We'll walk you through the security controls, backups and data handling during your demo." },
      { question: "Can the system be adapted to our facility?", answer: "We configure services, departments, roles and billing to match how your facility works. Anything beyond configuration is scoped and quoted separately." },
      { question: "How is pricing calculated?", answer: "Pricing depends on the modules, number of users and branches, and support level. You'll receive a written quote after the demo." },
    ],
    related: ["school-management-system-kenya", "inventory-management-software-kenya"],
    seoTitle: "Hospital & Clinic Management System in Kenya",
    seoDescription:
      "Hospital and clinic management software for registration, appointments, queues, billing, pharmacy and lab workflows. Request a demo from Mavqo Digital.",
    published: true,
  },
  {
    id: "prd_restaurant",
    name: "Restaurant Management System",
    shortName: "Restaurant",
    slug: "restaurant-management-system-kenya",
    icon: "restaurant",
    image: { src: "/images/restaurant-barista.webp", alt: "Smiling café worker in an apron entering an order on a tablet at the counter" },
    industry: "Restaurants & Hospitality",
    summary:
      "Take orders, send them to the kitchen, bill accurately and cash up with confidence — all from one system.",
    description:
      "A restaurant management system for restaurants, cafés and bars that connects the floor, the kitchen and the till — so orders are right, bills are accurate and owners can see exactly how the day went.",
    audience: [
      "Restaurants and fast-food outlets",
      "Cafés, coffee shops and bakeries",
      "Bars, lounges and hotel restaurants",
      "Owners, managers, cashiers and waiting staff",
    ],
    problems: [
      "Handwritten orders that get lost or misread in the kitchen",
      "Billing mistakes, missed items and disputes over the bill",
      "Cash and sales that don't add up at the end of the shift",
      "No clear view of best-selling dishes, busy hours or stock use",
    ],
    features: [
      { title: "Menu management", description: "Set up dishes, categories, prices and modifiers in one place." },
      { title: "Order taking", description: "Capture dine-in, takeaway and delivery orders quickly and accurately." },
      { title: "Table management", description: "See which tables are open, occupied or waiting for the bill." },
      { title: "Kitchen orders", description: "Send orders straight to the kitchen so nothing is lost or misread." },
      { title: "Billing & split bills", description: "Produce accurate bills and split them between guests when needed." },
      { title: "Receipts", description: "Issue clear receipts for every sale." },
      { title: "Shift & cash-up", description: "Close each shift with a clear summary of sales by payment type." },
      { title: "Ingredient & stock tracking", description: "Track stock used and know when to reorder." },
      { title: "Staff roles & permissions", description: "Control who can void items, give discounts or close bills." },
      { title: "Sales reports", description: "See sales by dish, category, waiter and time of day." },
    ],
    screenshots: [],
    onboarding: commonOnboarding,
    status: "available_for_demo",
    demoAvailable: true,
    pricingModel: "custom_quote",
    faqs: [
      { question: "Does it work for a small café as well as a large restaurant?", answer: "Yes. You choose the modules you need, so a small café isn't paying for features it won't use, and a bigger restaurant can add tables, kitchen orders and more staff roles." },
      { question: "Which payment methods are supported?", answer: "Payment integrations are confirmed per deployment. We only commit to integrations that are implemented and tested — tell us how your customers pay and we'll go through it in the demo." },
      { question: "Can it handle takeaway and delivery orders?", answer: "Bring your order types to the demo and we'll show you how dine-in, takeaway and delivery orders are set up for your restaurant." },
      { question: "How is pricing calculated?", answer: "Pricing depends on the number of tills, users and branches, and the modules you need. You'll get a written quote after the demo." },
    ],
    related: ["pos-system-kenya", "inventory-management-software-kenya"],
    seoTitle: "Restaurant Management System in Kenya",
    seoDescription:
      "Restaurant management software for orders, table management, kitchen orders, billing, split bills, cash-up and sales reports. Book a demo with Mavqo Digital.",
    published: true,
  },
  {
    id: "prd_pos",
    name: "Point of Sale (POS) System",
    shortName: "POS",
    slug: "pos-system-kenya",
    icon: "pos",
    image: { src: "/images/pos-cashier.webp", alt: "Smiling cashier at a POS terminal in a café, holding a receipt" },
    industry: "Retail & Hospitality",
    summary:
      "Sell faster, issue receipts, update stock automatically and see your sales in real time.",
    description:
      "A point of sale system for shops, supermarkets, restaurants and pharmacies that speeds up checkout, keeps stock accurate and gives owners clear sales reports.",
    audience: [
      "Shops, supermarkets and mini-marts",
      "Restaurants, cafés and bars",
      "Pharmacies and hardware stores",
      "Owners who want visibility of sales and staff activity",
    ],
    problems: [
      "Slow checkout and long queues",
      "Stock that doesn't match what was sold",
      "Cash discrepancies and limited control over staff actions",
      "No clear picture of daily, weekly or monthly sales",
    ],
    features: [
      { title: "Product catalogue", description: "Manage items, prices and categories." },
      { title: "Sales processing", description: "Fast, simple checkout for cashiers." },
      { title: "Receipt generation", description: "Issue clear receipts for every sale." },
      { title: "Automatic stock updates", description: "Stock levels adjust as you sell." },
      { title: "User permissions", description: "Control what each cashier and manager can do." },
      { title: "Sales reports", description: "See sales by day, product, category and user." },
      { title: "Returns & adjustments", description: "Handle returns and corrections with a clear record." },
    ],
    screenshots: [],
    onboarding: commonOnboarding,
    status: "available_for_demo",
    demoAvailable: true,
    pricingModel: "custom_quote",
    faqs: [
      { question: "Can I manage more than one branch?", answer: "Tell us about your branches during the demo and we'll show you exactly how multi-location set-ups are handled for your business." },
      { question: "Which payment methods are supported?", answer: "Payment integrations are confirmed per deployment. We only commit to integrations that are implemented and tested — let's discuss what you need during the demo." },
      { question: "How is pricing calculated?", answer: "Pricing depends on the number of tills, users and branches. You'll receive a written quote after the demo." },
    ],
    related: ["inventory-management-software-kenya", "restaurant-management-system-kenya"],
    seoTitle: "POS System in Kenya for Shops, Restaurants & Pharmacies",
    seoDescription:
      "Point of sale software with fast checkout, receipts, automatic stock updates, user permissions and sales reports. Request a POS demo from Mavqo Digital.",
    published: true,
  },
  {
    id: "prd_inventory",
    name: "Inventory Management System",
    shortName: "Inventory",
    slug: "inventory-management-software-kenya",
    icon: "inventory",
    image: { src: "/images/inventory-tablet.webp", alt: "Tablet showing warehouse shelves with stock-level labels such as ready, running out of stock and out of stock" },
    industry: "Retail, Wholesale & Distribution",
    summary:
      "Know exactly what you have, where it is, and when to reorder — with full stock movement history.",
    description:
      "Inventory management software that tracks goods received, goods issued and stock adjustments with a full audit trail, so you can reduce losses, avoid stock-outs and make better purchasing decisions.",
    audience: [
      "Wholesalers and distributors",
      "Retailers and supermarkets",
      "Warehouses and stores departments",
      "Hospitals, restaurants and schools managing supplies",
    ],
    problems: [
      "Stock-outs of fast-moving items and over-stocking of slow ones",
      "Unexplained stock losses",
      "No reliable record of what came in and what went out",
      "Purchasing decisions made on guesswork",
    ],
    features: [
      { title: "Product records", description: "Maintain items, units and categories." },
      { title: "Stock levels", description: "See current quantities at a glance." },
      { title: "Goods received", description: "Record deliveries against suppliers." },
      { title: "Goods issued", description: "Track stock leaving the store and why." },
      { title: "Suppliers", description: "Keep supplier details and purchase history." },
      { title: "Stock adjustments", description: "Correct stock with reasons and an audit trail." },
      { title: "Reorder alerts", description: "Get notified before items run out." },
      { title: "Inventory reporting", description: "Valuation, movement and stock-take reports." },
    ],
    screenshots: [],
    onboarding: commonOnboarding,
    status: "available_for_demo",
    demoAvailable: true,
    pricingModel: "custom_quote",
    faqs: [
      { question: "Can it handle multiple stores or warehouses?", answer: "Share your locations with us during the demo and we'll show you how multi-location stock would be set up for your operation." },
      { question: "Can it work together with your POS?", answer: "Yes — our POS updates stock as you sell. We'll show both working together in the demo if that's relevant to you." },
      { question: "How is pricing calculated?", answer: "Pricing depends on the number of users, locations and modules. You'll get a written quote after the demo." },
    ],
    related: ["pos-system-kenya", "business-management-software-kenya"],
    seoTitle: "Inventory Management Software in Kenya",
    seoDescription:
      "Inventory management software for stock levels, goods received and issued, suppliers, reorder alerts and reports. Book a demo with Mavqo Digital.",
    published: true,
  },
  {
    id: "prd_business",
    name: "Business Management Software",
    shortName: "Business Suite",
    slug: "business-management-software-kenya",
    icon: "business",
    image: { src: "/images/business.jpg", alt: "Smiling business owner in her workplace" },
    industry: "SMEs & Growing Businesses",
    summary:
      "An all-in-one suite to run sales, stock, customers and reporting for growing businesses.",
    description:
      "We're building an integrated business management suite for growing Kenyan businesses. Join the early-access list and we'll contact you when it's ready to demo.",
    audience: [
      "Small and medium-sized enterprises",
      "Growing businesses outgrowing spreadsheets",
      "Owners who want one view of their operations",
    ],
    problems: [
      "Information spread across too many tools and spreadsheets",
      "No single view of how the business is performing",
    ],
    features: [],
    screenshots: [],
    onboarding: commonOnboarding,
    status: "in_development",
    demoAvailable: false,
    pricingModel: "subscription",
    faqs: [
      { question: "When will it be available?", answer: "It's currently in development. Join the early-access list and we'll let you know as soon as demos are available." },
      { question: "Is there something I can use today?", answer: "Yes — our POS and Inventory Management systems are available to demo now and cover sales and stock control for many businesses." },
    ],
    related: ["pos-system-kenya", "inventory-management-software-kenya"],
    seoTitle: "Business Management Software for Kenyan SMEs (Early Access)",
    seoDescription:
      "Mavqo Digital is building an all-in-one business management suite for Kenyan SMEs. Join the early-access list to be first to see it.",
    published: true,
  },
];

/** Statuses that may be presented to customers as "available". */
const AVAILABLE: ProductStatus[] = ["available_for_demo", "available_for_sale"];

export function isAvailable(p: Pick<Product, "status">) {
  return AVAILABLE.includes(p.status);
}

/** Demo can only be offered if the product is available AND flagged as demoable. */
export function canRequestDemo(p: Pick<Product, "status" | "demoAvailable">) {
  return isAvailable(p) && p.demoAvailable;
}

export function statusLabel(status: ProductStatus): string {
  switch (status) {
    case "available_for_sale":
      return "Available now";
    case "available_for_demo":
      return "Live demo available";
    case "in_development":
      return "Coming soon";
    case "planned":
      return "Planned";
    case "maintenance":
      return "Temporarily unavailable";
  }
}

/** Products shown publicly. `planned` products are never listed. */
export function getPublicProducts(list: Product[] = products) {
  return list.filter((p) => p.published && p.status !== "planned");
}

export function getProduct(slug: string) {
  return getPublicProducts().find((p) => p.slug === slug);
}

export function getDemoableProducts() {
  return getPublicProducts().filter(canRequestDemo);
}
