Your Personal Website
=====================

Structure
- `index.html`: Home with responsive navbar and hero.
- `research/`, `publications/`, `updates/`, `blog/`, `photography/`, `hobbies/`, `contact/`: Core pages.
- `assets/css/style.css`: Global styles and responsive layout.
- `assets/js/main.js`: Navbar toggle, scroll effects, minor UX.
- `assets/img/`: Logo and favicon.
- `robots.txt`, `sitemap.xml`, `manifest.webmanifest`: SEO and PWA basics.

Development
- Open `index.html` in a browser directly or serve with a static server.
- To customize: replace logo, update titles/descriptions, and content.

Contact Form
- Uses Formspree as a drop-in endpoint. Replace `action` in `contact/index.html` with your Formspree endpoint or integrate your own backend/serverless.

Security & SEO
- Meta CSP and basic security headers included as `<meta http-equiv>` where possible. Prefer setting real HTTP headers at your host for production.
- `robots.txt` and `sitemap.xml` are ready. Update when adding pages.

License
- Private by default. Add a license if you plan to open source.

