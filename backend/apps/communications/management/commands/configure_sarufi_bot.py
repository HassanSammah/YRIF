"""
Django management command to configure the YRIF Chat Sarufi bot.

Usage:
    python manage.py configure_sarufi_bot
    python manage.py configure_sarufi_bot --dry-run
    python manage.py configure_sarufi_bot --bot-id 12345
"""
import json
from django.core.management.base import BaseCommand
from django.conf import settings


# ── Bot Intents ────────────────────────────────────────────────────────────────
# Maps intent names → example utterances (Swahili + English, Tanzania-context)

INTENTS = {
    # Greetings
    "greeting": [
        "hello", "hi", "hey", "habari", "mambo", "salamu", "hujambo",
        "good morning", "good afternoon", "good evening", "sasa", "niaje",
        "karibu", "habari yako", "habari za leo", "shikamoo", "marahaba",
    ],
    "goodbye": [
        "bye", "goodbye", "kwaheri", "asante", "thank you", "thanks",
        "see you", "asante sana", "sawa", "ok bye", "done", "tutaonana",
        "nimemaliza", "baadaye",
    ],

    # About YRIF
    "about_yrif": [
        "what is YRIF", "YRIF ni nini", "about YRIF", "tell me about YRIF",
        "maelezo ya YRIF", "YRIF inafanya nini", "what does YRIF do",
        "Youth Research Innovation Foundation", "YRIF mission", "YRIF vision",
        "YRIF goals", "malengo ya YRIF",
    ],
    "who_can_join": [
        "who can join", "nani anaweza kujiunga", "can I join", "eligibility",
        "membership", "join YRIF", "how to join", "jinsi ya kujiunga",
        "am I eligible", "requirements to join", "who is YRIF for",
    ],

    # Research
    "research_info": [
        "research", "utafiti", "research submission", "submit research",
        "how to submit research", "jinsi ya kuwasilisha utafiti",
        "publish research", "research paper", "academic research",
        "niwasilishe utafiti wangu vipi", "research submission process",
    ],
    "research_status": [
        "my research status", "check research", "research yangu iko wapi",
        "research under review", "when will my research be approved",
        "utafiti wangu unaangaliwa", "research feedback", "check my submission",
        "utafiti wangu", "my submissions",
    ],
    "research_categories": [
        "research categories", "aina za utafiti", "natural sciences",
        "social sciences", "arts", "technology", "what category",
        "which category should I use", "research topics", "sayansi",
    ],

    # Events
    "events_info": [
        "events", "matukio", "upcoming events", "what events are available",
        "competitions", "seminars", "workshops", "webinars", "bonanza",
        "shindano", "mkutano", "warsha", "tukio lijalo", "YRIF events",
    ],
    "register_event": [
        "register for event", "jisajili kwa tukio", "how to register",
        "event registration", "sign up for event", "register competition",
        "attend event", "jinsi ya kusajili tukio", "I want to attend",
        "nataka kushiriki tukio",
    ],
    "my_events": [
        "my events", "matukio yangu", "my registrations", "events I registered",
        "events nimesajili", "my event status", "am I registered",
        "matukio niliyosajili",
    ],
    "competition": [
        "competition", "shindano", "research competition", "innovation bonanza",
        "how to participate in competition", "competition rules", "prizes",
        "judge scores", "competition results", "shindano la uvumbuzi",
    ],

    # Certificates
    "certificates": [
        "certificate", "shahada", "my certificate", "download certificate",
        "hati yangu", "participation certificate", "winner certificate",
        "how to get certificate", "jinsi ya kupata hati", "certifications",
    ],

    # Mentorship
    "mentorship_info": [
        "mentorship", "ushauri", "mentor", "mentoring", "mshauri",
        "find mentor", "tafuta mshauri", "mentorship program",
        "how does mentorship work", "mentorship process", "get a mentor",
    ],
    "request_mentor": [
        "I need a mentor", "request mentor", "omba mshauri",
        "how to request mentor", "jinsi ya kuomba mshauri",
        "connect me with mentor", "need guidance", "nahitaji mshauri",
        "mentor application", "omba mshauri",
    ],
    "become_mentor": [
        "become a mentor", "kuwa mshauri", "mentor application",
        "I want to mentor", "mentor registration", "how to be mentor",
        "jinsi ya kuwa mshauri", "mentor profile", "share expertise",
    ],
    "my_mentorship": [
        "my mentor", "mshauri wangu", "mentorship status", "active mentorship",
        "mentorship session", "mentorship feedback", "my mentee",
        "ushauri wangu", "jukwaa la ushauri",
    ],

    # Account & Profile
    "how_to_register": [
        "How do I register", "how to register", "registration steps",
        "account creation steps", "how to sign up", "jinsi ya kusajili",
        "create account", "open account", "new account",
    ],
    "account_help": [
        "account", "login", "sign in", "can't login", "account issues",
        "account help", "account problem", "login help", "kuingia",
        "shida ya kuingia", "login not working",
    ],
    "account_approval": [
        "account approval", "when will I be approved", "pending approval",
        "account status", "account not active", "approval process",
        "how long does approval take", "why is my account pending",
        "akaunti inasubiri", "when can I use my account",
    ],
    "profile_help": [
        "profile", "update profile", "change details", "edit profile",
        "profile picture", "bio", "skills", "education", "my information",
        "taarifa zangu", "wasifu wangu", "complete profile",
    ],
    "password_help": [
        "forgot password", "reset password", "change password",
        "password help", "cannot login", "niwezi kuingia",
        "account locked", "password reset", "nimesahau nywila",
    ],
    "roles": [
        "roles", "user roles", "youth", "researcher", "mentor",
        "research assistant", "industry partner", "what roles are there",
        "change my role", "role assignment", "majukumu", "jukumu langu",
    ],

    # Partners
    "partner_info": [
        "partner", "mshirika", "industry partner", "organization",
        "company", "partner with YRIF", "partnership", "become a partner",
        "industry collaboration", "ushirikiano", "biashara",
    ],

    # Resources
    "resources_info": [
        "resources", "rasilimali", "learning materials", "resource hub",
        "documents", "downloads", "learning content", "materials",
        "study materials", "jinsi ya kupata rasilimali", "library",
    ],

    # Contact & Support
    "contact_support": [
        "contact", "contact YRIF", "support", "help", "email",
        "phone number", "reach YRIF", "office", "address",
        "wasiliana na YRIF", "msaada", "mawasiliano", "info",
    ],
    "report_issue": [
        "problem", "issue", "bug", "error", "kuna tatizo", "report issue",
        "not working", "inafanya kazi vibaya", "system problem",
        "website problem", "something is broken", "technical problem",
    ],
    "escalate": [
        "speak to human", "talk to admin", "real person", "human support",
        "connect me to staff", "I need real help", "speak to someone",
        "official support", "formal complaint", "niongee na mtu wa kweli",
        "I want to talk to a person", "live agent",
    ],
}


