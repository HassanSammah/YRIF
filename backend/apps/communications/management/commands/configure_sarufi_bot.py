"""
Django management command to configure the YRIF Chat Sarufi bot.

Usage:
    python manage.py configure_sarufi_bot                     # push to Sarufi API
    python manage.py configure_sarufi_bot --dry-run           # preview only
    python manage.py configure_sarufi_bot --export-only       # write JSON files, skip API
    python manage.py configure_sarufi_bot --bot-id 6732       # override bot ID
"""
import json
import os
import requests
from django.core.management.base import BaseCommand
from django.conf import settings


# ── Bot Intents ────────────────────────────────────────────────────────────────
# Each intent has BOTH English and Swahili utterances so Sarufi matches either.

INTENTS = {
    # ── Greetings & Farewells ─────────────────────────────────────────────────
    "greeting": [
        "hello", "hi", "hey", "good morning", "good afternoon", "good evening",
        "start", "begin", "help me", "howdy", "what's up", "yo",
        "habari", "mambo", "salamu", "hujambo", "shikamoo", "marahaba",
        "niaje", "sasa", "karibu", "habari yako", "habari za leo",
        "habari za asubuhi", "habari za jioni", "nzuri", "poa",
    ],
    "goodbye": [
        "bye", "goodbye", "see you", "see you later", "take care",
        "thanks", "thank you", "that's all", "done", "ok bye", "exit",
        "kwaheri", "asante", "asante sana", "sawa", "tutaonana",
        "nimemaliza", "baadaye", "tutaonana baadaye", "nakushukuru",
    ],

    # ── About YRIF ────────────────────────────────────────────────────────────
    "about_yrif": [
        "what is YRIF", "about YRIF", "tell me about YRIF",
        "what does YRIF do", "what is Youth Research Innovation Foundation",
        "YRIF goals", "YRIF objectives", "explain YRIF", "YRIF platform",
        "what kind of organisation is YRIF", "what is this platform",
        "YRIF ni nini", "maelezo ya YRIF", "YRIF inafanya nini",
        "niambie kuhusu YRIF", "YRIF ni taasisi gani", "jukwaa hili ni nini",
        "malengo ya YRIF", "Youth Research Innovation Foundation ni nini",
    ],
    "vision_mission": [
        "what is YRIF's vision", "YRIF vision", "YRIF mission",
        "mission statement", "vision statement", "YRIF's purpose",
        "why does YRIF exist", "YRIF's goal", "what does YRIF stand for",
        "YRIF strategy", "YRIF direction", "YRIF ambition",
        "maono ya YRIF", "dhamira ya YRIF", "YRIF inalenga nini",
        "kusudi la YRIF", "azma ya YRIF", "dira ya YRIF",
        "YRIF inaelekea wapi", "lengo kuu la YRIF",
    ],
    "core_values": [
        "core values", "YRIF values", "YRIF principles", "what does YRIF believe in",
        "YRIF ethics", "YRIF standards", "organizational values",
        "YRIF integrity", "YRIF professionalism",
        "maadili ya YRIF", "misingi ya YRIF", "thamani za YRIF",
        "kanuni za YRIF", "YRIF inaamini nini", "msingi wa YRIF",
    ],
    "who_can_join": [
        "who can join", "who is eligible", "can I join YRIF",
        "eligibility", "membership requirements", "join YRIF",
        "is YRIF for me", "who is YRIF for", "YRIF members",
        "am I eligible", "how old do I need to be", "age requirement",
        "nani anaweza kujiunga", "naweza kujiunga", "sifa za kujiunga",
        "je ninaweza kujiunga", "uanachama", "YRIF ni kwa nani",
        "masharti ya kujiunga", "wanachama wa YRIF",
    ],

    # ── Registration & Account ────────────────────────────────────────────────
    "how_to_register": [
        "how do I register", "how to register", "sign up", "create account",
        "registration steps", "how to join", "open account", "new account",
        "registration process", "how to sign up for YRIF",
        "jinsi ya kusajili", "jinsi ya kujiunga", "jinsi ya kuunda akaunti",
        "hatua za usajili", "nijiandikishe vipi", "nisajili vipi",
        "usajili wa YRIF", "nianzishe akaunti",
    ],
    "account_help": [
        "account help", "login help", "sign in", "can't log in",
        "account issues", "login not working", "account problem",
        "I cannot login", "account access", "trouble signing in",
        "msaada wa akaunti", "shida ya kuingia", "siwezi kuingia",
        "kuingia kwenye akaunti", "tatizo la akaunti", "niingie vipi",
        "login haisaidii", "tatizo la login",
    ],
    "account_approval": [
        "account approval", "pending approval", "account status",
        "account not active", "when will I be approved",
        "how long does approval take", "why is my account pending",
        "approval process", "account pending", "waiting for approval",
        "akaunti inasubiri", "idhini ya akaunti", "lini nitaidhinishwa",
        "kwa nini akaunti yangu inasubiri", "hali ya akaunti yangu",
        "akaunti haijaidhinishwa", "mchakato wa idhini",
    ],
    "password_help": [
        "forgot password", "reset password", "change password",
        "password help", "can't remember password", "password reset",
        "account locked", "I forgot my password",
        "nimesahau nywila", "badilisha nywila", "weka upya nywila",
        "nywila yangu", "nakosea nywila", "siwezi kukumbuka nywila",
        "nywila haifanyi kazi", "msaada wa nywila",
    ],
    "profile_help": [
        "update profile", "edit profile", "profile settings",
        "change my details", "profile picture", "update bio",
        "complete profile", "profile information", "my details",
        "sasisha wasifu", "hariri wasifu", "wasifu wangu",
        "taarifa zangu", "badilisha taarifa", "picha ya wasifu",
        "kamilisha wasifu", "maboresho ya wasifu",
    ],
    "roles": [
        "user roles", "types of members", "what roles are there",
        "youth role", "researcher role", "mentor role",
        "research assistant", "industry partner", "change my role",
        "role assignment", "what role should I choose",
        "majukumu ya watumiaji", "aina za wanachama", "jukumu langu",
        "majukumu ya YRIF", "niwe mshauri", "niwe mtafiti",
        "mabadiliko ya jukumu", "chaguo la jukumu",
    ],

    # ── Research ──────────────────────────────────────────────────────────────
    "research_info": [
        "research", "submit research", "how to submit research",
        "research submission", "publish research", "research paper",
        "upload research", "research process", "research portal",
        "utafiti", "wasilisha utafiti", "jinsi ya kuwasilisha utafiti",
        "niwasilishe utafiti wangu vipi", "kuchapisha utafiti",
        "hati ya utafiti", "ombi la utafiti", "portali ya utafiti",
    ],
    "research_status": [
        "my research status", "check research", "research review",
        "when will my research be approved", "research feedback",
        "check my submission", "my submissions", "research pending",
        "utafiti wangu uko wapi", "hali ya utafiti wangu",
        "utafiti wangu unaangaliwa", "maoni ya utafiti", "utafiti wangu",
        "angalia mawasilisho yangu", "utafiti ulioidhinishwa",
    ],
    "research_categories": [
        "research categories", "types of research", "research topics",
        "what category", "which category should I use",
        "natural sciences", "social sciences", "arts", "technology",
        "aina za utafiti", "kategoria za utafiti", "mada za utafiti",
        "kategoria gani", "sayansi za asili", "sayansi za jamii",
        "sanaa", "teknolojia", "niwasilishe wapi",
    ],
    "journal_publication": [
        "YRIF journal", "research journal", "academic journal",
        "publish in YRIF journal", "open access journal",
        "YRIF publication", "get published", "journal submission",
        "jarida la YRIF", "jarida la kisayansi", "kuchapisha katika jarida",
        "jarida la huria", "machapisho ya YRIF", "uchapishaji wa utafiti",
        "niwe mwandishi", "kazi zangu zichapishwe",
    ],
    "grants_funding": [
        "grant", "funding", "scholarship", "research funding",
        "financial support", "research grant", "how to get funding",
        "YRIF grant", "apply for grant", "research budget",
        "ruzuku", "ufadhili", "msaada wa fedha", "udhamini",
        "ufadhili wa utafiti", "pata fedha za utafiti",
        "omba ruzuku", "msaada wa kifedha", "ningepata pesa vipi",
    ],

    # ── Events & Competitions ──────────────────────────────────────────────────
    "events_info": [
        "events", "upcoming events", "what events are available",
        "YRIF events", "seminars", "workshops", "webinars",
        "what's happening", "event schedule", "event calendar",
        "matukio", "matukio yanayokuja", "matukio ya YRIF",
        "seminari", "warsha", "webinari", "ratiba ya matukio",
        "tukio gani linakuja", "kuna nini kinachoendelea",
    ],
    "register_event": [
        "register for event", "how to register for event",
        "event registration", "sign up for event", "attend event",
        "how to attend", "register competition", "I want to attend",
        "jisajili kwa tukio", "jinsi ya kusajili tukio",
        "usajili wa tukio", "nataka kushiriki tukio",
        "nishiriki vipi", "sajili tukio",
    ],
    "my_events": [
        "my events", "events I registered", "my registrations",
        "events I signed up for", "my event status", "am I registered",
        "view my events", "events dashboard",
        "matukio yangu", "matukio niliyosajili", "usajili wangu",
        "nimesajili matukio gani", "hali ya usajili wangu",
    ],
    "competition": [
        "competition", "research competition", "innovation competition",
        "innovation bonanza", "how to participate in competition",
        "competition rules", "prizes", "competition results",
        "awards", "YRIF awards", "research awards",
        "shindano", "shindano la utafiti", "shindano la uvumbuzi",
        "bonanza ya uvumbuzi", "kushiriki shindano", "tuzo za YRIF",
        "tuzo za utafiti", "matokeo ya shindano",
    ],
    "certificates": [
        "certificate", "my certificate", "download certificate",
        "participation certificate", "winner certificate",
        "how to get certificate", "certifications", "digital certificate",
        "hati", "hati yangu", "pakua hati", "hati ya ushiriki",
        "hati ya ushindi", "jinsi ya kupata hati", "vyeti vya YRIF",
        "shahada", "vpakua cheti",
    ],

    # ── Mentorship ────────────────────────────────────────────────────────────
    "mentorship_info": [
        "mentorship", "mentor", "mentoring program", "how does mentorship work",
        "mentorship process", "get a mentor", "find a mentor",
        "YRIF mentorship", "mentorship benefits",
        "ushauri", "mshauri", "programu ya ushauri", "ushauri wa YRIF",
        "faida za ushauri", "jinsi ushauri unavyofanya kazi",
        "tafuta mshauri", "pata mshauri",
    ],
    "request_mentor": [
        "I need a mentor", "request a mentor", "how to request mentor",
        "apply for mentorship", "connect me with mentor",
        "need guidance", "mentor application",
        "nahitaji mshauri", "omba mshauri", "jinsi ya kuomba mshauri",
        "ombi la ushauri", "unganisha na mshauri", "ninahitaji mwongozo",
    ],
    "become_mentor": [
        "become a mentor", "mentor registration", "how to be mentor",
        "I want to mentor", "share my expertise", "mentor profile",
        "mentor application", "volunteer as mentor",
        "kuwa mshauri", "sajili kama mshauri", "jinsi ya kuwa mshauri",
        "nataka kuwa mshauri", "toa maarifa yangu", "wasifu wa mshauri",
    ],
    "my_mentorship": [
        "my mentor", "mentorship status", "active mentorship",
        "mentorship session", "mentorship feedback", "my mentee",
        "check mentorship", "view mentorship",
        "mshauri wangu", "hali ya ushauri", "ushauri wangu",
        "mwanafunzi wangu", "angalia ushauri", "kikao cha ushauri",
    ],

    # ── Programs ──────────────────────────────────────────────────────────────
    "high_school_program": [
        "high school", "secondary school", "high school program",
        "research club", "form 5", "form 6", "O level", "A level",
        "secondary student", "high school research",
        "shule ya sekondari", "shule ya upili", "klabu ya utafiti",
        "kidato cha tano", "kidato cha sita", "mwanafunzi wa sekondari",
        "programu ya sekondari", "utafiti shuleni",
    ],
    "university_program": [
        "university program", "campus program", "university seminar",
        "university outreach", "college program", "higher education",
        "university partnership", "campus events",
        "chuo kikuu", "semina ya chuo", "warsha ya chuo kikuu",
        "ufikiaji wa vyuo", "mpango wa chuo", "elimu ya juu",
        "ushirikiano wa chuo", "matukio ya chuo",
    ],

    # ── Partners & Support ────────────────────────────────────────────────────
    "partner_info": [
        "partner with YRIF", "become a partner", "industry partner",
        "organization partnership", "company collaboration",
        "sponsorship", "corporate partner", "YRIF partners",
        "kushirikiana na YRIF", "kuwa mshirika", "ushirikiano wa biashara",
        "mshirika wa sekta binafsi", "ushirikiano", "dhamana",
        "washirika wa YRIF", "mkakati wa ushirikiano",
    ],
    "donation": [
        "donate", "how to donate", "support YRIF", "contribute",
        "financial contribution", "make a donation", "donate to YRIF",
        "give to YRIF", "fund YRIF", "YRIF fundraising",
        "changia", "jinsi ya kuchangia", "saidia YRIF",
        "mchango wa fedha", "toa mchango", "changia YRIF",
        "ufadhili wa YRIF", "msaada wa kifedha",
    ],
    "vacancies": [
        "jobs at YRIF", "vacancies", "career opportunities",
        "work at YRIF", "internship", "volunteer", "open positions",
        "job application", "YRIF hiring", "staff positions",
        "kazi YRIF", "nafasi za kazi", "fursa za kazi",
        "fanya kazi YRIF", "mafunzo kazini", "kujitoa",
        "nafasi za wazi", "omba kazi", "YRIF inaajiri",
    ],

    # ── Resources ─────────────────────────────────────────────────────────────
    "resources_info": [
        "resources", "learning materials", "resource hub",
        "documents", "downloads", "study materials",
        "library", "learning content", "research templates",
        "rasilimali", "vifaa vya kujifunzia", "kituo cha rasilimali",
        "nyaraka", "upakuaji", "vifaa vya masomo",
        "maktaba", "maudhui ya kujifunzia", "violezo vya utafiti",
    ],

    # ── Contact & Technical Support ───────────────────────────────────────────
    "contact_support": [
        "contact YRIF", "support", "help", "email YRIF",
        "phone number", "reach YRIF", "office address",
        "get in touch", "YRIF contact details",
        "wasiliana na YRIF", "msaada", "mawasiliano", "barua pepe ya YRIF",
        "nambari ya simu", "ofisi ya YRIF", "anwani",
        "niwasiliane nao vipi", "mawasiliano ya YRIF",
    ],
    "report_issue": [
        "report a problem", "technical issue", "bug", "error",
        "not working", "system problem", "website problem",
        "something is broken", "report issue", "technical problem",
        "tatizo la kiufundi", "kuna tatizo", "ripoti tatizo",
        "haifanyi kazi", "tatizo la mfumo", "tatizo la tovuti",
        "kitu kimevunjika", "tatizo la kiufundi",
    ],
    "escalate": [
        "speak to a human", "talk to a human", "talk to human", "talk to admin",
        "real person", "human support", "connect me to staff", "I need real help",
        "speak to someone", "live agent", "official support", "talk to staff",
        "formal complaint", "escalate my issue", "human agent", "talk to someone",
        "I want a human", "speak with a person", "contact support",
        "niongee na mtu wa kweli", "niongee na mtu", "niongee na msimamizi",
        "mtu halisi", "msaada wa kweli", "nisiliano na wafanyakazi",
        "malalamiko rasmi", "peleka tatizo langu juu",
        "zungumza na mtu", "msaada wa binadamu", "nisiliano na timu",
    ],
}


