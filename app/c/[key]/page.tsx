import { notFound } from "next/navigation";
import Feed, { parsePage, parseSort } from "@/components/Feed";
import { categoryName, isCategory } from "@/lib/site";

type Params = Promise<{ key: string }>;
type SP = Promise<{ sort?: string; page?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { key } = await params;
  return { title: isCategory(key) ? categoryName(key) : "频道" };
}

export default async function ChannelPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { key } = await params;
  if (!isCategory(key)) notFound();
  const sp = await searchParams;
  return <Feed channel={key} base={`/c/${key}`} filter={{ category: key }} sort={parseSort(sp.sort)} page={parsePage(sp.page)} />;
}
