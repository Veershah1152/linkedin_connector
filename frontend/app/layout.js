import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata = {
  title: "Lyra Suite — LinkedIn Content & Career Automation",
  description:
    "Generate, schedule, and publish AI-powered LinkedIn posts. Build your resume, track analytics, and grow your professional brand — all from one dashboard.",
  keywords: ["LinkedIn", "AI", "automation", "posts", "scheduling", "resume", "career"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ colorScheme: "light" }}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
