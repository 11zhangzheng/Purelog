import { notFound } from "next/navigation";
import HomeView, { totalPages } from "@/components/HomeView";

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return { title: `第 ${n} 页` };
}

export default async function Page({ params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 2 || n > (await totalPages())) notFound();
  return <HomeView page={n} />;
}
