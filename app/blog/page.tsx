import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getPosts() {
  try {
    return await prisma.blogPost.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
    });
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="container py-5">
      <h1 className="h4 mb-4">Blog</h1>
      {posts.length > 0 ? (
        <div className="row g-4">
          {posts.map((post) => (
            <div key={post.id} className="col-md-4">
              <h6 className="fw-bold">{post.title}</h6>
              {post.excerpt && <p className="text-secondary">{post.excerpt}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-secondary">
          Todavía no hay artículos publicados (tabla <code>blog_posts</code>).
        </p>
      )}
    </div>
  );
}
