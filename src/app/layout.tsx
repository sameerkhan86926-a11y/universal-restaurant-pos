import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Universal Restaurant POS",
  description: "Customizable Restaurant Management System",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let config = await prisma.restaurantConfig.findUnique({
    where: { id: "default" },
  });

  if (!config) {
    config = await prisma.restaurantConfig.create({
      data: { id: "default" },
    });
  }

  return (
    <html lang="en">
      <head>
        <style>{`
          :root {
            --brand-primary: ${config.primaryColor};
            --brand-secondary: ${config.secondaryColor};
          }
        `}</style>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
