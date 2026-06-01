/**
 * Translation strings, side-by-side English + Bengali. Keys follow a
 * `screen.path` convention. Adding a new key here typechecks every
 * consumer so a missing translation is a compile error, not a runtime
 * fallback.
 *
 * Bengali strings cover the user-visible surface: onboarding, primary
 * navigation, banners, buttons, status, occupancy, history, notification
 * preferences. Rarely-seen developer/error copy may remain in English
 * and fall back gracefully via the `t()` helper.
 */

export const STRINGS = {
  // ---- common ----
  "common.cancel": { en: "Cancel", bn: "বাতিল" },
  "common.done": { en: "Done", bn: "সম্পন্ন" },
  "common.save": { en: "Save", bn: "সংরক্ষণ" },
  "common.edit": { en: "Edit", bn: "সম্পাদনা" },
  "common.back": { en: "Back", bn: "পেছনে" },
  "common.next": { en: "Next", bn: "পরবর্তী" },
  "common.skip": { en: "Skip", bn: "এড়িয়ে যান" },
  "common.refresh": { en: "Refresh", bn: "রিফ্রেশ" },
  "common.retry": { en: "Try again", bn: "আবার চেষ্টা করুন" },
  "common.loading": { en: "Loading…", bn: "লোড হচ্ছে…" },
  "common.min": { en: "min", bn: "মিনিট" },
  "common.km": { en: "km", bn: "কিমি" },
  "common.m": { en: "m", bn: "মি" },
  "common.kmh": { en: "km/h", bn: "কিমি/ঘ" },
  "common.signOut": { en: "Sign out", bn: "সাইন আউট" },
  "common.map": { en: "Map", bn: "মানচিত্র" },
  "common.stops": { en: "Stops", bn: "স্টপ" },
  "common.search": { en: "Search", bn: "অনুসন্ধান" },
  "common.menu": { en: "Menu", bn: "মেনু" },
  "common.close": { en: "Close", bn: "বন্ধ করুন" },

  // ---- hamburger menu ----
  "menu.live": { en: "Live tracking", bn: "লাইভ ট্র্যাকিং" },
  "menu.today": { en: "Today's schedules", bn: "আজকের সময়সূচী" },
  "menu.routes": { en: "All routes", bn: "সব রুট" },
  "menu.notifications": { en: "Notifications", bn: "নোটিফিকেশন" },
  "menu.history": { en: "Trip history", bn: "যাত্রার ইতিহাস" },
  "menu.preferences": { en: "Notification preferences", bn: "নোটিফিকেশন সেটিংস" },
  "menu.profile": { en: "Profile", bn: "প্রোফাইল" },

  // ---- today's schedules ----
  "today.title": { en: "Today's schedules", bn: "আজকের সময়সূচী" },
  "today.searchPlaceholder": {
    en: "Search routes or buses",
    bn: "রুট বা বাস খুঁজুন",
  },
  "today.section.live": { en: "Live now", bn: "এখন চলছে" },
  "today.section.preTrip": { en: "Departing soon", bn: "শীঘ্রই ছাড়বে" },
  "today.section.upcoming": { en: "Upcoming today", bn: "আজকের পরবর্তী" },
  "today.section.completed": { en: "Completed today", bn: "আজ শেষ হয়েছে" },
  "today.section.favorites": { en: "Your favorites", bn: "আপনার পছন্দের" },
  "today.empty.title": {
    en: "No schedules for today",
    bn: "আজ কোনো সময়সূচী নেই",
  },
  "today.empty.subtitle": {
    en: "Today's day-of-week has no active schedules in the system. Check back tomorrow or talk to your admin.",
    bn: "আজকের দিনের জন্য সিস্টেমে কোনো সক্রিয় সময়সূচী নেই। আগামীকাল আবার দেখুন বা আপনার অ্যাডমিনের সাথে কথা বলুন।",
  },
  "today.empty.searchTitle": {
    en: "No matches",
    bn: "কোনো মিল নেই",
  },
  "today.empty.searchSubtitle": {
    en: "Try a different route name or bus code.",
    bn: "অন্য রুট বা বাসের নাম দিয়ে চেষ্টা করুন।",
  },
  "today.tap.viewLive": { en: "View live", bn: "লাইভ দেখুন" },
  "today.inMinutes": { en: "in {n} min", bn: "{n} মিনিট পর" },
  "today.now": { en: "starting now", bn: "এখনই শুরু" },
  "today.passed": { en: "departed", bn: "ছেড়ে গেছে" },
  "today.driverNotAssigned": {
    en: "GPS-only",
    bn: "শুধু জিপিএস",
  },

  // ---- onboarding ----
  "onboarding.slide1.title": {
    en: "Real-time bus tracking",
    bn: "রিয়েল-টাইম বাস ট্র্যাকিং",
  },
  "onboarding.slide1.body": {
    en: "See your bus moving on the map, second by second. No more guessing whether it's coming or already passed.",
    bn: "মানচিত্রে আপনার বাস সেকেন্ডে সেকেন্ডে চলতে দেখুন। আর অনুমান করতে হবে না বাস আসছে নাকি চলে গেছে।",
  },
  "onboarding.slide2.title": {
    en: "Smart alerts",
    bn: "স্মার্ট অ্যালার্ট",
  },
  "onboarding.slide2.body": {
    en: "Get a heads-up when your bus is a few minutes from your stop — even when the app is closed.",
    bn: "আপনার স্টপের কয়েক মিনিট আগে নোটিফিকেশন পান — এমনকি অ্যাপ বন্ধ থাকলেও।",
  },
  "onboarding.slide3.title": {
    en: "Pre-trip visibility",
    bn: "যাত্রা শুরুর আগেই দৃশ্যমান",
  },
  "onboarding.slide3.body": {
    en: "Know whether the bus is still parked, on the way to the start, or already boarding — long before it leaves the depot.",
    bn: "বাসটি এখনো দাঁড়িয়ে আছে, শুরুর দিকে যাচ্ছে, না কি যাত্রী তুলছে — গ্যারেজ ছাড়ার অনেক আগেই জানুন।",
  },
  "onboarding.getStarted": { en: "Get started", bn: "শুরু করুন" },

  // ---- live screen ----
  "live.emptyTitle": {
    en: "No buses running right now",
    bn: "এখন কোনো বাস চলছে না",
  },
  "live.emptySubtitle": {
    en: "We're not seeing any active trips. Pull down to refresh, or check back closer to your scheduled departure.",
    bn: "এখন কোনো সক্রিয় ট্রিপ নেই। নিচে টেনে রিফ্রেশ করুন, অথবা আপনার নির্ধারিত যাত্রার সময়ের কাছাকাছি আবার চেক করুন।",
  },
  "live.findingBus": { en: "Finding your bus…", bn: "আপনার বাস খোঁজা হচ্ছে…" },

  // ---- trip badges ----
  "badge.live": { en: "LIVE", bn: "লাইভ" },
  "badge.preTrip": { en: "PRE-TRIP", bn: "যাত্রা-পূর্ব" },
  "badge.ended": { en: "ENDED", bn: "শেষ" },
  "badge.planned": { en: "PLANNED", bn: "নির্ধারিত" },
  "badge.stale": { en: "STALE", bn: "পুরোনো" },
  "badge.delayed": { en: "DELAYED", bn: "বিলম্বিত" },

  // ---- trip sheet ----
  "tripSheet.liveTrip": { en: "Live trip", bn: "লাইভ ট্রিপ" },
  "tripSheet.hero.noTrip.title": {
    en: "Waiting for the bus",
    bn: "বাসের জন্য অপেক্ষা",
  },
  "tripSheet.hero.noTrip.body": {
    en: "No bus is broadcasting on this route yet. We'll show the live position the moment it starts.",
    bn: "এই রুটে এখনো কোনো বাস সম্প্রচার করছে না। চলা শুরু করলেই লাইভ অবস্থান দেখাব।",
  },
  "tripSheet.hero.preTrip.title": {
    en: "Trip hasn't started yet",
    bn: "যাত্রা এখনো শুরু হয়নি",
  },
  "tripSheet.hero.preTrip.body": {
    en: "ETA + stop progression will appear once the driver starts the trip.",
    bn: "ড্রাইভার যাত্রা শুরু করার পর ETA ও স্টপ অগ্রগতি দেখানো হবে।",
  },
  "tripSheet.hero.live.title": { en: "LIVE", bn: "লাইভ" },
  "tripSheet.hero.live.body": {
    en: "Bus is on route — see where it is and when it reaches your stop.",
    bn: "বাস পথে — কোথায় আছে ও আপনার স্টপে কখন পৌঁছাবে দেখুন।",
  },
  "tripSheet.hero.ended.title": { en: "Trip ended", bn: "যাত্রা শেষ" },
  "tripSheet.hero.ended.body": {
    en: "The driver has finished this trip.",
    bn: "ড্রাইভার এই যাত্রা শেষ করেছেন।",
  },
  "tripSheet.toStop": { en: "to {stop}", bn: "{stop} পর্যন্ত" },
  "tripSheet.tracking": {
    en: "Tracking live position",
    bn: "লাইভ অবস্থান ট্র্যাক করা হচ্ছে",
  },
  "tripSheet.arrived": { en: "Arrived", bn: "পৌঁছেছে" },
  "tripSheet.ended": { en: "Ended", bn: "শেষ" },
  "tripSheet.speed": { en: "Speed", bn: "গতি" },
  "tripSheet.confidence": { en: "Confidence", bn: "নির্ভুলতা" },
  "tripSheet.stops": { en: "Stops", bn: "স্টপ" },
  "tripSheet.route": { en: "Route", bn: "রুট" },
  "tripSheet.arrivedAtStop": {
    en: "Arrived at {stop}",
    bn: "{stop}-এ পৌঁছেছে",
  },

  // ---- occupancy ----
  "occupancy.howCrowded": { en: "HOW CROWDED?", bn: "কতটা ভিড়?" },
  "occupancy.light": { en: "Light", bn: "হালকা" },
  "occupancy.some": { en: "Some", bn: "মাঝারি" },
  "occupancy.full": { en: "Full", bn: "পূর্ণ" },
  "occupancy.voteCount": { en: "{n} votes", bn: "{n} ভোট" },
  "occupancy.voteCountOne": { en: "{n} vote", bn: "{n} ভোট" },
  "occupancy.busFull": { en: "Bus is full", bn: "বাস পূর্ণ" },
  "occupancy.someSeats": { en: "Some seats left", bn: "কিছু সিট খালি" },
  "occupancy.plentyOfRoom": { en: "Plenty of room", bn: "যথেষ্ট জায়গা" },

  // ---- pre-trip banner ----
  "preTrip.label": { en: "PRE-TRIP", bn: "যাত্রা-পূর্ব" },
  "preTrip.atDepot.title": {
    en: "Bus is parked at the depot",
    bn: "বাস গ্যারেজে দাঁড়ানো আছে",
  },
  "preTrip.atDepot.detail": {
    en: "Waiting for departure. We'll show you the live location as soon as it starts moving.",
    bn: "যাত্রার অপেক্ষায়। চলা শুরু করলেই লাইভ অবস্থান দেখাব।",
  },
  "preTrip.approaching.title": {
    en: "Bus is on the way",
    bn: "বাস পথে আছে",
  },
  "preTrip.approaching.detail": {
    en: "On the way to the start point",
    bn: "শুরুর স্থানে যাচ্ছে",
  },
  "preTrip.approaching.distanceM": {
    en: "{n}m to the start point",
    bn: "শুরুর স্থান থেকে {n} মি দূরে",
  },
  "preTrip.approaching.distanceKm": {
    en: "{n} km to the start point",
    bn: "শুরুর স্থান থেকে {n} কিমি দূরে",
  },
  "preTrip.atOrigin.title": {
    en: "Bus has arrived at the start",
    bn: "বাস শুরুর স্থানে পৌঁছেছে",
  },
  "preTrip.atOrigin.detail": {
    en: "Boarding soon — the trip will start any moment.",
    bn: "শীঘ্রই বোর্ডিং — যেকোনো মুহূর্তে যাত্রা শুরু হবে।",
  },

  // ---- history screen ----
  "history.title": { en: "Your trips", bn: "আপনার যাত্রা" },
  "history.last30Days": { en: "LAST 30 DAYS", bn: "গত ৩০ দিন" },
  "history.tripsTracked": { en: "trips tracked", bn: "ট্র্যাক করা ট্রিপ" },
  "history.routes": { en: "routes", bn: "রুট" },
  "history.timeTracked": { en: "time tracked", bn: "ট্র্যাকিং সময়" },
  "history.currentStreak": { en: "current streak", bn: "বর্তমান ধারাবাহিকতা" },
  "history.streakUnit": { en: "d", bn: "দিন" },
  "history.topRoutes": { en: "TOP ROUTES", bn: "শীর্ষ রুট" },
  "history.tripCount": { en: "{n} trips", bn: "{n} ট্রিপ" },
  "history.tripCountOne": { en: "{n} trip", bn: "{n} ট্রিপ" },
  "history.recentVisits": { en: "RECENT VISITS", bn: "সাম্প্রতিক যাত্রা" },
  "history.empty.title": { en: "No trips yet", bn: "এখনো কোনো ট্রিপ নেই" },
  "history.empty.subtitle": {
    en: "Once you watch a live bus for at least a minute, it'll show up here.",
    bn: "অন্তত এক মিনিটের জন্য একটি লাইভ বাস দেখলে এখানে দেখা যাবে।",
  },
  "history.justNow": { en: "just now", bn: "এইমাত্র" },
  "history.minAgo": { en: "{n} min ago", bn: "{n} মিনিট আগে" },
  "history.hrAgo": { en: "{n} hr ago", bn: "{n} ঘণ্টা আগে" },
  "history.dAgo": { en: "{n} d ago", bn: "{n} দিন আগে" },

  // ---- notifications prefs ----
  "notifPrefs.title": { en: "Notifications", bn: "নোটিফিকেশন" },
  "notifPrefs.general": { en: "GENERAL", bn: "সাধারণ" },
  "notifPrefs.pushNotifications": {
    en: "Push notifications",
    bn: "পুশ নোটিফিকেশন",
  },
  "notifPrefs.masterSwitch": {
    en: "Master switch — turn off to silence every alert.",
    bn: "মাস্টার সুইচ — সব অ্যালার্ট বন্ধ করতে এটি অফ করুন।",
  },
  "notifPrefs.quietHours": { en: "QUIET HOURS", bn: "নীরব সময়" },
  "notifPrefs.quietOff": { en: "Off", bn: "বন্ধ" },
  "notifPrefs.quiet22to7": { en: "10 PM — 7 AM", bn: "রাত ১০ — সকাল ৭" },
  "notifPrefs.quiet23to6": { en: "11 PM — 6 AM", bn: "রাত ১১ — সকাল ৬" },
  "notifPrefs.quietCustom": { en: "Custom", bn: "কাস্টম" },
  "notifPrefs.from": { en: "From", bn: "থেকে" },
  "notifPrefs.until": { en: "Until", bn: "পর্যন্ত" },
  "notifPrefs.quietHelp": {
    en: "During quiet hours, you'll get no pushes — alerts still pile up in the in-app feed.",
    bn: "নীরব সময়ে কোনো পুশ পাবেন না — অ্যালার্টগুলো অ্যাপে জমা হবে।",
  },
  "notifPrefs.stopAlerts": { en: "STOP ALERTS", bn: "স্টপ অ্যালার্ট" },
  "notifPrefs.emptyTitle": {
    en: "No stop alerts yet",
    bn: "এখনো কোনো স্টপ অ্যালার্ট নেই",
  },
  "notifPrefs.emptySubtitle": {
    en: "Open a route and tap the bell next to a stop to get a heads-up before the bus arrives.",
    bn: "একটি রুট খুলুন এবং বাস পৌঁছানোর আগে নোটিফিকেশন পেতে স্টপের পাশের ঘণ্টায় ট্যাপ করুন।",
  },
  "notifPrefs.leadBefore": { en: "{n}m before", bn: "{n} মি. আগে" },

  // ---- profile ----
  "profile.notifications": { en: "NOTIFICATIONS", bn: "নোটিফিকেশন" },
  "profile.notificationsTitle": {
    en: "Stop alerts & quiet hours",
    bn: "স্টপ অ্যালার্ট ও নীরব সময়",
  },
  "profile.notificationsSubtitle": {
    en: "Get pushed before your bus arrives — on your schedule.",
    bn: "বাস আসার আগেই পুশ পান — আপনার সময়সূচি অনুযায়ী।",
  },
  "profile.tripHistory": { en: "TRIP HISTORY", bn: "যাত্রার ইতিহাস" },
  "profile.tripHistoryTitle": {
    en: "Your trips & stats",
    bn: "আপনার যাত্রা ও পরিসংখ্যান",
  },
  "profile.tripHistorySubtitle": {
    en: "Last 30 days of routes you've tracked, plus a streak count.",
    bn: "গত ৩০ দিনের ট্র্যাক করা রুট, সাথে ধারাবাহিকতা গণনা।",
  },
  "profile.language": { en: "LANGUAGE", bn: "ভাষা" },
  "profile.languageHelp": {
    en: "Choose the language used across the app.",
    bn: "অ্যাপ জুড়ে ব্যবহৃত ভাষা নির্বাচন করুন।",
  },

  // ---- driver ----
  "driver.brand": { en: "UNIBUS DRIVER", bn: "ইউনিবাস ড্রাইভার" },
  "driver.driverFallback": { en: "Driver", bn: "ড্রাইভার" },
  "driver.assignedRoute": { en: "Assigned route", bn: "নির্ধারিত রুট" },
  "driver.noTrip": { en: "No active trip", bn: "কোনো সক্রিয় ট্রিপ নেই" },
  "driver.ready": { en: "Ready when you are", bn: "আপনি প্রস্তুত হলেই শুরু" },
  "driver.bus": { en: "Bus", bn: "বাস" },
  "driver.nextStop": { en: "NEXT STOP", bn: "পরের স্টপ" },
  "driver.nextStopXofY": {
    en: "NEXT STOP · {x} OF {y}",
    bn: "পরের স্টপ · {y}-এর মধ্যে {x}",
  },
  "driver.onRoute": { en: "On route", bn: "পথে" },
  "driver.metrics.speed": { en: "Speed", bn: "গতি" },
  "driver.metrics.gps": { en: "GPS", bn: "জিপিএস" },
  "driver.metrics.updated": { en: "Updated", bn: "আপডেট" },
  "driver.source.label": { en: "LOCATION SOURCE", bn: "অবস্থানের উৎস" },
  "driver.source.phone": { en: "My phone", bn: "আমার ফোন" },
  "driver.source.busDevice": { en: "Bus device", bn: "বাসের ডিভাইস" },
  "driver.permission.title": {
    en: "Location permission required",
    bn: "অবস্থানের অনুমতি প্রয়োজন",
  },
  "driver.permission.body": {
    en: 'Allow "Always" location so the bus stays live while your screen is off. Tap to open Settings.',
    bn: "স্ক্রিন বন্ধ থাকলেও বাস লাইভ রাখতে \"সর্বদা\" অবস্থান অনুমতি দিন। সেটিংস খুলতে ট্যাপ করুন।",
  },
  "driver.startTrip": { en: "Start trip", bn: "ট্রিপ শুরু করুন" },
  "driver.endTrip": { en: "End trip", bn: "ট্রিপ শেষ করুন" },
  "driver.startTripNow": { en: "Start trip now", bn: "এখনই ট্রিপ শুরু" },
  "driver.preTripHint": {
    en: "Bus is broadcasting location. Trip will start automatically when you arrive at the first stop, or tap above to start now.",
    bn: "বাস অবস্থান সম্প্রচার করছে। প্রথম স্টপে পৌঁছালে ট্রিপ স্বয়ংক্রিয়ভাবে শুরু হবে, অথবা এখনই শুরু করতে উপরে ট্যাপ করুন।",
  },
  "driver.approaching": { en: "Approaching {stop}", bn: "{stop} আসছে" },
  "driver.preTrip.parked": {
    en: "Pre-trip · Parked at depot",
    bn: "যাত্রা-পূর্ব · গ্যারেজে দাঁড়ানো",
  },
  "driver.preTrip.heading": {
    en: "Pre-trip · Heading to start",
    bn: "যাত্রা-পূর্ব · শুরুর দিকে যাচ্ছে",
  },
  "driver.preTrip.atStart": {
    en: "Pre-trip · At start point",
    bn: "যাত্রা-পূর্ব · শুরুর স্থানে",
  },
} as const;

export type StringKey = keyof typeof STRINGS;
