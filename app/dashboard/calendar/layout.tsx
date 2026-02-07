import type { Metadata } from 'next';

export const metadata: Metadata = { title: "ปฏิทิน" };

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
