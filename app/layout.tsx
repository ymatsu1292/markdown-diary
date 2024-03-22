import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Markdown Diary",
  description: "Diary application with Markdown"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css" />
	<script src="https://cdn.jsdelivr.net/combine/npm/markdown-it@12/dist/markdown-it.min.js,npm/markdown-it-sub@1/dist/markdown-it-sub.min.js,npm/markdown-it-sup@1/dist/markdown-it-sup.min.js,npm/markdown-it-ins@3/dist/markdown-it-ins.min.js,npm/markdown-it-footnote@3/dist/markdown-it-footnote.min.js,npm/markdown-it-container@3/dist/markdown-it-container.min.js"></script>
      </head>
      <body className={inter.className}>
	<Providers>
	  {children}
	</Providers>
      </body>
    </html>
  );
};
