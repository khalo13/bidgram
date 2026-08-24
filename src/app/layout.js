import './globals.css';

export const metadata = {
  title: 'BidInsta - The Paid Discovery Board',
  description: 'Bid for attention. Own the top spot.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body className="bg-[#070708] text-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}