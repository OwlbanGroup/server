# Embedding OWLban Earnings Dashboard into Company Website

This document provides instructions to embed the OWLban Earnings Dashboard into the company website (e.g., <https://www.quadranova.net/>).

## Hosting the Dashboard

1. Host the `earnings_dashboard/dashboard.html` and related assets (`dashboard.css`, etc.) on a web server accessible by the company website.

2. Ensure the backend API (`/api/earnings`) is accessible and properly secured for cross-origin requests if hosted on a different domain.

## Embedding via iframe

Add the following iframe snippet to the desired page on the company website:

```html
<iframe
  src="https://your-dashboard-hosting-domain.com/earnings_dashboard/dashboard.html"
  width="100%"
  height="600"
  style="border:none;"
  title="OWLban Earnings Dashboard"
  allowfullscreen
></iframe>
```

Replace `https://your-dashboard-hosting-domain.com` with the actual URL where the dashboard is hosted.

## Authentication and CORS

- The dashboard uses Microsoft authentication and basic auth for API access.
- Ensure CORS headers on the API server allow requests from the company website domain.
- If necessary, configure authentication flows to support embedded usage.

## Optional: Widget or Component Integration

If the company website uses a frontend framework (React, Angular, Vue), consider creating a widget/component version of the dashboard for tighter integration.

## Support

For assistance with hosting, embedding, or authentication configuration, please contact the development team.

---

This completes the integration plan for embedding the OWLban Earnings Dashboard into the company website.
