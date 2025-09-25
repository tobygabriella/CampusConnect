# Favicon Generation Instructions

To generate the favicon files referenced in index.html, follow these steps:

1. Use the Aro logo (`/src/assets/aro.png`) as the source image.

2. Visit a favicon generator website like [RealFaviconGenerator](https://realfavicongenerator.net/) or [Favicon.io](https://favicon.io/).

3. Upload the Aro logo and generate the following files:
   - favicon.ico
   - favicon-16x16.png
   - favicon-32x32.png
   - apple-touch-icon.png
   - android-chrome-192x192.png
   - android-chrome-512x512.png
   - safari-pinned-tab.svg

4. Download the generated package and place all files in the `/public` directory.

5. Also create an `og-image.png` file (1200x630px recommended) for social media sharing, using the Aro logo prominently.

These files are referenced in the HTML and will ensure proper display of the Aro logo across all devices and platforms.

## For production deployment:
- Update the domain URLs in `index.html` to match your actual domain
- Generate a `sitemap.xml` file and update its reference in `robots.txt`