# ── Bot Flows ──────────────────────────────────────────────────────────────────
# Each state has bilingual messages (🇹🇿 Swahili + 🇬🇧 English) and a next_state.

def _bi(sw: str, en: str) -> str:
    """Build a bilingual message: Swahili first, English below a separator."""
    return f"🇹🇿 {sw}\n\n---\n🇬🇧 {en}"


FLOWS = {
    # ── Greeting & Goodbye ────────────────────────────────────────────────────
    "greeting": {
        "message": [
            _bi(
                "Karibu kwenye YRIF Chat! 🌟 Mimi ni msaidizi wako wa kidijitali wa YRIF.\n\n"
                "Ninaweza kukusaidia kuhusu:\n"
                "📝 Utafiti & Mawasilisho\n"
                "📅 Matukio & Mashindano\n"
                "🤝 Ushauri wa Kitaalamu\n"
                "🏆 Vyeti & Tuzo\n"
                "🏢 Nafasi za Kazi\n"
                "💰 Michango & Ufadhili\n\n"
                "Ungehitaji msaada gani leo?",
                "Welcome to YRIF Chat! 🌟 I'm your digital assistant for the YRIF platform.\n\n"
                "I can help you with:\n"
                "📝 Research & Submissions\n"
                "📅 Events & Competitions\n"
                "🤝 Mentorship\n"
                "🏆 Certificates & Awards\n"
                "🏢 Vacancies & Opportunities\n"
                "💰 Donations & Funding\n\n"
                "What would you like help with today?",
            )
        ],
        "next_state": "end",
    },

    "goodbye": {
        "message": [
            _bi(
                "Kwaheri! Asante kwa kutumia YRIF Chat. 👋\n"
                "Nikuwepo ukihitaji msaada zaidi. Endelea na kazi nzuri! 🌟",
                "Goodbye! Thank you for using YRIF Chat. 👋\n"
                "I'm here whenever you need more help. Keep up the great work! 🌟",
            )
        ],
        "next_state": "end",
    },

    # ── About YRIF ────────────────────────────────────────────────────────────
    "about_yrif": {
        "message": [
            _bi(
                "YRIF (Youth Research & Innovation Foundation) ni taasisi ya kitaifa ya Tanzania. 🇹🇿\n\n"
                "🎯 YRIF inalenga kuwezesha vijana wa Tanzania kuchangia mabadiliko ya uchumi kupitia "
                "utafiti, uvumbuzi, na maarifa.\n\n"
                "👥 Tunakusanyisha:\n"
                "• Vijana na Watafiti wa Chuo\n"
                "• Washauri wa Kitaalamu\n"
                "• Washirika wa Sekta Binafsi\n"
                "• Wanafunzi wa Sekondari na Vyuo\n\n"
                "🏆 Tunafanya nini:\n"
                "• Kusaidia mawasilisho na uchapishaji wa utafiti\n"
                "• Kupanga mashindano ya uvumbuzi\n"
                "• Kuunganisha vijana na washauri\n"
                "• Kutoa mafunzo na rasilimali\n"
                "• Kujenga mtandao wa vijana Tanzania\n\n"
                "Tuna lengo la wanachama 3,000+ ifikapo mwisho wa mwaka wa kwanza!",
                "YRIF (Youth Research & Innovation Foundation) is a national non-profit platform in Tanzania. 🇹🇿\n\n"
                "🎯 YRIF empowers young Tanzanians to contribute to economic transformation through "
                "research, innovation, and knowledge generation.\n\n"
                "👥 We bring together:\n"
                "• Youth & University Researchers\n"
                "• Academic Mentors\n"
                "• Industry Partners\n"
                "• Secondary School & University Students\n\n"
                "🏆 What we do:\n"
                "• Support research submission and publication\n"
                "• Organise innovation competitions\n"
                "• Connect youth with mentors\n"
                "• Provide training and resources\n"
                "• Build a national youth research network\n\n"
                "We target 3,000+ active members by the end of our first year!",
            )
        ],
        "next_state": "who_can_join",
    },

    "vision_mission": {
        "message": [
            _bi(
                "🌍 Maono ya YRIF:\n"
                "\"Kuwa kituo cha ulimwengu cha Utafiti na Uvumbuzi.\"\n\n"
                "🎯 Dhamira ya YRIF:\n"
                "\"Kuchochea uwezo wa vijana kukabiliana na changamoto za kimataifa kupitia "
                "ufumbuzi unaotegemea utafiti.\"\n\n"
                "📐 Mwelekeo wa Kimkakati:\n"
                "• Inaunga mkono Dira ya Tanzania 2050\n"
                "• Inaendana na Ajenda ya Utafiti ya Taifa\n"
                "• Inashughulikia SDGs 4 (Elimu), 8 (Kazi), na 9 (Uvumbuzi)",
                "🌍 YRIF Vision:\n"
                "\"To become the world's centre of Research and Innovation.\"\n\n"
                "🎯 YRIF Mission:\n"
                "\"To engage the youth potential by addressing global challenges through "
                "research-based solutions.\"\n\n"
                "📐 Strategic Alignment:\n"
                "• Supports Tanzania Vision 2050\n"
                "• Aligned with the National Research Agenda\n"
                "• Addresses SDGs 4 (Education), 8 (Decent Work), and 9 (Innovation)",
            )
        ],
        "next_state": "about_yrif",
    },

    "core_values": {
        "message": [
            _bi(
                "💎 Maadili Msingi ya YRIF:\n\n"
                "🔷 Utaalamu – Kuzingatia viwango vya juu vya kitaalamu na kimaadili.\n"
                "🔷 Uadilifu – Kukuza uaminifu na uwajibikaji katika mwenendo wa utafiti.\n"
                "🔷 Kuzingatia – Kufuata maadili ya utafiti na uzingativu wa kisheria.\n"
                "🔷 Uvumbuzi – Kukubali teknolojia za kisasa na fikira za ubunifu.\n\n"
                "Maadili haya yanaweza kuonekana katika kila tunalofanya!",
                "💎 YRIF Core Values:\n\n"
                "🔷 Professionalism – Upholding high academic and ethical standards.\n"
                "🔷 Integrity – Promoting honesty and accountability in research conduct.\n"
                "🔷 Adherence – Observing research ethics and legal compliance.\n"
                "🔷 Innovation – Embracing modern technologies and creative thinking.\n\n"
                "These values are reflected in everything we do!",
            )
        ],
        "next_state": "about_yrif",
    },

    "who_can_join": {
        "message": [
            _bi(
                "YRIF inakaribishia kila mtu! 🎉\n\n"
                "👤 Aina za Wanachama:\n"
                "🧑‍🎓 Kijana/Mwanafunzi – Wanaotaka kujifunza na kushiriki utafiti\n"
                "🔬 Mtafiti – Wanaofanya utafiti wa kitaalamu au huru\n"
                "👨‍💼 Mshauri – Wataalamu wanaotaka kusaidia vijana\n"
                "🛠️ Msaidizi wa Utafiti – Wanaotaka kusaidia miradi ya utafiti\n"
                "🏢 Mshirika wa Sekta Binafsi – Makampuni na mashirika\n\n"
                "✅ Wanaotarajiwa: vijana, wanafunzi wa sekondari na vyuo, watafiti, "
                "wataalam, na washirika wa sekta.\n\n"
                "Jisajili bure na usubiri idhini ya akaunti (siku 1–2 za kazi)!",
                "YRIF welcomes everyone! 🎉\n\n"
                "👤 Membership Types:\n"
                "🧑‍🎓 Youth/Student – Those wanting to learn and participate in research\n"
                "🔬 Researcher – Conducting academic or independent research\n"
                "👨‍💼 Mentor – Experts wanting to guide young researchers\n"
                "🛠️ Research Assistant – Supporting research projects\n"
                "🏢 Industry Partner – Companies and organisations\n\n"
                "✅ Target members: youth, secondary school and university students, "
                "researchers, experts, and sector partners.\n\n"
                "Registration is free — approval takes 1–2 business days!",
            )
        ],
        "next_state": "how_to_register",
    },

    # ── Registration & Account ────────────────────────────────────────────────
    "how_to_register": {
        "message": [
            _bi(
                "📝 Hatua za Kusajili Akaunti ya YRIF:\n\n"
                "1️⃣ Bonyeza Register / Jisajili kwenye jukwaa\n"
                "2️⃣ Chagua njia ya kusajili:\n"
                "   • 🇹🇿 BRIQ Auth — nambari ya simu ya Tanzania\n"
                "   • 🌐 Google — Gmail yako\n"
                "3️⃣ Jaza taarifa zako (jina, barua pepe, jukumu)\n"
                "4️⃣ Thibitisha barua pepe yako\n"
                "5️⃣ Kamilisha wasifu wako\n"
                "6️⃣ Subiri idhini ya akaunti (siku 1–2 za kazi)\n\n"
                "✉️ Utapata arifa kwa barua pepe ukisha kuidhinishwa.",
                "📝 Steps to Create a YRIF Account:\n\n"
                "1️⃣ Click Register / Sign Up on the platform\n"
                "2️⃣ Choose your registration method:\n"
                "   • 🇹🇿 BRIQ Auth — Tanzanian phone number\n"
                "   • 🌐 Google — your Gmail account\n"
                "3️⃣ Fill in your details (name, email, role)\n"
                "4️⃣ Verify your email address\n"
                "5️⃣ Complete your profile\n"
                "6️⃣ Wait for account approval (1–2 business days)\n\n"
                "✉️ You will receive an email notification once approved.",
            )
        ],
        "next_state": "account_approval",
    },

    "account_help": {
        "message": [
            _bi(
                "👤 Msaada wa Akaunti:\n\n"
                "Tuna njia mbili za kuingia:\n"
                "🔐 BRIQ Auth — nambari ya simu ya Tanzania\n"
                "🌐 Google — Gmail yako\n\n"
                "Kama una tatizo la kuingia:\n"
                "• Angalia nenosiri lako — tumia Forgot Password kama umesahau\n"
                "• Hakikisha barua pepe yako imethibitishwa\n"
                "• Angalia hali ya akaunti yako (inasubiri idhini?)\n\n"
                "Bado una tatizo? Wasiliana: info@yriftz.org",
                "👤 Account Help:\n\n"
                "We support two sign-in methods:\n"
                "🔐 BRIQ Auth — Tanzanian phone number\n"
                "🌐 Google — your Gmail account\n\n"
                "If you're having trouble logging in:\n"
                "• Check your password — use Forgot Password if you've forgotten it\n"
                "• Make sure your email address has been verified\n"
                "• Check your account status (is it still pending approval?)\n\n"
                "Still stuck? Contact us: info@yriftz.org",
            )
        ],
        "next_state": "end",
    },

    "account_approval": {
        "message": [
            _bi(
                "⏳ Mchakato wa Idhini ya Akaunti:\n\n"
                "Kila akaunti mpya inakaguliwa na timu yetu kuhakikisha usalama wa jamii.\n\n"
                "⏱️ Muda wa kawaida: siku 1–2 za kazi\n\n"
                "📬 Utapata arifa kwa barua pepe:\n"
                "• ✅ Ukishaidhinishwa — ufikiaji kamili wa jukwaa\n"
                "• ❌ Kama imekataliwa — pamoja na maelezo\n\n"
                "Hali za akaunti:\n"
                "• ⏳ Inasubiri idhini — akaunti mpya\n"
                "• ✅ Amilifu — ufikiaji kamili\n"
                "• 🚫 Imesimamishwa — imezuiwa kwa muda\n\n"
                "Ukingoja zaidi ya siku 3: tuma barua pepe kwa info@yriftz.org",
                "⏳ Account Approval Process:\n\n"
                "Every new account is reviewed by our team to ensure community safety.\n\n"
                "⏱️ Typical wait time: 1–2 business days\n\n"
                "📬 You will receive an email notification:\n"
                "• ✅ When approved — giving you full platform access\n"
                "• ❌ If declined — with a reason provided\n\n"
                "Account statuses:\n"
                "• ⏳ Pending Approval — newly registered\n"
                "• ✅ Active — full access granted\n"
                "• 🚫 Suspended — temporarily blocked\n\n"
                "Waiting longer than 3 days? Email us at info@yriftz.org",
            )
        ],
        "next_state": "contact_support",
    },

    "password_help": {
        "message": [
            _bi(
                "🔐 Msaada wa Nenosiri:\n\n"
                "Umesahau Nenosiri?\n"
                "1. Nenda ukurasa wa kuingia (Login)\n"
                "2. Bonyeza Forgot Password\n"
                "3. Weka barua pepe yako\n"
                "4. Angalia barua pepe kwa kiungo cha kurekebisha\n\n"
                "Kubadilisha Nenosiri:\n"
                "1. Ingia → Profile → Security\n"
                "2. Weka nenosiri la sasa na jipya\n\n"
                "Bado una tatizo? info@yriftz.org",
                "🔐 Password Help:\n\n"
                "Forgot your password?\n"
                "1. Go to the Login page\n"
                "2. Click Forgot Password\n"
                "3. Enter your email address\n"
                "4. Check your email for the reset link\n\n"
                "Want to change your password?\n"
                "1. Log in → Profile → Security\n"
                "2. Enter your current password and the new one\n\n"
                "Still having trouble? Contact us at info@yriftz.org",
            )
        ],
        "next_state": "end",
    },

    "profile_help": {
        "message": [
            _bi(
                "👤 Kusasisha Wasifu Wako:\n\n"
                "Ingia na nenda Profile ili kusasisha:\n\n"
                "📝 Taarifa za Kibinafsi: jina, bio, picha, mkoa, taasisi\n"
                "📚 Kielimu: kiwango cha elimu, maslahi ya utafiti, ujuzi\n"
                "📱 Mawasiliano: nambari ya simu (uthibitisho wa OTP)\n\n"
                "Wasifu kamili unakusaidia:\n"
                "• Kupata ushauri unaofaa\n"
                "• Kushiriki matukio yanayofaa\n"
                "• Kuonekana na washirika na washauri",
                "👤 Updating Your Profile:\n\n"
                "Log in and go to Profile to update:\n\n"
                "📝 Personal Info: name, bio, photo, region, institution\n"
                "📚 Academic: education level, research interests, skills\n"
                "📱 Contact: phone number (OTP verification)\n\n"
                "A complete profile helps you:\n"
                "• Get matched with suitable mentors\n"
                "• Discover relevant events and opportunities\n"
                "• Be visible to partners and mentors",
            )
        ],
        "next_state": "end",
    },

    "roles": {
        "message": [
            _bi(
                "👥 Majukumu kwenye YRIF:\n\n"
                "🧑‍🎓 Kijana — mwanachama wa kawaida\n"
                "🔬 Mtafiti — wasilisha na simamia utafiti\n"
                "👨‍💼 Mshauri — toa ushauri kwa vijana\n"
                "🛠️ Msaidizi wa Utafiti — saidia miradi ya utafiti\n"
                "🏢 Mshirika wa Sekta Binafsi — washirika wa biashara na taasisi\n\n"
                "Kubadilisha jukumu: wasiliana nasi kwa info@yriftz.org",
                "👥 Roles on YRIF:\n\n"
                "🧑‍🎓 Youth — standard member\n"
                "🔬 Researcher — submit and manage research\n"
                "👨‍💼 Mentor — provide guidance to young researchers\n"
                "🛠️ Research Assistant — support research projects\n"
                "🏢 Industry Partner — business and institutional partners\n\n"
                "To change your role: contact us at info@yriftz.org",
            )
        ],
        "next_state": "end",
    },

    # ── Research ──────────────────────────────────────────────────────────────
    "research_info": {
        "message": [
            _bi(
                "📝 Jinsi ya Kuwasilisha Utafiti:\n\n"
                "1️⃣ Ingia kwenye akaunti yako\n"
                "2️⃣ Nenda Research → Submit Research\n"
                "3️⃣ Jaza: kichwa, muhtasari, maneno muhimu\n"
                "4️⃣ Chagua kategoria (Sayansi, Jamii, Sanaa, au Teknolojia)\n"
                "5️⃣ Pakia hati yako (PDF au Word)\n"
                "6️⃣ Bonyeza Submit\n\n"
                "⏳ Utafiti wako utakaguliwa na wataalamu. "
                "Utapata arifa baada ya ukaguzi.",
                "📝 How to Submit Research:\n\n"
                "1️⃣ Log in to your account\n"
                "2️⃣ Go to Research → Submit Research\n"
                "3️⃣ Fill in: title, abstract, keywords\n"
                "4️⃣ Select a category (Science, Social, Arts, or Technology)\n"
                "5️⃣ Upload your document (PDF or Word)\n"
                "6️⃣ Click Submit\n\n"
                "⏳ Your research will be reviewed by our expert panel. "
                "You'll receive a notification once reviewed.",
            )
        ],
        "next_state": "research_categories",
    },

    "research_categories": {
        "message": [
            _bi(
                "📚 Kategoria za Utafiti katika YRIF:\n\n"
                "🔬 Sayansi za Asili — Biolojia, Kemia, Fizikia, Mazingira\n"
                "👥 Sayansi za Jamii — Uchumi, Saikolojia, Siasa, Elimu\n"
                "🎨 Sanaa — Sanaa za Ubunifu, Utamaduni, Lugha\n"
                "💻 Teknolojia — TEHAMA, Uhandisi, Uvumbuzi wa Kidijitali\n\n"
                "Chagua kategoria inayofaa utafiti wako zaidi!",
                "📚 Research Categories at YRIF:\n\n"
                "🔬 Natural Sciences — Biology, Chemistry, Physics, Environment\n"
                "👥 Social Sciences — Economics, Psychology, Political Science, Education\n"
                "🎨 Arts — Creative Arts, Culture, Languages\n"
                "💻 Technology — ICT, Engineering, Digital Innovation\n\n"
                "Choose the category that best fits your research!",
            )
        ],
        "next_state": "research_info",
    },

    "research_status": {
        "message": [
            _bi(
                "🔍 Kufuatilia Utafiti Wako:\n\n"
                "Ingia na nenda Research → My Submissions\n\n"
                "📊 Hali za Utafiti:\n"
                "✏️ Rasimu — bado hujatuma\n"
                "📤 Imetumwa — inasubiri ukaguzi\n"
                "🔍 Inakaguliwa — wataalamu wanakagua\n"
                "✅ Imeidhinishwa — imepitishwa\n"
                "❌ Imekataliwa — tazama maoni ya wataalamu\n"
                "🌐 Imechapishwa — inaonekana kwa umma\n\n"
                "Kama una maswali mahususi: info@yriftz.org",
                "🔍 Tracking Your Research:\n\n"
                "Log in and go to Research → My Submissions\n\n"
                "📊 Research Statuses:\n"
                "✏️ Draft — not yet submitted\n"
                "📤 Submitted — awaiting review\n"
                "🔍 Under Review — being assessed by experts\n"
                "✅ Approved — accepted\n"
                "❌ Rejected — see reviewer feedback\n"
                "🌐 Published — visible to the public\n\n"
                "For specific questions: info@yriftz.org",
            )
        ],
        "next_state": "end",
    },

    "journal_publication": {
        "message": [
            _bi(
                "📖 Jarida la YRIF:\n\n"
                "YRIF inakuza jarida la huria la kisayansi kwa vijana!\n\n"
                "✅ Faida:\n"
                "• Chapisha utafiti wako hadharani\n"
                "• Ufikiaji wa bure (open access) kwa wasomaji wote\n"
                "• Utambuzi wa kitaifa na kimataifa\n"
                "• Kuimarisha wasifu wako wa kitaalamu\n\n"
                "📝 Jinsi ya Kuchapisha:\n"
                "1. Wasilisha utafiti kupitia Research Portal\n"
                "2. Utafiti hupita ukaguzi wa wataalamu\n"
                "3. Ukipita, unachapishwa kwenye jarida\n\n"
                "Maswali: info@yriftz.org",
                "📖 YRIF Journal:\n\n"
                "YRIF publishes an open-access research journal for youth!\n\n"
                "✅ Benefits:\n"
                "• Publish your research publicly\n"
                "• Free access (open access) for all readers\n"
                "• National and international recognition\n"
                "• Strengthen your academic profile\n\n"
                "📝 How to Get Published:\n"
                "1. Submit your research via the Research Portal\n"
                "2. Your work goes through expert peer review\n"
                "3. If approved, it is published in the journal\n\n"
                "Questions? info@yriftz.org",
            )
        ],
        "next_state": "research_info",
    },

    "grants_funding": {
        "message": [
            _bi(
                "💰 Ufadhili na Ruzuku:\n\n"
                "YRIF inasaidia vijana kupata msaada wa kifedha kwa utafiti!\n\n"
                "🎯 Fursa Zinazopatikana:\n"
                "• Ruzuku za utafiti kutoka kwa washirika\n"
                "• Udhamini wa kushiriki mashindano\n"
                "• Msaada wa kuchapisha utafiti\n"
                "• Mafunzo ya kuandika maombi ya ruzuku\n\n"
                "📋 Jinsi ya Kupata Habari:\n"
                "1. Kaa mwanachama amilifu wa YRIF\n"
                "2. Angalia matangazo kwenye jukwaa\n"
                "3. Jiandikishe kwa matukio yanayohusika\n\n"
                "Maswali ya ufadhili: info@yriftz.org",
                "💰 Grants & Funding:\n\n"
                "YRIF helps youth access financial support for research!\n\n"
                "🎯 Available Opportunities:\n"
                "• Research grants from YRIF partners\n"
                "• Sponsorships to join competitions\n"
                "• Support for research publication\n"
                "• Training on grant writing\n\n"
                "📋 How to Stay Informed:\n"
                "1. Remain an active YRIF member\n"
                "2. Monitor announcements on the platform\n"
                "3. Register for relevant events\n\n"
                "Funding enquiries: info@yriftz.org",
            )
        ],
        "next_state": "contact_support",
    },

    # ── Events & Competitions ──────────────────────────────────────────────────
    "events_info": {
        "message": [
            _bi(
                "📅 Matukio ya YRIF:\n\n"
                "🎓 Seminari — mazungumzo ya kitaalamu\n"
                "🛠️ Warsha — mafunzo ya vitendo\n"
                "🏆 Mashindano — shindana na ushinde tuzo\n"
                "🎪 Bonanza ya Uvumbuzi — onyesha mradi wako\n"
                "💻 Webinari — matukio ya mtandaoni\n"
                "🏫 Matukio ya Vyuo na Sekondari\n\n"
                "Tembelea ukurasa wa Events kwenye jukwaa kuona matukio yanayokuja!",
                "📅 YRIF Events:\n\n"
                "🎓 Seminars — academic talks and discussions\n"
                "🛠️ Workshops — hands-on training sessions\n"
                "🏆 Competitions — compete and win prizes\n"
                "🎪 Innovation Bonanza — showcase your project\n"
                "💻 Webinars — online events\n"
                "🏫 University & School Outreach Events\n\n"
                "Visit the Events page on the platform to see upcoming events!",
            )
        ],
        "next_state": "register_event",
    },

    "register_event": {
        "message": [
            _bi(
                "✅ Jinsi ya Kusajili Tukio:\n\n"
                "1️⃣ Ingia kwenye akaunti yako\n"
                "2️⃣ Nenda ukurasa wa Events\n"
                "3️⃣ Bonyeza tukio unalotaka\n"
                "4️⃣ Angalia tarehe, mahali, na mahitaji\n"
                "5️⃣ Bonyeza Register Now\n"
                "6️⃣ Utapata uthibitisho kwa barua pepe\n\n"
                "📌 Baadhi ya matukio yanahitaji mawasilisho ya utafiti kwa mashindano. "
                "Hakikisha kusajili kabla ya tarehe ya mwisho!",
                "✅ How to Register for an Event:\n\n"
                "1️⃣ Log in to your account\n"
                "2️⃣ Go to the Events page\n"
                "3️⃣ Click on the event you want to attend\n"
                "4️⃣ Check the date, location, and requirements\n"
                "5️⃣ Click Register Now\n"
                "6️⃣ You'll receive a confirmation email\n\n"
                "📌 Some events require a research submission for competitions. "
                "Be sure to register before the deadline!",
            )
        ],
        "next_state": "competition",
    },

    "my_events": {
        "message": [
            _bi(
                "📋 Matukio Yako:\n\n"
                "Ingia na nenda Events → My Registrations kuona:\n\n"
                "• Matukio uliyosajili\n"
                "• Hali ya usajili wako\n"
                "• Matukio yanayokuja\n"
                "• Matokeo ya mashindano\n"
                "• Vyeti vyako vya ushiriki\n\n"
                "Kama hujasajili tukio lolote bado, tembelea ukurasa wa Events!",
                "📋 Your Events:\n\n"
                "Log in and go to Events → My Registrations to view:\n\n"
                "• Events you've registered for\n"
                "• Your registration status\n"
                "• Upcoming events\n"
                "• Competition results\n"
                "• Your participation certificates\n\n"
                "Haven't registered for any events yet? Visit the Events page!",
            )
        ],
        "next_state": "end",
    },

    "competition": {
        "message": [
            _bi(
                "🏆 Mashindano ya YRIF:\n\n"
                "Mashindano yetu yanalenga kuleta uvumbuzi wa vijana kwa hadhi ya juu!\n\n"
                "📂 Makategoria ya Tuzo:\n"
                "🔬 Sayansi za Asili\n"
                "👥 Sayansi za Jamii\n"
                "🎨 Sanaa\n\n"
                "📝 Kushiriki:\n"
                "1. Wasilisha utafiti au mradi wako\n"
                "2. Sajili kwa tukio la mashindano\n"
                "3. Wataalamu watakadiria kazi zako\n\n"
                "🎖️ Tuzo:\n"
                "• Vyeti vya ushindi\n"
                "• Zawadi za pesa\n"
                "• Nafasi za mafunzo\n"
                "• Uchapishaji kwenye Jarida la YRIF",
                "🏆 YRIF Competitions:\n\n"
                "Our competitions are designed to elevate youth innovation!\n\n"
                "📂 Award Categories:\n"
                "🔬 Natural Sciences\n"
                "👥 Social Sciences\n"
                "🎨 Arts\n\n"
                "📝 How to Participate:\n"
                "1. Submit your research or project\n"
                "2. Register for the competition event\n"
                "3. Expert judges will evaluate your work\n\n"
                "🎖️ Prizes:\n"
                "• Winner certificates\n"
                "• Cash prizes\n"
                "• Training opportunities\n"
                "• Publication in the YRIF Journal",
            )
        ],
        "next_state": "certificates",
    },

    "certificates": {
        "message": [
            _bi(
                "🏆 Vyeti vya YRIF:\n\n"
                "Unaweza kupata vyeti vya:\n"
                "🥇 Ushindi — ukishinda mashindano\n"
                "📜 Ushiriki — ukishiriki matukio\n\n"
                "Kupakua Hati Yako:\n"
                "1. Ingia kwenye akaunti yako\n"
                "2. Nenda Events → My Registrations\n"
                "3. Bonyeza tukio husika\n"
                "4. Bonyeza Download Certificate\n\n"
                "Vyeti vinapatikana baada ya tukio kukamilika. "
                "Kama hati yako haipo: info@yriftz.org",
                "🏆 YRIF Certificates:\n\n"
                "You can earn certificates for:\n"
                "🥇 Winning — when you win a competition\n"
                "📜 Participation — when you attend events\n\n"
                "How to Download Your Certificate:\n"
                "1. Log in to your account\n"
                "2. Go to Events → My Registrations\n"
                "3. Click on the relevant event\n"
                "4. Click Download Certificate\n\n"
                "Certificates are available after the event concludes. "
                "If yours is missing: info@yriftz.org",
            )
        ],
        "next_state": "end",
    },

    # ── Mentorship ────────────────────────────────────────────────────────────
    "mentorship_info": {
        "message": [
            _bi(
                "🤝 Programu ya Ushauri wa YRIF:\n\n"
                "Tunaunganisha vijana wenye talanta na wataalamu wenye uzoefu!\n\n"
                "Mchakato:\n"
                "1. 📋 Jaza ombi la ushauri\n"
                "2. 🔍 Timu yetu inakupanga na mshauri anayefaa\n"
                "3. 🤝 Mazungumzo na mshauri wako yanaanza\n"
                "4. 📈 Fuatilia maendeleo yako\n\n"
                "👨‍💼 Washauri wetu wana uzoefu katika:\n"
                "• Sayansi na Teknolojia\n"
                "• Biashara na Ujasiriamali\n"
                "• Sanaa na Ubunifu\n"
                "• Sera na Uongozi",
                "🤝 YRIF Mentorship Programme:\n\n"
                "We connect talented youth with experienced professionals!\n\n"
                "The Process:\n"
                "1. 📋 Submit a mentorship request\n"
                "2. 🔍 Our team matches you with a suitable mentor\n"
                "3. 🤝 Your mentorship sessions begin\n"
                "4. 📈 Track your progress\n\n"
                "👨‍💼 Our mentors have expertise in:\n"
                "• Science and Technology\n"
                "• Business and Entrepreneurship\n"
                "• Arts and Creativity\n"
                "• Policy and Leadership",
            )
        ],
        "next_state": "request_mentor",
    },

    "request_mentor": {
        "message": [
            _bi(
                "📝 Jinsi ya Kuomba Mshauri:\n\n"
                "1️⃣ Ingia kwenye akaunti yako\n"
                "2️⃣ Nenda ukurasa wa Mentorship\n"
                "3️⃣ Bonyeza Request Mentor\n"
                "4️⃣ Jaza:\n"
                "   • Mada unayohitaji ushauri\n"
                "   • Ujumbe kwa mshauri\n"
                "   • Mshauri unayependekeza (si lazima)\n"
                "5️⃣ Tuma ombi\n\n"
                "⏳ Timu yetu itakupanga na mshauri ndani ya siku 3–5 za kazi. "
                "Utapata arifa ukishapangwa!",
                "📝 How to Request a Mentor:\n\n"
                "1️⃣ Log in to your account\n"
                "2️⃣ Go to the Mentorship page\n"
                "3️⃣ Click Request Mentor\n"
                "4️⃣ Fill in:\n"
                "   • The topic you need guidance on\n"
                "   • A message to your prospective mentor\n"
                "   • Preferred mentor (optional)\n"
                "5️⃣ Submit your request\n\n"
                "⏳ Our team will match you with a mentor within 3–5 business days. "
                "You'll be notified when matched!",
            )
        ],
        "next_state": "end",
    },

    "become_mentor": {
        "message": [
            _bi(
                "🌟 Kuwa Mshauri wa YRIF:\n\n"
                "Kama una uzoefu na unataka kusaidia vijana, tunakukaribishia!\n\n"
                "📋 Mahitaji:\n"
                "• Uzoefu wa kitaalamu au kitaaluma\n"
                "• Nia ya kweli ya kusaidia vijana\n"
                "• Muda wa dakika 30–60 kwa wiki\n\n"
                "Jinsi ya Kusajili:\n"
                "1. Ingia → Profile → Mentor Profile\n"
                "2. Jaza maelezo ya utaalamu wako\n"
                "3. Weka upatikanaji wako\n"
                "4. Timu yetu itakukagua\n\n"
                "Asante kwa kutaka kusaidia vijana wa Tanzania! 🇹🇿",
                "🌟 Become a YRIF Mentor:\n\n"
                "If you have expertise and want to give back, we welcome you!\n\n"
                "📋 Requirements:\n"
                "• Professional or academic expertise\n"
                "• A genuine desire to support youth\n"
                "• 30–60 minutes available per week\n\n"
                "How to Register as a Mentor:\n"
                "1. Log in → Profile → Mentor Profile\n"
                "2. Fill in your expertise details\n"
                "3. Set your availability\n"
                "4. Our team will review your application\n\n"
                "Thank you for wanting to support Tanzania's youth! 🇹🇿",
            )
        ],
        "next_state": "end",
    },

    "my_mentorship": {
        "message": [
            _bi(
                "👥 Ushauri Wako:\n\n"
                "Ingia na nenda Mentorship → My Mentorship kuona:\n\n"
                "• Hali ya ombi lako\n"
                "• Maelezo ya mshauri wako\n"
                "• Mazungumzo ya ushauri\n"
                "• Historia ya vikao\n"
                "• Toa maoni kuhusu ushauri\n\n"
                "Tatizo na ushauri wako? info@yriftz.org",
                "👥 Your Mentorship:\n\n"
                "Log in and go to Mentorship → My Mentorship to view:\n\n"
                "• Your request status\n"
                "• Your mentor's profile\n"
                "• Mentorship conversations\n"
                "• Session history\n"
                "• Leave feedback about your mentorship\n\n"
                "Issue with your mentorship? info@yriftz.org",
            )
        ],
        "next_state": "end",
    },

    # ── Programs ──────────────────────────────────────────────────────────────
    "high_school_program": {
        "message": [
            _bi(
                "🏫 Programu ya Sekondari — YRIF Research Clubs:\n\n"
                "YRIF inaanzisha klabu za utafiti katika shule za sekondari Tanzania!\n\n"
                "🎯 Malengo:\n"
                "• Kuanzisha utamaduni wa utafiti tangu shuleni\n"
                "• Kuwafunza wanafunzi wa Kidato cha 5–6 mbinu za utafiti\n"
                "• Kupanga mashindano ya kiwango cha shule\n\n"
                "📊 Lengo: Shule 30+ ifikapo mwisho wa mwaka wa kwanza!\n\n"
                "Shule yako inataka kujiunga? "
                "Wasiliana nasi: info@yriftz.org",
                "🏫 Secondary School Programme — YRIF Research Clubs:\n\n"
                "YRIF is establishing research clubs in secondary schools across Tanzania!\n\n"
                "🎯 Objectives:\n"
                "• Introduce a research culture from secondary level\n"
                "• Train Form 5–6 students in research methods\n"
                "• Organise school-level competitions\n\n"
                "📊 Target: 30+ schools by the end of Year 1!\n\n"
                "Want your school to join? "
                "Contact us: info@yriftz.org",
            )
        ],
        "next_state": "who_can_join",
    },

    "university_program": {
        "message": [
            _bi(
                "🎓 Programu ya Vyuo Vikuu — Seminari za YRIF:\n\n"
                "YRIF inafanya kazi na vyuo vikuu kote Tanzania!\n\n"
                "🎯 Tunachofanya:\n"
                "• Seminari za uhamasishaji wa utafiti\n"
                "• Warsha za uandishi wa kisayansi\n"
                "• Maonyesho ya mradi na mashindano\n"
                "• Kuunganisha wanafunzi na washauri\n\n"
                "📊 Lengo: Vyuo 20+ ifikapo mwisho wa mwaka wa kwanza!\n\n"
                "Chuo chako kinataka kushirikiana? "
                "Wasiliana: info@yriftz.org",
                "🎓 University Programme — YRIF Seminars:\n\n"
                "YRIF partners with universities across Tanzania!\n\n"
                "🎯 What We Do:\n"
                "• Research awareness seminars\n"
                "• Scientific writing workshops\n"
                "• Project showcases and competitions\n"
                "• Connecting students with mentors\n\n"
                "📊 Target: 20+ universities by the end of Year 1!\n\n"
                "Your university wants to partner? "
                "Contact us: info@yriftz.org",
            )
        ],
        "next_state": "who_can_join",
    },

    # ── Partners, Donations & Vacancies ───────────────────────────────────────
    "partner_info": {
        "message": [
            _bi(
                "🏢 Ushirikiano na YRIF:\n\n"
                "Tunafurahi kushirikiana na makampuni, taasisi, na mashirika!\n\n"
                "🎯 Faida za Ushirikiano:\n"
                "• Fikia talanta za vijana wa Tanzania\n"
                "• Pata utafiti wa kisasa unaofaa sekta yako\n"
                "• Jenga jina na dhamana ya kampuni yako\n"
                "• Changia maendeleo ya Tanzania\n\n"
                "🤝 Aina za Ushirikiano:\n"
                "• Sekta ya Viwanda na Biashara\n"
                "• Shirika za Jamii\n"
                "• Taasisi za Elimu na Utafiti\n\n"
                "Wasiliana: info@yriftz.org",
                "🏢 Partner with YRIF:\n\n"
                "We welcome partnerships with companies, institutions, and organisations!\n\n"
                "🎯 Partnership Benefits:\n"
                "• Access Tanzania's emerging youth talent\n"
                "• Gain cutting-edge research relevant to your sector\n"
                "• Build your organisation's brand and reputation\n"
                "• Contribute to Tanzania's development\n\n"
                "🤝 Partnership Types:\n"
                "• Industry and Business Sector\n"
                "• Community Organisations\n"
                "• Educational and Research Institutions\n\n"
                "Contact us: info@yriftz.org",
            )
        ],
        "next_state": "contact_support",
    },

    "donation": {
        "message": [
            _bi(
                "💰 Saidia YRIF — Toa Mchango:\n\n"
                "Michango yako inasaidia moja kwa moja kuwezesha vijana wa Tanzania!\n\n"
                "🎯 Mchango Wako Unafanya Nini:\n"
                "• Kusaidia vifaa vya kujifunzia kwa wanafunzi\n"
                "• Kufadhili warsha za utafiti\n"
                "• Kusaidia zawadi za mashindano\n"
                "• Kuunga mkono vikao vya ushauri\n\n"
                "💳 Jinsi ya Kuchangia:\n"
                "1. Tembelea yriftz.org/donate\n"
                "2. Chagua kiasi au weka kiasi chako\n"
                "3. Chagua mchango wa mara moja au wa kila mwezi\n"
                "4. Jaza taarifa zako\n"
                "5. Timu yetu itawasiliana nawe kuhusu malipo\n\n"
                "Asante kwa msaada wako! 🙏",
                "💰 Support YRIF — Make a Donation:\n\n"
                "Your donations directly empower young Tanzanian researchers!\n\n"
                "🎯 What Your Donation Does:\n"
                "• Provides study materials for students\n"
                "• Funds youth research workshops\n"
                "• Sponsors competition prizes\n"
                "• Supports mentorship cohorts\n\n"
                "💳 How to Donate:\n"
                "1. Visit yriftz.org/donate\n"
                "2. Select a preset amount or enter your own\n"
                "3. Choose one-time or monthly recurring donation\n"
                "4. Fill in your details\n"
                "5. Our team will contact you with payment instructions\n\n"
                "Thank you for your support! 🙏",
            )
        ],
        "next_state": "contact_support",
    },

    "vacancies": {
        "message": [
            _bi(
                "🏢 Nafasi za Kazi na Fursa za YRIF:\n\n"
                "YRIF inatoa nafasi za kazi, mafunzo kazini, na kujitoa kwa wataalamu!\n\n"
                "🎯 Aina za Fursa:\n"
                "• Nafasi za wakati wote (Full-time)\n"
                "• Nafasi za sehemu (Part-time)\n"
                "• Mkataba (Contract)\n"
                "• Mafunzo kazini (Internship)\n\n"
                "📋 Jinsi ya Kuomba:\n"
                "1. Tembelea yriftz.org/vacancies\n"
                "2. Tazama nafasi zilizo wazi\n"
                "3. Tuma ombi kwa barua pepe: info@yriftz.org\n\n"
                "Wasiliana nasi kwa habari zaidi!",
                "🏢 Vacancies & Opportunities at YRIF:\n\n"
                "YRIF offers jobs, internships, and volunteering opportunities!\n\n"
                "🎯 Types of Opportunities:\n"
                "• Full-time positions\n"
                "• Part-time roles\n"
                "• Contract work\n"
                "• Internships\n\n"
                "📋 How to Apply:\n"
                "1. Visit yriftz.org/vacancies\n"
                "2. Browse open positions\n"
                "3. Apply by emailing: info@yriftz.org\n\n"
                "Contact us for more information!",
            )
        ],
        "next_state": "contact_support",
    },

    # ── Resources ─────────────────────────────────────────────────────────────
    "resources_info": {
        "message": [
            _bi(
                "📚 Kituo cha Rasilimali cha YRIF:\n\n"
                "Pata nyenzo za kujifunzia na rasilimali muhimu!\n\n"
                "📄 Makala na Vitabu\n"
                "🎥 Video za Mafunzo\n"
                "📊 Ripoti na Machapisho ya Utafiti\n"
                "📋 Miongozo na Violezo vya Utafiti\n\n"
                "Jinsi ya Kupata:\n"
                "1. Ingia kwenye akaunti yako\n"
                "2. Nenda ukurasa wa Resources\n"
                "3. Tafuta au vinjari kwa kategoria\n"
                "4. Bonyeza Download\n\n"
                "Rasilimali zetu zinaendelea kuongezwa!",
                "📚 YRIF Resource Hub:\n\n"
                "Access learning materials and key resources!\n\n"
                "📄 Articles and Books\n"
                "🎥 Training Videos\n"
                "📊 Research Reports and Publications\n"
                "📋 Research Guides and Templates\n\n"
                "How to Access:\n"
                "1. Log in to your account\n"
                "2. Go to the Resources page\n"
                "3. Search or browse by category\n"
                "4. Click Download\n\n"
                "We continuously add new resources!",
            )
        ],
        "next_state": "end",
    },

    # ── Contact & Support ─────────────────────────────────────────────────────
    "contact_support": {
        "message": [
            _bi(
                "📞 Mawasiliano ya YRIF:\n\n"
                "📧 Barua Pepe: info@yriftz.org\n"
                "🌐 Tovuti: yriftz.org\n"
                "📱 Jukwaa: unalitumia sasa hivi!\n\n"
                "📋 Kwa Msaada wa Haraka:\n"
                "• Tumia fomu ya Contact kwenye jukwaa\n"
                "• Au niambie hapa — nitajaribu kukusaidia!\n\n"
                "⏰ Masaa ya Kazi: Jumatatu–Ijumaa, 8:00–17:00 EAT",
                "📞 YRIF Contact Details:\n\n"
                "📧 Email: info@yriftz.org\n"
                "🌐 Website: yriftz.org\n"
                "📱 Platform: the one you're using right now!\n\n"
                "📋 For Quick Support:\n"
                "• Use the Contact form on the platform\n"
                "• Or tell me here — I'll do my best to help!\n\n"
                "⏰ Working Hours: Monday–Friday, 8:00 AM–5:00 PM EAT",
            )
        ],
        "next_state": "end",
    },

    "report_issue": {
        "message": [
            _bi(
                "🐛 Kuripoti Tatizo la Kiufundi:\n\n"
                "Asante kwa kutuarifu! Hii inasaidia kuboresha jukwaa letu.\n\n"
                "Jinsi ya Kuripoti:\n"
                "1. Nenda ukurasa wa Contact\n"
                "2. Chagua mada: Technical Issue\n"
                "3. Eleza tatizo kwa undani\n"
                "4. Ambatisha picha ya skrini kama inasaidia\n\n"
                "Au tuma barua pepe moja kwa moja:\n"
                "📧 info@yriftz.org\n"
                "Mada: [Technical Issue] — maelezo mafupi\n\n"
                "Timu yetu ya kiufundi itashughulikia haraka!",
                "🐛 Reporting a Technical Issue:\n\n"
                "Thank you for letting us know! This helps us improve the platform.\n\n"
                "How to Report:\n"
                "1. Go to the Contact page\n"
                "2. Select topic: Technical Issue\n"
                "3. Describe the issue in detail\n"
                "4. Attach a screenshot if it helps\n\n"
                "Or email us directly:\n"
                "📧 info@yriftz.org\n"
                "Subject: [Technical Issue] — brief description\n\n"
                "Our technical team will respond promptly!",
            )
        ],
        "next_state": "escalate",
    },

    "escalate": {
        "message": [
            _bi(
                "👨‍💼 Msaada wa Mtu wa Kweli:\n\n"
                "Nakuelewa! Nitatuma ombi lako kwa timu yetu mara moja.\n\n"
                "✅ Ujumbe wako umetumwa kwa timu yetu\n"
                "📧 Utapigiwa barua pepe ndani ya masaa 24 za kazi\n\n"
                "Au wasiliana moja kwa moja:\n"
                "📧 info@yriftz.org\n\n"
                "Asante kwa uvumilivu wako! 🙏",
                "👨‍💼 Human Support:\n\n"
                "Understood! I'll escalate your request to our team right away.\n\n"
                "✅ Your message has been flagged for our team\n"
                "📧 You'll receive an email response within 24 business hours\n\n"
                "Or contact us directly:\n"
                "📧 info@yriftz.org\n\n"
                "Thank you for your patience! 🙏",
            )
        ],
        "next_state": "end",
    },

    # ── End state ─────────────────────────────────────────────────────────────
    "end": {
        "message": [
            _bi(
                "Je, kuna kitu kingine ninachoweza kukusaidia? 😊\n"
                "Andika swali lako au chagua mada yoyote hapo juu.",
                "Is there anything else I can help you with? 😊\n"
                "Type your question or choose any topic above.",
            )
        ],
        "next_state": "end",
    },
}


