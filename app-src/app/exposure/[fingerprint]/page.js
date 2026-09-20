'use client';

/**
 * app/exposure/[fingerprint]/page.js
 *
 * Direct link forwarder to Security Investigation page for a specific secret fingerprint.
 */

import SecurityInvestigationPage from '@/app/investigate/[fingerprint]/page';

export default function ExposureDetailsPage() {
  return <SecurityInvestigationPage />;
}
