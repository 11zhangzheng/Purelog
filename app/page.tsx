import Feed, { parsePage, parseSort } from "@/components/Feed";

type SP = Promise<{ sort?: string; page?: string }>;

export default async function Home({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  return <Feed base="/" filter={{}} sort={parseSort(sp.sort)} page={parsePage(sp.page)} />;
}
