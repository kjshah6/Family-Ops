import "./globals.css";

export const metadata = {
  title: "Cubby",
  description: "The school community app for parents — pickup, drop-off, calendars, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
