/**
 * Blog content extracted from the WordPress database by
 * scripts/extract_posts.py. Generated — do not hand-edit.
 *
 * The posts predate the 2023 rebuild and were written in the classic
 * editor, so `html` is real HTML rather than the section model used for
 * pages. It's build-time content from the site's own database, so it is
 * rendered directly; see BlogPost for how asset paths are resolved.
 */
import posts from './content/posts.json'

export const allPosts = posts

export const getPost = (slug) => posts.find((p) => p.slug === slug)

export default posts
