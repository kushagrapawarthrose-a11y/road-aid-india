import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'RoadAid India - Incident Reporting & Emergency Response',
  description: 'Life-saving real-time road accident reporting and coordination platform for citizens, hospitals, and ambulance responders.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased selection:bg-emergency-teal selection:text-white">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </body>
    </html>
  );
}
