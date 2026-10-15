import Feed, { parsePage, parseSort } from "@/components/Feed";

type Params = Promise<{ tag: string }>;
type SP = Promise<{ sort?: string; page?: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  return { title: `#${decodeURIComponent((await params).tag)}` };
}

export default async function TagPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const tag = decodeURIComponent((await params).tag);
  const sp = await searchParams;
  return (
    <Feed
      base={`/tag/${encodeURIComponent(tag)}`}
      filter={{ tag }}
      sort={parseSort(sp.sort)}
      page={parsePage(sp.page)}
      header={
        <div className="card section-head">
          <h1># {tag}</h1>
        </div>
      }
      empty="该标签下暂无文章"
    />
  );
}
