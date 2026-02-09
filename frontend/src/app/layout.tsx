import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import Navbar from './components/auth/Navbar';

export const metadata = {
  title: 'Modern Todo Application',
  description: 'A beautiful and functional todo application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[color:rgb(var(--background-rgb))] text-[color:rgb(var(--text-primary-rgb))]">
        <AuthProvider>
          <Navbar />
          <div className="container mx-auto px-4 max-w-4xl pt-8">
            <main className="animate-fade-in">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}