# ── Bot Metadata ───────────────────────────────────────────────────────────────

BOT_METADATA = {
    "name": "YRIF Chat",
    "description": (
        "Msaidizi wa kidijitali wa YRIF — Youth Research & Innovation Foundation Tanzania. "
        "Husaidia kuhusu utafiti, matukio, ushauri, vyeti, ufadhili, nafasi za kazi, na mawasiliano. "
        "Digital assistant for YRIF — research, events, mentorship, certificates, funding, vacancies, and support. "
        "Bilingual: Swahili & English."
    ),
    "industry": "education",
    "visible_on_community": False,
    "webhook_trigger_intents": ["escalate"],
}


# ── Management Command ─────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Configure the YRIF Chat Sarufi bot with bilingual intents, flows, and webhook."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print configuration summary without making API calls or writing files.",
        )
        parser.add_argument(
            "--export-only",
            action="store_true",
            help="Write intents.json and flows.json to backend/apps/communications/sarufi/ and exit.",
        )
        parser.add_argument(
            "--bot-id",
            type=int,
            default=None,
            help="Sarufi bot ID to update. Reads SARUFI_BOT_ID from settings if omitted.",
        )

    def handle(self, *args, **options):
        api_key = getattr(settings, "SARUFI_API_KEY", "")
        bot_id = options["bot_id"] or (
            int(settings.SARUFI_BOT_ID) if getattr(settings, "SARUFI_BOT_ID", "") else None
        )
        dry_run = options["dry_run"]
        export_only = options["export_only"]

        total_utterances = sum(len(v) for v in INTENTS.values())
        self.stdout.write(
            f"Intents  : {len(INTENTS)} intents, {total_utterances} total utterances\n"
            f"Flows    : {len(FLOWS)} states\n"
            f"Webhook  : {BOT_METADATA['webhook_trigger_intents']}\n"
            f"Bot ID   : {bot_id or '(not set)'}"
        )

        if dry_run:
            self.stdout.write(self.style.WARNING("\n[DRY RUN] No files written, no API calls made."))
            self.stdout.write("\n--- INTENTS SAMPLE (first 3) ---")
            sample = dict(list(INTENTS.items())[:3])
            self.stdout.write(json.dumps(sample, indent=2, ensure_ascii=False))
            return

        # ── Always export JSON files ──────────────────────────────────────────
        export_dir = os.path.normpath(os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "..", "..", "sarufi",
        ))
        os.makedirs(export_dir, exist_ok=True)

        intents_path = os.path.join(export_dir, "intents.json")
        flows_path = os.path.join(export_dir, "flows.json")

        with open(intents_path, "w", encoding="utf-8") as f:
            json.dump(INTENTS, f, ensure_ascii=False, indent=2)
        with open(flows_path, "w", encoding="utf-8") as f:
            json.dump(FLOWS, f, ensure_ascii=False, indent=2)

        self.stdout.write(self.style.SUCCESS(f"\n✅ JSON files written to:\n  {intents_path}\n  {flows_path}"))
        self.stdout.write(
            "   → You can paste these into the Sarufi dashboard (bot editor) if the API push fails."
        )

        if export_only:
            self.stdout.write(self.style.WARNING("\n[EXPORT ONLY] Skipping API push."))
            return

        if not api_key:
            self.stderr.write(self.style.ERROR("\nSARUFI_API_KEY is not set — skipping API push."))
            return
        if not bot_id:
            self.stderr.write(self.style.ERROR("\nNo bot ID provided — skipping API push."))
            return

        # Resolve webhook URL from settings (falls back to production domain)
        webhook_url = getattr(settings, "SARUFI_WEBHOOK_URL", None) or (
            "https://yriftz.org/api/v1/communications/sarufi/webhook/"
        )

        payload = {
            "name": BOT_METADATA["name"],
            "description": BOT_METADATA["description"],
            "industry": BOT_METADATA["industry"],
            "intents": INTENTS,
            "flow": FLOWS,
            "visible_on_community": BOT_METADATA["visible_on_community"],
            "webhook_trigger_intents": BOT_METADATA["webhook_trigger_intents"],
            "webhook": webhook_url,
        }
        self.stdout.write(f"Webhook URL: {webhook_url}")

        # ── Attempt 1: new platform (api.sarufi.io) ───────────────────────────
        endpoints = [
            f"https://api.sarufi.io/chatbot/{bot_id}",
            f"https://developers.sarufi.io/chatbot/{bot_id}",
        ]
        pushed = False
        for url in endpoints:
            self.stdout.write(f"\nAttempting push to: {url} ...")
            try:
                resp = requests.put(
                    url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                    timeout=30,
                )
                if resp.status_code in (200, 201):
                    self.stdout.write(self.style.SUCCESS(f"✅ Bot updated successfully via {url}"))
                    pushed = True
                    break
                else:
                    self.stdout.write(
                        self.style.WARNING(f"  ⚠ HTTP {resp.status_code}: {resp.text[:200]}")
                    )
            except Exception as exc:
                self.stdout.write(self.style.WARNING(f"  ⚠ Request failed: {exc}"))

        if not pushed:
            self.stderr.write(self.style.ERROR(
                "\n❌ API push failed on all endpoints.\n"
                "   → Use the exported JSON files to update the bot manually via the Sarufi dashboard:\n"
                "      1. Log in to developers.sarufi.io\n"
                "      2. Open your bot (ID: {})\n"
                "      3. Open the JSON editor and paste yrif-chat.json\n"
                "         (backend/apps/communications/sarufi/yrif-chat.json)\n"
                "      4. Save the bot".format(bot_id)
            ))
