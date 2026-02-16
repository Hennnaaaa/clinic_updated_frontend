import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="Begum Sahib Noor Zaman Sahulat Dispensary - Clinic Management System" />
        
        {/* Favicon - UPDATED WITH CLINIC LOGO */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/cliniclogo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/cliniclogo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/cliniclogo.png" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#1890ff" />
        
        {/* Mobile Web App */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Clinic Management" />
        
        {/* Manifest (optional - for PWA) */}
        {/* <link rel="manifest" href="/manifest.json" /> */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}