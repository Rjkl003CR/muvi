
# muvi - Movie Bank App

**Zero local storage. Cloud-powered cinema. Social movie curation.**

**muvi** is an offline-first, full-stack Progressive Web App (PWA) designed to bridge media storage and community movie curation. It allows users to leverage high-speed networks (such as campus Wi-Fi) to transfer video files directly into remote cloud storage without filling up local device space. 

Users can curate shared collections, stream stored movies on demand, take personal timestamped notes, and chat in real-time with uploaders and peers.



## Key Features

* **Zero Local Storage Footprint:** Direct remote uploads prevent client-side disk consumption.
* **Automated Metadata Cards:** Integrated with TMDB API to display poster art, cast, IMDb ratings, runtimes, release years, and genres.
* **Shared & Collaborative Collections:** Organize films into public, private, or group-managed movie banks.
* **In-App Video Streaming:** Native HTML5 player with HTTP Range Request support for fast seeking and zero buffering lag.
* **Real-Time Community Chat:** Dedicated chat rooms per film/collection powered by WebSockets/Supabase Realtime.
* **Offline-First PWA:** Full Service Worker and Web App Manifest setup allowing offline access to cached watchlists, metadata, and user notes.
* **Personal Watch Notes:** Keep private reviews, timestamps, and commentary directly on movie cards.


## Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend Platform** | Next.js / React (Progressive Web App) |
| **Styling & UI** | Tailwind CSS |
| **Database & Auth** | Supabase (PostgreSQL, Auth, Realtime WebSockets) |
| **Cloud Storage** | Cloudflare R2 / S3-Compatible Storage |
| **External API** | TMDB (The Movie Database API) |