# ── Bot Flows ──────────────────────────────────────────────────────────────────
# State machine: each state has message(s) and next_state

FLOWS = {
    "greeting": {
        "message": [
            "Karibu sana kwenye YRIF! 🌟 Mimi ni YRIF Chat, msaidizi wako wa kidijitali.\n\n"
            "Ninaweza kukusaidia kuhusu:\n"
            "📝 Utafiti & Mawasilisho\n"
            "📅 Matukio & Mashindano\n"
            "🤝 Ushauri wa Kitaaluma\n"
            "🏆 Vyeti & Tuzo\n"
            "📚 Rasilimali za Kujifunzia\n\n"
            "Ungehitaji msaada gani leo?"
        ],
        "next_state": "end",
    },

    "about_yrif": {
        "message": [
            "YRIF (Youth Research & Innovation Foundation) ni taasisi ya kitaifa ya Tanzania. 🇹🇿\n\n"
            "🎯 *Dhamira:* Kuweka nguvu kwa vijana wa Tanzania kupitia utafiti, uvumbuzi, na teknolojia.\n\n"
            "👥 *Tunakusanyisha:*\n"
            "• Vijana na Watafiti\n"
            "• Washauri wa Kitaaluma\n"
            "• Washirika wa Sekta Binafsi\n"
            "• Wasaidizi wa Utafiti\n\n"
            "🏆 *Tunafanya nini:*\n"
            "• Kusaidia mawasilisho ya utafiti\n"
            "• Kupanga mashindano ya uvumbuzi\n"
            "• Kuunganisha vijana na washauri\n"
            "• Kutoa mafunzo na rasilimali\n"
            "• Kujenga mtandao wa kitaifa"
        ],
        "next_state": "end",
    },

    "who_can_join": {
        "message": [
            "YRIF inakaribishia kila mtu! 🎉\n\n"
            "👤 *Aina za Watumiaji:*\n"
            "🧑‍🎓 *Kijana* – Wadau wanaotaka kujifunza na kushiriki\n"
            "🔬 *Mtafiti* – Wanaofanya utafiti wa kitaaluma\n"
            "👨‍💼 *Mshauri* – Wataalamu wanaotaka kusaidia vijana\n"
            "🏢 *Mshirika wa Sekta Binafsi* – Makampuni yanayotaka kushirikiana\n"
            "🛠️ *Msaidizi wa Utafiti* – Wanaotaka kusaidia miradi ya utafiti\n\n"
            "Jisajili bure na usubiri idhini ya akaunti yako (siku 1-2 za kazi)!"
        ],
        "next_state": "how_to_register",
    },

    "research_info": {
        "message": [
            "📝 *Jinsi ya Kuwasilisha Utafiti:*\n\n"
            "1️⃣ Ingia kwenye akaunti yako\n"
            "2️⃣ Nenda Research → Submit Research\n"
            "3️⃣ Jaza: kichwa, muhtasari, maneno muhimu\n"
            "4️⃣ Chagua kategoria:\n"
            "   • 🔬 Sayansi za Asili\n"
            "   • 👥 Sayansi za Jamii\n"
            "   • 🎨 Sanaa\n"
            "   • 💻 Teknolojia\n"
            "5️⃣ Pakia hati yako (PDF/Word)\n"
            "6️⃣ Bonyeza Submit\n\n"
            "⏳ Utafiti wako utakaguliwa na wataalamu. Utapata arifa baada ya ukaguzi!"
        ],
        "next_state": "end",
    },

    "research_categories": {
        "message": [
            "📚 *Kategoria za Utafiti katika YRIF:*\n\n"
            "🔬 *Sayansi za Asili* – Biolojia, Kemia, Fizikia, Mazingira\n"
            "👥 *Sayansi za Jamii* – Uchumi, Saikolojia, Siasa, Elimu\n"
            "🎨 *Sanaa* – Sanaa za ubunifu, Utamaduni, Lugha\n"
            "💻 *Teknolojia* – TEHAMA, Uhandisi, Uvumbuzi wa Kidijitali\n\n"
            "Chagua kategoria inayofaa utafiti wako zaidi!"
        ],
        "next_state": "research_info",
    },

    "research_status": {
        "message": [
            "🔍 *Kufuatilia Utafiti Wako:*\n\n"
            "Ingia na nenda Research → My Submissions\n\n"
            "📊 *Hali za Utafiti:*\n"
            "✏️ Rasimu – Bado hujatuma\n"
            "📤 Imetumwa – Inasubiri ukaguzi\n"
            "🔍 Inakaguliwa – Wataalamu wanakagua\n"
            "✅ Imeidhinishwa – Imepitishwa!\n"
            "❌ Imekataliwa – Tazama maoni ya wataalamu\n"
            "🌐 Imechapishwa – Inaonekana kwa umma\n\n"
            "Kama una maswali mahususi, wasiliana: info@yriftz.org"
        ],
        "next_state": "end",
    },

    "events_info": {
        "message": [
            "📅 *Matukio ya YRIF:*\n\n"
            "🎓 Seminari – Mazungumzo ya kitaalamu\n"
            "🛠️ Warsha – Mafunzo ya vitendo\n"
            "🏆 Mashindano – Shindana na ushinde tuzo!\n"
            "🎪 Bonanza ya Uvumbuzi – Onyesha mradi wako\n"
            "💻 Webinari – Matukio ya mtandaoni\n\n"
            "Tembelea ukurasa wa Events kwenye jukwaa letu kuona matukio yanayokuja na kusajili!"
        ],
        "next_state": "register_event",
    },

    "register_event": {
        "message": [
            "✅ *Jinsi ya Kusajili Tukio:*\n\n"
            "1️⃣ Nenda ukurasa wa Events\n"
            "2️⃣ Bonyeza tukio unalotaka\n"
            "3️⃣ Angalia tarehe, mahali, na mahitaji\n"
            "4️⃣ Bonyeza Register Now\n"
            "5️⃣ Utapata uthibitisho kwa barua pepe!\n\n"
            "📌 Baadhi ya matukio yanahitaji mawasilisho ya utafiti kwa mashindano. "
            "Hakikisha kusajili kabla ya tarehe ya mwisho!"
        ],
        "next_state": "end",
    },

    "my_events": {
        "message": [
            "📋 *Matukio Yako:*\n\n"
            "Ingia na nenda Events → My Registrations kuona:\n\n"
            "• Matukio uliyosajili\n"
            "• Hali ya usajili wako\n"
            "• Matukio yanayokuja\n"
            "• Matokeo ya mashindano\n"
            "• Vyeti vyako\n\n"
            "Kama hujasajili tukio lolote bado, tembelea ukurasa wa Events!"
        ],
        "next_state": "end",
    },

    "competition": {
        "message": [
            "🏆 *Mashindano ya YRIF:*\n\n"
            "Mashindano yetu yanalenga kuleta uvumbuzi wa vijana!\n\n"
            "📝 *Kushiriki:*\n"
            "1. Wasilisha utafiti au mradi wako\n"
            "2. Sajili kwa tukio la mashindano\n"
            "3. Wataalamu watakadiria kazi zako\n\n"
            "🎖️ *Tuzo:*\n"
            "• Vyeti vya ushindi\n"
            "• Zawadi za pesa\n"
            "• Nafasi za mafunzo\n"
            "• Mitandao ya kitaalamu\n\n"
            "Tazama matukio ya mashindano kwenye ukurasa wa Events!"
        ],
        "next_state": "end",
    },

    "certificates": {
        "message": [
            "🏆 *Vyeti vya YRIF:*\n\n"
            "Unaweza kupata vyeti vya:\n"
            "🥇 Ushindi – Ukishinda mashindano\n"
            "📜 Ushiriki – Ukishiriki matukio\n\n"
            "*Kupakua Hati:*\n"
            "1. Ingia kwenye akaunti yako\n"
            "2. Nenda Events → My Registrations\n"
            "3. Bonyeza tukio husika\n"
            "4. Bonyeza Download Certificate\n\n"
            "Vyeti vinapatikana baada ya tukio kukamilika. "
            "Kama hati yako haipo, wasiliana nasi: info@yriftz.org"
        ],
        "next_state": "end",
    },

    "mentorship_info": {
        "message": [
            "🤝 *Programu ya Ushauri wa YRIF:*\n\n"
            "Tunaunganisha vijana wenye talanta na wataalamu wenye uzoefu!\n\n"
            "*Mchakato:*\n"
            "1. 📋 Jaza ombi la ushauri\n"
            "2. 🔍 Timu yetu inakupanga na mshauri anayefaa\n"
            "3. 🤝 Mazungumzo na mshauri wako yanaanza\n"
            "4. 📈 Fuatilia maendeleo yako\n\n"
            "👨‍💼 *Washauri wetu wana uzoefu katika:*\n"
            "• Sayansi na Teknolojia\n"
            "• Biashara na Ujasiriamali\n"
            "• Sanaa na Ubunifu\n"
            "• Sera na Uongozi\n\n"
            "Omba mshauri leo kupitia ukurasa wa Mentorship!"
        ],
        "next_state": "request_mentor",
    },

    "request_mentor": {
        "message": [
            "📝 *Jinsi ya Kuomba Mshauri:*\n\n"
            "1️⃣ Ingia kwenye akaunti yako\n"
            "2️⃣ Nenda ukurasa wa Mentorship\n"
            "3️⃣ Bonyeza Request Mentor\n"
            "4️⃣ Jaza:\n"
            "   • Mada unayohitaji ushauri\n"
            "   • Ujumbe kwa mshauri\n"
            "   • Mshauri unayependekeza (si lazima)\n"
            "5️⃣ Tuma ombi\n\n"
            "⏳ Timu yetu itakupanga na mshauri ndani ya siku 3-5 za kazi. "
            "Utapata arifa ukishapangwa!"
        ],
        "next_state": "end",
    },

    "become_mentor": {
        "message": [
            "🌟 *Kuwa Mshauri wa YRIF:*\n\n"
            "Kama una uzoefu na unataka kusaidia vijana, tunakukaribishia!\n\n"
            "📋 *Mahitaji:*\n"
            "• Uzoefu wa kitaaluma au kitaaluma\n"
            "• Nia ya kusaidia vijana\n"
            "• Muda wa dakika 30-60 kwa wiki\n\n"
            "*Jinsi ya Kusajili:*\n"
            "1. Ingia kwenye akaunti yako\n"
            "2. Nenda Profile → Mentor Profile\n"
            "3. Jaza maelezo ya utaalamu wako\n"
            "4. Weka upatikanaji wako\n"
            "5. Timu yetu itakukagua\n\n"
            "Asante kwa kutaka kusaidia vijana wa Tanzania! 🇹🇿"
        ],
        "next_state": "end",
    },

    "my_mentorship": {
        "message": [
            "👥 *Ushauri Wako:*\n\n"
            "Ingia na nenda Mentorship → My Mentorship kuona:\n\n"
            "• Hali ya ombi lako\n"
            "• Maelezo ya mshauri wako\n"
            "• Mazungumzo ya ushauri\n"
            "• Historia ya vikao\n"
            "• Toa maoni kuhusu ushauri\n\n"
            "Kama una tatizo na ushauri wako, wasiliana na timu yetu: info@yriftz.org"
        ],
        "next_state": "end",
    },

    "how_to_register": {
        "message": [
            "📝 *Kusajili Akaunti ya YRIF:*\n\n"
            "1️⃣ Bonyeza Register / Jisajili\n"
            "2️⃣ Chagua njia ya kusajili:\n"
            "   • 🇹🇿 BRIQ Auth (nambari ya simu ya Tanzania)\n"
            "   • 📧 Google (Gmail yako)\n"
            "3️⃣ Jaza taarifa zako\n"
            "4️⃣ Thibitisha barua pepe yako\n"
            "5️⃣ Kamisha wasifu wako\n"
            "6️⃣ Subiri idhini ya akaunti (siku 1-2)\n\n"
            "✉️ Utapata arifa ukisha kuidhinishwa. Je, una maswali?"
        ],
        "next_state": "end",
    },

    "account_help": {
        "message": [
            "👤 *Msaada wa Akaunti:*\n\n"
            "Tuna njia mbili za kuingia:\n"
            "🔐 BRIQ Auth – Nambari ya simu ya Tanzania\n"
            "🌐 Google – Gmail yako\n\n"
            "Kama una tatizo la kuingia:\n"
            "• Angalia nenosiri lako\n"
            "• Tumia Forgot Password\n"
            "• Thibitisha barua pepe yako\n\n"
            "Bado una tatizo? Wasiliana: info@yriftz.org"
        ],
        "next_state": "end",
    },

    "account_approval": {
        "message": [
            "⏳ *Mchakato wa Idhini ya Akaunti:*\n\n"
            "Kila akaunti mpya inakaguliwa na timu yetu ili kuhakikisha usalama wa jamii.\n\n"
            "⏱️ *Muda:* Kawaida siku 1-2 za kazi\n\n"
            "*Utapata arifa kwa:*\n"
            "• ✅ Barua pepe ukishaidhinishwa\n"
            "• ❌ Barua pepe kama ombi limekataliwa\n\n"
            "*Hali za akaunti:*\n"
            "• ⏳ Inasubiri idhini\n"
            "• ✅ Amilifu\n"
            "• 🚫 Imesimamishwa\n\n"
            "Ukingoja zaidi ya siku 3: info@yriftz.org"
        ],
        "next_state": "contact_support",
    },

    "profile_help": {
        "message": [
            "👤 *Kusasisha Wasifu Wako:*\n\n"
            "Ingia na nenda Profile ili kusasisha:\n\n"
            "📝 *Taarifa za Kibinafsi:*\n"
            "• Jina na maelezo (bio)\n"
            "• Picha ya wasifu\n"
            "• Mkoa na taasisi\n\n"
            "📚 *Kielimu:*\n"
            "• Kiwango cha elimu\n"
            "• Maslahi ya utafiti\n"
            "• Ujuzi na mafanikio\n\n"
            "📱 *Mawasiliano:*\n"
            "• Nambari ya simu (uthibitisho wa OTP)\n\n"
            "Wasifu kamili unakusaidia kupata ushauri na matukio yanayofaa!"
        ],
        "next_state": "end",
    },

    "password_help": {
        "message": [
            "🔐 *Msaada wa Nenosiri:*\n\n"
            "*Umesahau Nenosiri?*\n"
            "1. Nenda ukurasa wa kuingia\n"
            "2. Bonyeza Forgot Password\n"
            "3. Weka barua pepe yako\n"
            "4. Angalia barua pepe kwa kiungo\n\n"
            "*Kubadilisha Nenosiri:*\n"
            "1. Ingia → Profile → Security\n"
            "2. Weka nenosiri la sasa na jipya\n\n"
            "Bado una tatizo? info@yriftz.org"
        ],
        "next_state": "end",
    },

    "roles": {
        "message": [
            "👥 *Majukumu kwenye YRIF:*\n\n"
            "🧑‍🎓 *Kijana* – Mwanachama wa kawaida\n"
            "🔬 *Mtafiti* – Wasilisha na usimamie utafiti\n"
            "👨‍💼 *Mshauri* – Toa ushauri kwa vijana\n"
            "🛠️ *Msaidizi wa Utafiti* – Saidia miradi ya utafiti\n"
            "🏢 *Mshirika wa Sekta Binafsi* – Washirika wa biashara\n\n"
            "Kubadilisha jukumu: Wasiliana nasi kwa info@yriftz.org"
        ],
        "next_state": "end",
    },

    "partner_info": {
        "message": [
            "🏢 *Ushirikiano na YRIF:*\n\n"
            "Tunafurahi kushirikiana na makampuni na taasisi!\n\n"
            "🎯 *Faida za Ushirikiano:*\n"
            "• Fikia talanta za vijana wa Tanzania\n"
            "• Pata utafiti wa kisasa\n"
            "• Jenga jina la kampuni\n"
            "• Saidia maendeleo ya Tanzania\n\n"
            "🤝 *Aina za Ushirikiano:*\n"
            "• Sekta ya Viwanda\n"
            "• Shirika za Jamii\n"
            "• Taasisi za Elimu\n\n"
            "Wasiliana nasi: info@yriftz.org"
        ],
        "next_state": "contact_support",
    },

    "resources_info": {
        "message": [
            "📚 *Kituo cha Rasilimali cha YRIF:*\n\n"
            "Pata nyenzo za kujifunzia na rasilimali muhimu!\n\n"
            "📄 Makala na Vitabu\n"
            "🎥 Video za Mafunzo\n"
            "📊 Ripoti za Utafiti\n"
            "📋 Miongozo na Violezo\n\n"
            "*Jinsi ya Kupata:*\n"
            "1. Ingia kwenye akaunti yako\n"
            "2. Nenda ukurasa wa Resources\n"
            "3. Tafuta au vinjari\n"
            "4. Bonyeza Download\n\n"
            "Rasilimali zetu zinaendelea kuongezwa!"
        ],
        "next_state": "end",
    },

    "contact_support": {
        "message": [
            "📞 *Mawasiliano ya YRIF:*\n\n"
            "📧 Barua Pepe: info@yriftz.org\n"
            "🌐 Tovuti: yriftz.org\n"
            "📱 Programu: Unaitumia sasa hivi!\n\n"
            "📋 Kwa Msaada Wa Haraka:\n"
            "• Tumia fomu ya Contact kwenye jukwaa\n"
            "• Au niambie hapa — nitajaribu kukusaidia!\n\n"
            "⏰ Masaa ya Kazi: Jumatatu-Ijumaa, 8:00-17:00 EAT"
        ],
        "next_state": "end",
    },

    "report_issue": {
        "message": [
            "🐛 *Kuripoti Tatizo la Kiufundi:*\n\n"
            "Asante kwa kutuarifu! Hii inasaidia kuboresha jukwaa letu.\n\n"
            "*Jinsi ya Kuripoti:*\n"
            "1. Nenda ukurasa wa Contact\n"
            "2. Chagua mada: Technical Issue\n"
            "3. Eleza tatizo kwa undani\n"
            "4. Ambatisha picha kama inasaidia\n\n"
            "Au tuma barua pepe moja kwa moja:\n"
            "📧 info@yriftz.org\n"
            "Mada: [Technical Issue] - Maelezo mafupi\n\n"
            "Timu yetu ya kiufundi itashughulikia haraka!"
        ],
        "next_state": "contact_support",
    },

    "escalate": {
        "message": [
            "👨‍💼 *Msaada wa Mtu wa Kweli:*\n\n"
            "Nakuelewa! Nitatuma ombi lako kwa timu yetu.\n\n"
            "✅ Ujumbe wako umetumwa kwa timu yetu\n"
            "📧 Utapigiwa barua pepe ndani ya masaa 24\n\n"
            "Au wasiliana moja kwa moja:\n"
            "📧 info@yriftz.org\n\n"
            "Asante kwa uvumilivu wako! 🙏"
        ],
        "next_state": "end",
    },

    "goodbye": {
        "message": [
            "Kwaheri! Asante kwa kutumia YRIF Chat. 👋\n"
            "Nikuwepo ukihitaji msaada zaidi. Endelea kufanya kazi nzuri! 🌟"
        ],
        "next_state": "end",
    },

    "end": {
        "message": [
            "Je, kuna kitu kingine ninachoweza kukusaidia? 😊",
        ],
        "next_state": "end",
    },
}


