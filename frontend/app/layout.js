import "./globals.css";

export const metadata = {
  title: "LinkForge AI — LinkedIn Post Automation Platform",
  description:
    "Generate, schedule, and publish AI-powered LinkedIn posts. Grow your professional presence effortlessly with LinkForge AI.",
  keywords: ["LinkedIn", "AI", "automation", "posts", "scheduling", "content generation"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
