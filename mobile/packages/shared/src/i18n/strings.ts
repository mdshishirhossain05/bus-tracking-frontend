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

  // ---- on-map live status HUD ----
  "hud.nextStop": { en: "Next stop", bn: "পরবর্তী স্টপ" },
  "hud.arrivingIn": { en: "Arriving in", bn: "পৌঁছাবে" },
  "hud.enRoute": { en: "On the way", bn: "পথে আছে" },
  "hud.live": { en: "Live", bn: "লাইভ" },
  "hud.tracking": { en: "Tracking bus…", bn: "বাস ট্র্যাক হচ্ছে…" },
  "hud.stopped": { en: "Stopped", bn: "থেমেছে" },

  // ---- on-map bus status callout ----
  "busCallout.nextStop": { en: "NEXT STOP", bn: "পরবর্তী স্টপ" },
  "busCallout.yourStop": { en: "YOUR STOP", bn: "আপনার স্টপ" },

  // ---- background live-tracking notification ----
  "busNotif.title": { en: "Live bus tracking", bn: "লাইভ বাস ট্র্যাকিং" },
  "busNotif.next": { en: "Next", bn: "পরবর্তী" },
  "busNotif.yourStop": { en: "Your stop", bn: "আপনার স্টপ" },
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
  "today.section.tomorrow": { en: "Tomorrow's schedule", bn: "আগামীকালের সময়সূচী" },
  "today.section.completed": { en: "Completed today", bn: "আজ শেষ হয়েছে" },
  "today.section.notLive": { en: "Not live yet", bn: "এখনো শুরু হয়নি" },
  "today.section.favorites": { en: "Your favorites", bn: "আপনার পছন্দের" },
  "today.badge.notLive": { en: "Not live yet", bn: "শুরু হয়নি" },
  "today.badge.delayed": { en: "Departed, no trip yet", bn: "ছাড়ার সময় পেরিয়েছে" },
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

  // ---- map layers ----
  "map.layers.title": { en: "Map view", bn: "মানচিত্র দৃশ্য" },
  "map.layers.hybrid": {
    en: "Hybrid (satellite + labels)",
    bn: "হাইব্রিড (স্যাটেলাইট + লেবেল)",
  },
  "map.layers.hybridHelp": {
    en: "Useful for matching stops with real landmarks.",
    bn: "প্রকৃত স্থানের সাথে স্টপ মেলানোর জন্য উপযোগী।",
  },
  "map.layers.traffic": { en: "Show traffic", bn: "ট্রাফিক দেখান" },
  "map.layers.trafficHelp": {
    en: "Highlights congestion on roads — handy for predicting delays.",
    bn: "রাস্তায় যানজট দেখায় — দেরি অনুমান করতে সহায়ক।",
  },
  "map.layers.dark": { en: "Dark map", bn: "ডার্ক মানচিত্র" },
  "map.layers.darkHelp": {
    en: "Switch to a dark Google Maps style — easier on the eyes at night.",
    bn: "ডার্ক গুগল মানচিত্র শৈলীতে পরিবর্তন করুন — রাতে চোখের জন্য আরামদায়ক।",
  },
  "today.tab.today": { en: "Today", bn: "আজ" },
  "today.tab.tomorrow": { en: "Tomorrow", bn: "আগামীকাল" },
  "today.tab.all": { en: "All days", bn: "সব দিন" },
  "today.dow.SUNDAY": { en: "Sunday", bn: "রবিবার" },
  "today.dow.MONDAY": { en: "Monday", bn: "সোমবার" },
  "today.dow.TUESDAY": { en: "Tuesday", bn: "মঙ্গলবার" },
  "today.dow.WEDNESDAY": { en: "Wednesday", bn: "বুধবার" },
  "today.dow.THURSDAY": { en: "Thursday", bn: "বৃহস্পতিবার" },
  "today.dow.FRIDAY": { en: "Friday", bn: "শুক্রবার" },
  "today.dow.SATURDAY": { en: "Saturday", bn: "শনিবার" },
  "today.empty.tomorrow.title": {
    en: "No buses scheduled for tomorrow",
    bn: "আগামীকালের জন্য কোনো বাস নেই",
  },
  "today.empty.tomorrow.subtitle": {
    en: "Check back the day before — or look at the All days tab.",
    bn: "একদিন আগে আবার দেখুন — অথবা সব দিন ট্যাবে দেখুন।",
  },
  "today.empty.all.title": {
    en: "No schedules created yet",
    bn: "এখনো কোনো সময়সূচী তৈরি হয়নি",
  },
  "today.empty.all.subtitle": {
    en: "Ask your admin to add bus schedules in the web admin.",
    bn: "অ্যাডমিনকে ওয়েবে বাসের সময়সূচী যোগ করতে বলুন।",
  },

  // ---- walk-time / multi-bus / destination ----
  "walk.toStop": {
    en: "{n} min walk to {stop}",
    bn: "{stop} পর্যন্ত {n} মিনিটের হাঁটাপথ",
  },
  "walk.toStopFar": {
    en: "~{n} min walk to {stop}",
    bn: "{stop} পর্যন্ত প্রায় {n} মিনিটের হাঁটাপথ",
  },
  "otherBuses.title": {
    en: "Other buses on this route",
    bn: "এই রুটের অন্য বাস",
  },
  "otherBuses.tapHint": {
    en: "Tap to track",
    bn: "ট্র্যাক করতে ট্যাপ করুন",
  },
  "otherBuses.noEta": {
    en: "No ETA yet",
    bn: "এখনো ETA নেই",
  },
  "destination.set": { en: "Set destination", bn: "গন্তব্য নির্ধারণ" },
  "destination.clear": { en: "Clear destination", bn: "গন্তব্য মুছুন" },
  "destination.chip": { en: "Your stop", bn: "আপনার স্টপ" },
  "destination.approachingTitle": {
    en: "Get off at the next stop",
    bn: "পরের স্টপে নেমে যান",
  },
  "destination.approachingBody": {
    en: "{stop} is coming up — get ready to step off.",
    bn: "{stop} আসছে — নামার জন্য প্রস্তুত হন।",
  },
  "destination.atStopTitle": {
    en: "You've reached {stop}",
    bn: "আপনি {stop}-এ পৌঁছেছেন",
  },

  // ---- stale data / source-side issues ----
  // Shown when the bus's position hasn't updated for a while, even
  // though the trip is still RUNNING in the system. Tells the
  // passenger whether to trust the marker or wait for fresh data.
  "stale.mild.title": {
    en: "Live updates paused",
    bn: "লাইভ আপডেট বিরতি",
  },
  "stale.mild.body": {
    en: "Last position was {n} ago. Showing the most recent location.",
    bn: "সর্বশেষ অবস্থান {n} আগের। সর্বশেষ অবস্থান দেখানো হচ্ছে।",
  },
  "stale.serious.title": {
    en: "Bus may be offline",
    bn: "বাস সম্ভবত অফলাইনে",
  },
  "stale.serious.body": {
    en: "No update for {n}. The driver's phone or the bus GPS may have lost signal.",
    bn: "{n} ধরে কোনো আপডেট নেই। ড্রাইভারের ফোন বা বাসের জিপিএস সংকেত হারাতে পারে।",
  },
  "stale.severe.title": {
    en: "Bus location unavailable",
    bn: "বাসের অবস্থান অজানা",
  },
  "stale.severe.body": {
    en: "No update for {n}. The trip may have ended without a proper signal — try refreshing or check today's schedules.",
    bn: "{n} ধরে কোনো আপডেট নেই। যাত্রা সঠিক সংকেত ছাড়াই শেষ হয়ে থাকতে পারে — রিফ্রেশ করুন বা আজকের সময়সূচী দেখুন।",
  },
  "stale.source.phone": {
    en: "Driver's phone (last seen {n} ago)",
    bn: "ড্রাইভারের ফোন (সর্বশেষ {n} আগে)",
  },
  "stale.source.device": {
    en: "Bus GPS device (last seen {n} ago)",
    bn: "বাসের জিপিএস ডিভাইস (সর্বশেষ {n} আগে)",
  },
  "stale.justNow": { en: "just now", bn: "এইমাত্র" },
  "stale.seconds": { en: "{n} sec", bn: "{n} সেকেন্ড" },
  "stale.minutes": { en: "{n} min", bn: "{n} মিনিট" },
  "stale.hours": { en: "{n} hr", bn: "{n} ঘণ্টা" },

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

  // ---- new home view (trip cards) ----
  "home.title": { en: "Active trips", bn: "চলমান ট্রিপ" },
  "home.subtitle.one": {
    en: "1 bus is on route right now",
    bn: "এখন ১টি বাস চলছে",
  },
  "home.subtitle.many": {
    en: "{n} buses are on route right now",
    bn: "এখন {n}টি বাস চলছে",
  },
  "home.liveTrack": { en: "Live Track", bn: "লাইভ ট্র্যাক" },
  "home.allTrips": { en: "All trips", bn: "সব ট্রিপ" },
  "home.backToTrips": { en: "Back to trips", bn: "ট্রিপ তালিকায় ফিরুন" },
  "home.switchTrip": { en: "Switch trip", bn: "অন্য ট্রিপ" },

  // ---- notification permission primer ----
  "notifPrimer.title": {
    en: "Never miss your bus.",
    bn: "আর কখনো বাস মিস করবেন না।",
  },
  "notifPrimer.body": {
    en: "Turn on notifications and we'll alert you a few minutes before the bus reaches your stop — even when the app is closed.",
    bn: "নোটিফিকেশন চালু করুন — বাস আপনার স্টপে পৌঁছানোর কয়েক মিনিট আগেই আপনাকে জানিয়ে দেব, এমনকি অ্যাপ বন্ধ থাকলেও।",
  },
  "notifPrimer.allow": { en: "Allow notifications", bn: "নোটিফিকেশন অনুমতি দিন" },
  "notifPrimer.later": { en: "Maybe later", bn: "পরে দেখব" },

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
  "stop.badge.passed": { en: "Passed", bn: "অতিক্রান্ত" },
  "stop.badge.now": { en: "Next", bn: "পরবর্তী" },
  "stop.badge.here": { en: "Bus here", bn: "বাস এখানে" },
  "stop.badge.destination": { en: "Your stop", bn: "আপনার স্টপ" },

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

  // ---- auth (login + register + forgot password) ----
  "auth.login.title": { en: "Track your bus", bn: "আপনার বাস ট্র্যাক করুন" },
  "auth.login.subtitle": {
    en: "Sign in to follow your route live.",
    bn: "লাইভ রুট দেখতে সাইন ইন করুন।",
  },
  "auth.field.email": { en: "Email", bn: "ইমেইল" },
  "auth.field.emailPlaceholder": {
    en: "you@university.edu",
    bn: "you@university.edu",
  },
  "auth.field.password": { en: "Password", bn: "পাসওয়ার্ড" },
  "auth.field.passwordPlaceholder": { en: "••••••••", bn: "••••••••" },
  "auth.login.signIn": { en: "Sign in", bn: "সাইন ইন" },
  "auth.login.missing": {
    en: "Enter your email and password.",
    bn: "ইমেইল ও পাসওয়ার্ড লিখুন।",
  },
  "auth.login.invalid": {
    en: "Invalid credentials. Please try again.",
    bn: "ভুল তথ্য। আবার চেষ্টা করুন।",
  },
  "auth.login.noAccount": {
    en: "Don't have an account?",
    bn: "অ্যাকাউন্ট নেই?",
  },
  "auth.login.createOne": { en: "Create one", bn: "তৈরি করুন" },
  "auth.login.forgotPassword": {
    en: "Forgot password?",
    bn: "পাসওয়ার্ড ভুলে গেছেন?",
  },

  // forgot password flow
  "auth.forgot.title": { en: "Reset your password", bn: "পাসওয়ার্ড রিসেট" },
  "auth.forgot.subtitle": {
    en: "We'll email you a 6-digit code to verify it's you.",
    bn: "আপনাকে যাচাই করতে ইমেইলে ৬ সংখ্যার কোড পাঠানো হবে।",
  },
  "auth.forgot.stepXofY": {
    en: "STEP {x} OF {y}",
    bn: "ধাপ {x} / {y}",
  },
  "auth.forgot.sendCode": { en: "Send code", bn: "কোড পাঠান" },
  "auth.forgot.codeLabel": { en: "6-digit code", bn: "৬ সংখ্যার কোড" },
  "auth.forgot.codePlaceholder": { en: "123456", bn: "১২৩৪৫৬" },
  "auth.forgot.verifyCode": { en: "Verify code", bn: "কোড যাচাই" },
  "auth.forgot.changeEmail": { en: "Change email", bn: "ইমেইল বদলান" },
  "auth.forgot.resendIn": {
    en: "Resend in {n}s",
    bn: "{n} সেকেন্ডে পুনরায় পাঠান",
  },
  "auth.forgot.resend": { en: "Resend code", bn: "কোড পুনরায় পাঠান" },
  "auth.forgot.emailSent": {
    en: "We sent a 6-digit code to {email}. Check your inbox (and spam).",
    bn: "{email}-এ ৬ সংখ্যার কোড পাঠানো হয়েছে। ইনবক্স (ও স্প্যাম) দেখুন।",
  },
  "auth.forgot.codeFailedToSend": {
    en: "We couldn't send the code. Check the email and try again.",
    bn: "কোড পাঠানো যায়নি। ইমেইল দেখে আবার চেষ্টা করুন।",
  },
  "auth.forgot.codeWrong": {
    en: "That code didn't match. Try again or request a new one.",
    bn: "কোড মিলেনি। আবার চেষ্টা করুন বা নতুন কোড নিন।",
  },
  "auth.forgot.enterEmail": {
    en: "Enter your email to receive the reset code.",
    bn: "রিসেট কোড পেতে ইমেইল দিন।",
  },
  "auth.forgot.enterCode": {
    en: "Enter the 6-digit code we sent to your email.",
    bn: "ইমেইলে পাঠানো ৬ সংখ্যার কোড লিখুন।",
  },
  "auth.forgot.newPasswordTitle": {
    en: "Choose a new password",
    bn: "নতুন পাসওয়ার্ড দিন",
  },
  "auth.forgot.newPasswordSubtitle": {
    en: "Pick something secure you'll remember.",
    bn: "এমন কিছু বাছুন যা মনে রাখতে পারবেন।",
  },
  "auth.forgot.newPassword": { en: "New password", bn: "নতুন পাসওয়ার্ড" },
  "auth.forgot.confirmPassword": {
    en: "Confirm password",
    bn: "পাসওয়ার্ড নিশ্চিত করুন",
  },
  "auth.forgot.resetPassword": {
    en: "Reset password",
    bn: "পাসওয়ার্ড রিসেট",
  },
  "auth.forgot.passwordsDontMatch": {
    en: "Passwords don't match.",
    bn: "পাসওয়ার্ড মেলেনি।",
  },
  "auth.forgot.passwordRulesFail": {
    en: "Password doesn't meet all the requirements yet.",
    bn: "পাসওয়ার্ড এখনো সব শর্ত পূরণ করেনি।",
  },
  "auth.forgot.success": {
    en: "Password reset",
    bn: "পাসওয়ার্ড রিসেট হয়েছে",
  },
  "auth.forgot.successBody": {
    en: "You can now sign in with your new password.",
    bn: "এখন নতুন পাসওয়ার্ড দিয়ে সাইন ইন করতে পারেন।",
  },
  "auth.forgot.backToLogin": {
    en: "Back to sign in",
    bn: "সাইন ইনে ফিরে যান",
  },
  "auth.forgot.failed": {
    en: "Couldn't reset the password. Please try again.",
    bn: "পাসওয়ার্ড রিসেট করা যায়নি। আবার চেষ্টা করুন।",
  },

  // password rules
  "auth.rule.8chars": { en: "8+ characters", bn: "৮+ অক্ষর" },
  "auth.rule.upper": { en: "Uppercase letter", bn: "একটি বড় হাতের অক্ষর" },
  "auth.rule.lower": { en: "Lowercase letter", bn: "একটি ছোট হাতের অক্ষর" },
  "auth.rule.number": { en: "Number", bn: "একটি সংখ্যা" },
  "auth.rule.special": {
    en: "Special character",
    bn: "একটি বিশেষ অক্ষর",
  },

  // register screen
  "auth.register.verifyTitle": {
    en: "Verify your email",
    bn: "ইমেইল যাচাই করুন",
  },
  "auth.register.verifySubtitle": {
    en: "We'll send a 6-digit code to confirm it's yours.",
    bn: "আপনার ইমেইল নিশ্চিত করতে ৬ সংখ্যার কোড পাঠানো হবে।",
  },
  "auth.register.aboutYou": { en: "Tell us about you", bn: "আপনার তথ্য দিন" },
  "auth.register.aboutYouSubtitle": {
    en: "These details help your admin approve your account.",
    bn: "এই তথ্যগুলো অ্যাডমিনকে আপনার অ্যাকাউন্ট অনুমোদন করতে সাহায্য করে।",
  },
  "auth.register.setPasswordTitle": {
    en: "Set a password",
    bn: "পাসওয়ার্ড দিন",
  },
  "auth.register.setPasswordSubtitle": {
    en: "Choose something you'll remember.",
    bn: "এমন কিছু বাছুন যা মনে রাখবেন।",
  },
  "auth.register.fullName": { en: "Full name", bn: "পূর্ণ নাম" },
  "auth.register.fullNamePlaceholder": {
    en: "Your full name",
    bn: "আপনার পূর্ণ নাম",
  },
  "auth.register.studentId": { en: "Student ID", bn: "স্টুডেন্ট আইডি" },
  "auth.register.phoneOptional": {
    en: "Phone (optional)",
    bn: "ফোন (ঐচ্ছিক)",
  },
  "auth.register.deptOptional": {
    en: "Department (optional)",
    bn: "বিভাগ (ঐচ্ছিক)",
  },
  "auth.register.batchOptional": { en: "Batch (optional)", bn: "ব্যাচ (ঐচ্ছিক)" },
  "auth.register.pickupOptional": {
    en: "Pickup point (optional)",
    bn: "পিকআপ স্থান (ঐচ্ছিক)",
  },
  "auth.register.pickupPlaceholder": {
    en: "e.g. Mirpur 10",
    bn: "যেমন: মিরপুর ১০",
  },
  "auth.register.continue": { en: "Continue", bn: "চালিয়ে যান" },
  "auth.register.createAccount": {
    en: "Create account",
    bn: "অ্যাকাউন্ট তৈরি করুন",
  },
  "auth.register.welcome": { en: "Welcome, {name}!", bn: "স্বাগতম, {name}!" },
  "auth.register.successBody": {
    en: "Your account is being reviewed. We'll let you sign in once an admin approves your registration — typically within a few hours.",
    bn: "আপনার অ্যাকাউন্ট পর্যালোচনা চলছে। অ্যাডমিন অনুমোদন দিলে সাইন ইন করতে পারবেন — সাধারণত কয়েক ঘণ্টার মধ্যে।",
  },
  "auth.register.emailSentBadge": { en: "Email sent", bn: "ইমেইল পাঠানো হয়েছে" },
  "auth.register.errors.fullName": {
    en: "Enter your full name.",
    bn: "পূর্ণ নাম লিখুন।",
  },
  "auth.register.errors.studentId": {
    en: "Enter your student ID.",
    bn: "স্টুডেন্ট আইডি লিখুন।",
  },
  "auth.register.errors.email": {
    en: "Enter your email to receive the verification code.",
    bn: "যাচাইকরণ কোড পেতে ইমেইল লিখুন।",
  },
  "auth.register.errors.otp": {
    en: "Enter the 6-digit code we sent to your email.",
    bn: "ইমেইলে পাঠানো ৬ সংখ্যার কোড লিখুন।",
  },
  "auth.register.errors.send": {
    en: "We couldn't send the code. Check the email address and try again.",
    bn: "কোড পাঠানো যায়নি। ইমেইল দেখে আবার চেষ্টা করুন।",
  },
  "auth.register.errors.verify": {
    en: "That code didn't match. Try again or request a new one.",
    bn: "কোড মেলেনি। আবার চেষ্টা করুন বা নতুন কোড নিন।",
  },
  "auth.register.errors.registration": {
    en: "Registration failed. Please check the form and try again.",
    bn: "নিবন্ধন ব্যর্থ। তথ্য দেখে আবার চেষ্টা করুন।",
  },

  // ---- offline / no network banner ----
  "offline.title": { en: "You're offline", bn: "আপনি অফলাইনে" },
  "offline.subtitle": {
    en: "Live updates pause until we reconnect.",
    bn: "পুনরায় সংযোগ না হওয়া পর্যন্ত লাইভ আপডেট বিরতি।",
  },
  "offline.reconnecting": {
    en: "Reconnecting…",
    bn: "পুনঃসংযোগ হচ্ছে…",
  },
  "offline.signalLost": {
    en: "Signal lost — last position shown.",
    bn: "সিগন্যাল হারিয়েছে — সর্বশেষ অবস্থান দেখানো হচ্ছে।",
  },

  // ---- notification permission ----
  "notifPerm.title": { en: "DEVICE PERMISSION", bn: "ডিভাইস অনুমতি" },
  "notifPerm.granted": {
    en: "Notifications allowed",
    bn: "নোটিফিকেশন অনুমতি দেওয়া আছে",
  },
  "notifPerm.grantedBody": {
    en: "This device will receive push alerts based on your settings below.",
    bn: "নিচের সেটিংস অনুযায়ী এই ডিভাইস পুশ অ্যালার্ট পাবে।",
  },
  "notifPerm.denied": {
    en: "Notifications blocked",
    bn: "নোটিফিকেশন বন্ধ",
  },
  "notifPerm.deniedBody": {
    en: "We can't send push alerts until you enable notifications in your device settings.",
    bn: "ডিভাইস সেটিংসে নোটিফিকেশন চালু না করা পর্যন্ত আমরা পুশ অ্যালার্ট পাঠাতে পারব না।",
  },
  "notifPerm.askable": {
    en: "Tap to allow notifications",
    bn: "নোটিফিকেশনের অনুমতি দিতে ট্যাপ করুন",
  },
  "notifPerm.askableBody": {
    en: "Get a heads-up before your bus arrives — even when the app is closed.",
    bn: "অ্যাপ বন্ধ থাকলেও বাস আসার আগে নোটিফিকেশন পান।",
  },
  "notifPerm.openSettings": {
    en: "Open settings",
    bn: "সেটিংস খুলুন",
  },
  "notifPerm.allow": { en: "Allow", bn: "অনুমতি দিন" },

  // ---- profile screen ----
  "profile.title": { en: "Profile", bn: "প্রোফাইল" },
  "profile.role.passenger": { en: "PASSENGER", bn: "যাত্রী" },
  "profile.section.account": { en: "ACCOUNT", bn: "অ্যাকাউন্ট" },
  "profile.field.fullName": { en: "Full name", bn: "পূর্ণ নাম" },
  "profile.field.email": { en: "Email", bn: "ইমেইল" },
  "profile.field.phone": { en: "Phone", bn: "ফোন" },
  "profile.field.department": { en: "Department", bn: "বিভাগ" },
  "profile.field.batch": { en: "Batch", bn: "ব্যাচ" },
  "profile.field.pickup": { en: "Pickup point", bn: "পিকআপ স্থান" },
  "profile.action.save": { en: "Save", bn: "সংরক্ষণ" },
  "profile.action.cancel": { en: "Cancel", bn: "বাতিল" },
  "profile.msg.saved": { en: "Profile updated.", bn: "প্রোফাইল আপডেট হয়েছে।" },
  "profile.msg.saveFailed": {
    en: "Could not update profile.",
    bn: "প্রোফাইল আপডেট করা যায়নি।",
  },

  "profile.section.password": {
    en: "CHANGE PASSWORD",
    bn: "পাসওয়ার্ড পরিবর্তন",
  },
  "profile.field.currentPassword": {
    en: "Current password",
    bn: "বর্তমান পাসওয়ার্ড",
  },
  "profile.field.newPassword": { en: "New password", bn: "নতুন পাসওয়ার্ড" },
  "profile.field.confirmNewPassword": {
    en: "Confirm new password",
    bn: "নতুন পাসওয়ার্ড নিশ্চিত করুন",
  },
  "profile.action.updatePassword": {
    en: "Update password",
    bn: "পাসওয়ার্ড আপডেট",
  },
  "profile.msg.passwordChanged": {
    en: "Password changed.",
    bn: "পাসওয়ার্ড পরিবর্তিত হয়েছে।",
  },
  "profile.msg.passwordMismatch": {
    en: "New password and confirmation do not match.",
    bn: "নতুন পাসওয়ার্ড ও নিশ্চিতকরণ মেলেনি।",
  },
  "profile.msg.passwordFailed": {
    en: "Could not change password.",
    bn: "পাসওয়ার্ড পরিবর্তন করা যায়নি।",
  },

  "profile.section.devices": { en: "DEVICES", bn: "ডিভাইস" },
  "profile.thisDevice": { en: "This device", bn: "এই ডিভাইস" },
  "profile.signOutOthers": {
    en: "Sign out other devices",
    bn: "অন্য ডিভাইস থেকে সাইন আউট",
  },
  "profile.signOut": { en: "Sign out", bn: "সাইন আউট" },
} as const;

export type StringKey = keyof typeof STRINGS;