# ── Bot Metadata ───────────────────────────────────────────────────────────────

BOT_METADATA = {
    "name": "YRIF Chat",
    "description": (
        "Msaidizi wa kidijitali wa YRIF — Youth Research & Innovation Foundation Tanzania. "
        "Husaidia kuhusu utafiti, matukio, ushauri, vyeti, akaunti, na mawasiliano. "
        "Digital assistant for YRIF platform — research, events, mentorship, certificates, and support."
    ),
    "industry": "education",
    "visible_on_community": False,
    "webhook_trigger_intents": ["escalate"],
}


class Command(BaseCommand):
    help = "Configure the YRIF Chat Sarufi bot with intents, flows, and webhook settings."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would be configured without making API calls.",
        )
        parser.add_argument(
            "--bot-id",
            type=int,
            default=None,
            help="Sarufi bot ID to update. Reads SARUFI_BOT_ID from settings if omitted.",
        )

    def handle(self, *args, **options):
        api_key = settings.SARUFI_API_KEY
        if not api_key:
            self.stderr.write(self.style.ERROR("SARUFI_API_KEY is not set in settings."))
            return

        bot_id = options["bot_id"] or (
            int(settings.SARUFI_BOT_ID) if getattr(settings, "SARUFI_BOT_ID", "") else None
        )
        dry_run = options["dry_run"]

        self.stdout.write(f"Intents  : {len(INTENTS)} intents, "
                          f"{sum(len(v) for v in INTENTS.values())} total utterances")
        self.stdout.write(f"Flows    : {len(FLOWS)} states")
        self.stdout.write(f"Webhook triggers: {BOT_METADATA['webhook_trigger_intents']}")

        if dry_run:
            self.stdout.write(self.style.WARNING("\n[DRY RUN] Skipping API calls."))
            self.stdout.write("\n--- INTENTS PREVIEW ---")
            self.stdout.write(json.dumps(INTENTS, indent=2, ensure_ascii=False)[:2000] + "...")
            self.stdout.write("\n--- FLOWS PREVIEW ---")
            self.stdout.write(json.dumps(FLOWS, indent=2, ensure_ascii=False)[:2000] + "...")
            return

        try:
            from sarufi import Sarufi  # type: ignore[import]
        except ImportError:
            self.stderr.write(self.style.ERROR(
                "sarufi package not installed. Run: pip install sarufi"
            ))
            return

        base_url = getattr(settings, "SARUFI_BASE_URL", "")
        if base_url:
            Sarufi._BASE_URL = base_url
        self.stdout.write(f"\nConnecting to Sarufi (api_key=...{api_key[-6:]}, base={Sarufi._BASE_URL})...")
        try:
            sarufi_client = Sarufi(api_key=api_key)
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Failed to initialise Sarufi: {exc}"))
            return

        # Resolve webhook URL from settings
        backend_ngrok = getattr(settings, "NGROK_BACKEND_URL", "")
        allowed_hosts = getattr(settings, "ALLOWED_HOSTS", [])
        base_url = backend_ngrok or (
            f"https://{allowed_hosts[0]}" if allowed_hosts and allowed_hosts[0] not in ("*", "localhost") else ""
        )
        webhook_url = f"{base_url}/api/v1/communications/sarufi/webhook/" if base_url else ""

        if bot_id:
            self.stdout.write(f"Updating existing bot (id={bot_id})...")
            try:
                bot = sarufi_client.update_bot(
                    id=bot_id,
                    intents=INTENTS,
                    flow=FLOWS,
                    description=BOT_METADATA["description"],
                    webhook_url=webhook_url or None,
                    webhook_trigger_intents=BOT_METADATA["webhook_trigger_intents"],
                    visible_on_community=BOT_METADATA["visible_on_community"],
                )
                self.stdout.write(self.style.SUCCESS(
                    f"✅ Bot updated! id={bot_id}, name={BOT_METADATA['name']}"
                ))
            except Exception as exc:
                self.stderr.write(self.style.ERROR(f"Failed to update bot: {exc}"))
                return
        else:
            self.stdout.write("Creating new YRIF Chat bot...")
            try:
                bot = sarufi_client.create_bot(
                    name=BOT_METADATA["name"],
                    description=BOT_METADATA["description"],
                    industry=BOT_METADATA["industry"],
                    intents=INTENTS,
                    flow=FLOWS,
                    webhook_url=webhook_url or None,
                    webhook_trigger_intents=BOT_METADATA["webhook_trigger_intents"],
                    visible_on_community=BOT_METADATA["visible_on_community"],
                )
                new_id = getattr(bot, "id", None) or (
                    bot.get("id") if isinstance(bot, dict) else None
                )
                self.stdout.write(self.style.SUCCESS(
                    f"✅ Bot created! id={new_id}, name={BOT_METADATA['name']}"
                ))
                if new_id:
                    self.stdout.write(self.style.WARNING(
                        f"\n⚠️  Add to backend/.env:\n    SARUFI_BOT_ID={new_id}"
                    ))
            except Exception as exc:
                self.stderr.write(self.style.ERROR(f"Failed to create bot: {exc}"))
                return

        if webhook_url:
            self.stdout.write(f"\nWebhook URL configured: {webhook_url}")
        else:
            self.stdout.write(self.style.WARNING(
                "\n⚠️  No webhook URL set (NGROK_BACKEND_URL not configured). "
                "Re-run after setting NGROK_BACKEND_URL in .env to enable escalation webhook."
            ))
